import sys
import os

# In Vercel, buildCommand copies backend/ into api/backend/
# Locally, backend/ lives one level up
_backend_vercel = os.path.join(os.path.dirname(__file__), 'backend')
_backend_local = os.path.join(os.path.dirname(__file__), '..', 'backend')

sys.path.insert(0, _backend_vercel if os.path.isdir(_backend_vercel) else _backend_local)

from main import app
