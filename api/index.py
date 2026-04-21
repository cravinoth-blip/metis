import os
import sys
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI

# Define app unconditionally so Vercel always detects a valid ASGI target
app = FastAPI()

_import_error: str | None = None
_import_step = "init"

try:
    _import_step = "database"
    import database
    _import_step = "models"
    import models
    _import_step = "auth"
    import auth
    _import_step = "routers"
    from routers import auth_router, users, quiz, admin, events, courses
    _import_step = "main"
    from main import app as _main_app
    app = _main_app
    _import_step = "done"
except Exception as _e:
    _import_error = traceback.format_exc()


@app.get("/api/debug")
def _debug():
    return {"step": _import_step, "error": _import_error}
