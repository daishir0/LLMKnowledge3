from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import User, Group, Record, GroupPrompt, Prompt, Task, Knowledge
from ..schemas import (
    Group as GroupSchema, GroupCreate, GroupUpdate, Prompt as PromptSchema,
    GroupDetail, GroupDetailRecord, GroupDetailKnowledge, GroupDetailTask
)
from ..auth import get_current_user
from ..services import log_history

router = APIRouter(prefix="/groups", tags=["groups"])

@router.get("/", response_model=List[GroupSchema])
async def list_groups(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Group).filter(
        Group.user_id == current_user.id,
        Group.deleted == False
    )
    
    if search:
        query = query.filter(
            or_(
                Group.name.contains(search),
                Group.description.contains(search)
            )
        )
    
    groups = query.offset(skip).limit(limit).all()
    return groups

@router.post("/", response_model=GroupSchema)
async def create_group(
    group: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_group = Group(
        name=group.name,
        description=group.description,
        user_id=current_user.id
    )
    
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    log_history(db, "groups", db_group.id, "create", {
        "name": db_group.name,
        "description": db_group.description
    }, current_user.id)
    
    return db_group

@router.get("/{group_id}", response_model=GroupSchema)
async def get_group(
    group_id: int,
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
    
    return group

@router.put("/{group_id}", response_model=GroupSchema)
async def update_group(
    group_id: int,
    group_update: GroupUpdate,
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
    
    update_data = group_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(group, field, value)
    
    db.commit()
    db.refresh(group)
    
    log_history(db, "groups", group.id, "update", update_data, current_user.id)
    
    return group

@router.delete("/{group_id}")
async def delete_group(
    group_id: int,
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
    
    group.deleted = True
    db.commit()
    
    log_history(db, "groups", group.id, "delete", {}, current_user.id)
    
    return {"message": "Group deleted successfully"}

@router.post("/{group_id}/prompts/{prompt_id}")
async def add_prompt_to_group(
    group_id: int,
    prompt_id: int,
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
    
    existing = db.query(GroupPrompt).filter(
        GroupPrompt.group_id == group_id,
        GroupPrompt.prompt_id == prompt_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Prompt already associated with group")
    
    group_prompt = GroupPrompt(
        group_id=group_id,
        prompt_id=prompt_id
    )
    
    db.add(group_prompt)
    db.commit()
    
    return {"message": "Prompt added to group successfully"}

@router.delete("/{group_id}/prompts/{prompt_id}")
async def remove_prompt_from_group(
    group_id: int,
    prompt_id: int,
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
    
    group_prompt = db.query(GroupPrompt).filter(
        GroupPrompt.group_id == group_id,
        GroupPrompt.prompt_id == prompt_id
    ).first()
    
    if not group_prompt:
        raise HTTPException(status_code=404, detail="Prompt not associated with group")
    
    db.delete(group_prompt)
    db.commit()
    
    return {"message": "Prompt removed from group successfully"}

@router.get("/{group_id}/prompts", response_model=List[PromptSchema])
async def get_group_prompts(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all prompts associated with a group"""
    group = db.query(Group).filter(
        Group.id == group_id,
        Group.user_id == current_user.id,
        Group.deleted == False
    ).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    prompts = db.query(Prompt).join(
        GroupPrompt, GroupPrompt.prompt_id == Prompt.id
    ).filter(
        GroupPrompt.group_id == group_id,
        Prompt.deleted == False
    ).all()
    
    return prompts

@router.get("/{group_id}/detail", response_model=GroupDetail)
async def get_group_detail(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a group including records, knowledge, and tasks"""
    group = db.query(Group).filter(
        Group.id == group_id,
        Group.user_id == current_user.id,
        Group.deleted == False
    ).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Get prompts associated with this group
    prompts = db.query(Prompt).join(
        GroupPrompt, GroupPrompt.prompt_id == Prompt.id
    ).filter(
        GroupPrompt.group_id == group_id,
        Prompt.deleted == False
    ).all()
    
    # Get records (plain knowledge) in this group
    records = db.query(Record).filter(
        Record.group_id == group_id,
        Record.deleted == False
    ).all()
    
    record_data = [
        GroupDetailRecord(
            id=record.id,
            title=record.title,
            content=record.content[:200] + "..." if len(record.content) > 200 else record.content,
            file_type=record.file_type,
            created_at=record.created_at
        ) for record in records
    ]
    
    # Get generated knowledge for this group
    knowledge_query = db.query(Knowledge, Record, Prompt).join(
        Record, Knowledge.record_id == Record.id
    ).join(
        Prompt, Knowledge.prompt_id == Prompt.id
    ).filter(
        Record.group_id == group_id,
        Knowledge.deleted == False,
        Record.deleted == False
    ).order_by(Knowledge.created_at.desc())
    
    knowledge_data = [
        GroupDetailKnowledge(
            id=knowledge.id,
            question=knowledge.question,
            answer=knowledge.answer[:200] + "..." if len(knowledge.answer) > 200 else knowledge.answer,
            record_title=record.title,
            prompt_name=prompt.name,
            created_at=knowledge.created_at
        ) for knowledge, record, prompt in knowledge_query.all()
    ]
    
    # Get pending/failed tasks for this group
    task_query = db.query(Task, Record, Prompt).join(
        Record, Task.record_id == Record.id
    ).join(
        Prompt, Task.prompt_id == Prompt.id
    ).filter(
        Record.group_id == group_id,
        Task.status.in_(["pending", "processing", "failed"])
    ).order_by(Task.created_at.desc())
    
    pending_tasks = [
        GroupDetailTask(
            id=task.id,
            type=task.type,
            status=task.status,
            record_title=record.title,
            prompt_name=prompt.name,
            error_message=task.error_message,
            created_at=task.created_at
        ) for task, record, prompt in task_query.all()
    ]
    
    # Calculate task statistics
    total_tasks = db.query(Task).join(Record).filter(
        Record.group_id == group_id
    ).count()
    
    completed_tasks = db.query(Task).join(Record).filter(
        Record.group_id == group_id,
        Task.status == "completed"
    ).count()
    
    failed_tasks = db.query(Task).join(Record).filter(
        Record.group_id == group_id,
        Task.status == "failed"
    ).count()
    
    processing_tasks = db.query(Task).join(Record).filter(
        Record.group_id == group_id,
        Task.status.in_(["pending", "processing"])
    ).count()
    
    task_stats = {
        "total": total_tasks,
        "completed": completed_tasks,
        "failed": failed_tasks,
        "processing": processing_tasks,
        "completion_rate": round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
    }
    
    return GroupDetail(
        group=group,
        prompts=prompts,
        records=record_data,
        knowledge=knowledge_data,
        pending_tasks=pending_tasks,
        task_stats=task_stats
    )
