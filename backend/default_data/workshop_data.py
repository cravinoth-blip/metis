"""
Default workshop seed data for the Metis Learning Platform.

Fields mirror the Workshop model:
  id               - unique slug string
  title            - display name
  description      - short summary
  category         - topic area
  level            - 1 (beginner) to 5 (expert)
  tags             - comma-separated tag string
  format           - 'in-person' | 'online' | 'hybrid' | 'other'
  duration_minutes - expected run time
  location         - room, building, or video link placeholder
  organizer        - person or team running the session
  capacity         - max attendees (None = unlimited)
  xp_reward        - XP awarded on completion
  start_date       - ISO datetime string or None (set per-deployment)
  end_date         - ISO datetime string or None
"""

WORKSHOPS = {

    # ─────────────────────────────────────────────────────────────────────────
    # PROMPT ENGINEERING
    # ─────────────────────────────────────────────────────────────────────────
    "prompt-engineering-hands-on": {
        "id": "prompt-engineering-hands-on",
        "title": "Prompt Engineering for Clinical Research",
        "description": (
            "A practical, hands-on session covering zero-shot, few-shot, and "
            "chain-of-thought prompting techniques applied to clinical writing, "
            "data summaries, and regulatory documents."
        ),
        "category": "Prompt Engineering",
        "level": 2,
        "tags": "AI, Prompt Engineering, Clinical, Hands-on",
        "format": "hybrid",
        "duration_minutes": 120,
        "location": "Training Room B / Zoom",
        "organizer": "AI Enablement Team",
        "capacity": 24,
        "xp_reward": 300,
        "start_date": None,
        "end_date": None,
    },

    # ─────────────────────────────────────────────────────────────────────────
    # AI GOVERNANCE
    # ─────────────────────────────────────────────────────────────────────────
    "ai-governance-compliance": {
        "id": "ai-governance-compliance",
        "title": "AI Governance & Compliance in Practice",
        "description": (
            "An in-person workshop walking through the EU AI Act, GDPR obligations, "
            "and the company's internal AI Acceptable Use Policy. Includes case studies "
            "of high-risk AI use in clinical trials."
        ),
        "category": "AI Governance",
        "level": 2,
        "tags": "Governance, Compliance, GDPR, EU AI Act, Policy",
        "format": "in-person",
        "duration_minutes": 90,
        "location": "Conference Room A",
        "organizer": "Legal & Compliance",
        "capacity": 30,
        "xp_reward": 250,
        "start_date": None,
        "end_date": None,
    },

    # ─────────────────────────────────────────────────────────────────────────
    # BIORENDER
    # ─────────────────────────────────────────────────────────────────────────
    "biorender-figures-masterclass": {
        "id": "biorender-figures-masterclass",
        "title": "BioRender Advanced Figures Masterclass",
        "description": (
            "Deep-dive into BioRender's advanced features: mechanism-of-action diagrams, "
            "pathway templates, figure composition for publication, and export settings "
            "for journal submission."
        ),
        "category": "Scientific Visualisation",
        "level": 3,
        "tags": "BioRender, Figures, Publication, MOA, Visualisation",
        "format": "online",
        "duration_minutes": 90,
        "location": "Zoom",
        "organizer": "Medical Affairs",
        "capacity": 40,
        "xp_reward": 200,
        "start_date": None,
        "end_date": None,
    },

    # ─────────────────────────────────────────────────────────────────────────
    # SYSTEMATIC LITERATURE REVIEW
    # ─────────────────────────────────────────────────────────────────────────
    "slr-ai-automation": {
        "id": "slr-ai-automation",
        "title": "SLR Automation with AI Tools",
        "description": (
            "Practical workshop on accelerating systematic literature reviews using "
            "Elicit, Consensus, and custom AI pipelines for abstract screening, "
            "data extraction, and evidence synthesis."
        ),
        "category": "Systematic Literature Review",
        "level": 3,
        "tags": "SLR, Elicit, Consensus, Evidence Synthesis, AI",
        "format": "hybrid",
        "duration_minutes": 150,
        "location": "Training Room A / Teams",
        "organizer": "HEOR Team",
        "capacity": 20,
        "xp_reward": 350,
        "start_date": None,
        "end_date": None,
    },

    # ─────────────────────────────────────────────────────────────────────────
    # MEDICAL WRITING
    # ─────────────────────────────────────────────────────────────────────────
    "medical-writing-ai-practical": {
        "id": "medical-writing-ai-practical",
        "title": "Medical Writing with AI: Practical Session",
        "description": (
            "Hands-on workshop for medical writers covering AI-assisted drafting of "
            "CSR sections, plain-language summaries, adverse event narratives, and "
            "quality-control workflows for AI-generated content."
        ),
        "category": "Medical Writing",
        "level": 2,
        "tags": "Medical Writing, CSR, Plain Language, AI, QC",
        "format": "in-person",
        "duration_minutes": 180,
        "location": "Training Suite, Floor 3",
        "organizer": "Medical Writing Centre of Excellence",
        "capacity": 16,
        "xp_reward": 400,
        "start_date": None,
        "end_date": None,
    },

    # ─────────────────────────────────────────────────────────────────────────
    # DATA & AI LITERACY
    # ─────────────────────────────────────────────────────────────────────────
    "data-ai-literacy-intro": {
        "id": "data-ai-literacy-intro",
        "title": "Data & AI Literacy for Non-Technical Teams",
        "description": (
            "An accessible introduction to key concepts: how AI models are trained, "
            "what 'confidence' and 'bias' mean in practice, how to evaluate AI output "
            "quality, and when not to rely on AI-generated results."
        ),
        "category": "AI Literacy",
        "level": 1,
        "tags": "AI Literacy, Data, Beginner, Non-Technical, Bias",
        "format": "online",
        "duration_minutes": 60,
        "location": "Zoom",
        "organizer": "AI Enablement Team",
        "capacity": None,
        "xp_reward": 150,
        "start_date": None,
        "end_date": None,
    },
}
