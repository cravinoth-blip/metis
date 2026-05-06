import json
from pathlib import Path
from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from database import get_db
import models
from auth import verify_token, calculate_level
from default_data.quiz_data import QUIZZES

router = APIRouter()
templates = Jinja2Templates(directory=str(Path(__file__).parent.parent / "templates"))


# ── Auth helper ────────────────────────────────────────────────────────────────

def _get_user(request: Request, db: Session) -> models.User | None:
    token = request.cookies.get("metis_session")
    if not token:
        return None
    payload = verify_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return db.query(models.User).filter(
        models.User.id == int(user_id),
        models.User.is_active == True,
    ).first()


def _redirect_login():
    return RedirectResponse("/login", status_code=302)


# ── /login ─────────────────────────────────────────────────────────────────────

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request, db: Session = Depends(get_db)):
    # Already logged in? Send to dashboard
    if _get_user(request, db):
        return RedirectResponse("/dashboard", status_code=302)
    return templates.TemplateResponse("login.html", {"request": request})


# ── /dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page(request: Request, db: Session = Depends(get_db)):
    user = _get_user(request, db)
    if not user:
        return _redirect_login()

    level, xp_to_next = calculate_level(user.xp)
    quiz_count = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.user_id == user.id
    ).count()
    recent = (
        db.query(models.QuizAttempt)
        .filter(models.QuizAttempt.user_id == user.id)
        .order_by(models.QuizAttempt.completed_at.desc())
        .limit(6)
        .all()
    )
    # Enrich with quiz titles from in-memory data
    recent_activity = []
    for a in recent:
        q = QUIZZES.get(a.quiz_id, {})
        recent_activity.append({
            "quiz_title": q.get("title", a.quiz_id),
            "xp_earned": a.xp_earned,
            "score_pct": round(a.score_pct),
        })

    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "user": user,
        "level": level,
        "xp_to_next": xp_to_next,
        "quiz_count": quiz_count,
        "recent_activity": recent_activity,
        "active_page": "dashboard",
    })


# ── /skillgames ────────────────────────────────────────────────────────────────

@router.get("/skillgames", response_class=HTMLResponse)
async def skillgames_page(request: Request, db: Session = Depends(get_db)):
    user = _get_user(request, db)
    if not user:
        return _redirect_login()

    level, _ = calculate_level(user.xp)

    quizzes_list = []
    for quiz_id, quiz in QUIZZES.items():
        best = db.query(func.max(models.QuizAttempt.score_pct)).filter(
            models.QuizAttempt.user_id == user.id,
            models.QuizAttempt.quiz_id == quiz_id,
        ).scalar()
        attempts = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.user_id == user.id,
            models.QuizAttempt.quiz_id == quiz_id,
        ).count()
        quizzes_list.append({
            "id": quiz_id,
            "title": quiz["title"],
            "description": quiz.get("description", ""),
            "category": quiz.get("category", ""),
            "difficulty": quiz.get("difficulty", "beginner"),
            "min_level": quiz.get("min_level", 1),
            "question_count": len(quiz.get("questions", [])),
            "xp_reward": quiz.get("xp_reward", 50),
            "best_score": round(best) if best is not None else None,
            "attempts": attempts,
        })

    lb_users = (
        db.query(models.User)
        .filter(models.User.is_active == True)
        .order_by(models.User.xp.desc())
        .limit(20)
        .all()
    )
    leaderboard = [
        {
            "rank": i + 1,
            "username": u.username,
            "full_name": u.full_name or u.username,
            "department": u.department or "",
            "avatar_initials": u.avatar_initials or "??",
            "xp": u.xp,
            "level": u.level,
            "is_current_user": u.id == user.id,
        }
        for i, u in enumerate(lb_users)
    ]

    return templates.TemplateResponse("skillgames.html", {
        "request": request,
        "user": user,
        "level": level,
        "quizzes_json": json.dumps(quizzes_list),
        "leaderboard_json": json.dumps(leaderboard),
        "active_page": "skillgames",
    })


# ── /learning ──────────────────────────────────────────────────────────────────

