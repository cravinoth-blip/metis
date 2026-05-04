import logging
from database import SessionLocal
from models import Event
from scraper import scrape_ai_events

logger = logging.getLogger(__name__)

async def seed_events():
    """Seed events from scraper if none exist."""
    db = SessionLocal()
    try:
        if db.query(Event).count() == 0:
            logger.info("Seeding initial events...")
            scraped = await scrape_ai_events()
            for evt_data in scraped:
                evt = Event(**evt_data, is_active=True)
                db.add(evt)
            db.commit()
            logger.info(f"Seeded {len(scraped)} events")
    except Exception as e:
        logger.error(f"Event seeding error: {e}")
        db.rollback()
    finally:
        db.close()
