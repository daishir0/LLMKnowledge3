from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    api_key = Column(String(255), unique=True, index=True)
    monthly_api_limit = Column(Integer, default=1000)
    current_month_usage = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    groups = relationship("Group", back_populates="user")
    prompts = relationship("Prompt", back_populates="user")
    records = relationship("Record", back_populates="user")
    knowledge = relationship("Knowledge", back_populates="user")
    tasks = relationship("Task", back_populates="user")

class Group(Base):
    __tablename__ = "groups"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    deleted = Column(Boolean, default=False)
    task_executed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="groups")
    records = relationship("Record", back_populates="group")
    group_prompts = relationship("GroupPrompt", back_populates="group")

class Prompt(Base):
    __tablename__ = "prompts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)  # plain_to_knowledge, knowledge_to_knowledge
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="prompts")
    group_prompts = relationship("GroupPrompt", back_populates="prompt")

class GroupPrompt(Base):
    __tablename__ = "group_prompts"
    
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    prompt_id = Column(Integer, ForeignKey("prompts.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    group = relationship("Group", back_populates="group_prompts")
    prompt = relationship("Prompt", back_populates="group_prompts")

class Record(Base):
    __tablename__ = "records"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    file_path = Column(String(500))
    file_type = Column(String(50))
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_type = Column(String(50))  # 'record' or 'knowledge'
    parent_id = Column(Integer)
    deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="records")
    group = relationship("Group", back_populates="records")
    knowledge = relationship("Knowledge", back_populates="record")

class Knowledge(Base):
    __tablename__ = "knowledge"
    
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    record_id = Column(Integer, ForeignKey("records.id"), nullable=False)
    prompt_id = Column(Integer, ForeignKey("prompts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_type = Column(String(50))  # 'record' or 'knowledge'
    parent_id = Column(Integer)
    deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="knowledge")
    record = relationship("Record", back_populates="knowledge")
    prompt = relationship("Prompt")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False)  # 'plain_to_knowledge', 'knowledge_to_knowledge'
    status = Column(String(20), default="pending")  # pending, processing, completed, failed, cancelled
    record_id = Column(Integer, ForeignKey("records.id"), nullable=False)
    prompt_id = Column(Integer, ForeignKey("prompts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    result_knowledge_id = Column(Integer, ForeignKey("knowledge.id"))
    error_message = Column(Text)
    ai_provider = Column(String(50))
    ai_model = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="tasks")
    record = relationship("Record")
    prompt = relationship("Prompt")
    result_knowledge = relationship("Knowledge")

class History(Base):
    __tablename__ = "history"
    
    id = Column(Integer, primary_key=True, index=True)
    table_name = Column(String(50), nullable=False)
    record_id = Column(Integer, nullable=False)
    action = Column(String(20), nullable=False)  # create, update, delete
    data = Column(JSON)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")
