import re
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
from typing import List
from pydantic import BaseModel
import json

from database import get_db
import models
import schemas
from auth import get_current_user, get_current_admin, calculate_level
# from default_data.course_data import COURSES


class ModuleReorderRequest(BaseModel):
    order: List[str]

router = APIRouter(tags=["learnings"])
_templates = Jinja2Templates(directory=str(Path(__file__).parent.parent / "templates"))


def _parse_markdown(text: str) -> str:
    """Lightweight markdown → HTML, mirroring the JS parseMarkdown."""
    if not text:
        return ''
    text = re.sub(r'^### (.+)$', r'<h4 style="margin:20px 0 8px;font-size:15px;font-weight:700">\1</h4>', text, flags=re.MULTILINE)
    text = re.sub(r'^## (.+)$',  r'<h3 style="margin:24px 0 10px;font-size:17px;font-weight:700">\1</h3>', text, flags=re.MULTILINE)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'^> ?(.+)$', r'<div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0;font-size:13.5px">\1</div>', text, flags=re.MULTILINE)
    def _list_block(m):
        items = ''.join(
            f'<li style="margin-bottom:8px;margin-left:24px;list-style-type:disc">{re.sub(r"^[ \t]*- ", "", ln)}</li>'
            for ln in m.group(0).strip().splitlines() if ln.strip()
        )
        return (
            '<div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px 20px;border-radius:12px;margin:20px 0">'
            '<div style="font-weight:700;margin-bottom:12px;color:#166534;font-size:14px">Key Points</div>'
            f'<ul style="margin:0;color:#14532d;line-height:1.6">{items}</ul></div>'
        )
    text = re.sub(r'(^[ \t]*- .+(\n|$))+', _list_block, text, flags=re.MULTILINE)
    text = text.replace('\n\n', '</p><p style="margin-bottom:12px;color:var(--text-secondary)">')
    return f'<div style="margin-bottom:16px"><p style="margin-bottom:12px;color:var(--text-secondary)">{text}</p></div>'


def _render_module_content(content_text: str) -> str:
    if not content_text:
        return '<p style="color:var(--text-secondary)">No content available.</p>'
    # Raw HTML from the Quill editor — pass straight through
    stripped = content_text.strip()
    if stripped.startswith('<') and not stripped.startswith('["') and not stripped.startswith('[{'):
        return stripped
    try:
        parsed = json.loads(content_text)
        if isinstance(parsed, list):
            parts = []
            for s in parsed:
                t      = (s.get('type') or '').lower()
                heading = s.get('heading') or ''
                body   = s.get('body') or s.get('content') or s.get('text') or ''
                points = s.get('points') or []
                if t == 'heading' and body:
                    parts.append(f'<h4 style="margin:20px 0 8px;font-size:15px;font-weight:700">{body}</h4>')
                elif heading:
                    parts.append(f'<h4 style="margin:20px 0 8px;font-size:15px;font-weight:700">{heading}</h4>')
                if t == 'heading':
                    pass  # already handled above
                elif t == 'text' and body:
                    # body is Quill HTML — output directly so lists, bold, etc. render correctly
                    parts.append(body)
                elif t == 'key_points' and points:
                    items = ''.join(f'<li style="margin-bottom:8px">{p}</li>' for p in points if str(p).strip())
                    parts.append(f'<div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px 20px;border-radius:12px;margin:20px 0"><div style="font-weight:700;margin-bottom:12px;color:#166534;font-size:14px">Key Points</div><ul style="margin:0;padding-left:24px;list-style-type:disc;color:#14532d;line-height:1.6">{items}</ul></div>')
                elif t == 'steps' and points:
                    items = ''.join(f'<li style="margin-bottom:8px">{p}</li>' for p in points if str(p).strip())
                    parts.append(f'<ol style="margin:12px 0 12px 0;padding-left:24px;color:var(--text-secondary)">{items}</ol>')
                elif t == 'tip' and body:
                    parts.append(f'<div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0;font-size:13.5px">&#128161; <strong>Tip:</strong> {body}</div>')
                elif t == 'warning' and body:
                    parts.append(f'<div style="background:#fff7ed;border-left:4px solid #f97316;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0;font-size:13.5px">&#9888; <strong>Warning:</strong> {body}</div>')
                elif t == 'example' and body:
                    parts.append(f'<div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0;font-size:13.5px">&#128221; <strong>Example:</strong> {body}</div>')
                elif body:
                    parts.append(body)
            return ''.join(parts) or '<p style="color:var(--text-secondary)">No content.</p>'
    except (ValueError, TypeError):
        pass
    return _parse_markdown(content_text)


