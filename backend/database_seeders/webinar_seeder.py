import logging
from uuid import uuid4

from database import SessionLocal
from models import Webinar
from default_data.webinar_data import WEBINARS

logger = logging.getLogger(__name__)


def seed_webinars():
    """Seed initial webinars from webinar_data.py if the table is empty."""
    db = SessionLocal()
    try:
        if db.query(Webinar).count() > 0:
            logger.info("Webinars table not empty — skipping seeding.")
            return

        logger.info("Seeding initial webinars from webinar_data.py...")

        for webinar in WEBINARS.values():
            db.add(Webinar(
                id=str(uuid4()),
                title=webinar["title"],
                description=webinar.get("description"),
                category=webinar.get("category"),
                tags=webinar.get("tags"),
                speaker=webinar.get("speaker"),
                platform=webinar.get("platform"),
                start_date=webinar.get("start_date"),
                duration_minutes=webinar.get("duration_minutes"),
                registration_url=webinar.get("registration_url"),
                capacity=webinar.get("capacity"),
                xp_reward=webinar.get("xp_reward", 0),
                is_active=True,
            ))

        db.commit()
        logger.info(f"✅ Seeded {len(WEBINARS)} webinars.")

    except Exception as e:
        logger.error(f"Webinar seeding error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
