import os
import boto3
import argparse
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

REGION = os.getenv("COGNITO_REGION", "ap-south-1")
USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")


def create_user(email, password, name, role):
    if not USER_POOL_ID:
        print("Error: COGNITO_USER_POOL_ID is not set in .env")
        return

    client = boto3.client('cognito-idp', region_name=REGION)

    try:
        # Create the user in Cognito
        print(f"Creating user {email} as {role}...")
        response = client.admin_create_user(
            UserPoolId=USER_POOL_ID,
            Username=email,
            UserAttributes=[
                {'Name': 'email', 'Value': email},
                {'Name': 'email_verified', 'Value': 'true'},
                {'Name': 'name', 'Value': name}
            ],
            MessageAction='SUPPRESS', # Don't send welcome email
            TemporaryPassword=password
        )
        
        # Set the password permanently (so they don't have to change it on first login)
        client.admin_set_user_password(
            UserPoolId=USER_POOL_ID,
            Username=email,
            Password=password,
            Permanent=True
        )
        
        print(f"✅ Successfully created user: {email}")
        print(f"User ID: {response['User']['Username']}")
        
    except ClientError as e:
        print(f"❌ Error creating user: {e.response['Error']['Message']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a user in AWS Cognito")
    parser.add_argument("--email", required=True, help="User's email address")
    parser.add_argument("--password", required=True, help="User's password (must meet Cognito requirements)")
    parser.add_argument("--name", required=True, help="User's full name")
    parser.add_argument("--role", choices=['Manager', 'Employee'], default='Employee', help="User's role (Manager or Employee)")
    
    args = parser.parse_args()
    create_user(args.email, args.password, args.name, args.role)
