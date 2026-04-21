import sys
import os
import traceback

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

try:
    from main import app
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except Exception as _e:
    from fastapi import FastAPI
    from mangum import Mangum as _Mangum
    _err = traceback.format_exc()
    _debug = FastAPI()

    @_debug.get("/api/debug")
    def _debug_error():
        return {"import_error": str(_e), "traceback": _err}

    handler = _Mangum(_debug)
