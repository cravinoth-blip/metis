from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from database import get_db
import models
import schemas
from auth import get_current_user, calculate_level, verify_token

router = APIRouter(tags=["events"])


def _get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[models.User]:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[7:]
    payload = verify_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return db.query(models.User).filter(models.User.id == int(user_id), models.User.is_active == True).first()


@router.get("/", response_model=list[schemas.EventOut])
def list_events(
    event_type: Optional[str] = Query(None),
    current_user: Optional[models.User] = Depends(_get_optional_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Event).filter(models.Event.is_active == True)

    if event_type and event_type != "all":
        query = query.filter(models.Event.event_type == event_type)

    events = query.order_by(models.Event.created_at.desc()).all()

    user_reg_ids: set[int] = set()
    if current_user:
        user_reg_ids = {
            reg.event_id for reg in db.query(models.EventRegistration).filter(
                models.EventRegistration.user_id == current_user.id
            ).all()
        }

    result = []
    for event in events:
        evt_out = schemas.EventOut.model_validate(event)
        evt_out.is_registered = event.id in user_reg_ids
        result.append(evt_out)

    return result


@router.post("/{event_id}/register")
def register_for_event(
    event_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = db.query(models.Event).filter(
        models.Event.id == event_id,
        models.Event.is_active == True
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check already registered
    existing = db.query(models.EventRegistration).filter(
        models.EventRegistration.user_id == current_user.id,
        models.EventRegistration.event_id == event_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already registered for this event")

    # Check capacity
    if event.capacity > 0 and event.registered_count >= event.capacity:
        raise HTTPException(status_code=400, detail="Event is full")

    # Register
    reg = models.EventRegistration(
        user_id=current_user.id,
        event_id=event_id,
        registered_at=datetime.utcnow()
    )
    db.add(reg)

    # Update event count
    event.registered_count += 1

    # Award XP (10% of event XP reward)
    xp_earned = max(1, int(event.xp_reward * 0.1)) if event.xp_reward > 0 else 5
    current_user.xp += xp_earned
    level, _ = calculate_level(current_user.xp)
    current_user.level = level

    db.commit()

    return {
        "message": f"Registered for {event.title}! +{xp_earned} XP",
        "xp_earned": xp_earned,
        "new_xp": current_user.xp
    }


@router.delete("/{event_id}/register")
def unregister_from_event(
    event_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reg = db.query(models.EventRegistration).filter(
        models.EventRegistration.user_id == current_user.id,
        models.EventRegistration.event_id == event_id
    ).first()

    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if event and event.registered_count > 0:
        event.registered_count -= 1

    db.delete(reg)
    db.commit()

    return {"message": "Unregistered from event"}
