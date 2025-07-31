from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, groups, prompts, records, knowledge, tasks, matrix, admin
from .models import User
from .auth import get_password_hash, generate_api_key
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LLMKnowledge3 API",
    description="AI-powered knowledge management system",
    version="1.0.0"
)

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(auth.router)
app.include_router(groups.router)
app.include_router(prompts.router)
app.include_router(records.router)
app.include_router(knowledge.router)
app.include_router(tasks.router)
app.include_router(matrix.router)
app.include_router(admin.router)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.on_event("startup")
async def startup_event():
    """Create admin user if it doesn't exist"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_user = db.query(User).filter(User.username == admin_username).first()
        
        if not admin_user:
            admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
            admin_email = os.getenv("ADMIN_EMAIL", "admin@llmknowledge3.com")
            
            admin_user = User(
                username=admin_username,
                email=admin_email,
                hashed_password=get_password_hash(admin_password),
                is_admin=True,
                is_active=True,
                api_key=generate_api_key(),
                monthly_api_limit=10000
            )
            
            db.add(admin_user)
            db.commit()
            print(f"Admin user created: {admin_username}")
        else:
            print(f"Admin user already exists: {admin_username}")
    
    finally:
        db.close()
