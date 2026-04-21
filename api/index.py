import traceback
from fastapi import FastAPI

try:
    from main import app
except Exception as _e:
    app = FastAPI()
    _err = traceback.format_exc()

    @app.get("/api/{path:path}")
    @app.post("/api/{path:path}")
    def _import_error(path: str):
        return {"import_error": str(_e), "traceback": _err}
