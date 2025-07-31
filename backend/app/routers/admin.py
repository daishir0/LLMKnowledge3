from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import User
from ..schemas import User as UserSchema, UserUpdate
from ..auth import get_current_admin_user, get_password_hash
from ..services import log_history

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=List[UserSchema])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    
    if search:
        query = query.filter(
            or_(
                User.username.contains(search),
                User.email.contains(search)
            )
        )
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/users/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.put("/users/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.dict(exclude_unset=True)
    
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    log_history(db, "users", user.id, "update", update_data, current_user.id)
    
    return user

@router.delete("/users/{user_id}")
async def deactivate_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    
    user.is_active = False
    db.commit()
    
    log_history(db, "users", user.id, "update", {"is_active": False}, current_user.id)
    
    return {"message": "User deactivated successfully"}

@router.post("/users/{user_id}/reset-usage")
async def reset_user_usage(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.current_month_usage = 0
    db.commit()
    
    log_history(db, "users", user.id, "update", {"current_month_usage": 0}, current_user.id)
    
    return {"message": "User usage reset successfully"}

@router.get("/stats")
async def get_admin_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    admin_users = db.query(User).filter(User.is_admin == True).count()
    
    from ..models import Group, Record, Knowledge, Task
    total_groups = db.query(Group).filter(Group.deleted == False).count()
    total_records = db.query(Record).filter(Record.deleted == False).count()
    total_knowledge = db.query(Knowledge).filter(Knowledge.deleted == False).count()
    total_tasks = db.query(Task).count()
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "admin": admin_users
        },
        "content": {
            "groups": total_groups,
            "records": total_records,
            "knowledge": total_knowledge,
            "tasks": total_tasks
        }
    }
