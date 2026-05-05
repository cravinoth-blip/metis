import logging
from uuid import uuid4

from database import SessionLocal
from models import Launch
from default_data.launch_data import LAUNCHES

logger = logging.getLogger(__name__)


def seed_launches():
    """Seed initial Launch & Learn sessions from launch_data.py if the table is empty."""
    db = SessionLocal()
    try:
        if db.query(Launch).count() > 0:
            logger.info("Launches table not empty — skipping seeding.")
            return

        logger.info("Seeding initial Launch & Learn sessions from launch_data.py...")

        for lunch in LAUNCHES.values():
            db.add(Launch(
                id=str(uuid4()),
                title=lunch["title"],
                description=lunch.get("description"),
                category=lunch.get("category"),
                tags=lunch.get("tags"),
                speaker=lunch.get("speaker"),
                menu=lunch.get("menu"),
                location=lunch.get("location"),
                event_date=lunch.get("event_date"),
                event_time=lunch.get("event_time"),
                duration_minutes=lunch.get("duration_minutes"),
                capacity=lunch.get("capacity"),
                xp_reward=lunch.get("xp_reward", 0),
                is_active=True,
            ))

        db.commit()
        logger.info(f"✅ Seeded {len(LAUNCHES)} Launch & Learn sessions.")

    except Exception as e:
        logger.error(f"Lunch seeding error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
