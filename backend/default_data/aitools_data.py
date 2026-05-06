"""
Default AI tools seed data, sourced from the aitools.js page.

Fields mirror the AITool model:
  name          - display name
  description   - short summary
  emoji_logo    - single emoji icon
  tags          - comma-separated tag string
  url           - tool homepage / access URL
  provider      - company / vendor
  is_enterprise - True for company-licensed tools, False for public/free tools
"""

AI_TOOLS = [
    # ─────────────────────────────────────────────────────────────────────────
    # FREE TOOLS
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "ChatGPT",
        "description": "General-purpose AI assistant by OpenAI.",
        "emoji_logo": "💬",
        "tags": "Writing, Analysis, Code",
        "url": "https://chat.openai.com",
        "provider": "OpenAI",
        "is_enterprise": False,
    },
    {
        "name": "Claude",
        "description": "Long-context AI assistant by Anthropic.",
        "emoji_logo": "🟣",
        "tags": "Writing, Analysis, Research",
        "url": "https://claude.ai",
        "provider": "Anthropic",
        "is_enterprise": False,
    },
    {
        "name": "Perplexity",
        "description": "AI-powered research and search engine.",
        "emoji_logo": "🔍",
        "tags": "Research, Search",
        "url": "https://perplexity.ai",
        "provider": "Perplexity AI",
        "is_enterprise": False,
    },
    {
        "name": "Mistral",
        "description": "Open-weight European AI models.",
        "emoji_logo": "🌊",
        "tags": "Writing, Code, Research",
        "url": "https://mistral.ai",
        "provider": "Mistral AI",
        "is_enterprise": False,
    },
    {
        "name": "Meta AI",
        "description": "Llama-powered assistant by Meta.",
        "emoji_logo": "🦙",
        "tags": "Writing, Analysis",
        "url": "https://meta.ai",
        "provider": "Meta",
        "is_enterprise": False,
    },
    {
        "name": "DALL·E",
        "description": "AI image generation by OpenAI.",
        "emoji_logo": "🎨",
        "tags": "Image Generation, Design, Creative",
        "url": "https://labs.openai.com",
        "provider": "OpenAI",
        "is_enterprise": False,
    },
    {
        "name": "Midjourney",
        "description": "High-quality AI art generation.",
        "emoji_logo": "🖼️",
        "tags": "Image Generation, Design, Creative",
        "url": "https://midjourney.com",
        "provider": "Midjourney",
        "is_enterprise": False,
    },
    {
        "name": "ElevenLabs",
        "description": "Realistic AI voice synthesis.",
        "emoji_logo": "🔊",
        "tags": "Audio, Voice, Creative",
        "url": "https://elevenlabs.io",
        "provider": "ElevenLabs",
        "is_enterprise": False,
    },
    {
        "name": "Gemini",
        "description": "Google's multimodal AI assistant.",
        "emoji_logo": "🧪",
        "tags": "Writing, Analysis, Research",
        "url": "https://gemini.google.com",
        "provider": "Google",
        "is_enterprise": False,
    },
    {
        "name": "GitHub Copilot",
        "description": "AI pair-programmer for code completion.",
        "emoji_logo": "💻",
        "tags": "Code, Dev",
        "url": "https://github.com/features/copilot",
        "provider": "GitHub",
        "is_enterprise": False,
    },

    # ─────────────────────────────────────────────────────────────────────────
    # ENTERPRISE TOOLS
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "ChatGPT Enterprise",
        "description": "Secure GPT-4 with company data controls and audit logs.",
        "emoji_logo": "💬",
        "tags": "Writing, Analysis, Code",
        "url": "https://openai.com/enterprise",
        "provider": "OpenAI",
        "is_enterprise": True,
    },
    {
        "name": "Microsoft Copilot",
        "description": "AI integrated across Microsoft 365 apps.",
        "emoji_logo": "🔵",
        "tags": "Productivity, Office",
        "url": "https://copilot.microsoft.com",
        "provider": "Microsoft",
        "is_enterprise": True,
    },
    {
        "name": "Grammarly Business",
        "description": "AI writing assistant with brand-tone enforcement.",
        "emoji_logo": "✍️",
        "tags": "Writing",
        "url": "https://grammarly.com/business",
        "provider": "Grammarly",
        "is_enterprise": True,
    },
    {
        "name": "Bing Enterprise",
        "description": "Private web search powered by GPT-4.",
        "emoji_logo": "🔍",
        "tags": "Research, Search",
        "url": "https://bing.com",
        "provider": "Microsoft",
        "is_enterprise": True,
    },
    {
        "name": "Adobe Firefly",
        "description": "Generative AI for creative assets inside Creative Cloud.",
        "emoji_logo": "🎨",
        "tags": "Design, Creative",
        "url": "https://firefly.adobe.com",
        "provider": "Adobe",
        "is_enterprise": True,
    },
    {
        "name": "Tableau AI",
        "description": "Natural-language queries over your data warehouse.",
        "emoji_logo": "📊",
        "tags": "Analytics, Data",
        "url": "https://tableau.com",
        "provider": "Salesforce",
        "is_enterprise": True,
    },
    {
        "name": "Salesforce Einstein",
        "description": "CRM AI for predictions and automation.",
        "emoji_logo": "🤝",
        "tags": "Sales, CRM",
        "url": "https://salesforce.com/products/einstein",
        "provider": "Salesforce",
        "is_enterprise": True,
    },
    {
        "name": "GitHub Copilot Enterprise",
        "description": "Code completion and chat trained on your repos.",
        "emoji_logo": "💻",
        "tags": "Code, Dev",
        "url": "https://github.com/features/copilot",
        "provider": "GitHub",
        "is_enterprise": True,
    },
    {
        "name": "Nightfall DLP",
        "description": "Data-loss prevention for AI outputs.",
        "emoji_logo": "🔒",
        "tags": "Security",
        "url": "https://nightfall.ai",
        "provider": "Nightfall",
        "is_enterprise": True,
    },
    {
        "name": "Notion AI",
        "description": "AI writing and summarisation inside Notion workspaces.",
        "emoji_logo": "📋",
        "tags": "Productivity, Writing",
        "url": "https://notion.so/product/ai",
        "provider": "Notion",
        "is_enterprise": True,
    },
    {
        "name": "Glean",
        "description": "Enterprise search across all connected SaaS tools.",
        "emoji_logo": "🧠",
        "tags": "Search, Productivity",
        "url": "https://glean.com",
        "provider": "Glean",
        "is_enterprise": True,
    },
    {
        "name": "Superhuman AI",
        "description": "AI-powered email triage and drafting.",
        "emoji_logo": "📧",
        "tags": "Email, Productivity",
        "url": "https://superhuman.com",
        "provider": "Superhuman",
        "is_enterprise": True,
    },
]
