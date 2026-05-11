import logging
from uuid import uuid4

from database import SessionLocal
from models import Workshop
from default_data.workshop_data import WORKSHOPS

logger = logging.getLogger(__name__)


def seed_workshops():
    """Seed initial workshops from workshop_data.py if the table is empty."""
    db = SessionLocal()
    try:
        if db.query(Workshop).count() > 0:
            logger.info("Workshops table not empty — skipping seeding.")
            return

        logger.info("Seeding initial workshops from workshop_data.py...")

        for workshop in WORKSHOPS.values():
            db.add(Workshop(
                id=str(uuid4()),
                title=workshop["title"],
                description=workshop.get("description"),
                category=workshop.get("category"),
                level=workshop.get("level", 1),
                tags=workshop.get("tags"),
                format=workshop.get("format"),
                duration_minutes=workshop.get("duration_minutes"),
                location=workshop.get("location"),
                organizer=workshop.get("organizer"),
                capacity=workshop.get("capacity"),
                xp_reward=workshop.get("xp_reward", 0),
                start_date=workshop.get("start_date"),
                end_date=workshop.get("end_date"),
                is_active=True,
            ))

        db.commit()
        logger.info(f"✅ Seeded {len(WORKSHOPS)} workshops.")

    except Exception as e:
        logger.error(f"Workshop seeding error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
