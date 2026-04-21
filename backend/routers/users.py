from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from database import get_db
import models
import schemas
from auth import get_current_user, calculate_level

router = APIRouter(tags=["users"])


@router.get("/me/stats", response_model=schemas.UserStats)
def get_my_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quiz_attempts = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.user_id == current_user.id
    ).count()

    courses_completed = db.query(models.CourseProgress).filter(
        models.CourseProgress.user_id == current_user.id,
        models.CourseProgress.completed == True
    ).count()

    tools_used = db.query(func.count(func.distinct(models.ToolUsage.tool_name))).filter(
        models.ToolUsage.user_id == current_user.id
    ).scalar() or 0

    best_score = db.query(func.max(models.QuizAttempt.score_pct)).filter(
        models.QuizAttempt.user_id == current_user.id
    ).scalar()

    # Get rank from leaderboard
    users_above = db.query(models.User).filter(
        models.User.xp > current_user.xp,
        models.User.is_active == True
    ).count()
    rank = users_above + 1

    level, xp_to_next = calculate_level(current_user.xp)

    return {
        "xp": current_user.xp,
        "level": level,
        "xp_to_next": xp_to_next,
        "streak": current_user.streak,
        "quiz_attempts": quiz_attempts,
        "courses_completed": courses_completed,
        "tools_used": tools_used,
        "best_quiz_score": best_score,
        "rank": rank
    }


@router.get("/leaderboard", response_model=list[schemas.LeaderboardEntry])
def get_leaderboard(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    users = db.query(models.User).filter(
        models.User.is_active == True
    ).order_by(models.User.xp.desc()).limit(20).all()

    leaderboard = []
    for i, user in enumerate(users):
        leaderboard.append(schemas.LeaderboardEntry(
            rank=i + 1,
            user_id=user.id,
            username=user.username,
            full_name=user.full_name,
            department=user.department,
            avatar_initials=user.avatar_initials,
            xp=user.xp,
            level=user.level,
            is_current_user=(user.id == current_user.id)
        ))

    return leaderboard


@router.post("/me/tool-usage")
def log_tool_usage(
    tool_data: schemas.ToolLogRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Log usage
    usage = models.ToolUsage(
        user_id=current_user.id,
        tool_name=tool_data.tool_name,
        used_at=datetime.utcnow()
    )
    db.add(usage)

    # Award XP
    xp_earned = 10
    current_user.xp += xp_earned
    level, _ = calculate_level(current_user.xp)
    current_user.level = level

    db.commit()

    return {
        "message": f"+{xp_earned} XP for using {tool_data.tool_name}!",
        "xp_earned": xp_earned,
        "new_xp": current_user.xp,
        "new_level": current_user.level
    }


@router.put("/me/profile", response_model=schemas.UserOut)
def update_profile(
    update_data: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name
        # Update initials
        parts = update_data.full_name.strip().split()
        if len(parts) >= 2:
            current_user.avatar_initials = parts[0][0].upper() + parts[-1][0].upper()
        elif parts:
            current_user.avatar_initials = parts[0][:2].upper()

    if update_data.department is not None:
        current_user.department = update_data.department

    db.commit()
    db.refresh(current_user)
    return current_user
