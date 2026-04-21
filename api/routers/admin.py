from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import json
from database import get_db
import models
import schemas
from auth import get_current_admin, calculate_level
from quiz_data import QUIZZES
from scraper import scrape_ai_events

router = APIRouter(tags=["admin"])


@router.get("/stats", response_model=schemas.PlatformStats)
def get_platform_stats(
    _=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(models.User).filter(models.User.is_active == True).count()

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    active_today = db.query(models.User).filter(
        models.User.last_login >= today_start
    ).count()

    quizzes_today = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.completed_at >= today_start
    ).count()

    avg_score = db.query(func.avg(models.QuizAttempt.score_pct)).scalar() or 0.0

    total_xp = db.query(func.sum(models.User.xp)).scalar() or 0

    total_events = db.query(models.Event).filter(models.Event.is_active == True).count()

    return {
        "total_users": total_users,
        "active_today": active_today,
        "quizzes_taken_today": quizzes_today,
        "avg_score": round(float(avg_score), 1),
        "total_xp_awarded": total_xp,
        "total_events": total_events
    }


@router.get("/users")
def get_all_users(
    _=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    users = db.query(models.User).order_by(models.User.xp.desc()).all()
    result = []
    for user in users:
        quiz_count = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.user_id == user.id
        ).count()
        result.append({
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "department": user.department,
            "avatar_initials": user.avatar_initials,
            "is_admin": user.is_admin,
            "is_active": user.is_active,
            "xp": user.xp,
            "level": user.level,
            "streak": user.streak,
            "quiz_count": quiz_count,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None
        })
    return result


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    update_data: schemas.AdminUserUpdate,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if update_data.is_admin is not None:
        user.is_admin = update_data.is_admin

    if update_data.xp is not None:
        user.xp = max(0, update_data.xp)
        level, _ = calculate_level(user.xp)
        user.level = level

    if update_data.is_active is not None:
        user.is_active = update_data.is_active

    if update_data.department is not None:
        user.department = update_data.department

    db.commit()
    return {"message": "User updated successfully", "user_id": user_id}


@router.delete("/users/{user_id}")
def deactivate_user(
    user_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    user.is_active = False
    db.commit()
    return {"message": "User deactivated"}


@router.get("/quiz-stats", response_model=list[schemas.QuizStats])
def get_quiz_stats(
    _=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    result = []
    for quiz_id, quiz in QUIZZES.items():
        attempts = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.quiz_id == quiz_id
        ).all()

        if not attempts:
            result.append(schemas.QuizStats(
                quiz_id=quiz_id,
                title=quiz["title"],
                attempts=0,
                avg_score=0.0,
                pass_rate=0.0
            ))
            continue

        avg_score = sum(a.score_pct for a in attempts) / len(attempts)
        pass_count = sum(1 for a in attempts if a.score_pct >= 70)
        pass_rate = (pass_count / len(attempts)) * 100

        result.append(schemas.QuizStats(
            quiz_id=quiz_id,
            title=quiz["title"],
            attempts=len(attempts),
            avg_score=round(avg_score, 1),
            pass_rate=round(pass_rate, 1)
        ))

    return result


@router.post("/events", response_model=schemas.EventOut)
def create_event(
    event_data: schemas.EventCreate,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    event = models.Event(
        **event_data.model_dump(),
        is_active=True,
        registered_count=0,
        created_at=datetime.utcnow()
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    result = schemas.EventOut.model_validate(event)
    result.is_registered = False
    return result


@router.put("/events/{event_id}")
def update_event(
    event_id: int,
    update_data: schemas.EventUpdate,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    for field, value in update_data.model_dump(exclude_none=True).items():
        setattr(event, field, value)

    db.commit()
    return {"message": "Event updated"}


@router.delete("/events/{event_id}")
def delete_event(
    event_id: int,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.is_active = False
    db.commit()
    return {"message": "Event deleted"}


@router.post("/scrape-events")
async def trigger_scrape(
    _=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        events = await scrape_ai_events()

        # Replace all news events with fresh ones
        db.query(models.Event).filter(models.Event.event_type == "news").delete()

        added = 0
        for evt_data in events:
            if evt_data["event_type"] == "news":
                event = models.Event(**evt_data, is_active=True, created_at=datetime.utcnow())
                db.add(event)
                added += 1
            else:
                existing = db.query(models.Event).filter(
                    models.Event.title == evt_data["title"]
                ).first()
                if not existing:
                    event = models.Event(**evt_data, is_active=True, created_at=datetime.utcnow())
                    db.add(event)
                    added += 1

        db.commit()
        return {"message": f"Scraped {len(events)} events, added/replaced {added} events"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scrape failed: {str(e)}")


@router.get("/tool-usage")
def get_tool_usage_analytics(
    _=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Tool usage counts
    usage_counts = db.query(
        models.ToolUsage.tool_name,
        func.count(models.ToolUsage.id).label("count")
    ).group_by(models.ToolUsage.tool_name).order_by(func.count(models.ToolUsage.id).desc()).all()

    # Department breakdown by tool
    dept_usage = db.query(
        models.User.department,
        func.count(models.ToolUsage.id).label("count")
    ).join(models.User, models.ToolUsage.user_id == models.User.id).group_by(
        models.User.department
    ).order_by(func.count(models.ToolUsage.id).desc()).all()

    return {
        "tool_usage": [{"tool_name": r.tool_name, "count": r.count} for r in usage_counts],
        "department_usage": [{"department": r.department or "Unknown", "count": r.count} for r in dept_usage]
    }
