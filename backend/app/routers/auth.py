from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import User as UserSchema, UserCreate, Token
from ..auth import (
    authenticate_user, create_access_token, get_password_hash, 
    generate_api_key, get_current_user, get_current_admin_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from ..services import log_history

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=UserSchema)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    api_key = generate_api_key()
    
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        api_key=api_key,
        is_admin=False,
        is_active=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    log_history(db, "users", db_user.id, "create", {
        "username": db_user.username,
        "email": db_user.email
    })
    
    return db_user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/api-key")
async def get_api_key(current_user: User = Depends(get_current_user)):
    return {"api_key": current_user.api_key}

@router.post("/regenerate-api-key")
async def regenerate_api_key(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_api_key = generate_api_key()
    current_user.api_key = new_api_key
    db.commit()
    
    log_history(db, "users", current_user.id, "update", {
        "action": "regenerate_api_key"
    }, current_user.id)
    
    return {"api_key": new_api_key}
