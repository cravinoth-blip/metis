from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas

router = APIRouter(tags=["ai-tools"])


@router.get("/", response_model=List[schemas.AIToolOut])
def list_ai_tools(db: Session = Depends(get_db)):
    return (
        db.query(models.AITool)
        .filter(models.AITool.is_active == True)
        .order_by(models.AITool.is_enterprise.asc(), models.AITool.name.asc())
        .all()
    )
