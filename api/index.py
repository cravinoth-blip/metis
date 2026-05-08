import os
import sys
import traceback

# Point at the backend directory — single source of truth
_backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend')
sys.path.insert(0, _backend_dir)

from fastapi import FastAPI

# Define app unconditionally so Vercel always detects a valid ASGI target
app = FastAPI()

_import_error: str | None = None
_import_step = "init"

try:
    _import_step = "main"
    from main import app as _main_app
    app = _main_app
    _import_step = "done"
except Exception as _e:
    _import_error = traceback.format_exc()


@app.get("/api/debug")
def _debug():
    return {"step": _import_step, "error": _import_error}
