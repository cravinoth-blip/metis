# Metis – Your Learning Companion

A gamified AI learning platform for employees. Built with FastAPI + React.

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

The backend will:
- Create the SQLite database (`metis.db`) automatically on first run
- Seed the default admin account
- Seed 8 starter events
- Start a scheduler to refresh events every 6 hours

**Default admin account:**
- Email: `admin@metis.ai`
- Password: `MetisAdmin2024!`

API docs available at: http://localhost:8000/docs

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## Environment Variables (backend/.env)

Copy `.env.example` to `.env` and update:

```
SECRET_KEY=your-long-random-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
DATABASE_URL=sqlite:///./metis.db
```

---

## Features

- **Authentication**: JWT-based login/register with bcrypt password hashing
- **Gamification**: XP system, levels (every 500 XP), daily streaks, badges
- **Quizzes**: 5 quiz categories (60+ questions) with 6 question types:
  - Multiple choice
  - Spot the hallucination
  - Best prompt challenges
  - Which tool? scenarios
  - Ethics check
  - Real-world scenarios
- **Daily Challenges**: Speed Round, Scenario Spotlight, Prompt Duel
- **Leaderboard**: Top 20 users ranked by XP with podium animation
- **Badges**: 8 achievement badges with progress tracking
- **Events**: What's On page with Lunch & Learn, Workshops, Webinars, News
- **Enterprise Tools**: Catalogue of approved enterprise AI tools
- **AI Tools**: Directory of AI tools with usage logging (+10 XP per tool)
- **Admin Panel**: User management, event CRUD, analytics, event scraping
- **Learning**: 6 structured course paths with module-level progress

## Architecture

```
METIS/
├── backend/          FastAPI + SQLAlchemy + SQLite
│   ├── main.py       App entry point + seeding + scheduler
│   ├── models.py     SQLAlchemy ORM models
│   ├── schemas.py    Pydantic request/response schemas
│   ├── auth.py       JWT auth + password hashing
│   ├── quiz_data.py  All quiz content (60+ questions)
│   ├── scraper.py    Event scraping (with fallback data)
│   └── routers/      auth, users, quiz, admin, events
└── frontend/         React + Vite + TypeScript
    └── src/
        ├── pages/    Dashboard, SkillGames, Learning, WhatsOn,
        │             EnterpriseTools, AITools, Admin, Login, Register
        └── components/ Sidebar, Topbar, QuizModal, StatCard, etc.
```
