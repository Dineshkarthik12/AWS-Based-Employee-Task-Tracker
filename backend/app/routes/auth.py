from fastapi import APIRouter, Depends

from app.middleware.auth import get_current_user
from app.services.dynamodb import get_users_table

router = APIRouter(tags=["Auth"])


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get the current logged-in user's profile."""
    return {
        "success": True,
        "data": current_user,
    }
