from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Matrix
from ..schemas import (
    KnowledgeMatrix, KnowledgeMatrixItem, Matrix as MatrixSchema,
    MatrixCreate, MatrixUpdate, MatrixExportData
)
from ..auth import get_current_user, get_current_admin_user
from ..services import ExportService, MatrixService
import tempfile
import os

router = APIRouter(prefix="/matrix", tags=["knowledge-matrix"])

# マトリックス定義の管理エンドポイント
@router.get("/definitions", response_model=List[MatrixSchema])
async def get_matrix_definitions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ユーザーのマトリックス定義一覧を取得"""
    matrices = db.query(Matrix).filter(
        Matrix.user_id == current_user.id,
        Matrix.deleted == False
    ).all()
    return matrices

@router.post("/definitions", response_model=MatrixSchema)
async def create_matrix_definition(
    matrix_data: MatrixCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """新しいマトリックス定義を作成"""
    matrix_service = MatrixService(db)
    return matrix_service.create_matrix(matrix_data, current_user.id)

@router.put("/definitions/{matrix_id}", response_model=MatrixSchema)
async def update_matrix_definition(
    matrix_id: int,
    matrix_data: MatrixUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """マトリックス定義を更新"""
    matrix_service = MatrixService(db)
    return matrix_service.update_matrix(matrix_id, matrix_data, current_user.id)

@router.delete("/definitions/{matrix_id}")
async def delete_matrix_definition(
    matrix_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """マトリックス定義を削除"""
    matrix_service = MatrixService(db)
    matrix_service.delete_matrix(matrix_id, current_user.id)
    return {"message": "Matrix definition deleted successfully"}

# マトリックス表示・エクスポートエンドポイント
@router.get("/view/{matrix_id}", response_model=MatrixExportData)
async def view_matrix(
    matrix_id: int,
    include_plain_knowledge: bool = Query(False, description="Include plain knowledge text"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """マトリックス定義に基づいてナレッジマトリックスを表示"""
    matrix_service = MatrixService(db)
    return matrix_service.generate_matrix_data(matrix_id, current_user.id, include_plain_knowledge)

@router.get("/export/{matrix_id}/excel")
async def export_matrix_excel(
    matrix_id: int,
    include_plain_knowledge: bool = Query(False, description="Include plain knowledge text"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """マトリックス定義に基づいてExcelファイルをエクスポート"""
    matrix_service = MatrixService(db)
    
    # マトリックスデータを生成
    matrix_data = matrix_service.generate_matrix_data(matrix_id, current_user.id, include_plain_knowledge)
    
    # 一時ファイルを作成
    with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp_file:
        file_path = tmp_file.name
    
    try:
        # Excelファイルを生成
        matrix_service.export_matrix_to_excel(matrix_data, file_path)
        
        return FileResponse(
            path=file_path,
            filename=f"{matrix_data.matrix_name}_matrix.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        if os.path.exists(file_path):
            os.unlink(file_path)
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

# 以下は既存のエンドポイント（後方互換性のため残す）
@router.get("/legacy", response_model=KnowledgeMatrix)
async def get_knowledge_matrix(
    group_ids: Optional[str] = Query(None, description="Comma-separated group IDs"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    export_service = ExportService(db)
    
    parsed_group_ids = None
    if group_ids:
        try:
            parsed_group_ids = [int(id.strip()) for id in group_ids.split(",")]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid group IDs format")
    
    matrix_items = export_service.generate_knowledge_matrix(
        user_id=current_user.id,
        group_ids=parsed_group_ids
    )
    
    return KnowledgeMatrix(
        items=matrix_items,
        total_count=len(matrix_items)
    )

@router.get("/export/excel")
async def export_knowledge_matrix_excel(
    group_ids: Optional[str] = Query(None, description="Comma-separated group IDs"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    export_service = ExportService(db)
    
    parsed_group_ids = None
    if group_ids:
        try:
            parsed_group_ids = [int(id.strip()) for id in group_ids.split(",")]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid group IDs format")
    
    matrix_items = export_service.generate_knowledge_matrix(
        user_id=current_user.id,
        group_ids=parsed_group_ids
    )
    
    if not matrix_items:
        raise HTTPException(status_code=404, detail="No knowledge data found")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp_file:
        file_path = tmp_file.name
    
    try:
        export_service.export_to_excel(matrix_items, file_path)
        
        return FileResponse(
            path=file_path,
            filename=f"knowledge_matrix_{current_user.username}.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        if os.path.exists(file_path):
            os.unlink(file_path)
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/admin/", response_model=KnowledgeMatrix)
async def get_admin_knowledge_matrix(
    user_id: Optional[int] = Query(None, description="User ID to view (admin only)"),
    group_ids: Optional[str] = Query(None, description="Comma-separated group IDs"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    export_service = ExportService(db)
    
    target_user_id = user_id or current_user.id
    
    parsed_group_ids = None
    if group_ids:
        try:
            parsed_group_ids = [int(id.strip()) for id in group_ids.split(",")]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid group IDs format")
    
    matrix_items = export_service.generate_knowledge_matrix(
        user_id=target_user_id,
        group_ids=parsed_group_ids
    )
    
    return KnowledgeMatrix(
        items=matrix_items,
        total_count=len(matrix_items)
    )

@router.get("/admin/export/excel")
async def export_admin_knowledge_matrix_excel(
    user_id: Optional[int] = Query(None, description="User ID to export (admin only)"),
    group_ids: Optional[str] = Query(None, description="Comma-separated group IDs"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    export_service = ExportService(db)
    
    target_user_id = user_id or current_user.id
    
    parsed_group_ids = None
    if group_ids:
        try:
            parsed_group_ids = [int(id.strip()) for id in group_ids.split(",")]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid group IDs format")
    
    matrix_items = export_service.generate_knowledge_matrix(
        user_id=target_user_id,
        group_ids=parsed_group_ids
    )
    
    if not matrix_items:
        raise HTTPException(status_code=404, detail="No knowledge data found")
    
    target_user = db.query(User).filter(User.id == target_user_id).first()
    username = target_user.username if target_user else "unknown"
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp_file:
        file_path = tmp_file.name
    
    try:
        export_service.export_to_excel(matrix_items, file_path)
        
        return FileResponse(
            path=file_path,
            filename=f"knowledge_matrix_{username}.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        if os.path.exists(file_path):
            os.unlink(file_path)
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
