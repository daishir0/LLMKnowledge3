from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import User, Prompt
from ..schemas import Prompt as PromptSchema, PromptCreate, PromptUpdate
from ..auth import get_current_user
from ..services import log_history

router = APIRouter(prefix="/prompts", tags=["prompts"])

@router.get("/", response_model=List[PromptSchema])
async def list_prompts(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Prompt).filter(
        Prompt.user_id == current_user.id,
        Prompt.deleted == False
    )
    
    if search:
        query = query.filter(
            or_(
                Prompt.name.contains(search),
                Prompt.content.contains(search)
            )
        )
    
    if category:
        query = query.filter(Prompt.category == category)
    
    prompts = query.offset(skip).limit(limit).all()
    return prompts

@router.post("/", response_model=PromptSchema)
async def create_prompt(
    prompt: PromptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_prompt = Prompt(
        name=prompt.name,
        content=prompt.content,
        category=prompt.category,
        user_id=current_user.id
    )
    
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    
    log_history(db, "prompts", db_prompt.id, "create", {
        "name": db_prompt.name,
        "category": db_prompt.category
    }, current_user.id)
    
    return db_prompt

@router.get("/{prompt_id}", response_model=PromptSchema)
async def get_prompt(
    prompt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.user_id == current_user.id,
        Prompt.deleted == False
    ).first()
    
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    return prompt

@router.put("/{prompt_id}", response_model=PromptSchema)
async def update_prompt(
    prompt_id: int,
    prompt_update: PromptUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.user_id == current_user.id,
        Prompt.deleted == False
    ).first()
    
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    update_data = prompt_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prompt, field, value)
    
    db.commit()
    db.refresh(prompt)
    
    log_history(db, "prompts", prompt.id, "update", update_data, current_user.id)
    
    return prompt

@router.delete("/{prompt_id}")
async def delete_prompt(
    prompt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.user_id == current_user.id,
        Prompt.deleted == False
    ).first()
    
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    prompt.deleted = True
    db.commit()
    
    log_history(db, "prompts", prompt.id, "delete", {}, current_user.id)
    
    return {"message": "Prompt deleted successfully"}
