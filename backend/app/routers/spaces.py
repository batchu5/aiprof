from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends
from app.schemas.space import SpaceCreate, SpaceResponse, SpaceUpdate
from app.dependencies import get_current_user

router = APIRouter(prefix="/spaces", tags=["Spaces"])


@router.get("", response_model=List[SpaceResponse])
async def list_spaces(current_user=Depends(get_current_user)):
    return [
        SpaceResponse(
            id="1",
            user_id=current_user.get("sub", "usr_1"),
            title="Computer Science",
            description="Algorithms, Data Structures & Operating Systems",
            created_at=datetime.utcnow(),
            projects_count=4
        ),
        SpaceResponse(
            id="2",
            user_id=current_user.get("sub", "usr_1"),
            title="Mathematics & Statistics",
            description="Calculus, Linear Algebra & Probability",
            created_at=datetime.utcnow(),
            projects_count=3
        )
    ]


@router.post("", response_model=SpaceResponse)
async def create_space(payload: SpaceCreate, current_user=Depends(get_current_user)):
    return SpaceResponse(
        id="space_new_1",
        user_id=current_user.get("sub", "usr_1"),
        title=payload.title,
        description=payload.description,
        created_at=datetime.utcnow(),
        projects_count=0
    )


@router.get("/{space_id}", response_model=SpaceResponse)
async def get_space(space_id: str, current_user=Depends(get_current_user)):
    return SpaceResponse(
        id=space_id,
        user_id=current_user.get("sub", "usr_1"),
        title=f"Space {space_id}",
        description="Detailed study domain space",
        created_at=datetime.utcnow(),
        projects_count=2
    )
