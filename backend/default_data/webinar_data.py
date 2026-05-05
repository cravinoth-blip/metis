"""
Default webinar seed data for the Metis Learning Platform.

Fields mirror the Webinar model:
  id               - unique slug string
  title            - display name
  description      - short summary
  category         - topic area
  tags             - comma-separated tag string
  speaker          - presenter name(s)
  platform         - Zoom | Teams | YouTube Live | etc.
  duration_minutes - expected run time
  registration_url - link to register or join (None = internal booking)
  capacity         - max attendees (None = unlimited)
  xp_reward        - XP awarded on completion
  start_date       - ISO datetime string or None (set per-deployment)
"""

WEBINARS = {

    # ─────────────────────────────────────────────────────────────────────────
    # AI TOOLS & PRODUCTIVITY
    # ─────────────────────────────────────────────────────────────────────────
    "intro-to-claude-for-pharma": {
        "id": "intro-to-claude-for-pharma",
        "title": "Introduction to Claude for Pharmaceutical Professionals",
        "description": (
            "A live walkthrough of Anthropic's Claude in real pharma workflows: "
            "drafting regulatory summaries, simplifying dense clinical text, and "
            "structured data extraction from study reports."
        ),
        "category": "AI Tools",
        "tags": "Claude, AI, Pharma, Regulatory, Beginner",
        "speaker": "AI Enablement Team",
        "platform": "Zoom",
        "duration_minutes": 60,
        "registration_url": None,
        "capacity": None,
        "xp_reward": 150,
        "start_date": None,
    },

    "chatgpt-vs-claude-deep-dive": {
        "id": "chatgpt-vs-claude-deep-dive",
        "title": "ChatGPT vs Claude: Choosing the Right Model for Your Task",
        "description": (
            "A side-by-side comparison of leading LLMs across medical writing, "
            "literature review, and data analysis tasks — with live demos and a "
            "practical decision framework."
        ),
        "category": "AI Tools",
        "tags": "ChatGPT, Claude, LLM, Comparison, Productivity",
        "speaker": "Speaker1",
        "platform": "Teams",
        "duration_minutes": 45,
        "registration_url": None,
        "capacity": 200,
        "xp_reward": 100,
        "start_date": None,
    },

    # ─────────────────────────────────────────────────────────────────────────
    # REGULATORY & COMPLIANCE
    # ─────────────────────────────────────────────────────────────────────────
    "eu-ai-act-update": {
        "id": "eu-ai-act-update",
        "title": "EU AI Act: What Pharma Teams Need to Know in 2025",
        "description": (
            "A focused session on how the EU AI Act's risk classification affects "
            "AI tools used in clinical trials, pharmacovigilance, and regulatory "
            "submissions — including your obligations as a deployer."
        ),
        "category": "AI Governance",
        "tags": "EU AI Act, Compliance, Regulation, Risk, Pharma",
        "speaker": "Legal & Compliance",
        "platform": "Zoom",
        "duration_minutes": 60,
        "registration_url": None,
        "capacity": None,
        "xp_reward": 200,
        "start_date": None,
    },

    # ─────────────────────────────────────────────────────────────────────────
    # MEDICAL WRITING
    # ─────────────────────────────────────────────────────────────────────────
    "ai-adverse-event-narratives": {
        "id": "ai-adverse-event-narratives",
        "title": "Writing Adverse Event Narratives with AI Assistance",
        "description": (
            "Live demonstration of AI-assisted narrative drafting for adverse "
            "event case reports, covering prompt design, quality-control steps, "
            "and regulatory-compliant output review."
        ),
        "category": "Medical Writing",
        "tags": "Adverse Events, Narratives, Medical Writing, QC, Pharmacovigilance",
        "speaker": "Medical Writing Centre of Excellence",
        "platform": "Teams",
        "duration_minutes": 75,
        "registration_url": None,
        "capacity": 100,
        "xp_reward": 250,
        "start_date": None,
    },

    # ─────────────────────────────────────────────────────────────────────────
    # LITERATURE REVIEW
    # ─────────────────────────────────────────────────────────────────────────
    "elicit-live-demo": {
        "id": "elicit-live-demo",
        "title": "Live Demo: Accelerating Literature Search with Elicit",
        "description": (
            "Watch a real systematic literature review workflow using Elicit — "
            "from PICO question setup through abstract screening, data extraction, "
            "and evidence table generation."
        ),
        "category": "Systematic Literature Review",
        "tags": "Elicit, SLR, Literature Review, PICO, HEOR",
        "speaker": "HEOR Team",
        "platform": "Zoom",
        "duration_minutes": 60,
        "registration_url": None,
        "capacity": 150,
        "xp_reward": 200,
        "start_date": None,
    },

    # ─────────────────────────────────────────────────────────────────────────
    # DATA & STATISTICS
    # ─────────────────────────────────────────────────────────────────────────
    "interpreting-ai-outputs": {
        "id": "interpreting-ai-outputs",
        "title": "Interpreting AI Outputs: Confidence, Bias & When to Trust AI",
        "description": (
            "A practical guide to reading AI-generated results critically — "
            "understanding confidence scores, recognising hallucination patterns, "
            "spotting training bias, and knowing when to seek a second opinion."
        ),
        "category": "AI Literacy",
        "tags": "AI Literacy, Bias, Hallucination, Confidence, Data",
        "speaker": "Data Science Team",
        "platform": "YouTube Live",
        "duration_minutes": 50,
        "registration_url": None,
        "capacity": None,
        "xp_reward": 150,
        "start_date": None,
    },
}
