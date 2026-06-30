import boto3
from app.config.settings import settings


def get_dynamodb_resource():
    """Get DynamoDB resource with configured credentials."""
    kwargs = {
        "region_name": settings.AWS_REGION,
    }
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY

    return boto3.resource("dynamodb", **kwargs)


def get_users_table():
    """Get the Users DynamoDB table."""
    dynamodb = get_dynamodb_resource()
    return dynamodb.Table(settings.USERS_TABLE)


def get_tasks_table():
    """Get the Tasks DynamoDB table."""
    dynamodb = get_dynamodb_resource()
    return dynamodb.Table(settings.TASKS_TABLE)
