from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks
from app.schemas.material import MaterialResponse
from app.dependencies import get_current_user
from app.background.tasks import process_document_background

router = APIRouter(prefix="/materials", tags=["Materials"])


@router.post("/upload", response_model=MaterialResponse)
async def upload_material(
    project_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    contents = await file.read()
    background_tasks.add_task(process_document_background, project_id, contents, file.filename)
    
    return MaterialResponse(
        id="mat_1",
        project_id=project_id,
        filename=file.filename or "uploaded.pdf",
        file_type="pdf",
        is_vectorized=False,
        created_at=datetime.utcnow()
    )


@router.get("", response_model=List[MaterialResponse])
async def list_materials(project_id: str, current_user=Depends(get_current_user)):
    return [
        MaterialResponse(
            id="mat_1",
            project_id=project_id,
            filename="Lecture_Notes_Week_1.pdf",
            file_type="pdf",
            is_vectorized=True,
            created_at=datetime.utcnow()
        )
    ]
