from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.services.cognito import verify_token
from app.services.dynamodb import get_users_table

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Dependency to extract and verify the current user from the JWT token.
    Returns user info from DynamoDB enriched with Cognito claims.
    """
    token = credentials.credentials

    try:
        claims = await verify_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

    # Extract user info from Cognito claims
    cognito_sub = claims.get("sub", "")
    email = claims.get("email", "")

    # Look up user in DynamoDB
    users_table = get_users_table()
    try:
        response = users_table.get_item(Key={"UserId": cognito_sub})
        user = response.get("Item")

        if not user:
            # If user not in DynamoDB yet, create them with default Employee role
            user = {
                "UserId": cognito_sub,
                "Name": claims.get("name", claims.get("email", "Unknown")),
                "Email": email,
                "Role": claims.get("custom:role", "Employee"),
            }
            users_table.put_item(Item=user)

        return {
            "user_id": user["UserId"],
            "name": user.get("Name", ""),
            "email": user.get("Email", email),
            "role": user.get("Role", "Employee"),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch user profile: {str(e)}"
        )


async def require_manager(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency to require the current user to be a Manager."""
    if current_user.get("role") != "Manager":
        raise HTTPException(
            status_code=403, detail="Access denied. Manager role required."
        )
    return current_user


async def require_employee(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency to require the current user to be an Employee."""
    if current_user.get("role") != "Employee":
        raise HTTPException(
            status_code=403, detail="Access denied. Employee role required."
        )
    return current_user