def _learning_rows(user_id: int, db: Session, q: str = '') -> list:
    rows = (
        db.query(models.Learning)
        .options(joinedload(models.Learning.modules))
        .filter(models.Learning.is_active == True)
        .order_by(models.Learning.title)
        .all()
    )
    result = []
    for lr in rows:
        active_mods = sorted([m for m in lr.modules if m.is_active], key=lambda m: m.order)
        completed   = _get_user_completed_modules(user_id, lr.id, db)
        total       = len(active_mods)
        pct         = _calc_progress(len(completed), total)
        result.append({
            'id': lr.id, 'title': lr.title, 'description': lr.description,
            'type': lr.type, 'progress_pct': pct, 'modules_completed': completed,
            'total_modules': total, 'is_completed': pct >= 100,
        })
    if q:
        ql = q.lower()
        result = [l for l in result if ql in l['title'].lower() or ql in (l['description'] or '').lower()]
    return result


# ── Learning UI HTMX ──────────────────────────────────────────────────────────

@router.get("/ui/learnings", response_class=HTMLResponse)
def ui_learning_list(
    request: Request,
    q: str = '',
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    learnings = _learning_rows(current_user.id, db, q)
    return _templates.TemplateResponse("learning_list.html", {"request": request, "learnings": learnings, "q": q})


@router.get("/ui/learnings/{learning_id}/modules", response_class=HTMLResponse)
def ui_learning_modules(
    request: Request,
    learning_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    modules = (
        db.query(models.LearningModule)
        .filter(models.LearningModule.learning_id == learning_id, models.LearningModule.is_active == True)
        .order_by(models.LearningModule.order.asc())
        .all()
    )
    completed = _get_user_completed_modules(current_user.id, learning_id, db)
    return _templates.TemplateResponse("learning_modules.html", {
        "request": request, "modules": modules,
        "completed_indices": completed, "learning_id": learning_id,
    })


@router.get("/ui/modules/{module_id}", response_class=HTMLResponse)
def ui_module_modal(
    request: Request,
    module_id: str,
    learning_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    module = db.query(models.LearningModule).filter(
        models.LearningModule.id == module_id,
        models.LearningModule.is_active == True,
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    completed = db.query(models.ModuleCompletion).filter(
        models.ModuleCompletion.user_id == current_user.id,
        models.ModuleCompletion.learning_id == learning_id,
        models.ModuleCompletion.module_index == module.order,
    ).first() is not None
    return _templates.TemplateResponse("learning_module_modal.html", {
        "request": request,
        "module": module,
        "learning_id": learning_id,
        "completed": completed,
        "content_html": _render_module_content(module.content_text),
    })


@router.post("/ui/learnings/{learning_id}/modules/{module_id}/complete", response_class=HTMLResponse)
def ui_complete_module(
    request: Request,
    learning_id: str,
    module_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import json as _json
    current_user = db.merge(current_user)
    module = db.query(models.LearningModule).filter(
        models.LearningModule.id == module_id,
        models.LearningModule.learning_id == learning_id,
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    existing = db.query(models.ModuleCompletion).filter(
        models.ModuleCompletion.user_id == current_user.id,
        models.ModuleCompletion.learning_id == learning_id,
        models.ModuleCompletion.module_index == module.order,
    ).first()

    xp_earned = 0
    completion_bonus = 0
    learning_just_completed = False
    if not existing:
        # Use xp_reward if set, otherwise default to 10
        xp_earned = getattr(module, 'xp_reward', None) or 10

        # Count BEFORE adding so autoflush doesn't double-count
        total = db.query(models.LearningModule).filter(
            models.LearningModule.learning_id == learning_id,
            models.LearningModule.is_active == True,
        ).count()
        done_before = db.query(models.ModuleCompletion).filter(
            models.ModuleCompletion.user_id == current_user.id,
            models.ModuleCompletion.learning_id == learning_id,
        ).count()
        progress = _calc_progress(done_before + 1, total)

        db.add(models.ModuleCompletion(
            user_id=current_user.id, learning_id=learning_id,
            module_index=module.order, xp_earned=xp_earned,
            completed_at=datetime.now(timezone.utc),
        ))
        current_user.xp += xp_earned
        new_level, _ = calculate_level(current_user.xp)
        current_user.level = new_level

        lp = db.query(models.LearningProgress).filter(
            models.LearningProgress.user_id == current_user.id,
            models.LearningProgress.learning_id == learning_id,
        ).first()
        was_already_completed = lp and lp.completed
        if lp:
            lp.progress_pct = progress
            if progress >= 100:
                lp.completed = True
                lp.completed_at = datetime.now(timezone.utc)
        else:
            db.add(models.LearningProgress(
                user_id=current_user.id, learning_id=learning_id,
                progress_pct=progress, completed=(progress >= 100),
            ))

        # Award the learning-level XP bonus the first time all modules are done
        if progress >= 100 and not was_already_completed:
            learning_just_completed = True
            lr = db.query(models.Learning).filter(models.Learning.id == learning_id).first()
            completion_bonus = (lr.xp_reward or 0) if lr else 0
            if completion_bonus:
                current_user.xp += completion_bonus
                new_level, _ = calculate_level(current_user.xp)
                current_user.level = new_level

        db.commit()
        db.refresh(current_user)

    learnings = _learning_rows(current_user.id, db)
    total_xp = xp_earned + completion_bonus
    if not xp_earned:
        toast = "Already completed"
    elif learning_just_completed and completion_bonus:
        toast = f"Learning complete! +{total_xp} XP"
    elif learning_just_completed:
        toast = f"Learning complete! +{xp_earned} XP"
    else:
        toast = f"Module complete! +{xp_earned} XP"

    response = _templates.TemplateResponse("learning_list.html", {"request": request, "learnings": learnings, "q": ""})
    # closeModal MUST be last: it removes the triggering element from the DOM,
    # which would prevent subsequent events from bubbling to document.body.
    trigger = {
        "showToast": toast,
        "updateXP": {"xp": current_user.xp, "level": current_user.level},
    }
    if learning_just_completed:
        trigger["learningCompleted"] = True
    trigger["closeModal"] = True
    response.headers["HX-Trigger"] = _json.dumps(trigger)
    return response

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
    if not xp_to_add:
        xp_to_add = 10  # default per-module XP

    # 4. Create Completion Record
    db.add(models.ModuleCompletion(
        user_id=current_user.id,
        learning_id=learning_id,
        module_index=module.order,
        xp_earned=xp_to_add,
        completed_at=datetime.now(timezone.utc)
    ))

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

    was_already_completed = lp and lp.completed
    if lp:
        lp.progress_pct = progress
        if progress >= 100:
            lp.completed = True
            lp.completed_at = datetime.now(timezone.utc)
    else:
        db.add(models.LearningProgress(
            user_id=current_user.id,
            learning_id=learning_id,
            progress_pct=progress,
            completed=(progress >= 100)
        ))

    # 7. Award learning completion bonus XP the first time all modules are done
    completion_bonus = 0
    if progress >= 100 and not was_already_completed:
        lr = db.query(models.Learning).filter(models.Learning.id == learning_id).first()
        completion_bonus = (lr.xp_reward or 0) if lr else 0
        if completion_bonus:
            current_user.xp += completion_bonus
            new_level, _ = calculate_level(current_user.xp)
            current_user.level = new_level

    db.commit()
    db.refresh(current_user)

    return {
        "status": "success",
        "xp_earned": xp_to_add,
        "completion_bonus": completion_bonus,
        "new_xp": current_user.xp,
        "new_level": current_user.level,
        "progress_pct": progress,
        "learning_completed": progress >= 100 and not was_already_completed,
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
