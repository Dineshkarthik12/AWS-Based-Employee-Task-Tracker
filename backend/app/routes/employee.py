from datetime import datetime

from boto3.dynamodb.conditions import Attr
from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import get_current_user
from app.models.schemas import EmployeeTaskUpdate
from app.services.dynamodb import get_tasks_table

router = APIRouter(tags=["Employee"])


@router.get("/mytasks")
async def get_my_tasks(current_user: dict = Depends(get_current_user)):
    """Get all tasks assigned to the current employee."""
    if current_user["role"] != "Employee":
        raise HTTPException(
            status_code=403, detail="Access denied. Employee role required."
        )

    tasks_table = get_tasks_table()

    try:
        response = tasks_table.scan(
            FilterExpression=Attr("AssignedTo").eq(current_user["user_id"])
        )
        tasks = response.get("Items", [])

        # Handle pagination
        while "LastEvaluatedKey" in response:
            response = tasks_table.scan(
                FilterExpression=Attr("AssignedTo").eq(current_user["user_id"]),
                ExclusiveStartKey=response["LastEvaluatedKey"],
            )
            tasks.extend(response.get("Items", []))

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
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch tasks: {str(e)}"
        )


@router.put("/mytasks/{task_id}")
async def update_my_task(
    task_id: str,
    task_update: EmployeeTaskUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update status or remarks of a task assigned to the current employee."""
    if current_user["role"] != "Employee":
        raise HTTPException(
            status_code=403, detail="Access denied. Employee role required."
        )

    tasks_table = get_tasks_table()

    # Verify task exists and belongs to this employee
    try:
        response = tasks_table.get_item(Key={"TaskId": task_id})
        existing_task = response.get("Item")

        if not existing_task:
            raise HTTPException(status_code=404, detail="Task not found")

        if existing_task.get("AssignedTo") != current_user["user_id"]:
            raise HTTPException(
                status_code=403,
                detail="You can only update tasks assigned to you",
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch task: {str(e)}"
        )

    # Build update expression
    update_parts = []
    expression_values = {}
    expression_names = {}

    if task_update.status is not None:
        if task_update.status not in ["Pending", "In Progress", "Completed"]:
            raise HTTPException(
                status_code=400,
                detail="Status must be Pending, In Progress, or Completed",
            )
        update_parts.append("#taskStatus = :status")
        expression_values[":status"] = task_update.status
        expression_names["#taskStatus"] = "Status"

    if task_update.remarks is not None:
        update_parts.append("#remarks = :remarks")
        expression_values[":remarks"] = task_update.remarks.strip()
        expression_names["#remarks"] = "Remarks"

    if not update_parts:
        raise HTTPException(status_code=400, detail="No fields to update")

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
        raise HTTPException(
            status_code=500, detail=f"Failed to update task: {str(e)}"
        )

    return {"success": True, "message": "Task updated successfully"}


@router.get("/mytasks/stats")
async def get_my_task_stats(current_user: dict = Depends(get_current_user)):
    """Get task statistics for the current employee."""
    if current_user["role"] != "Employee":
        raise HTTPException(
            status_code=403, detail="Access denied. Employee role required."
        )

    tasks_table = get_tasks_table()

    try:
        response = tasks_table.scan(
            FilterExpression=Attr("AssignedTo").eq(current_user["user_id"])
        )
        tasks = response.get("Items", [])

        while "LastEvaluatedKey" in response:
            response = tasks_table.scan(
                FilterExpression=Attr("AssignedTo").eq(current_user["user_id"]),
                ExclusiveStartKey=response["LastEvaluatedKey"],
            )
            tasks.extend(response.get("Items", []))

        total = len(tasks)
        pending = sum(1 for t in tasks if t.get("Status") == "Pending")
        in_progress = sum(1 for t in tasks if t.get("Status") == "In Progress")
        completed = sum(1 for t in tasks if t.get("Status") == "Completed")

        return {
            "success": True,
            "data": {
                "total_tasks": total,
                "pending_tasks": pending,
                "in_progress_tasks": in_progress,
                "completed_tasks": completed,
            },
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch stats: {str(e)}"
        )
