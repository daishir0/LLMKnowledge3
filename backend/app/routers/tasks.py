from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import User, Task, Record, Prompt, Group, GroupPrompt
from ..schemas import Task as TaskSchema, TaskCreate, TaskUpdate, TaskStatus, APIResponse
from ..auth import get_current_user
from ..services import log_history, TaskService
import asyncio

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("/", response_model=List[TaskSchema])
async def list_tasks(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Task).filter(Task.user_id == current_user.id)
    
    if status:
        query = query.filter(Task.status == status)
    
    tasks = query.offset(skip).limit(limit).all()
    return tasks

@router.post("/", response_model=TaskSchema)
async def create_task(
    task: TaskCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Record).filter(
        Record.id == task.record_id,
        Record.user_id == current_user.id,
        Record.deleted == False
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    prompt = db.query(Prompt).filter(
        Prompt.id == task.prompt_id,
        Prompt.user_id == current_user.id,
        Prompt.deleted == False
    ).first()
    
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    if current_user.current_month_usage >= current_user.monthly_api_limit:
        raise HTTPException(status_code=429, detail="Monthly API limit exceeded")
    
    db_task = Task(
        type=task.type,
        record_id=task.record_id,
        prompt_id=task.prompt_id,
        user_id=current_user.id,
        ai_provider=task.ai_provider,
        ai_model=task.ai_model
    )
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    task_service = TaskService(db)
    background_tasks.add_task(task_service.process_task, db_task.id)
    
    log_history(db, "tasks", db_task.id, "create", {
        "type": db_task.type,
        "record_id": db_task.record_id,
        "prompt_id": db_task.prompt_id
    }, current_user.id)
    
    return db_task

@router.post("/bulk/group/{group_id}", response_model=APIResponse)
async def create_bulk_tasks_for_group(
    group_id: int,
    background_tasks: BackgroundTasks,
    force: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(Group).filter(
        Group.id == group_id,
        Group.user_id == current_user.id,
        Group.deleted == False
    ).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    records = db.query(Record).filter(
        Record.group_id == group_id,
        Record.user_id == current_user.id,
        Record.deleted == False
    ).all()
    
    group_prompts = db.query(GroupPrompt).filter(
        GroupPrompt.group_id == group_id
    ).all()
    
    if not group_prompts:
        raise HTTPException(status_code=400, detail="No prompts associated with group")
    
    tasks_created = 0
    task_service = TaskService(db)
    
    for record in records:
        for group_prompt in group_prompts:
            existing_task = db.query(Task).filter(
                Task.record_id == record.id,
                Task.prompt_id == group_prompt.prompt_id,
                Task.user_id == current_user.id
            ).first()
            
            if existing_task and not force:
                continue
            
            if current_user.current_month_usage >= current_user.monthly_api_limit:
                break
            
            db_task = Task(
                type="plain_to_knowledge",
                record_id=record.id,
                prompt_id=group_prompt.prompt_id,
                user_id=current_user.id
            )
            
            db.add(db_task)
            db.commit()
            db.refresh(db_task)
            
            background_tasks.add_task(task_service.process_task, db_task.id)
            tasks_created += 1
    
    from datetime import datetime
    group.task_executed_at = datetime.utcnow()
    db.commit()
    
    return APIResponse(
        success=True,
        message=f"Created {tasks_created} tasks for group",
        data={"tasks_created": tasks_created}
    )

@router.get("/status", response_model=TaskStatus)
async def get_task_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_tasks = db.query(Task).filter(Task.user_id == current_user.id).count()
    pending_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status == "pending"
    ).count()
    processing_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status == "processing"
    ).count()
    completed_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status == "completed"
    ).count()
    failed_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status == "failed"
    ).count()
    
    return TaskStatus(
        total_tasks=total_tasks,
        pending_tasks=pending_tasks,
        processing_tasks=processing_tasks,
        completed_tasks=completed_tasks,
        failed_tasks=failed_tasks
    )

@router.get("/{task_id}", response_model=TaskSchema)
async def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return task

@router.put("/{task_id}", response_model=TaskSchema)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    
    db.commit()
    db.refresh(task)
    
    log_history(db, "tasks", task.id, "update", update_data, current_user.id)
    
    return task

@router.delete("/{task_id}")
async def cancel_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.status in ["completed", "failed"]:
        raise HTTPException(status_code=400, detail="Cannot cancel completed or failed task")
    
    task.status = "cancelled"
    db.commit()
    
    log_history(db, "tasks", task.id, "update", {"status": "cancelled"}, current_user.id)
    
    return {"message": "Task cancelled successfully"}
