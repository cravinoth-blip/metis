from fastapi import APIRouter, Depends, HTTPException, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, timezone
from typing import Any, List, Optional
import json
import uuid
from pathlib import Path

from database import get_db
import models
import schemas
from auth import get_current_admin, calculate_level
from default_data.quiz_data import QUIZZES
from scraper import scrape_ai_events
from pydantic import BaseModel

router = APIRouter(tags=["admin"])

templates = Jinja2Templates(directory=str(Path(__file__).parent.parent / "templates"))

class ModuleBuildData(BaseModel):
    title: str
    duration: int = 0
    xp_reward: int = 0
    sections: List[Any] = []

class ModuleHtmlData(BaseModel):
    title: str
    duration: int = 0
    xp_reward: int = 50
    content_text: str = ""


# ==============================================================================
# EXISTING JSON API ENDPOINTS (Untouched)
# ==============================================================================

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
        **event_data.model_dump(exclude={"is_active", "registered_count", "created_at"}),
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

@router.post("/learnings/{learning_id}/modules/build-html", status_code=201)
def build_learning_module_html(
    learning_id: str,
    data: ModuleHtmlData,
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
        content_text=data.content_text,
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

# ── AI Tools ──────────────────────────────────────────────────────────────────
@router.get("/ai-tools", response_model=List[schemas.AIToolOut])
def list_ai_tools(
    _=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return db.query(models.AITool).filter(models.AITool.is_active == True).order_by(models.AITool.name).all()

@router.post("/ai-tools", response_model=schemas.AIToolOut, status_code=201)
def create_ai_tool(
    data: schemas.AIToolCreate,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    tool = models.AITool(**data.model_dump())
    db.add(tool)
    db.commit()
    db.refresh(tool)
    return tool

@router.put("/ai-tools/{tool_id}", response_model=schemas.AIToolOut)
def update_ai_tool(
    tool_id: int,
    data: schemas.AIToolUpdate,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    tool = db.query(models.AITool).filter(models.AITool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="AI tool not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(tool, field, value)
    tool.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(tool)
    return tool

@router.delete("/ai-tools/{tool_id}")
def delete_ai_tool(
    tool_id: int,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    tool = db.query(models.AITool).filter(models.AITool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="AI tool not found")
    tool.is_active = False
    tool.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "AI tool deactivated"}

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


# ==============================================================================
# HTMX + Jinja2 HTML Endpoints
# (Under a /ui/ sub-path to cleanly separate them from the JSON API)
# ==============================================================================

@router.get("/ui", response_class=HTMLResponse)
async def admin_ui_shell(request: Request, admin=Depends(get_current_admin)):
    """Serves the main HTML Shell that holds the tabs."""
    return templates.TemplateResponse("admin_base.html", {"request": request})


@router.get("/ui/tabs/overview", response_class=HTMLResponse)
async def html_tab_overview(
    request: Request, 
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(models.User).filter(models.User.is_active == True).count()
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    active_today = db.query(models.User).filter(models.User.last_login >= today_start).count()
    quizzes_today = db.query(models.QuizAttempt).filter(models.QuizAttempt.completed_at >= today_start).count()
    total_events = db.query(models.Event).filter(models.Event.is_active == True).count()
    
    stats = {
        "total_users": total_users, 
        "quizzes": quizzes_today, 
        "events": total_events, 
        "active": active_today
    }
    return templates.TemplateResponse("overview.html", {"request": request, "stats": stats})


@router.get("/ui/tabs/users", response_class=HTMLResponse)
async def html_tab_users(
    request: Request,
    q: str = "",
    sort: str = "xp",
    dir: str = "desc",
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(models.User)
    if q:
        search_term = f"%{q.lower()}%"
        query = query.filter(
            func.lower(models.User.full_name).like(search_term) |
            func.lower(models.User.email).like(search_term)
        )

    sort_col_map = {
        "name": models.User.full_name,
        "email": models.User.email,
        "dept": models.User.department,
        "xp": models.User.xp,
        "level": models.User.level,
        "admin": models.User.is_admin,
    }
    sort_col = sort_col_map.get(sort, models.User.xp)
    order = sort_col.asc() if dir == "asc" else sort_col.desc()
    users = query.order_by(order).all()
    return templates.TemplateResponse("users.html", {"request": request, "users": users, "q": q, "sort": sort, "dir": dir})


@router.get("/ui/users/form", response_class=HTMLResponse)
async def html_user_form(
    request: Request, 
    user_id: int = None, 
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first() if user_id else None
    return templates.TemplateResponse("user_modal.html", {"request": request, "user": user})


@router.post("/ui/users", response_class=HTMLResponse)
async def html_save_user(
    request: Request,
    user_id: Optional[int] = Form(None),
    full_name: str = Form(...),
    email: str = Form(...),
    department: str = Form(""),
    is_admin: bool = Form(False),
    xp: int = Form(0),
    level: int = Form(1),
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    if user_id:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user:
            user.full_name = full_name
            user.email = email
            user.department = department
            user.is_admin = is_admin
            user.xp = max(0, xp)
            user.level = max(1, level)
    else:
        user = models.User(
            full_name=full_name,
            email=email,
            department=department,
            is_admin=is_admin,
            xp=xp,
            level=level,
            is_active=True
        )
        db.add(user)
        
    db.commit()
    
    # Re-fetch users and return the updated table template directly
    users = db.query(models.User).order_by(models.User.xp.desc()).all()
    response = templates.TemplateResponse("users.html", {"request": request, "users": users, "q": ""})
    
    # Trigger JS events for UX via HTMX response headers
    response.headers["HX-Trigger"] = '{"closeModal": true, "showToast": "User saved successfully!"}'
    return response


@router.delete("/ui/users/{user_id}", response_class=HTMLResponse)
async def html_delete_user(
    user_id: int, 
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    if user_id == admin.id:
        # Returning a 400 will cause HTMX to trigger an error event
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.is_active = False # Match your JSON API soft-delete logic
        db.commit()
    
    # Returning an empty HTML string tells HTMX to remove the target element
    response = HTMLResponse("")
    response.headers["HX-Trigger"] = '{"showToast": "User deleted!"}'
    return response


# ── Learnings HTMX ────────────────────────────────────────────────────────────

@router.get("/ui/tabs/learnings", response_class=HTMLResponse)
async def html_tab_learnings(
    request: Request,
    q: str = "",
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.Learning)
        .options(joinedload(models.Learning.modules))
        .filter(models.Learning.is_active == True)
    )
    if q:
        t = f"%{q.lower()}%"
        query = query.filter(
            func.lower(models.Learning.title).like(t) |
            func.lower(models.Learning.category).like(t)
        )
    learnings = query.order_by(models.Learning.created_at.desc()).all()
    for lr in learnings:
        active_modules = [m for m in lr.modules if m.is_active]
        lr.module_count = len(active_modules)
        lr.module_xp = sum(m.xp_reward for m in active_modules)
    return templates.TemplateResponse("learnings.html", {"request": request, "learnings": learnings, "q": q})


@router.get("/ui/learnings/form", response_class=HTMLResponse)
async def html_learning_form(
    request: Request,
    learning_id: Optional[str] = None,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    learning = db.query(models.Learning).filter(models.Learning.id == learning_id).first() if learning_id else None
    return templates.TemplateResponse("learning_modal.html", {"request": request, "learning": learning})


def _learnings_list(db):
    rows = (
        db.query(models.Learning)
        .options(joinedload(models.Learning.modules))
        .filter(models.Learning.is_active == True)
        .order_by(models.Learning.created_at.desc())
        .all()
    )
    for lr in rows:
        lr.module_count = sum(1 for m in lr.modules if m.is_active)
    return rows


@router.post("/ui/learnings", response_class=HTMLResponse)
async def html_create_learning(
    request: Request,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    lr_type: Optional[str] = Form(None),
    level: int = Form(1),
    min_level: int = Form(1),
    estimated_duration_min: Optional[str] = Form(None),
    xp_reward: int = Form(0),
    is_mandatory: bool = Form(False),
    tags: Optional[str] = Form(None),
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    duration = int(estimated_duration_min) if estimated_duration_min and estimated_duration_min.strip() else None
    learning = models.Learning(
        id=str(uuid.uuid4()),
        title=title,
        description=description or None,
        category=category or None,
        type=lr_type or None,
        level=level,
        min_level=min_level,
        estimated_duration_min=duration,
        xp_reward=xp_reward,
        is_mandatory=is_mandatory,
        tags=tags or None,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(learning)
    db.commit()
    response = templates.TemplateResponse("learnings.html", {"request": request, "learnings": _learnings_list(db), "q": ""})
    response.headers["HX-Trigger"] = '{"closeModal": true, "showToast": "Learning created!"}'
    return response


@router.put("/ui/learnings/{learning_id}", response_class=HTMLResponse)
async def html_update_learning_ui(
    request: Request,
    learning_id: str,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    lr_type: Optional[str] = Form(None),
    level: int = Form(1),
    min_level: int = Form(1),
    estimated_duration_min: Optional[str] = Form(None),
    xp_reward: int = Form(0),
    is_mandatory: bool = Form(False),
    tags: Optional[str] = Form(None),
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    duration = int(estimated_duration_min) if estimated_duration_min and estimated_duration_min.strip() else None
    lr = db.query(models.Learning).filter(models.Learning.id == learning_id).first()
    if not lr:
        raise HTTPException(status_code=404, detail="Not found")
    lr.title = title
    lr.description = description or None
    lr.category = category or None
    lr.type = lr_type or None
    lr.level = level
    lr.min_level = min_level
    lr.estimated_duration_min = duration
    lr.xp_reward = xp_reward
    lr.is_mandatory = is_mandatory
    lr.tags = tags or None
    lr.updated_at = datetime.now(timezone.utc)
    db.commit()
    response = templates.TemplateResponse("learnings.html", {"request": request, "learnings": _learnings_list(db), "q": ""})
    response.headers["HX-Trigger"] = '{"closeModal": true, "showToast": "Learning updated!"}'
    return response


@router.delete("/ui/learnings/{learning_id}", response_class=HTMLResponse)
async def html_delete_learning_ui(
    learning_id: str,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    lr = db.query(models.Learning).filter(models.Learning.id == learning_id).first()
    if lr:
        lr.is_active = False
        lr.updated_at = datetime.now(timezone.utc)
        db.commit()
    response = HTMLResponse("")
    response.headers["HX-Trigger"] = '{"showToast": "Learning deactivated"}'
    return response


@router.get("/ui/learnings/{learning_id}/modules", response_class=HTMLResponse)
async def html_learning_modules_modal(
    request: Request,
    learning_id: str,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    modules = (
        db.query(models.LearningModule)
        .filter(models.LearningModule.learning_id == learning_id, models.LearningModule.is_active == True)
        .order_by(models.LearningModule.order.asc())
        .all()
    )
    return templates.TemplateResponse("modules_modal.html", {"request": request, "modules": modules, "learning_id": learning_id})


@router.get("/ui/learnings/{learning_id}/modules/form", response_class=HTMLResponse)
async def html_add_module_modal(
    request: Request,
    learning_id: str,
    admin=Depends(get_current_admin),
):
    return templates.TemplateResponse("add_module_modal.html", {"request": request, "learning_id": learning_id})


@router.post("/learnings/{learning_id}/modules/reorder")
def reorder_learning_modules(
    learning_id: str,
    data: dict,
    _=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    order: list[str] = data.get("order", [])
    for position, module_id in enumerate(order):
        db.query(models.LearningModule).filter(
            models.LearningModule.id == module_id,
            models.LearningModule.learning_id == learning_id,
        ).update({"order": position, "updated_at": datetime.now(timezone.utc)})
    db.commit()
    return {"reordered": len(order)}


@router.delete("/ui/learning-modules/{module_id}", response_class=HTMLResponse)
async def html_delete_module_ui(
    module_id: str,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    module = db.query(models.LearningModule).filter(models.LearningModule.id == module_id).first()
    if module:
        module.is_active = False
        module.updated_at = datetime.now(timezone.utc)
        db.commit()
    response = HTMLResponse("")
    response.headers["HX-Trigger"] = '{"showToast": "Module deleted"}'
    return response


# ── Events HTMX ───────────────────────────────────────────────────────────────

@router.get("/ui/tabs/events", response_class=HTMLResponse)
async def html_tab_events(
    request: Request,
    q: str = "",
    type_filter: str = "all",
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(models.Event).filter(
        models.Event.is_active == True,
        models.Event.event_type.in_(["workshop", "webinar"]),
    )
    if type_filter != "all":
        query = query.filter(models.Event.event_type == type_filter)
    if q:
        query = query.filter(func.lower(models.Event.title).like(f"%{q.lower()}%"))
    events = query.order_by(models.Event.created_at.desc()).all()
    return templates.TemplateResponse("events.html", {"request": request, "events": events, "q": q, "type_filter": type_filter})


@router.get("/ui/events/form", response_class=HTMLResponse)
async def html_event_form(
    request: Request,
    event_id: Optional[int] = None,
    event_type: str = "workshop",
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first() if event_id else None
    if event:
        event_type = event.event_type
    return templates.TemplateResponse("event_form.html", {"request": request, "event": event, "event_type": event_type})


def _events_list(db):
    return (
        db.query(models.Event)
        .filter(models.Event.is_active == True, models.Event.event_type.in_(["workshop", "webinar"]))
        .order_by(models.Event.created_at.desc())
        .all()
    )


@router.post("/ui/events", response_class=HTMLResponse)
async def html_create_event_ui(
    request: Request,
    event_type: str = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    organizer: Optional[str] = Form(None),
    speaker: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    event_format: Optional[str] = Form(None),
    event_date: Optional[str] = Form(None),
    event_time: Optional[str] = Form(None),
    duration_minutes: Optional[int] = Form(None),
    xp_reward: int = Form(0),
    source_url: Optional[str] = Form(None),
    registration_url: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    event = models.Event(
        event_type=event_type,
        title=title,
        description=description or None,
        organizer=organizer or None,
        speaker=speaker or None,
        location=location or None,
        format=event_format or None,
        event_date=event_date or None,
        event_time=event_time or None,
        duration_minutes=duration_minutes,
        xp_reward=xp_reward,
        source_url=source_url or None,
        registration_url=registration_url or None,
        tags=tags or None,
        is_active=True,
        registered_count=0,
        created_at=datetime.now(timezone.utc),
    )
    db.add(event)
    db.commit()
    response = templates.TemplateResponse("events.html", {"request": request, "events": _events_list(db), "q": "", "type_filter": "all"})
    response.headers["HX-Trigger"] = '{"closeModal": true, "showToast": "Event created!"}'
    return response


@router.put("/ui/events/{event_id}", response_class=HTMLResponse)
async def html_update_event_ui(
    request: Request,
    event_id: int,
    event_type: str = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    organizer: Optional[str] = Form(None),
    speaker: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    event_format: Optional[str] = Form(None),
    event_date: Optional[str] = Form(None),
    event_time: Optional[str] = Form(None),
    duration_minutes: Optional[int] = Form(None),
    xp_reward: int = Form(0),
    source_url: Optional[str] = Form(None),
    registration_url: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    ev = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Not found")
    ev.title = title
    ev.description = description or None
    ev.organizer = organizer or None
    ev.speaker = speaker or None
    ev.location = location or None
    ev.format = event_format or None
    ev.event_date = event_date or None
    ev.event_time = event_time or None
    ev.duration_minutes = duration_minutes
    ev.xp_reward = xp_reward
    ev.source_url = source_url or None
    ev.registration_url = registration_url or None
    ev.tags = tags or None
    db.commit()
    response = templates.TemplateResponse("events.html", {"request": request, "events": _events_list(db), "q": "", "type_filter": "all"})
    response.headers["HX-Trigger"] = '{"closeModal": true, "showToast": "Event updated!"}'
    return response


@router.delete("/ui/events/{event_id}", response_class=HTMLResponse)
async def html_delete_event_ui(
    event_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    ev = db.query(models.Event).filter(models.Event.id == event_id).first()
    if ev:
        ev.is_active = False
        db.commit()
    response = HTMLResponse("")
    response.headers["HX-Trigger"] = '{"showToast": "Event deleted"}'
    return response


# ── AI Tools HTMX ─────────────────────────────────────────────────────────────

@router.get("/ui/tabs/ai-tools", response_class=HTMLResponse)
async def html_tab_ai_tools(
    request: Request,
    q: str = "",
    tool_type: str = "all",
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(models.AITool).filter(models.AITool.is_active == True)
    if tool_type == "enterprise":
        query = query.filter(models.AITool.is_enterprise == True)
    elif tool_type == "free":
        query = query.filter(models.AITool.is_enterprise == False)
    if q:
        t = f"%{q.lower()}%"
        query = query.filter(
            func.lower(models.AITool.name).like(t) |
            func.lower(models.AITool.category).like(t) |
            func.lower(models.AITool.tags).like(t)
        )
    tools = query.order_by(models.AITool.name).all()
    return templates.TemplateResponse("admin_ai_tools.html", {"request": request, "tools": tools, "q": q, "tool_type": tool_type})


@router.get("/ui/ai-tools/form", response_class=HTMLResponse)
async def html_ai_tool_form(
    request: Request,
    tool_id: Optional[int] = None,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    tool = db.query(models.AITool).filter(models.AITool.id == tool_id).first() if tool_id else None
    return templates.TemplateResponse("ai_tool_modal.html", {"request": request, "tool": tool})


def _tools_list(db):
    return db.query(models.AITool).filter(models.AITool.is_active == True).order_by(models.AITool.name).all()


@router.post("/ui/ai-tools", response_class=HTMLResponse)
async def html_create_ai_tool_ui(
    request: Request,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    provider: Optional[str] = Form(None),
    emoji_logo: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    is_enterprise: bool = Form(False),
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    tool = models.AITool(
        name=name,
        description=description or None,
        category=category or None,
        provider=provider or None,
        emoji_logo=emoji_logo or None,
        url=url or None,
        tags=tags or None,
        is_enterprise=is_enterprise,
        is_active=True,
    )
    db.add(tool)
    db.commit()
    response = templates.TemplateResponse("ai_tools.html", {"request": request, "tools": _tools_list(db), "q": "", "tool_type": "all"})
    response.headers["HX-Trigger"] = '{"closeModal": true, "showToast": "Tool created!"}'
    return response


@router.put("/ui/ai-tools/{tool_id}", response_class=HTMLResponse)
async def html_update_ai_tool_ui(
    request: Request,
    tool_id: int,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    provider: Optional[str] = Form(None),
    emoji_logo: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    is_enterprise: bool = Form(False),
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    tool = db.query(models.AITool).filter(models.AITool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Not found")
    tool.name = name
    tool.description = description or None
    tool.category = category or None
    tool.provider = provider or None
    tool.emoji_logo = emoji_logo or None
    tool.url = url or None
    tool.tags = tags or None
    tool.is_enterprise = is_enterprise
    tool.updated_at = datetime.now(timezone.utc)
    db.commit()
    response = templates.TemplateResponse("ai_tools.html", {"request": request, "tools": _tools_list(db), "q": "", "tool_type": "all"})
    response.headers["HX-Trigger"] = '{"closeModal": true, "showToast": "Tool updated!"}'
    return response


@router.delete("/ui/ai-tools/{tool_id}", response_class=HTMLResponse)
async def html_delete_ai_tool_ui(
    tool_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    tool = db.query(models.AITool).filter(models.AITool.id == tool_id).first()
    if tool:
        tool.is_active = False
        tool.updated_at = datetime.now(timezone.utc)
        db.commit()
    response = HTMLResponse("")
    response.headers["HX-Trigger"] = '{"showToast": "Tool deleted"}'
    return response


# ── Badges HTMX ───────────────────────────────────────────────────────────────

def _badges_list(db, q: str = ""):
    query = db.query(models.Badge).filter(models.Badge.is_active == True)
    if q:
        t = f"%{q.lower()}%"
        query = query.filter(
            func.lower(models.Badge.name).like(t) |
            func.lower(models.Badge.key).like(t) |
            func.lower(models.Badge.description).like(t)
        )
    badges = query.order_by(models.Badge.points_required.desc()).all()
    for b in badges:
        b.award_count = db.query(models.UserBadge).filter(models.UserBadge.badge_id == b.id).count()
    return badges


@router.get("/ui/tabs/badges", response_class=HTMLResponse)
async def html_tab_badges(
    request: Request,
    q: str = "",
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return templates.TemplateResponse("badges.html", {"request": request, "badges": _badges_list(db, q), "q": q})


@router.get("/ui/badges/form", response_class=HTMLResponse)
async def html_badge_form(
    request: Request,
    badge_id: Optional[int] = None,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    badge = db.query(models.Badge).filter(models.Badge.id == badge_id).first() if badge_id else None
    return templates.TemplateResponse("badge_modal.html", {"request": request, "badge": badge})


@router.post("/ui/badges", response_class=HTMLResponse)
async def html_create_badge(
    request: Request,
    name: str = Form(...),
    key: str = Form(...),
    description: Optional[str] = Form(None),
    emoji: Optional[str] = Form(None),
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    db.add(models.Badge(name=name, key=key, description=description or None, emoji=emoji or None, is_active=True))
    db.commit()
    response = templates.TemplateResponse("badges.html", {"request": request, "badges": _badges_list(db), "q": ""})
    response.headers["HX-Trigger"] = '{"closeModal": true, "showToast": "Badge created!"}'
    return response


@router.put("/ui/badges/{badge_id}", response_class=HTMLResponse)
async def html_update_badge(
    request: Request,
    badge_id: int,
    name: str = Form(...),
    key: str = Form(...),
    description: Optional[str] = Form(None),
    emoji: Optional[str] = Form(None),
    points_required: int = Form(0),
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    badge = db.query(models.Badge).filter(models.Badge.id == badge_id).first()
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")
    badge.name = name
    badge.key = key
    badge.description = description or None
    badge.emoji = emoji or None
    badge.points_required = points_required
    db.commit()
    response = templates.TemplateResponse("badges.html", {"request": request, "badges": _badges_list(db), "q": ""})
    response.headers["HX-Trigger"] = '{"closeModal": true, "showToast": "Badge updated!"}'
    return response


# ── Skill Games (Quizzes) HTMX ────────────────────────────────────────────────

def _quiz_list(db, q: str = ""):
    query = db.query(models.Quiz).filter(models.Quiz.is_active == True)
    if q:
        t = f"%{q.lower()}%"
        query = query.filter(
            func.lower(models.Quiz.title).like(t) |
            func.lower(models.Quiz.category).like(t)
        )
    quizzes = query.order_by(models.Quiz.title).all()
    for quiz in quizzes:
        quiz.question_count = sum(1 for qu in quiz.questions if qu.is_active)
        quiz.attempt_count = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.quiz_id == quiz.id
        ).count()
    return quizzes


def _questions_for(quiz_id: str, db) -> list:
    return (
        db.query(models.Question)
        .filter(models.Question.quiz_id == quiz_id, models.Question.is_active == True)
        .order_by(models.Question.order)
        .all()
    )


@router.get("/ui/tabs/skillgames", response_class=HTMLResponse)
async def html_tab_skillgames(
    request: Request,
    q: str = "",
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return templates.TemplateResponse("admin_skillgames.html", {
        "request": request, "quizzes": _quiz_list(db, q), "q": q,
    })


@router.get("/ui/quizzes/form", response_class=HTMLResponse)
async def html_quiz_form(
    request: Request,
    quiz_id: Optional[str] = None,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first() if quiz_id else None
    return templates.TemplateResponse("quiz_modal.html", {"request": request, "quiz": quiz})


@router.post("/ui/quizzes", response_class=HTMLResponse)
async def html_create_quiz(
    request: Request,
    title: str = Form(...),
    quiz_id: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    difficulty: str = Form("Beginner"),
    xp_reward: int = Form(100),
    time_estimate: Optional[str] = Form(None),
    min_level: int = Form(1),
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    db.add(models.Quiz(
        id=quiz_id, title=title, description=description or None,
        category=category or None, difficulty=difficulty,
        xp_reward=xp_reward, time_estimate=time_estimate or None,
        min_level=min_level, is_active=True,
    ))
    db.commit()
    response = templates.TemplateResponse("admin_skillgames.html", {
        "request": request, "quizzes": _quiz_list(db), "q": "",
    })
    response.headers["HX-Trigger"] = '{"closeModal": true, "showToast": "Quiz created!"}'
    return response


@router.put("/ui/quizzes/{quiz_id}", response_class=HTMLResponse)
async def html_update_quiz(
    request: Request,
    quiz_id: str,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    difficulty: str = Form("Beginner"),
    xp_reward: int = Form(100),
    time_estimate: Optional[str] = Form(None),
    min_level: int = Form(1),
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    quiz.title = title
    quiz.description = description or None
    quiz.category = category or None
    quiz.difficulty = difficulty
    quiz.xp_reward = xp_reward
    quiz.time_estimate = time_estimate or None
    quiz.min_level = min_level
    quiz.updated_at = datetime.now(timezone.utc)
    db.commit()
    response = templates.TemplateResponse("admin_skillgames.html", {
        "request": request, "quizzes": _quiz_list(db), "q": "",
    })
    response.headers["HX-Trigger"] = '{"closeModal": true, "showToast": "Quiz updated!"}'
    return response


@router.delete("/ui/quizzes/{quiz_id}", response_class=HTMLResponse)
async def html_delete_quiz(
    quiz_id: str,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if quiz:
        quiz.is_active = False
        quiz.updated_at = datetime.now(timezone.utc)
        db.commit()
    response = HTMLResponse("")
    response.headers["HX-Trigger"] = '{"showToast": "Quiz deleted"}'
    return response


@router.get("/ui/quizzes/{quiz_id}/questions", response_class=HTMLResponse)
async def html_quiz_questions(
    request: Request,
    quiz_id: str,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return templates.TemplateResponse("quiz_questions_modal.html", {
        "request": request,
        "quiz": quiz,
        "questions": _questions_for(quiz_id, db),
    })


@router.get("/ui/quizzes/{quiz_id}/questions/form", response_class=HTMLResponse)
async def html_new_question_form(
    request: Request,
    quiz_id: str,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    return templates.TemplateResponse("question_modal.html", {
        "request": request, "question": None, "quiz_id": quiz_id,
        "quiz_title": quiz.title if quiz else quiz_id,
    })


@router.post("/ui/quizzes/{quiz_id}/questions", response_class=HTMLResponse)
async def html_create_question(
    request: Request,
    quiz_id: str,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    fd = await request.form()
    question_text = fd.get("question", "").strip()
    q_type = fd.get("q_type", "single_choice")
    opts = [fd.get(f"option_{i}", "") for i in range(4)]
    correct_raw = fd.getlist("correct_index")
    correct_indices = sorted({int(x) for x in correct_raw if str(x).isdigit()})
    correct_index = correct_indices[0] if correct_indices else 0
    explanation = fd.get("explanation") or None

    existing_count = db.query(models.Question).filter(
        models.Question.quiz_id == quiz_id, models.Question.is_active == True,
    ).count()
    db.add(models.Question(
        id=f"{quiz_id}-q{existing_count + 1}",
        quiz_id=quiz_id,
        question=question_text,
        options=json.dumps(opts),
        correct_index=correct_index,
        correct_indices=json.dumps(correct_indices),
        explanation=explanation,
        type=q_type,
        order=existing_count,
        is_active=True,
    ))
    db.commit()
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    response = templates.TemplateResponse("quiz_questions_modal.html", {
        "request": request,
        "quiz": quiz,
        "questions": _questions_for(quiz_id, db),
    })
    response.headers["HX-Trigger"] = '{"showToast": "Question added!"}'
    return response


@router.get("/ui/questions/{question_id}/form", response_class=HTMLResponse)
async def html_edit_question_form(
    request: Request,
    question_id: str,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    q = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    quiz = db.query(models.Quiz).filter(models.Quiz.id == q.quiz_id).first()
    try:
        checked = json.loads(q.correct_indices) if q.correct_indices else [q.correct_index]
    except Exception:
        checked = [q.correct_index]
    return templates.TemplateResponse("question_modal.html", {
        "request": request,
        "question": q,
        "options": json.loads(q.options),
        "checked_indices": checked,
        "quiz_id": q.quiz_id,
        "quiz_title": quiz.title if quiz else q.quiz_id,
    })


@router.put("/ui/questions/{question_id}", response_class=HTMLResponse)
async def html_update_question(
    request: Request,
    question_id: str,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    fd = await request.form()
    question_text = fd.get("question", "").strip()
    q_type = fd.get("q_type", "single_choice")
    opts = [fd.get(f"option_{i}", "") for i in range(4)]
    correct_raw = fd.getlist("correct_index")
    correct_indices = sorted({int(x) for x in correct_raw if str(x).isdigit()})
    correct_index = correct_indices[0] if correct_indices else 0
    explanation = fd.get("explanation") or None

    q = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    q.question = question_text
    q.options = json.dumps(opts)
    q.correct_index = correct_index
    q.correct_indices = json.dumps(correct_indices)
    q.explanation = explanation
    q.type = q_type
    db.commit()
    quiz = db.query(models.Quiz).filter(models.Quiz.id == q.quiz_id).first()
    response = templates.TemplateResponse("quiz_questions_modal.html", {
        "request": request,
        "quiz": quiz,
        "questions": _questions_for(q.quiz_id, db),
    })
    response.headers["HX-Trigger"] = '{"showToast": "Question updated!"}'
    return response


@router.delete("/ui/questions/{question_id}", response_class=HTMLResponse)
async def html_delete_question(
    question_id: str,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    q = db.query(models.Question).filter(models.Question.id == question_id).first()
    if q:
        q.is_active = False
        db.commit()
    response = HTMLResponse("")
    response.headers["HX-Trigger"] = '{"showToast": "Question deleted"}'
    return response


@router.post("/ui/quizzes/{quiz_id}/questions/reorder")
async def reorder_quiz_questions(
    quiz_id: str,
    data: dict,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    order: list[str] = data.get("order", [])
    for position, question_id in enumerate(order):
        db.query(models.Question).filter(
            models.Question.id == question_id,
            models.Question.quiz_id == quiz_id,
        ).update({"order": position})
    db.commit()
    return {"reordered": len(order)}


@router.delete("/ui/badges/{badge_id}", response_class=HTMLResponse)
async def html_delete_badge(
    badge_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    badge = db.query(models.Badge).filter(models.Badge.id == badge_id).first()
    if badge:
        badge.is_active = False
        db.commit()
    response = HTMLResponse("")
    response.headers["HX-Trigger"] = '{"showToast": "Badge deleted"}'
    return response
