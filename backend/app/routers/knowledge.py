from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import User, Knowledge, Record, Prompt
from ..schemas import Knowledge as KnowledgeSchema, KnowledgeCreate, KnowledgeUpdate
from ..auth import get_current_user
from ..services import log_history

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

@router.get("/", response_model=List[KnowledgeSchema])
async def list_knowledge(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    record_id: Optional[int] = Query(None),
    prompt_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Knowledge).filter(
        Knowledge.user_id == current_user.id,
        Knowledge.deleted == False
    )
    
    if search:
        query = query.filter(
            or_(
                Knowledge.question.contains(search),
                Knowledge.answer.contains(search)
            )
        )
    
    if record_id:
        query = query.filter(Knowledge.record_id == record_id)
    
    if prompt_id:
        query = query.filter(Knowledge.prompt_id == prompt_id)
    
    knowledge = query.offset(skip).limit(limit).all()
    return knowledge

@router.post("/", response_model=KnowledgeSchema)
async def create_knowledge(
    knowledge: KnowledgeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Record).filter(
        Record.id == knowledge.record_id,
        Record.user_id == current_user.id,
        Record.deleted == False
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    prompt = db.query(Prompt).filter(
        Prompt.id == knowledge.prompt_id,
        Prompt.user_id == current_user.id,
        Prompt.deleted == False
    ).first()
    
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    db_knowledge = Knowledge(
        question=knowledge.question,
        answer=knowledge.answer,
        record_id=knowledge.record_id,
        prompt_id=knowledge.prompt_id,
        user_id=current_user.id,
        parent_type=knowledge.parent_type,
        parent_id=knowledge.parent_id
    )
    
    db.add(db_knowledge)
    db.commit()
    db.refresh(db_knowledge)
    
    log_history(db, "knowledge", db_knowledge.id, "create", {
        "question": db_knowledge.question[:100],
        "record_id": db_knowledge.record_id,
        "prompt_id": db_knowledge.prompt_id
    }, current_user.id)
    
    return db_knowledge

@router.get("/{knowledge_id}", response_model=KnowledgeSchema)
async def get_knowledge(
    knowledge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    knowledge = db.query(Knowledge).filter(
        Knowledge.id == knowledge_id,
        Knowledge.user_id == current_user.id,
        Knowledge.deleted == False
    ).first()
    
    if not knowledge:
        raise HTTPException(status_code=404, detail="Knowledge not found")
    
    return knowledge

@router.put("/{knowledge_id}", response_model=KnowledgeSchema)
async def update_knowledge(
    knowledge_id: int,
    knowledge_update: KnowledgeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    knowledge = db.query(Knowledge).filter(
        Knowledge.id == knowledge_id,
        Knowledge.user_id == current_user.id,
        Knowledge.deleted == False
    ).first()
    
    if not knowledge:
        raise HTTPException(status_code=404, detail="Knowledge not found")
    
    update_data = knowledge_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(knowledge, field, value)
    
    db.commit()
    db.refresh(knowledge)
    
    log_history(db, "knowledge", knowledge.id, "update", update_data, current_user.id)
    
    return knowledge

@router.delete("/{knowledge_id}")
async def delete_knowledge(
    knowledge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    knowledge = db.query(Knowledge).filter(
        Knowledge.id == knowledge_id,
        Knowledge.user_id == current_user.id,
        Knowledge.deleted == False
    ).first()
    
    if not knowledge:
        raise HTTPException(status_code=404, detail="Knowledge not found")
    
    knowledge.deleted = True
    db.commit()
    
    log_history(db, "knowledge", knowledge.id, "delete", {}, current_user.id)
    
    return {"message": "Knowledge deleted successfully"}
