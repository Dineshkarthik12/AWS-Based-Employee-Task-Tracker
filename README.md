# Employee Task Tracker

A modern full-stack web application that enables managers to assign and monitor employee tasks while allowing employees to view and update their assigned work.

## Architecture & Tech Stack

- **Frontend**: React.js (Vite), React Router, Axios, Tailwind CSS v4, AWS SDK v3
- **Backend**: FastAPI, Python, boto3, Pydantic
- **Database**: AWS DynamoDB
- **Authentication**: AWS Cognito User Pool
- **Deployment**: Single AWS EC2 Ubuntu instance using Nginx and Uvicorn

## Features

### Manager Role
- View dashboard with summary statistics
- Assign new tasks to employees with priorities and deadlines
- View, search, and filter all tasks
- Edit task details and assignments
- Delete tasks
- Monitor task progress across the organization

### Employee Role
- View personal dashboard with task statistics
- View all assigned tasks
- Filter tasks by status
- Update task status (Pending, In Progress, Completed)
- Add work remarks to tasks

## Prerequisites

1. AWS Account
2. AWS Cognito User Pool with an App Client (no secret)
3. Two AWS DynamoDB tables (`EmployeeTracker_Users` and `EmployeeTracker_Tasks`)
4. Node.js >= 20
5. Python >= 3.10

## Environment Variables

### Backend (`backend/.env`)

```ini
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

COGNITO_USER_POOL_ID=your_user_pool_id
COGNITO_APP_CLIENT_ID=your_app_client_id
COGNITO_REGION=us-east-1

USERS_TABLE=EmployeeTracker_Users
TASKS_TABLE=EmployeeTracker_Tasks

FRONTEND_URL=http://your-ec2-ip-or-domain
```

### Frontend (`frontend/.env`)

```ini
VITE_API_URL=http://your-ec2-ip-or-domain
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_CLIENT_ID=your_app_client_id
```

## DynamoDB Table Schema

### Users Table (`EmployeeTracker_Users`)
- Partition Key: `UserId` (String)

### Tasks Table (`EmployeeTracker_Tasks`)
- Partition Key: `TaskId` (String)

## Deployment Instructions (Ubuntu EC2)

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd employee-task-tracker
   ```

2. **Backend Setup**
   ```bash
   sudo apt update
   sudo apt install python3-pip python3-venv nginx -y
   
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
   Create `.env` file and populate it with your AWS credentials.

3. **Frontend Setup**
   ```bash
   # Install Node.js (if not installed)
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   cd ../frontend
   npm install
   ```
   Create `.env` file and populate it.
   ```bash
   npm run build
   ```

4. **Nginx Configuration**
   Copy the frontend build to `/var/www/html`
   ```bash
   sudo cp -r dist/* /var/www/html/
   ```
   
   Configure Nginx (example in `deploy/nginx.conf`)
   ```bash
   sudo cp ../deploy/nginx.conf /etc/nginx/sites-available/default
   sudo systemctl restart nginx
   ```

5. **Systemd Service for Backend**
   Copy the systemd service file (example in `deploy/backend.service`) and adjust paths.
   ```bash
   sudo cp ../deploy/backend.service /etc/systemd/system/employee-tracker-backend.service
   sudo systemctl daemon-reload
   sudo systemctl start employee-tracker-backend
   sudo systemctl enable employee-tracker-backend
   ```
