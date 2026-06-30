import uuid
from datetime import datetime

from boto3.dynamodb.conditions import Attr
from fastapi import APIRouter, Depends, HTTPException, Query

from app.middleware.auth import require_manager
from app.models.schemas import TaskCreate, TaskUpdate
from app.services.dynamodb import get_tasks_table, get_users_table

router = APIRouter(tags=["Manager"])


@router.get("/employees")
async def get_all_employees(current_user: dict = Depends(require_manager)):
    """Get all employees. Manager only."""
    users_table = get_users_table()

    try:
        response = users_table.scan(
            FilterExpression=Attr("Role").eq("Employee")
        )
        employees = response.get("Items", [])

        # Handle pagination for larger datasets
        while "LastEvaluatedKey" in response:
            response = users_table.scan(
                FilterExpression=Attr("Role").eq("Employee"),
                ExclusiveStartKey=response["LastEvaluatedKey"],
            )
            employees.extend(response.get("Items", []))

        return {
            "success": True,
            "data": [
                {
                    "user_id": emp["UserId"],
                    "name": emp.get("Name", ""),
                    "email": emp.get("Email", ""),
                    "role": emp.get("Role", "Employee"),
                }
                for emp in employees
            ],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch employees: {str(e)}")


@router.post("/tasks")
async def create_task(
    task: TaskCreate, current_user: dict = Depends(require_manager)
):
    """Create and assign a new task. Manager only."""
    # Validate priority
    if task.priority not in ["Low", "Medium", "High"]:
        raise HTTPException(
            status_code=400,
            detail="Priority must be Low, Medium, or High",
        )

    # Validate deadline format
    try:
        datetime.strptime(task.deadline, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Deadline must be in YYYY-MM-DD format",
        )

    # Verify the assigned employee exists
    users_table = get_users_table()
    try:
        emp_response = users_table.get_item(Key={"UserId": task.assigned_to})
        employee = emp_response.get("Item")
        if not employee or employee.get("Role") != "Employee":
            raise HTTPException(
                status_code=404,
                detail="Assigned employee not found",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify employee: {str(e)}")

    # Create the task
    task_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    task_item = {
        "TaskId": task_id,
        "Title": task.title.strip(),
        "Description": task.description.strip(),
        "AssignedTo": task.assigned_to,
        "AssignedToName": employee.get("Name", ""),
        "AssignedBy": current_user["user_id"],
        "AssignedByName": current_user["name"],
        "Priority": task.priority,
        "Status": "Pending",
        "Deadline": task.deadline,
        "Remarks": "",
        "CreatedAt": now,
        "UpdatedAt": now,
    }

    tasks_table = get_tasks_table()
    try:
        tasks_table.put_item(Item=task_item)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")

    return {
        "success": True,
        "message": "Task created successfully",
        "data": {
            "task_id": task_id,
            "title": task_item["Title"],
            "description": task_item["Description"],
            "assigned_to": task_item["AssignedTo"],
            "assigned_to_name": task_item["AssignedToName"],
            "assigned_by": task_item["AssignedBy"],
            "assigned_by_name": task_item["AssignedByName"],
            "priority": task_item["Priority"],
            "status": task_item["Status"],
            "deadline": task_item["Deadline"],
            "remarks": task_item["Remarks"],
            "created_at": task_item["CreatedAt"],
            "updated_at": task_item["UpdatedAt"],
        },
    }


@router.get("/tasks")
async def get_all_tasks(
    search: str = Query(default="", description="Search by title or employee name"),
    status: str = Query(default="", description="Filter by status"),
    current_user: dict = Depends(require_manager),
):
    """Get all tasks with optional search and filter. Manager only."""
    tasks_table = get_tasks_table()

    try:
        # Build filter expression
        filter_parts = []
        expression_values = {}
        expression_names = {}

        if status and status in ["Pending", "In Progress", "Completed"]:
            filter_parts.append("#taskStatus = :status")
            expression_values[":status"] = status
            expression_names["#taskStatus"] = "Status"

        scan_kwargs = {}
        if filter_parts:
            scan_kwargs["FilterExpression"] = " AND ".join(filter_parts)
            scan_kwargs["ExpressionAttributeValues"] = expression_values
            scan_kwargs["ExpressionAttributeNames"] = expression_names

        response = tasks_table.scan(**scan_kwargs)
        tasks = response.get("Items", [])

        # Handle pagination
        while "LastEvaluatedKey" in response:
            scan_kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]
            response = tasks_table.scan(**scan_kwargs)
            tasks.extend(response.get("Items", []))

        # Apply search filter in-memory (for flexibility)
        if search:
            search_lower = search.lower()
            tasks = [
                t
                for t in tasks
                if search_lower in t.get("Title", "").lower()
                or search_lower in t.get("AssignedToName", "").lower()
            ]

        # Sort by creation date (newest first)
        tasks.sort(key=lambda t: t.get("CreatedAt", ""), reverse=True)

        return {
            "success": True,
            "data": [
                {
                    "task_id": t["TaskId"],
                    "title": t.get("Title", ""),
                    "description": t.get("Description", ""),
                    "assigned_to": t.get("AssignedTo", ""),
                    "assigned_to_name": t.get("AssignedToName", ""),
                    "assigned_by": t.get("AssignedBy", ""),
                    "assigned_by_name": t.get("AssignedByName", ""),
                    "priority": t.get("Priority", "Medium"),
                    "status": t.get("Status", "Pending"),
                    "deadline": t.get("Deadline", ""),
                    "remarks": t.get("Remarks", ""),
                    "created_at": t.get("CreatedAt", ""),
                    "updated_at": t.get("UpdatedAt", ""),
                }
                for t in tasks
            ],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tasks: {str(e)}")


@router.put("/tasks/{task_id}")
async def update_task(
    task_id: str,
    task_update: TaskUpdate,
    current_user: dict = Depends(require_manager),
):
    """Update a task. Manager only."""
    tasks_table = get_tasks_table()

    # Verify task exists
    try:
        response = tasks_table.get_item(Key={"TaskId": task_id})
        existing_task = response.get("Item")
        if not existing_task:
            raise HTTPException(status_code=404, detail="Task not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch task: {str(e)}")

    # Build update expression
    update_parts = []
    expression_values = {}
    expression_names = {}

    update_data = task_update.model_dump(exclude_none=True)

    field_mapping = {
        "title": "Title",
        "description": "Description",
        "assigned_to": "AssignedTo",
        "priority": "Priority",
        "status": "Status",
        "deadline": "Deadline",
    }

    for field, dynamo_field in field_mapping.items():
        if field in update_data:
            value = update_data[field]

            # Validate priority
            if field == "priority" and value not in ["Low", "Medium", "High"]:
                raise HTTPException(
                    status_code=400,
                    detail="Priority must be Low, Medium, or High",
                )

            # Validate status
            if field == "status" and value not in [
                "Pending",
                "In Progress",
                "Completed",
            ]:
                raise HTTPException(
                    status_code=400,
                    detail="Status must be Pending, In Progress, or Completed",
                )

            # Validate deadline
            if field == "deadline":
                try:
                    datetime.strptime(value, "%Y-%m-%d")
                except ValueError:
                    raise HTTPException(
                        status_code=400,
                        detail="Deadline must be in YYYY-MM-DD format",
                    )

            safe_name = f"#{field}"
            safe_value = f":{field}"
            update_parts.append(f"{safe_name} = {safe_value}")
            expression_values[safe_value] = value
            expression_names[safe_name] = dynamo_field

    if not update_parts:
        raise HTTPException(status_code=400, detail="No fields to update")

    # If assigned_to is being updated, also update the name
    if "assigned_to" in update_data:
        users_table = get_users_table()
        try:
            emp_response = users_table.get_item(
                Key={"UserId": update_data["assigned_to"]}
            )
            employee = emp_response.get("Item")
            if not employee or employee.get("Role") != "Employee":
                raise HTTPException(
                    status_code=404,
                    detail="Assigned employee not found",
                )
            update_parts.append("#assignedToName = :assignedToName")
            expression_values[":assignedToName"] = employee.get("Name", "")
            expression_names["#assignedToName"] = "AssignedToName"
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to verify employee: {str(e)}"
            )

    # Add UpdatedAt
    update_parts.append("#updatedAt = :updatedAt")
    expression_values[":updatedAt"] = datetime.utcnow().isoformat()
    expression_names["#updatedAt"] = "UpdatedAt"

    try:
        tasks_table.update_item(
            Key={"TaskId": task_id},
            UpdateExpression="SET " + ", ".join(update_parts),
            ExpressionAttributeValues=expression_values,
            ExpressionAttributeNames=expression_names,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")

    return {"success": True, "message": "Task updated successfully"}


@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: str, current_user: dict = Depends(require_manager)
):
    """Delete a task. Manager only."""
    tasks_table = get_tasks_table()

    # Verify task exists
    try:
        response = tasks_table.get_item(Key={"TaskId": task_id})
        if not response.get("Item"):
            raise HTTPException(status_code=404, detail="Task not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch task: {str(e)}")

    try:
        tasks_table.delete_item(Key={"TaskId": task_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete task: {str(e)}")

    return {"success": True, "message": "Task deleted successfully"}


@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(require_manager)):
    """Get dashboard statistics. Manager only."""
    tasks_table = get_tasks_table()
    users_table = get_users_table()

    try:
        # Get all tasks
        tasks_response = tasks_table.scan()
        tasks = tasks_response.get("Items", [])
        while "LastEvaluatedKey" in tasks_response:
            tasks_response = tasks_table.scan(
                ExclusiveStartKey=tasks_response["LastEvaluatedKey"]
            )
            tasks.extend(tasks_response.get("Items", []))

        # Get employee count
        emp_response = users_table.scan(
            FilterExpression=Attr("Role").eq("Employee"),
            Select="COUNT",
        )
        employee_count = emp_response.get("Count", 0)

        # Calculate stats
        total_tasks = len(tasks)
        pending = sum(1 for t in tasks if t.get("Status") == "Pending")
        in_progress = sum(1 for t in tasks if t.get("Status") == "In Progress")
        completed = sum(1 for t in tasks if t.get("Status") == "Completed")

        return {
            "success": True,
            "data": {
                "total_employees": employee_count,
                "total_tasks": total_tasks,
                "pending_tasks": pending,
                "in_progress_tasks": in_progress,
                "completed_tasks": completed,
            },
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch stats: {str(e)}"
        )
