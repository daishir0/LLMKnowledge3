from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    monthly_api_limit: Optional[int] = None

class User(UserBase):
    id: int
    is_admin: bool
    is_active: bool
    api_key: Optional[str]
    monthly_api_limit: int
    current_month_usage: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Group(GroupBase):
    id: int
    user_id: int
    deleted: bool
    task_executed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PromptBase(BaseModel):
    name: str
    content: str
    category: str

class PromptCreate(PromptBase):
    pass

class PromptUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None

class Prompt(PromptBase):
    id: int
    user_id: int
    deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RecordBase(BaseModel):
    title: str
    content: str
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    parent_type: Optional[str] = None
    parent_id: Optional[int] = None

class RecordCreate(RecordBase):
    group_id: int

class RecordUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    parent_type: Optional[str] = None
    parent_id: Optional[int] = None

class Record(RecordBase):
    id: int
    group_id: int
    user_id: int
    deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class KnowledgeBase(BaseModel):
    question: str
    answer: str
    parent_type: Optional[str] = None
    parent_id: Optional[int] = None

class KnowledgeCreate(KnowledgeBase):
    record_id: int
    prompt_id: int

class KnowledgeUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    parent_type: Optional[str] = None
    parent_id: Optional[int] = None

class Knowledge(KnowledgeBase):
    id: int
    record_id: int
    prompt_id: int
    user_id: int
    deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    type: str
    record_id: int
    prompt_id: int
    ai_provider: Optional[str] = None
    ai_model: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    status: Optional[str] = None
    error_message: Optional[str] = None
    result_knowledge_id: Optional[int] = None

class Task(TaskBase):
    id: int
    status: str
    user_id: int
    result_knowledge_id: Optional[int]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class KnowledgeMatrixItem(BaseModel):
    group_name: str
    record_title: str
    prompt_name: str
    question: str
    answer: str
    created_at: datetime

class KnowledgeMatrix(BaseModel):
    items: List[KnowledgeMatrixItem]
    total_count: int

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

class TaskStatus(BaseModel):
    total_tasks: int
    pending_tasks: int
    processing_tasks: int
    completed_tasks: int
    failed_tasks: int
