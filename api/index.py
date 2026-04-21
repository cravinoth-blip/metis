import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app
from mangum import Mangum


class _StripApiPrefix:
    """Strip the /api routing prefix Vercel adds before FastAPI sees the path."""
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            scope = dict(scope)
            path = scope.get("path", "")
            if path.startswith("/api"):
                scope["path"] = path[4:] or "/"
                scope["raw_path"] = scope["path"].encode()
        await self.inner(scope, receive, send)


handler = Mangum(_StripApiPrefix(app), lifespan="auto")
