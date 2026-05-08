# Metis – Your Learning Companion

A gamified AI learning platform for employees. Built with FastAPI and Jinja2 templates — no separate frontend build step required.

## Running the project

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
cp .env.example .env
python main.py
```

Open http://localhost:8000

On first run the app will automatically:
- Create the SQLite database (`metis.db`)
- Seed the default admin account
- Seed starter quiz data, learnings, and events
- Start a background scheduler to refresh events every 6 hours

**Default admin account:**
- Email: `admin@metis.ai`
- Password: `MetisAdmin2024!`

API docs: http://localhost:8000/docs

---

## Docker

```bash
docker compose up --build
```

Open http://localhost:80

---

## Environment Variables (`backend/.env`)

Copy `.env.example` to `.env` and update:

```
SECRET_KEY=your-long-random-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
DATABASE_URL=sqlite:///./metis.db
```

---

## Features

- **Authentication** — JWT login with bcrypt password hashing
- **Gamification** — XP, levels (every 500 XP), day streaks
- **Quizzes** — Multiple categories with scoring and XP rewards
- **Learning** — Structured learning resources with module-level progress and XP on completion
- **AI Updates** — What's On page with workshops, webinars, and news (auto-scraped)
- **AI Tools** — Catalogue of enterprise and free AI tools
- **Admin Panel** — Full CRUD for users, learnings, modules, events, and AI tools
- **Dashboard** — Personal XP, level, streak, and activity summary

---

## Architecture

```
metis_project_repo/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── README.md
└── backend/
    ├── main.py                  App entry point, page routes, lifespan
    ├── models.py                SQLAlchemy ORM models
    ├── schemas.py               Pydantic request/response schemas
    ├── auth.py                  JWT auth, password hashing, level calc
    ├── database.py              Engine, session, Base
    ├── scraper.py               Event scraper with fallback data
    ├── requirements.txt
    ├── routers/
    │   ├── auth_router.py       Login, register, /me
    │   ├── users.py             User stats, dashboard UI
    │   ├── quiz.py              Quiz list, submit, skill games UI
    │   ├── learnings.py         Learning list, module completion, HTMX UI
    │   ├── events.py            Events list, registration, HTMX UI
    │   ├── ai_tools.py          AI tools list, usage logging, HTMX UI
    │   └── admin.py             Admin CRUD for all entities
    ├── templates/               Jinja2 HTML templates
    │   ├── sidebar.html         Shared sidebar include
    │   ├── topbar.html          Shared topbar include
    │   ├── dashboard_page.html
    │   ├── skillgames_page.html
    │   ├── learning_page.html
    │   ├── whatson_page.html
    │   ├── aitools_page.html
    │   ├── admin_base.html
    │   └── ...                  Partial templates (lists, modals, forms)
    ├── static/
    │   └── css/styles.css
    ├── default_data/            Seed data (quizzes, learnings)
    └── database_seeders/        Seeder scripts run at startup
```

### Key design decisions

- **Single-process, no build step** — FastAPI serves both the API (`/api/*`) and the full HTML UI. Pages are Jinja2 templates; interactive fragments use HTMX for partial updates.
- **HTMX over SPA** — Instead of a separate React/Vite frontend, all UI interactions (modals, tab switching, form submissions, live search) are handled by HTMX swapping HTML fragments returned by the backend.
- **SQLite by default** — Zero-config local development. Switch to PostgreSQL by setting `DATABASE_URL` in `.env`.
