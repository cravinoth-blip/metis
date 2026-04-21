from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base, SessionLocal
from routers import auth_router, users, quiz, admin, events, courses
import models
from scraper import scrape_ai_events
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed_database():
    """Create default admin user and seed events if DB is empty."""
    db = SessionLocal()
    try:
        from models import User, Event
        from auth import hash_password

        # Create admin if not exists
        existing_admin = db.query(User).filter(User.email == "admin@metis.ai").first()
        if not existing_admin:
            admin_user = User(
                email="admin@metis.ai",
                username="admin",
                hashed_password=hash_password("MetisAdmin2024!"),
                full_name="Metis Administrator",
                department="Platform",
                avatar_initials="MA",
                is_admin=True,
                xp=9999,
                level=20
            )
            db.add(admin_user)
            logger.info("Created default admin user: admin@metis.ai")

        # Seed events if none exist
        if db.query(Event).count() == 0:
            logger.info("Seeding initial events...")
            scraped = await scrape_ai_events()
            for evt_data in scraped:
                evt = Event(**evt_data, is_active=True)
                db.add(evt)
            logger.info(f"Seeded {len(scraped)} events")

        db.commit()
    except Exception as e:
        logger.error(f"Seeding error: {e}")
        db.rollback()
    finally:
        db.close()


async def refresh_events():
    """Scheduled job to scrape fresh events. News items are replaced; training events only added if new."""
    logger.info("Running scheduled event refresh...")
    db = SessionLocal()
    try:
        from models import Event
        from scraper import scrape_news_only
        events_data = await scrape_ai_events()

        # Replace all existing news events with fresh ones
        db.query(Event).filter(Event.event_type == "news").delete()

        added = 0
        for evt_data in events_data:
            if evt_data["event_type"] == "news":
                event = Event(**evt_data, is_active=True)
                db.add(event)
                added += 1
            else:
                existing = db.query(Event).filter(Event.title == evt_data["title"]).first()
                if not existing:
                    event = Event(**evt_data, is_active=True)
                    db.add(event)
                    added += 1

        db.commit()
        logger.info(f"Event refresh complete: added/replaced {added} events")
    except Exception as e:
        logger.error(f"Event refresh error: {e}")
        db.rollback()
    finally:
        db.close()


_startup_error: str | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _startup_error
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified")
        await seed_database()
    except Exception as e:
        import traceback
        _startup_error = traceback.format_exc()
        logger.error(f"Startup error (non-fatal): {e}")
    yield


app = FastAPI(
    title="Metis API",
    description="Gamified AI Learning Platform API",
    version="1.0.0",
    lifespan=lifespan
)

import os as _os
_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
if _os.getenv("VERCEL_URL"):
    _ALLOWED_ORIGINS.append(f"https://{_os.getenv('VERCEL_URL')}")
if _os.getenv("FRONTEND_URL"):
    _ALLOWED_ORIGINS.append(_os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router.router, prefix="/api/auth")
app.include_router(users.router, prefix="/api/users")
app.include_router(quiz.router, prefix="/api/quiz")
app.include_router(admin.router, prefix="/api/admin")
app.include_router(events.router, prefix="/api/events")
app.include_router(courses.router, prefix="/api/courses")


@app.get("/api/debug")
def debug():
    return {"startup_error": _startup_error, "database_url_set": bool(os.getenv("DATABASE_URL"))}


@app.get("/")
def root():
    return {
        "message": "Metis Learning Platform API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
