from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TaskCreate(BaseModel):
    """Schema for creating a new task."""
    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    description: str = Field(default="", max_length=2000, description="Task description")
    assigned_to: str = Field(..., description="Employee UserId to assign the task to")
    priority: str = Field(default="Medium", description="Task priority: Low, Medium, High")
    deadline: str = Field(..., description="Task deadline in ISO format (YYYY-MM-DD)")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Complete API documentation",
                "description": "Write comprehensive API docs for the new endpoints",
                "assigned_to": "user-123",
                "priority": "High",
                "deadline": "2026-07-15",
            }
        }


class TaskUpdate(BaseModel):
    """Schema for manager updating a task."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    assigned_to: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[str] = None
    status: Optional[str] = None


class EmployeeTaskUpdate(BaseModel):
    """Schema for employee updating their task status/remarks."""
    status: Optional[str] = Field(None, description="Status: Pending, In Progress, Completed")
    remarks: Optional[str] = Field(None, max_length=2000, description="Work remarks")


class UserProfile(BaseModel):
    """Schema for user profile response."""
    user_id: str
    name: str
    email: str
    role: str


class TaskResponse(BaseModel):
    """Schema for task response."""
    task_id: str
    title: str
    description: str
    assigned_to: str
    assigned_to_name: Optional[str] = None
    assigned_by: str
    assigned_by_name: Optional[str] = None
    priority: str
    status: str
    deadline: str
    remarks: str
    created_at: str
    updated_at: str
