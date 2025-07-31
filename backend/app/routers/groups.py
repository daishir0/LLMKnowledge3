from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import User, Group, Record, GroupPrompt
from ..schemas import Group as GroupSchema, GroupCreate, GroupUpdate
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
