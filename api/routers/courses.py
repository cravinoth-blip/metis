from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from database import get_db
import models
import schemas
from auth import get_current_user, calculate_level
from course_data import COURSES

router = APIRouter(tags=["courses"])


def _get_user_completed_modules(user_id: int, course_id: str, db: Session) -> List[int]:
    """Return list of module indices the user has completed for a course."""
    completions = db.query(models.ModuleCompletion).filter(
        models.ModuleCompletion.user_id == user_id,
        models.ModuleCompletion.course_id == course_id
    ).all()
    return [c.module_index for c in completions]


def _calc_progress(completed_indices: List[int], total_modules: int) -> int:
    if total_modules == 0:
        return 0
    return round((len(completed_indices) / total_modules) * 100)


@router.get("/", response_model=List[schemas.CourseSummary])
def list_courses(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return all courses with the current user's progress."""
    result = []
    for course_id, course in COURSES.items():
        modules = course.get("modules", [])
        completed = _get_user_completed_modules(current_user.id, course_id, db)
        result.append(schemas.CourseSummary(
            id=course["id"],
            title=course["title"],
            description=course["description"],
            category=course["category"],
            level=course["level"],
            emoji=course["emoji"],
            color=course["color"],
            duration=course["duration"],
            total_modules=len(modules),
            progress_pct=_calc_progress(completed, len(modules)),
            modules_completed=completed,
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
        xp_reward=module["xp_reward"],
        sections=sections,
        completed=already_done,
    )


@router.post("/{course_id}/modules/{module_index}/complete", response_model=schemas.ModuleCompleteResult)
def complete_module(
    course_id: str,
    module_index: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a module as complete; award XP if first time."""
    course = COURSES.get(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    modules = course.get("modules", [])
    if module_index < 0 or module_index >= len(modules):
        raise HTTPException(status_code=404, detail="Module not found")

    module = modules[module_index]

    # Check if already completed
    existing = db.query(models.ModuleCompletion).filter(
        models.ModuleCompletion.user_id == current_user.id,
        models.ModuleCompletion.course_id == course_id,
        models.ModuleCompletion.module_index == module_index,
    ).first()

    if existing:
        # Already completed — return current state without awarding XP again
        completed_indices = _get_user_completed_modules(current_user.id, course_id, db)
        progress = _calc_progress(completed_indices, len(modules))
        return schemas.ModuleCompleteResult(
            xp_earned=0,
            new_xp=current_user.xp,
            new_level=current_user.level,
            progress_pct=progress,
            course_completed=progress == 100,
            already_completed=True,
        )

    # First completion — award XP
    xp_earned = module.get("xp_reward", 40)

    completion = models.ModuleCompletion(
        user_id=current_user.id,
        course_id=course_id,
        module_index=module_index,
        xp_earned=xp_earned,
        completed_at=datetime.utcnow(),
    )
    db.add(completion)

    # Update user XP + level
    current_user.xp += xp_earned
    level, _ = calculate_level(current_user.xp)
    current_user.level = level

    # Update CourseProgress record
    cp = db.query(models.CourseProgress).filter(
        models.CourseProgress.user_id == current_user.id,
        models.CourseProgress.course_id == course_id,
    ).first()

    all_completed = db.query(models.ModuleCompletion).filter(
        models.ModuleCompletion.user_id == current_user.id,
        models.ModuleCompletion.course_id == course_id,
    ).count() + 1  # +1 for the one we just added (not yet flushed)

    total = len(modules)
    new_progress = _calc_progress(list(range(all_completed)), total)
    course_done = all_completed >= total

    if cp:
        cp.progress_pct = new_progress
        if course_done and not cp.completed:
            cp.completed = True
            cp.completed_at = datetime.utcnow()
    else:
        db.add(models.CourseProgress(
            user_id=current_user.id,
            course_id=course_id,
            progress_pct=new_progress,
            completed=course_done,
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow() if course_done else None,
        ))

    db.commit()

    return schemas.ModuleCompleteResult(
        xp_earned=xp_earned,
        new_xp=current_user.xp,
        new_level=current_user.level,
        progress_pct=new_progress,
        course_completed=course_done,
        already_completed=False,
    )
