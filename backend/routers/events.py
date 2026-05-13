# In your event router file

from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from database import get_db
import models
import schemas
from auth import get_current_user, calculate_level, verify_token, award_badge

_templates = Jinja2Templates(directory=str(Path(__file__).parent.parent / "templates"))

EVENT_COLORS = {
    "news":       {"bg": "#eff6ff", "color": "#2563eb", "label": "📰 AI News"},
    "workshop":   {"bg": "#dcfce7", "color": "#16a34a", "label": "🛠️ Workshop"},
    "webinar":    {"bg": "#ede9fe", "color": "#7c3aed", "label": "💻 Webinar"},
    "conference": {"bg": "#fee2e2", "color": "#dc2626", "label": "🎤 Conference"},
}
FORMAT_COLORS = {
    "in-person": {"bg": "#dcfce7", "color": "#16a34a", "label": "🏢 In-Person"},
    "online":    {"bg": "#dbeafe", "color": "#1d4ed8", "label": "🌐 Online"},
    "hybrid":    {"bg": "#fef3c7", "color": "#d97706", "label": "🔀 Hybrid"},
    "other":     {"bg": "#f1f5f9", "color": "#64748b", "label": "📌 Other"},
}

router = APIRouter(tags=["events"])

def _get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[models.User]:
    """Safely gets the current user from a token if present, otherwise returns None."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:]
    
    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        return db.query(models.User).filter(models.User.id == int(user_id), models.User.is_active == True).first()
    except Exception:
        # Catches expired tokens or validation errors without crashing
        return None

@router.get("/ui", response_class=HTMLResponse)
def whatson_ui(
    request: Request,
    event_type: str = "all",
    db: Session = Depends(get_db),
):
    query = db.query(models.Event).filter(models.Event.is_active == True)
    if event_type and event_type != "all":
        query = query.filter(models.Event.event_type == event_type)
    events = query.order_by(desc(models.Event.event_date), desc(models.Event.created_at)).all()
    return _templates.TemplateResponse("whatson_list.html", {
        "request":      request,
        "events":       events,
        "event_type":   event_type,
        "event_colors": EVENT_COLORS,
        "format_colors": FORMAT_COLORS,
    })


@router.get("/", response_model=List[schemas.EventOut])
def list_all_events(
    event_type: Optional[str] = Query(None, description="Filter by event type (e.g., 'workshop', 'news')."),
    current_user: Optional[models.User] = Depends(_get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Fetches all active events (workshops, webinars, news, etc.).
    If a user is authenticated, it will also indicate which events they are registered for.
    """
    # Base query for all active events
    query = db.query(models.Event).filter(models.Event.is_active == True)

    # Apply event_type filter if provided
    if event_type and event_type.lower() != "all":
        query = query.filter(models.Event.event_type == event_type)
        
    # Enhanced sorting: upcoming events first, then by creation date
    events = query.order_by(
        desc(models.Event.event_date), 
        desc(models.Event.created_at)
    ).all()

    # Get user's registrations in a single query for efficiency
    user_reg_ids: set[int] = set()
    if current_user:
        registrations = db.query(models.EventRegistration.event_id).filter(
            models.EventRegistration.user_id == current_user.id
        ).all()
        user_reg_ids = {reg.event_id for reg in registrations}

    # Prepare the output
    result = []
    for event in events:
        evt_out = schemas.EventOut.model_validate(event)
        evt_out.is_registered = event.id in user_reg_ids
        result.append(evt_out)
        
    return result

