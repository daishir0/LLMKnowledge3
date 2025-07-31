from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_
import os
import aiofiles
from ..database import get_db
from ..models import User, Record, Group
from ..schemas import Record as RecordSchema, RecordCreate, RecordUpdate
from ..auth import get_current_user
from ..services import log_history, MarkItDownService

router = APIRouter(prefix="/records", tags=["records"])

@router.get("/", response_model=List[RecordSchema])
async def list_records(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    group_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Record).filter(
        Record.user_id == current_user.id,
        Record.deleted == False
    )
    
    if search:
        query = query.filter(
            or_(
                Record.title.contains(search),
                Record.content.contains(search)
            )
        )
    
    if group_id:
        query = query.filter(Record.group_id == group_id)
    
    records = query.offset(skip).limit(limit).all()
    return records

@router.post("/", response_model=RecordSchema)
async def create_record(
    record: RecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(Group).filter(
        Group.id == record.group_id,
        Group.user_id == current_user.id,
        Group.deleted == False
    ).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    db_record = Record(
        title=record.title,
        content=record.content,
        file_path=record.file_path,
        file_type=record.file_type,
        group_id=record.group_id,
        user_id=current_user.id,
        parent_type=record.parent_type,
        parent_id=record.parent_id
    )
    
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    log_history(db, "records", db_record.id, "create", {
        "title": db_record.title,
        "group_id": db_record.group_id
    }, current_user.id)
    
    return db_record

@router.post("/upload", response_model=RecordSchema)
async def upload_file(
    group_id: int,
    file: UploadFile = File(...),
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
    
    upload_dir = f"uploads/{current_user.id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = f"{upload_dir}/{file.filename}"
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    markitdown_service = MarkItDownService()
    try:
        markdown_content = await markitdown_service.convert_file(file_path)
    except Exception as e:
        markdown_content = f"Failed to convert file: {str(e)}"
    
    db_record = Record(
        title=file.filename or "Uploaded File",
        content=markdown_content,
        file_path=file_path,
        file_type=file.content_type,
        group_id=group_id,
        user_id=current_user.id
    )
    
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    log_history(db, "records", db_record.id, "create", {
        "title": db_record.title,
        "file_path": file_path,
        "group_id": group_id
    }, current_user.id)
    
    return db_record

@router.get("/{record_id}", response_model=RecordSchema)
async def get_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Record).filter(
        Record.id == record_id,
        Record.user_id == current_user.id,
        Record.deleted == False
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    return record

@router.put("/{record_id}", response_model=RecordSchema)
async def update_record(
    record_id: int,
    record_update: RecordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Record).filter(
        Record.id == record_id,
        Record.user_id == current_user.id,
        Record.deleted == False
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    update_data = record_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)
    
    db.commit()
    db.refresh(record)
    
    log_history(db, "records", record.id, "update", update_data, current_user.id)
    
    return record

@router.delete("/{record_id}")
async def delete_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Record).filter(
        Record.id == record_id,
        Record.user_id == current_user.id,
        Record.deleted == False
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    record.deleted = True
    db.commit()
    
    log_history(db, "records", record.id, "delete", {}, current_user.id)
    
    return {"message": "Record deleted successfully"}
