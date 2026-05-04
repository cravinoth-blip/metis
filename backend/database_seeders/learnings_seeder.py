import logging
import re
from uuid import uuid4

from database import SessionLocal
from default_data.course_data import COURSES 

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def _uuid() -> str:
    return str(uuid4())

def parse_duration(duration_str: str) -> int:
    """Convert duration strings like '2h 30m' or '20 min' into total minutes."""
    if not duration_str:
        return 0
    minutes = 0
    h_match = re.search(r'(\d+)\s*h', duration_str, re.IGNORECASE)
    m_match = re.search(r'(\d+)\s*m', duration_str, re.IGNORECASE)
    if h_match:
        minutes += int(h_match.group(1)) * 60
    if m_match:
        minutes += int(m_match.group(1))
    return minutes

def parse_level(level_str: str) -> int:
    """Convert text levels to integer tiers."""
    mapping = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}
    return mapping.get(level_str, 1)

def sections_to_markdown(sections: list[dict]) -> str:
    """
    Converts the new 'sections' JSON list into a markdown string.
    Supported types: text, key_points, tip, warning, example, steps.
    """
    md_parts: list[str] = []
    
    for s in sections or []:
        t = (s.get("type") or "").lower()
        heading = s.get("heading", "").strip()
        body = s.get("body", "").strip()
        points = s.get("points") or []

        # Add the heading if it exists
        if heading:
            md_parts.append(f"### {heading}")

        # Render the body/points based on the type
        if t == "text":
            if body:
                md_parts.append(body)
                
        elif t == "key_points":
            if points:
                # FIX: Join points with a single newline so they form a proper Markdown list
                bullets = "\n".join([f"- {p}" for p in points if str(p).strip()])
                md_parts.append(bullets)
                
        elif t == "steps":
            if points:
                # FIX: Join numbered steps with a single newline
                steps = "\n".join([f"{i+1}. {p}" for i, p in enumerate(points) if str(p).strip()])
                md_parts.append(steps)
                
        elif t == "tip":
            if body:
                md_parts.append(f"> 💡 **Tip:** {body}")
                
        elif t == "warning":
            if body:
                md_parts.append(f"> ⚠️ **Warning:** {body}")
                
        elif t == "example":
            if body:
                md_parts.append(f"> 📝 **Example:** {body}")
                
        else:
            # Safe fallback for unknown types
            raw = {k: v for k, v in s.items() if k not in ["type", "heading"]}
            if raw:
                md_parts.append(f"> _Note:_ {raw}")
                
    return "\n\n".join(md_parts).strip()


async def seed_learnings():
    """Seed initial learnings and learning modules from course_data.py if DB is empty."""
    db = SessionLocal()
    try:
        from models import Learning, LearningModule
        
        # Only seed if empty
        if db.query(Learning).count() > 0:
            logger.info("Learnings table not empty — skipping seeding.")
            return

        logger.info("Seeding initial learnings and modules from course_data.py...")
        
        for course_key, course_data in COURSES.items():
            # Create the parent Learning record
            learning_id = _uuid()
            
            learning_record = Learning(
                id=learning_id,
                title=course_data.get("title"),
                description=course_data.get("description"),
                category=course_data.get("category"),
                type="course", # all in course_data represent courses
                level=parse_level(course_data.get("level", "Beginner")),
                tags=f"{course_data.get('category', '').lower().replace(' ', '-')}",
                estimated_duration_min=parse_duration(course_data.get("duration", "")),
                xp_reward=sum(m.get("xp_reward", 0) for m in course_data.get("modules", [])),
                is_mandatory=False,
                is_active=True,
            )
            db.add(learning_record)
            
            # Create the Modules for this Learning
            modules_data = course_data.get("modules", [])
            for mod_data in modules_data:
                module_record = LearningModule(
                    id=_uuid(),
                    learning_id=learning_id,
                    title=mod_data.get("title"),
                    description=None, # Can be derived or left null based on your schema
                    content_text=sections_to_markdown(mod_data.get("sections", [])),
                    content_url=None,
                    order=mod_data.get("index", 0),
                    duration_min=parse_duration(mod_data.get("duration", "")),
                    xp_reward=mod_data.get("xp_reward", 0),
                    is_active=True,
                )
                db.add(module_record)

        # Commit everything to the database
        db.commit()
        logger.info(f"✅ Seeding completed successfully. Added {len(COURSES)} courses.")

    except Exception as e:
        logger.error(f"Seeding error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

# If you want to run locally:
# if __name__ == "__main__":
#     import asyncio
#     asyncio.run(seed_learnings())
