from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, timezone
from typing import Any, List, Optional
import json
import uuid
from database import get_db
import models
import schemas
from auth import get_current_admin, calculate_level
from default_data.quiz_data import QUIZZES
from scraper import scrape_ai_events
from pydantic import BaseModel

router = APIRouter(tags=["admin"])

class ModuleBuildData(BaseModel):
    title: str
    duration: int = 0
    xp_reward: int = 0
    sections: List[Any] = []


@router.get("/stats", response_model=schemas.PlatformStats)
def get_platform_stats(
    _=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(models.User).filter(models.User.is_active == True).count()

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
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
    _=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if update_data.full_name is not None:
        user.full_name = update_data.full_name

    if update_data.email is not None:
        user.email = update_data.email

    if update_data.is_admin is not None:
        user.is_admin = update_data.is_admin

    if update_data.xp is not None:
        user.xp = max(0, update_data.xp)

    if update_data.level is not None:
        user.level = max(1, update_data.level)

    if update_data.is_active is not None:
        user.is_active = update_data.is_active

    if update_data.department is not None:
        user.department = update_data.department

    db.commit()
    db.refresh(user)
    return {
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
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
    }


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
        created_at=datetime.now(timezone.utc)
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    result = schemas.EventOut.model_validate(event)
    result.is_registered = False
    return result


@router.put("/events/{event_id}")
def update_event(
    event_id: str,  # <--- Change this from int to str
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
    event_id: str,  # <--- Change this from int to str
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
                event = models.Event(**evt_data, is_active=True, created_at=datetime.now(timezone.utc))
                db.add(event)
                added += 1
            else:
                existing = db.query(models.Event).filter(
                    models.Event.title == evt_data["title"]
                ).first()
                if not existing:
                    event = models.Event(**evt_data, is_active=True, created_at=datetime.now(timezone.utc))
                    db.add(event)
                    added += 1

        db.commit()
        return {"message": f"Scraped {len(events)} events, added/replaced {added} events"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scrape failed: {str(e)}")


@router.get("/learnings", response_model=list[schemas.LearningOut])
def list_learnings(
    _=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    learnings = (
        db.query(models.Learning)
        .options(joinedload(models.Learning.modules))
        .order_by(models.Learning.created_at.desc())
        .all()
    )
    result = []
    for learning in learnings:
        item = schemas.LearningOut.model_validate(learning)
        item.module_count = sum(1 for m in learning.modules if m.is_active)
        result.append(item)
    return result


@router.post("/learnings", response_model=schemas.LearningOut, status_code=201)
def create_learning(
    data: schemas.LearningCreate,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    learning = models.Learning(
        id=str(uuid.uuid4()),
        **data.model_dump(),
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(learning)
    db.commit()
    db.refresh(learning)
    return learning


@router.put("/learnings/{learning_id}", response_model=schemas.LearningOut)
def update_learning(
    learning_id: str,
    data: schemas.LearningUpdate,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    learning = db.query(models.Learning).filter(models.Learning.id == learning_id).first()
    if not learning:
        raise HTTPException(status_code=404, detail="Learning not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(learning, field, value)
    learning.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(learning)
    return learning


@router.delete("/learnings/{learning_id}")
def delete_learning(
    learning_id: str,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    learning = db.query(models.Learning).filter(models.Learning.id == learning_id).first()
    if not learning:
        raise HTTPException(status_code=404, detail="Learning not found")
    learning.is_active = False
    learning.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Learning deactivated"}


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


@router.get("/learnings/{learning_id}/modules", response_model=list[schemas.LearningModuleOut])
def list_learning_modules(
    learning_id: str,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    modules = (
        db.query(models.LearningModule)
        .filter(
            models.LearningModule.learning_id == learning_id,
            models.LearningModule.is_active == True,
        )
        .order_by(models.LearningModule.order.asc())
        .all()
    )
    return modules


@router.post("/learnings/{learning_id}/modules", response_model=schemas.LearningModuleOut, status_code=201)
def create_learning_module(
    learning_id: str,
    data: schemas.LearningModuleCreate,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    # Verify the parent learning exists
    learning = db.query(models.Learning).filter(models.Learning.id == learning_id).first()
    if not learning:
        raise HTTPException(status_code=404, detail="Parent Learning resource not found")

    # If the frontend passes `learning_id` inside the JSON body as well, 
    # we exclude it from the dump so it doesn't conflict with our path parameter.
    dump_data = data.model_dump(exclude={"learning_id"})

    module = models.LearningModule(
        id=str(uuid.uuid4()),
        learning_id=learning_id,
        **dump_data,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


@router.post("/learnings/{learning_id}/modules/build", status_code=201)
def build_learning_module(
    learning_id: str,
    data: ModuleBuildData,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    learning = db.query(models.Learning).filter(models.Learning.id == learning_id).first()
    if not learning:
        raise HTTPException(status_code=404, detail="Learning not found")

    existing_count = db.query(models.LearningModule).filter(
        models.LearningModule.learning_id == learning_id,
        models.LearningModule.is_active == True,
    ).count()

    module = models.LearningModule(
        id=str(uuid.uuid4()),
        learning_id=learning_id,
        title=data.title,
        content_text=json.dumps(data.sections),
        order=existing_count,
        duration_min=data.duration or None,
        xp_reward=data.xp_reward,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(module)
    db.commit()
    db.refresh(module)
    return {"id": module.id, "message": "Module created"}


@router.get("/learning-modules/{module_id}")
def get_learning_module_admin(
    module_id: str,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    module = db.query(models.LearningModule).filter(models.LearningModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Learning module not found")
    return module


@router.put("/learning-modules/{module_id}", response_model=schemas.LearningModuleOut)
def update_learning_module(
    module_id: str,
    data: schemas.LearningModuleUpdate,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    module = db.query(models.LearningModule).filter(models.LearningModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Learning module not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(module, field, value)
        
    module.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(module)
    return module


@router.delete("/learning-modules/{module_id}")
def delete_learning_module(
    module_id: str,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    module = db.query(models.LearningModule).filter(models.LearningModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Learning module not found")

    # Soft delete
    module.is_active = False
    module.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    return {"message": "Learning module deactivated"}

@router.get("/learnings/{learning_id}", response_model=schemas.LearningOut)
def get_learning(
    learning_id: str,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    learning = db.query(models.Learning).filter(models.Learning.id == learning_id).first()
    if not learning:
        raise HTTPException(status_code=404, detail="Learning not found")
    
    # Manually calculate module_count for the frontend
    item = schemas.LearningOut.model_validate(learning)
    item.module_count = db.query(models.LearningModule).filter(
        models.LearningModule.learning_id == learning_id, 
        models.LearningModule.is_active == True
    ).count()
    
    return item

def builder_sections_to_markdown(sections: list[schemas.BuilderSection]) -> str:
    """Helper to convert the frontend builder JSON into a single Markdown string."""
    md_parts = []
    
    for s in sections:
        t = (s.type or "").lower()
        heading = s.heading.strip() if s.heading else ""
        body = s.body.strip() if s.body else ""
        points = s.points or []

        if heading:
            md_parts.append(f"### {heading}")

        if t == "text" and body:
            md_parts.append(body)
            
        elif t == "key_points" and points:
            bullets = "\n".join([f"- {p}" for p in points if str(p).strip()])
            md_parts.append(bullets)
            
        elif t == "steps" and points:
            steps = "\n".join([f"{i+1}. {p}" for i, p in enumerate(points) if str(p).strip()])
            md_parts.append(steps)
            
        elif t == "tip" and body:
            md_parts.append(f"> 💡 **Tip:** {body}")
            
        elif t == "warning" and body:
            md_parts.append(f"> ⚠️ **Warning:** {body}")
            
        elif t == "example" and body:
            md_parts.append(f"> 📝 **Example:** {body}")

    return "\n\n".join(md_parts).strip()


@router.post("/learnings/{learning_id}/modules/build", response_model=schemas.LearningModuleOut, status_code=201)
def build_learning_module(
    learning_id: str,
    data: schemas.ModuleBuilderCreate,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Takes dynamic sections from the frontend Module Builder and saves them as Markdown."""
    
    # 1. Verify parent learning resource exists
    learning = db.query(models.Learning).filter(models.Learning.id == learning_id).first()
    if not learning:
        raise HTTPException(status_code=404, detail="Parent Learning resource not found")

    # 2. Determine the order for the new module (put it at the end)
    current_count = db.query(models.LearningModule).filter(
        models.LearningModule.learning_id == learning_id
    ).count()

    # 3. Convert sections to markdown
    compiled_markdown = builder_sections_to_markdown(data.sections)

    # 4. Create the module
    module = models.LearningModule(
        id=str(uuid.uuid4()),
        learning_id=learning_id,
        title=data.title,
        description=None,
        content_text=compiled_markdown, # Save compiled markdown here!
        content_url=None,
        order=current_count, # Auto-assign the next order index
        duration_min=data.duration,
        xp_reward=data.xp_reward,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    
    db.add(module)
    db.commit()
    db.refresh(module)
    
    return module

@router.get("/events", response_model=List[schemas.EventOut])
def get_events(
    event_type: Optional[str] = None,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get events, optionally filtered by event_type.
    Handles calls like GET /admin/events?event_type=workshop
    """
    query = db.query(models.Event)
    
    if event_type:
        query = query.filter(models.Event.event_type == event_type)
        
    # Ordering by created_at descending, but you can also order by start_date
    events = query.order_by(models.Event.created_at.desc()).all()
    
    return events
