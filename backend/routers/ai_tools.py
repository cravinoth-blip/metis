import json
from itertools import groupby as _groupby
from pathlib import Path
from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user, calculate_level, award_badge
import models

router = APIRouter(tags=["ai-tools"])
templates = Jinja2Templates(directory=str(Path(__file__).parent.parent / "templates"))

LOG_XP = 10


def _group_by_category(tools):
    key = lambda t: t.category or "General"
    return [(cat, list(grp)) for cat, grp in _groupby(sorted(tools, key=key), key=key)]


def _tools_context(user_id: int, db: Session) -> dict:
    tools = (
        db.query(models.AITool)
        .filter(models.AITool.is_active == True)
        .order_by(models.AITool.name.asc())
        .all()
    )
    used = {
        row.tool_name
        for row in db.query(models.ToolUsage.tool_name)
        .filter(models.ToolUsage.user_id == user_id)
        .all()
    }
    return {
        "enterprise_by_cat": _group_by_category([t for t in tools if t.is_enterprise]),
        "free_by_cat":       _group_by_category([t for t in tools if not t.is_enterprise]),
        "used_tools":        used,
        "log_xp":            LOG_XP,
    }


@router.get("/ui", response_class=HTMLResponse)
def ui_tools_list(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx = _tools_context(current_user.id, db)
    return templates.TemplateResponse("aitools_list.html", {"request": request, **ctx})


@router.post("/log/{tool_name}", response_class=HTMLResponse)
def log_tool_usage(
    tool_name: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user = db.merge(current_user)

    already = db.query(models.ToolUsage).filter(
        models.ToolUsage.user_id == current_user.id,
        models.ToolUsage.tool_name == tool_name,
    ).first()

    new_xp, new_level = current_user.xp, current_user.level
    newly_awarded = []

    if not already:
        db.add(models.ToolUsage(user_id=current_user.id, tool_name=tool_name))
        current_user.xp += LOG_XP
        new_level, _ = calculate_level(current_user.xp)
        current_user.level = new_level
        newly_awarded = award_badge(current_user, db)
        db.commit()
        db.refresh(current_user)
        new_xp = current_user.xp

    html = f'<button class="btn btn-success btn-sm" disabled>&#10003; +{LOG_XP} XP</button>'
    response = HTMLResponse(html)
    trigger = {
        "showToast": f"+{LOG_XP} XP for using {tool_name}!",
        "updateXP":  {"xp": new_xp, "level": new_level},
    }
    if newly_awarded:
        trigger["badgesAwarded"] = [{"emoji": b.emoji or "🏅", "name": b.name} for b in newly_awarded]
    response.headers["HX-Trigger"] = json.dumps(trigger)
    return response
