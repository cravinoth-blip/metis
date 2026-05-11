import logging
from database import SessionLocal
from models import Event
from scraper import scrape_ai_events
from default_data.workshop_data import WORKSHOPS
from default_data.webinar_data import WEBINARS

logger = logging.getLogger(__name__)

async def seed_all_events():
    """
    Main entry point for seeding. 
    Combines scraped news events data into the Event table.
    """
    db = SessionLocal()
    try:
        # 1. Check if we already have events to avoid duplicates
        if db.query(Event).count() > 0:
            logger.info("Events table already contains data — skipping seeding.")
            return

        logger.info("Starting unified event seeding...")
        event_entries = []

        # 2. Handle Scraped AI News Events
        try:
            scraped = await scrape_ai_events()
            for evt_data in scraped:
                date_str = evt_data.get("start_date", "")
                time_str = evt_data.get("event_time", "")
                display_date = f"{date_str} {time_str}".strip() if time_str else date_str
                event_entries.append(Event(
                    event_type=evt_data.get("event_type", "news"),
                    title=evt_data["title"],
                    description=evt_data.get("description"),
                    tags=evt_data.get("tags"),
                    location=evt_data.get("location") or None,
                    organizer=evt_data.get("host") or None,
                    event_date=display_date or None,
                    registration_url=evt_data.get("source_url") or None,
                    xp_reward=evt_data.get("xp_reward", 0),
                    is_active=True,
                ))
            logger.info(f"Prepared {len(scraped)} scraped events.")
        except Exception as e:
            logger.error(f"Error scraping AI events: {e}")

        # 3. Process Manual Workshops
        for w in WORKSHOPS.values():
            event_entries.append(Event(
                event_type="workshop",
                title=w["title"],
                description=w.get("description"),
                tags=str(w.get("tags", [])), # Store tags as string/JSON
                organizer=w.get("organizer"),
                format=w.get("format"),
                location=w.get("location"),
                duration_minutes=w.get("duration_minutes"),
                xp_reward=w.get("xp_reward", 0),
                is_active=True,
            ))

        # 4. Process Manual Webinars
        for wb in WEBINARS.values():
            event_entries.append(Event(
                event_type="webinar",
                title=wb["title"],
                description=wb.get("description"),
                tags=str(wb.get("tags", [])),
                speaker=wb.get("speaker"),
                platform=wb.get("platform"),
                duration_minutes=wb.get("duration_minutes"),
                registration_url=wb.get("registration_url"),
                xp_reward=wb.get("xp_reward", 0),
                is_active=True,
            ))

       
        # 5. Commit everything to the database
        db.add_all(event_entries)
        db.commit()
        logger.info(f"Successfully seeded {len(event_entries)} total events into the database.")

    except Exception as e:
        logger.error(f"Unified event seeding error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
