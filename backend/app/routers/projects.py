from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends
from app.schemas.project import ProjectCreate, ProjectResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=List[ProjectResponse])
async def list_projects(current_user=Depends(get_current_user)):
    return [
        ProjectResponse(
            id="proj_1",
            space_id="1",
            user_id=current_user.get("sub", "usr_1"),
            title="Machine Learning Basics",
            description="Supervised learning, classification & loss functions",
            created_at=datetime.utcnow()
        )
    ]


@router.post("", response_model=ProjectResponse)
async def create_project(payload: ProjectCreate, current_user=Depends(get_current_user)):
    return ProjectResponse(
        id="proj_new_1",
        space_id=payload.space_id,
        user_id=current_user.get("sub", "usr_1"),
        title=payload.title,
        description=payload.description,
        created_at=datetime.utcnow()
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, current_user=Depends(get_current_user)):
    return ProjectResponse(
        id=project_id,
        space_id="1",
        user_id=current_user.get("sub", "usr_1"),
        title=f"Project {project_id}",
        description="Comprehensive project overview",
        created_at=datetime.utcnow()
    )