@router.get("/learning", response_class=HTMLResponse)
async def learning_page(request: Request, db: Session = Depends(get_db)):
    user = _get_user(request, db)
    if not user:
        return _redirect_login()

    rows = (
        db.query(models.Learning)
        .options(joinedload(models.Learning.modules))
        .filter(models.Learning.is_active == True)
        .order_by(models.Learning.title)
        .all()
    )

    learnings = []
    for lr in rows:
        active_mods = sorted(
            [m for m in lr.modules if m.is_active],
            key=lambda m: m.order,
        )
        completions = db.query(models.ModuleCompletion).filter(
            models.ModuleCompletion.user_id == user.id,
            models.ModuleCompletion.learning_id == lr.id,
        ).all()
        completed_indices = [c.module_index for c in completions]
        total = len(active_mods)
        pct = round((len(completed_indices) / total) * 100) if total else 0

        learnings.append({
            "id": lr.id,
            "title": lr.title,
            "description": lr.description or "",
            "type": lr.type or "",
            "category": lr.category or "",
            "level": lr.level,
            "progress_pct": pct,
            "modules_completed": completed_indices,
            "total_modules": total,
            "modules": [
                {
                    "id": m.id,
                    "title": m.title,
                    "order": m.order,
                    "duration_min": m.duration_min or 0,
                    "xp_reward": m.xp_reward,
                }
                for m in active_mods
            ],
        })

    return templates.TemplateResponse("learning.html", {
        "request": request,
        "user": user,
        "learnings_json": json.dumps(learnings),
        "active_page": "learning",
    })


# ── /whatson ───────────────────────────────────────────────────────────────────

EVENT_COLORS = {
    "news":       {"bg": "#eff6ff", "color": "#2563eb", "label": "📰 AI News"},
    "workshop":   {"bg": "#dcfce7", "color": "#16a34a", "label": "🛠️ Workshop"},
    "webinar":    {"bg": "#ede9fe", "color": "#7c3aed", "label": "💻 Webinar"},
    "conference": {"bg": "#fee2e2", "color": "#dc2626", "label": "🎤 Conference"},
}

FORMAT_COLORS = {
    "in-person": {"bg": "#dcfce7", "color": "#16a34a", "label": "🏢 In-Person"},
    "online":    {"bg": "#ede9fe", "color": "#7c3aed", "label": "💻 Online"},
    "hybrid":    {"bg": "#fef3c7", "color": "#d97706", "label": "🔀 Hybrid"},
}


@router.get("/whatson", response_class=HTMLResponse)
async def whatson_page(request: Request, db: Session = Depends(get_db)):
    user = _get_user(request, db)
    if not user:
        return _redirect_login()

    active_filter = request.query_params.get("filter", "all")
    query = db.query(models.Event).filter(models.Event.is_active == True)
    if active_filter != "all":
        query = query.filter(models.Event.event_type == active_filter)
    events = query.order_by(models.Event.created_at.desc()).all()

    return templates.TemplateResponse("whatson.html", {
        "request": request,
        "user": user,
        "events": events,
        "active_filter": active_filter,
        "event_colors": EVENT_COLORS,
        "format_colors": FORMAT_COLORS,
        "active_page": "whatson",
    })


# ── /aitools ───────────────────────────────────────────────────────────────────

@router.get("/aitools", response_class=HTMLResponse)
async def aitools_page(request: Request, db: Session = Depends(get_db)):
    user = _get_user(request, db)
    if not user:
        return _redirect_login()

    tools = (
        db.query(models.AITool)
        .filter(models.AITool.is_active == True)
        .order_by(models.AITool.name)
        .all()
    )
    enterprise = [t for t in tools if t.is_enterprise]
    free = [t for t in tools if not t.is_enterprise]

    # Which free tools has this user already logged?
    used_names = {
        row.tool_name
        for row in db.query(models.ToolUsage.tool_name)
        .filter(models.ToolUsage.user_id == user.id)
        .all()
    }

    return templates.TemplateResponse("aitools.html", {
        "request": request,
        "user": user,
        "enterprise_tools": enterprise,
        "free_tools": free,
        "used_tools": used_names,
        "active_page": "aitools",
    })


# ── /admin ─────────────────────────────────────────────────────────────────────

@router.get("/admin", response_class=HTMLResponse)
async def admin_page(request: Request, db: Session = Depends(get_db)):
    user = _get_user(request, db)
    if not user:
        return _redirect_login()
    if not user.is_admin:
        return RedirectResponse("/dashboard", status_code=302)
    return templates.TemplateResponse("admin.html", {
        "request": request,
        "user": user,
        "active_page": "admin",
    })


# ── /add-module ────────────────────────────────────────────────────────────────

@router.get("/add-module", response_class=HTMLResponse)
async def add_module_page(request: Request, db: Session = Depends(get_db)):
    user = _get_user(request, db)
    if not user or not user.is_admin:
        return _redirect_login()
    return templates.TemplateResponse("add_module.html", {
        "request": request,
        "user": user,
        "active_page": "admin",
    })


# ── /edit-module ───────────────────────────────────────────────────────────────

@router.get("/edit-module", response_class=HTMLResponse)
async def edit_module_page(request: Request, db: Session = Depends(get_db)):
    user = _get_user(request, db)
    if not user or not user.is_admin:
        return _redirect_login()
    return templates.TemplateResponse("edit_module.html", {
        "request": request,
        "user": user,
        "active_page": "admin",
    })
