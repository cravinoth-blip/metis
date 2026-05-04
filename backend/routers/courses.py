from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
from typing import List
from pydantic import BaseModel
import json

from database import get_db
import models
import schemas
from auth import get_current_user, get_current_admin, calculate_level
from default_data.course_data import COURSES


class ModuleReorderRequest(BaseModel):
    order: List[str]

router = APIRouter(tags=["courses"])

def _get_user_completed_modules(user_id: int, learning_id: str, db: Session) -> List[int]:
    """Return list of module indices the user has completed for a learning resource."""
    completions = db.query(models.ModuleCompletion).filter(
        models.ModuleCompletion.user_id == user_id,
        models.ModuleCompletion.learning_id == learning_id  # Updated from course_id
    ).all()
    return [c.module_index for c in completions]

def _calc_progress(completed_count: int, total_modules: int) -> int:
    """Calculate progress percentage based on count."""
    if total_modules == 0:
        return 0
    return round((completed_count / total_modules) * 100)

@router.get("/learnings", response_model=List[schemas.LearningWithModulesOut])
def list_db_learnings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all active learning resources from the DB, each with their active modules."""
    rows = (
        db.query(models.Learning)
        .options(joinedload(models.Learning.modules))
        .filter(models.Learning.is_active == True)
        .order_by(models.Learning.title)
        .all()
    )
    result = []
    for lr in rows:
        # 1. Filter and sort active modules
        active_mods = sorted(
            [m for m in lr.modules if m.is_active],
            key=lambda m: m.order,
        )
        
        # 2. Get user completion data
        completed_indices = _get_user_completed_modules(current_user.id, lr.id, db)
        
        # 3. Calculate computed progress
        total_count = len(active_mods)
        current_progress = _calc_progress(len(completed_indices), total_count)

        # 4. MANUALLY construct the schema
        item = schemas.LearningWithModulesOut(
            id=lr.id,
            title=lr.title,
            description=lr.description,
            category=lr.category,
            level=lr.level,
            duration=lr.estimated_duration_min,  # Map DB name to Schema name
            total_modules=total_count,
            progress_pct=current_progress,
            modules_completed=completed_indices,
            modules=[schemas.LearningModuleOut.model_validate(m) for m in active_mods]
        )
        result.append(item)
    return result

@router.get("/", response_model=List[schemas.LearningSummary])
def list_learnings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return all active learning resources from the DB with the user's progress."""
    learnings = (
        db.query(models.Learning)
        .options(joinedload(models.Learning.modules))
        .filter(models.Learning.is_active == True)
        .all()
    )
    result = []
    for lr in learnings:
        active_mods = [m for m in lr.modules if m.is_active]
        total_count = len(active_mods)
        completed_indices = _get_user_completed_modules(current_user.id, lr.id, db)
        progress = _calc_progress(len(completed_indices), total_count)
        
        result.append(schemas.LearningSummary(
            id=lr.id,
            title=lr.title,
            description=lr.description,
            category=lr.category,
            level=lr.level,
            duration=lr.estimated_duration_min,
            total_modules=total_count,
            progress_pct=progress,
            modules_completed=completed_indices,
        ))
    return result