@router.post("/{event_id}/register", status_code=200)
def register_for_event(
    event_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register the current user for a specific event."""
    event = db.query(models.Event).filter(
        models.Event.id == event_id,
        models.Event.is_active == True
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if event.registration_url is None:
        raise HTTPException(status_code=400, detail="This event does not support direct registration.")

    # Check already registered
    existing = db.query(models.EventRegistration).filter(
        models.EventRegistration.user_id == current_user.id,
        models.EventRegistration.event_id == event_id
    ).first()

    if existing:
        return {"message": "Already registered for this event"}

    # Check capacity
    if event.capacity is not None and event.registered_count >= event.capacity:
        raise HTTPException(status_code=400, detail="This event is full")

    # Create registration and update count
    reg = models.EventRegistration(user_id=current_user.id, event_id=event_id)
    db.add(reg)
    event.registered_count += 1
    
    # Award XP for registering
    xp_earned = max(1, int(event.xp_reward * 0.1)) if event.xp_reward > 0 else 5
    current_user.xp += xp_earned
    current_user.level, _ = calculate_level(current_user.xp)
    award_badge(current_user, db)

    db.commit()
    return {
        "message": f"Successfully registered for {event.title}! +{xp_earned} XP",
        "xp_earned": xp_earned,
        "new_xp": current_user.xp
    }

@router.delete("/{event_id}/register", status_code=200)
def unregister_from_event(
    event_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unregister the current user from a specific event."""
    reg = db.query(models.EventRegistration).filter(
        models.EventRegistration.user_id == current_user.id,
        models.EventRegistration.event_id == event_id
    ).first()

    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    # Decrement event count if the event still exists
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if event and event.registered_count > 0:
        event.registered_count -= 1

    db.delete(reg)
    db.commit()
    return {"message": "Successfully unregistered from the event"}



@router.get("/ai-news")
async def get_ai_news():
    # This is a mock response; you can eventually pull this from your DB or an RSS feed
    return [
         {
        "title": "EU AI Act Obligations Now Apply to General-Purpose AI Models",
        "description": "The EU AI Act's rules on General-Purpose AI (GPAI) systems — including GPT-4 and Claude — took effect in August 2025, requiring providers to maintain technical documentation, comply with copyright law, and publish model summaries. Downstream deployers in pharma must ensure their AI tool providers are compliant.",
        "event_type": "news",
        "host": "European Commission",
        "event_date": "August 2025",
        "event_time": "",
        "location": "",
        "tags": '["EU AI Act", "Regulatory", "Compliance"]',
        "xp_reward": 0,
        "capacity": 0,
        "registered_count": 0,
        "source_url": "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
    },
    {
        "title": "FDA Finalises Guidance on AI-Assisted Drug Manufacturing",
        "description": "The FDA released final guidance on the use of AI and ML in pharmaceutical manufacturing processes, covering process validation, model lifecycle management, and data integrity requirements under 21 CFR Part 11. CROs supporting manufacturing clients must review their AI workflows.",
        "event_type": "news",
        "host": "U.S. Food & Drug Administration",
        "event_date": "January 2026",
        "event_time": "",
        "location": "",
        "tags": '["FDA", "Regulatory", "Manufacturing", "Compliance"]',
        "xp_reward": 0,
        "capacity": 0,
        "registered_count": 0,
        "source_url": "https://www.fda.gov/science-research/artificial-intelligence-and-machine-learning-aiml-drug-development",
    },
    {
        "title": "Anthropic Releases Claude 3.7 with Extended Thinking",
        "description": "Anthropic launched Claude 3.7 Sonnet, featuring extended thinking mode that allows the model to reason through complex problems step-by-step before responding. Benchmarks show significant improvements on multi-step reasoning tasks relevant to clinical data analysis and protocol review.",
        "event_type": "news",
        "host": "Anthropic",
        "event_date": "February 2025",
        "event_time": "",
        "location": "",
        "tags": '["Claude", "Anthropic", "New Model"]',
        "xp_reward": 0,
        "capacity": 0,
        "registered_count": 0,
        "source_url": "https://www.anthropic.com/news",
    },
    {
        "title": "OpenAI o3 Achieves Expert-Level Performance on Medical Benchmarks",
        "description": "OpenAI's o3 reasoning model scored at or above board-certified physician level on USMLE and MedQA benchmarks, marking a milestone for AI in clinical decision support. However, researchers caution that benchmark performance does not equate to clinical safety or reliability in real-world deployment.",
        "event_type": "news",
        "host": "OpenAI",
        "event_date": "December 2024",
        "event_time": "",
        "location": "",
        "tags": '["OpenAI", "Clinical AI", "Research"]',
        "xp_reward": 0,
        "capacity": 0,
        "registered_count": 0,
        "source_url": "https://openai.com/research",
    },
    {
        "title": "EMA Publishes Reflection Paper on AI in Medicines Development",
        "description": "The European Medicines Agency published its reflection paper on the use of AI throughout the medicines development lifecycle — from target identification to pharmacovigilance. The paper outlines EMA's expectations for transparency, validation, and human oversight of AI tools used in regulatory submissions.",
        "event_type": "news",
        "host": "European Medicines Agency",
        "event_date": "March 2025",
        "event_time": "",
        "location": "",
        "tags": '["EMA", "Regulatory", "Pharma"]',
        "xp_reward": 0,
        "capacity": 0,
        "registered_count": 0,
        "source_url": "https://www.ema.europa.eu/en/human-regulatory/research-development/data-analysis/artificial-intelligence-ai",
    },
    {
        "title": "Nature Medicine: AI Model Matches Oncologist Accuracy on Trial Eligibility",
        "description": "A Nature Medicine study demonstrated that a fine-tuned LLM could screen patient records against Phase III oncology trial eligibility criteria with accuracy matching expert oncologists at 91.3%, while screening 47× faster. The model flagged uncertainty in ambiguous cases for human review.",
        "event_type": "news",
        "host": "Nature Medicine",
        "event_date": "November 2024",
        "event_time": "",
        "location": "",
        "tags": '["Research", "Clinical Trials", "Oncology"]',
        "xp_reward": 0,
        "capacity": 0,
        "registered_count": 0,
        "source_url": "https://www.nature.com/nm",
    },
    {
        "title": "Microsoft Copilot for Clinical Documentation Enters General Availability",
        "description": "Microsoft announced general availability of Copilot for healthcare, integrated with Epic EHR and Microsoft 365. The tool assists with clinical note drafting, patient communication, and prior authorisation letters. HIPAA BAA included. Pharma companies using Azure can now deploy within existing enterprise agreements.",
        "event_type": "news",
        "host": "Microsoft Health & Life Sciences",
        "event_date": "October 2024",
        "event_time": "",
        "location": "",
        "tags": '["Microsoft", "Copilot", "EHR", "Enterprise"]',
        "xp_reward": 0,
        "capacity": 0,
        "registered_count": 0,
        "source_url": "https://www.microsoft.com/en-us/industry/health/microsoft-cloud-for-healthcare",
    }
    ]