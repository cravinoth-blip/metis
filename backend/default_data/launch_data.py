"""
Default Launch & Learn seed data for the Metis Learning Platform.

Fields mirror the Launch model:
  id               - unique slug string
  title            - display name
  description      - short summary
  category         - topic area
  tags             - comma-separated tag string
  speaker          - presenter name(s)
  menu             - food being served
  location         - room or building
  event_date       - display date string (e.g. "Tue 20 May 2025")
  event_time       - display time string (e.g. "12:30 - 13:30")
  duration_minutes - expected run time
  capacity         - max attendees (None = unlimited)
  xp_reward        - XP awarded on attendance
"""

LAUNCHES = {

    # ─────────────────────────────────────────────────────────────────────────
    # AI TOOLS
    # ─────────────────────────────────────────────────────────────────────────
    "lunch-ai-writing-tools": {
        "id": "lunch-ai-writing-tools",
        "title": "AI Writing Tools: What's New in 2025",
        "description": (
            "A relaxed lunchtime session exploring the latest updates to AI writing "
            "tools — Claude 3.5, GPT-4o, and Gemini — with live demos focused on "
            "medical and regulatory writing tasks."
        ),
        "category": "AI Tools",
        "tags": "AI, Writing, LLM, Demo, Lunch",
        "speaker": "AI Enablement Team",
        "menu": "Sandwiches, salads, and soft drinks provided",
        "location": "Canteen — Meeting Room C",
        "event_date": None,
        "event_time": "12:30 - 13:30",
        "duration_minutes": 60,
        "capacity": 30,
        "xp_reward": 100,
    },

    # ─────────────────────────────────────────────────────────────────────────
    # PROMPT ENGINEERING
    # ─────────────────────────────────────────────────────────────────────────
    "lunch-prompt-tips": {
        "id": "lunch-prompt-tips",
        "title": "5 Prompt Engineering Tips That Will Save You Hours",
        "description": (
            "Quick, practical prompt techniques you can use straight away: "
            "role-setting, output formatting, chain-of-thought, and iterative "
            "refinement — all demonstrated on real work examples."
        ),
        "category": "Prompt Engineering",
        "tags": "Prompting, Tips, Practical, Lunch",
        "speaker": "Speaker Name",
        "menu": "Pizza and drinks",
        "location": "Training Room A",
        "event_date": None,
        "event_time": "12:00 - 13:00",
        "duration_minutes": 60,
        "capacity": 25,
        "xp_reward": 100,
    },

    # ─────────────────────────────────────────────────────────────────────────
    # GOVERNANCE
    # ─────────────────────────────────────────────────────────────────────────
    "lunch-ai-policy-q-and-a": {
        "id": "lunch-ai-policy-q-and-a",
        "title": "Ask Me Anything: AI Policy & Acceptable Use",
        "description": (
            "Open Q&A with the Legal & Compliance team on the company's AI "
            "Acceptable Use Policy, GDPR data handling, and what the EU AI Act "
            "means for your day-to-day work."
        ),
        "category": "AI Governance",
        "tags": "Policy, Compliance, GDPR, Q&A, Lunch",
        "speaker": "Legal & Compliance",
        "menu": "Wraps and fruit platters",
        "location": "Conference Room B",
        "event_date": None,
        "event_time": "12:30 - 13:30",
        "duration_minutes": 60,
        "capacity": 40,
        "xp_reward": 75,
    },

    # ─────────────────────────────────────────────────────────────────────────
    # LITERATURE REVIEW
    # ─────────────────────────────────────────────────────────────────────────
    "lunch-slr-shortcuts": {
        "id": "lunch-slr-shortcuts",
        "title": "SLR Shortcuts: How AI Cut Our Review Time in Half",
        "description": (
            "The HEOR team shares their experience using Elicit and Consensus "
            "to accelerate a recent systematic literature review, including what "
            "worked, what didn't, and lessons for your next project."
        ),
        "category": "Systematic Literature Review",
        "tags": "SLR, HEOR, Elicit, Lunch, Case Study",
        "speaker": "HEOR Team",
        "menu": "Bento boxes",
        "location": "Canteen — Meeting Room A",
        "event_date": None,
        "event_time": "12:00 - 13:00",
        "duration_minutes": 60,
        "capacity": 20,
        "xp_reward": 100,
    },

    # ─────────────────────────────────────────────────────────────────────────
    # BIORENDER
    # ─────────────────────────────────────────────────────────────────────────
    "lunch-biorender-tips": {
        "id": "lunch-biorender-tips",
        "title": "BioRender Quick Wins: Figures Ready for Publication",
        "description": (
            "Thirty-minute hands-on crash course covering BioRender's most "
            "time-saving features — smart templates, colour palettes, and export "
            "settings — followed by open Q&A."
        ),
        "category": "Scientific Visualisation",
        "tags": "BioRender, Figures, Publication, Lunch, Hands-on",
        "speaker": "Medical Affairs",
        "menu": "Light bites and coffee",
        "location": "Training Room B",
        "event_date": None,
        "event_time": "12:30 - 13:15",
        "duration_minutes": 45,
        "capacity": 20,
        "xp_reward": 75,
    },
}