@router.get("/{course_id}/modules/{module_index}", response_model=schemas.ModuleContent)
def get_module(
    course_id: str,
    module_index: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return full content for a specific module."""
    course = COURSES.get(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    modules = course.get("modules", [])
    if module_index < 0 or module_index >= len(modules):
        raise HTTPException(status_code=404, detail="Module not found")
    
    module = modules[module_index]
    completed_indices = _get_user_completed_modules(current_user.id, course_id, db)
    already_done = module_index in completed_indices
    
    sections = [
        schemas.ModuleSection(
            type=s["type"],
            heading=s["heading"],
            body=s.get("body"),
            points=s.get("points"),
        )
        for s in module.get("sections", [])
    ]
    return schemas.ModuleContent(
        index=module["index"],
        title=module["title"],
        duration=module["duration"],
        xp_reward=module.get("xp_reward", 0),
        sections=sections,
        completed=already_done,
    )

@router.get("/learnings/{learning_id}/modules/{module_id}")
def get_learning_module(
    learning_id: str,
    module_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return full content for a specific DB learning module, including completion status."""
    module = db.query(models.LearningModule).filter(
        models.LearningModule.id == module_id,
        models.LearningModule.learning_id == learning_id,
        models.LearningModule.is_active == True
    ).first()
    
    if not module:
        raise HTTPException(status_code=404, detail="Learning module not found")

    existing = db.query(models.ModuleCompletion).filter(
        models.ModuleCompletion.user_id == current_user.id,
        models.ModuleCompletion.learning_id == learning_id,
        models.ModuleCompletion.module_index == module.order
    ).first()

    sections = []
    if module.content_text:
        try:
            parsed = json.loads(module.content_text)
            if isinstance(parsed, list):
                sections = parsed
            else:
                sections = [{"type": "text", "heading": "", "body": module.content_text, "points": []}]
        except (json.JSONDecodeError, ValueError):
            sections = [{"type": "text", "heading": "", "body": module.content_text, "points": []}]

    return {
        "id": module.id,
        "learning_id": module.learning_id,
        "title": module.title,
        "duration_min": module.duration_min,
        "xp_reward": getattr(module, 'xp_reward', 0), # Safely get xp_reward
        "sections": sections,
        "completed": existing is not None
    }

@router.post("/learnings/{learning_id}/modules/{module_id}/complete")
def complete_learning_module(
    learning_id: str,
    module_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a DB learning module as complete; update XP, Level, and Progress bar."""
    
    # --- FIX: Merge the user into the current session to avoid persistence errors ---
    current_user = db.merge(current_user)

    # 1. Fetch the module
    module = db.query(models.LearningModule).filter(
        models.LearningModule.id == module_id,
        models.LearningModule.learning_id == learning_id
    ).first()
    
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    # 2. Check for existing completion
    existing = db.query(models.ModuleCompletion).filter(
        models.ModuleCompletion.user_id == current_user.id,
        models.ModuleCompletion.learning_id == learning_id, 
        models.ModuleCompletion.module_index == module.order
    ).first()

    if existing:
        return {
            "status": "already_completed", 
            "xp_earned": 0,
            "new_xp": current_user.xp,
            "new_level": current_user.level
        }

    # 3. Calculate XP
    xp_to_add = getattr(module, 'xp_reward', None) 
    if xp_to_add is None:
        xp_to_add = getattr(module, 'points', 10) # Fallback to points or default 10

    # 4. Create Completion Record
    completion = models.ModuleCompletion(
        user_id=current_user.id,
        learning_id=learning_id,
        module_index=module.order,
        xp_earned=xp_to_add,
        completed_at=datetime.utcnow()
    )
    db.add(completion)

    # 5. Update User XP
    current_user.xp += xp_to_add
    new_level, _ = calculate_level(current_user.xp)
    current_user.level = new_level

    # 6. Update Progress %
    total_count = db.query(models.LearningModule).filter(
        models.LearningModule.learning_id == learning_id,
        models.LearningModule.is_active == True
    ).count()

    done_count = db.query(models.ModuleCompletion).filter(
        models.ModuleCompletion.user_id == current_user.id,
        models.ModuleCompletion.learning_id == learning_id
    ).count() + 1 
    
    progress = _calc_progress(done_count, total_count)

    lp = db.query(models.LearningProgress).filter(
        models.LearningProgress.user_id == current_user.id,
        models.LearningProgress.learning_id == learning_id
    ).first()

    if lp:
        lp.progress_pct = progress
        if progress >= 100:
            lp.completed = True
            lp.completed_at = datetime.utcnow()
    else:
        db.add(models.LearningProgress(
            user_id=current_user.id,
            learning_id=learning_id,
            progress_pct=progress,
            completed=(progress >= 100)
        ))

    db.commit()
    # Now db.refresh works flawlessly because of the db.merge at the top
    db.refresh(current_user)

    return {
        "status": "success",
        "xp_earned": xp_to_add,
        "new_xp": current_user.xp,
        "new_level": current_user.level,
        "progress_pct": progress
    }


@router.post("/learnings/{learning_id}/modules/reorder")
def reorder_learning_modules(
    learning_id: str,
    data: ModuleReorderRequest,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    learning = db.query(models.Learning).filter(models.Learning.id == learning_id).first()
    if not learning:
        raise HTTPException(status_code=404, detail="Learning not found")

    for index, module_id in enumerate(data.order):
        db.query(models.LearningModule).filter(
            models.LearningModule.id == module_id,
            models.LearningModule.learning_id == learning_id,
        ).update({"order": index, "updated_at": datetime.now(timezone.utc)})

    db.commit()
    return {"message": "Module order updated", "count": len(data.order)}
