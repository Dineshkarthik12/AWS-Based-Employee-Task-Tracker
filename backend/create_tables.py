import boto3
from botocore.exceptions import ClientError

def create_tables(region_name='us-east-1'):
    dynamodb = boto3.client('dynamodb', region_name=region_name)

    # Create Users Table
    try:
        print("Creating Users Table...")
        dynamodb.create_table(
            TableName='EmployeeTracker_Users',
            KeySchema=[
                {'AttributeName': 'UserId', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'UserId', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print("Users Table created successfully.")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print("Users Table already exists.")
        else:
            print(f"Error creating Users Table: {e}")

    # Create Tasks Table
    try:
        print("Creating Tasks Table...")
        dynamodb.create_table(
            TableName='EmployeeTracker_Tasks',
            KeySchema=[
                {'AttributeName': 'TaskId', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'TaskId', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print("Tasks Table created successfully.")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print("Tasks Table already exists.")
        else:
            print(f"Error creating Tasks Table: {e}")

if __name__ == '__main__':
    create_tables()
