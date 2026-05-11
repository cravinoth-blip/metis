import logging
from database import SessionLocal
from models import Badge
from default_data.badges_data import BADGES

logger = logging.getLogger(__name__)


def seed_badges():
    db = SessionLocal()
    try:
        for badge_data in BADGES:
            existing = db.query(Badge).filter(Badge.key == badge_data["key"]).first()
            if not existing:
                db.add(Badge(**badge_data))
        db.commit()
        logger.info(f"Badges seeded successfully.")
    except Exception as e:
        logger.error(f"Badges seeding error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
