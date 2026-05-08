from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from contextlib import asynccontextmanager
from database import engine, Base, SessionLocal
from routers import auth_router, users, quiz, admin, events, courses, ai_tools
import models
from scraper import scrape_ai_events
from pathlib import Path
import logging
import uvicorn
from database_seeders.main_seeder import seed_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



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

_TEMPLATES_DIR = Path(__file__).parent / "templates"
_STATIC_DIR = Path(__file__).parent / "static"

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
app.include_router(ai_tools.router, prefix="/api/ai-tools")


@app.get("/api/debug")
def debug():
    return {"startup_error": _startup_error, "database_url_set": bool(_os.getenv("DATABASE_URL"))}


@app.get("/health")
def health():
    return {"status": "healthy"}


app.mount("/static", StaticFiles(directory=_STATIC_DIR), name="static")
_templates = Jinja2Templates(directory=str(_TEMPLATES_DIR))


@app.get("/login", response_class=HTMLResponse, include_in_schema=False)
async def login_page(request: Request):
    return _templates.TemplateResponse("login.html", {"request": request})

@app.get("/learning-template", response_class=HTMLResponse, include_in_schema=False)
async def learning_template(request: Request):
    return _templates.TemplateResponse("add_learning_module.html", {"request": request})

@app.get("/admin", response_class=HTMLResponse, include_in_schema=False)
async def admin_page(request: Request):
    return _templates.TemplateResponse("admin_base.html", {"request": request, "active_page": "admin"})

@app.get("/aitools", response_class=HTMLResponse, include_in_schema=False)
async def aitools_page(request: Request):
    return _templates.TemplateResponse("aitools_page.html", {"request": request, "active_page": "aitools"})

@app.get("/dashboard", response_class=HTMLResponse, include_in_schema=False)
async def dashboard_page(request: Request):
    return _templates.TemplateResponse("dashboard_page.html", {"request": request, "active_page": "dashboard"})

@app.get("/skillgames", response_class=HTMLResponse, include_in_schema=False)
async def skillgames_page(request: Request):
    return _templates.TemplateResponse("skillgames_page.html", {"request": request, "active_page": "skillgames"})

@app.get("/learning", response_class=HTMLResponse, include_in_schema=False)
async def learning_page(request: Request):
    return _templates.TemplateResponse("learning_page.html", {"request": request, "active_page": "learning"})

@app.get("/add-module", response_class=HTMLResponse, include_in_schema=False)
async def add_module_page(request: Request, learning_id: str = ""):
    if not learning_id:
        return RedirectResponse("/admin", status_code=302)
    return _templates.TemplateResponse("add_module.html", {
        "request": request, "learning_id": learning_id, "active_page": "admin"
    })

@app.get("/edit-module", response_class=HTMLResponse, include_in_schema=False)
async def edit_module_page(request: Request, module_id: str = ""):
    if not module_id:
        return RedirectResponse("/admin", status_code=302)
    return _templates.TemplateResponse("edit_module.html", {
        "request": request, "module_id": module_id, "active_page": "admin"
    })

@app.get("/whatson", response_class=HTMLResponse, include_in_schema=False)
async def whatson_page(request: Request):
    return _templates.TemplateResponse("whatson_page.html", {
        "request": request, "active_page": "whatson"
    })


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)