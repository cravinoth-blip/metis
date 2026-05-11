import os
import sys
import traceback

# Add backend directory to path — single source of truth
_backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend')
sys.path.insert(0, _backend_dir)

from fastapi import FastAPI

# Fallback app — Vercel always needs a valid ASGI target at import time
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
    # Only register the debug route on the fallback app.
    # When the main app loads successfully it already exposes /api/debug itself.
    @app.get("/api/debug")
    def _debug():
        return {"step": _import_step, "error": _import_error}
