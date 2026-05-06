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
        "description": "Enterprise-grade conversational AI with no training on your data. GDPR-compliant through DPA with OpenAI.",
        "emoji_logo": "🤖",
        "tags": "Document drafting, Text summarisation, Code assistance, Q&A",
        "category" : "AI Writing",
        "url": "https://openai.com/enterprise",
        "provider": "OpenAI",
        "is_enterprise": True,
    },
    {
        "name": "Microsoft Copilot",
        "description": "AI integrated into Word, Excel, PowerPoint, Outlook and Teams. Accesses your M365 content securely.",
        "emoji_logo": "🔵",
        "tags": "Email drafting, Document summarisation, Meeting notes, Data analysis in Excel",
        "url": "https://copilot.microsoft.com",
        "provider": "Microsoft",
        "is_enterprise": True,
        "category" : "Productivity"
    },
    {
        "name": "QC RAG",
        "description": "AI-powered writing assistant for grammar, style, tone, and clarity. Integrates with Word, Outlook, Chrome.",
        "emoji_logo": "✏️",
        "tags": "Grammar checking, Tone adjustment, Clarity improvements, Style guide compliance, GDPR, SOC 2 Type II, Privacy policy reviewed",
        "url": "https://grammarly.com/business",
        "provider": "Grammarly",
        "is_enterprise": True,
    },
    {
        "name": "Green Light",
        "description": "Claim substantiation platform for medical and promotional content. Links every written claim directly to supporting evidence, flags unsubstantiated statements, and generates a substantiation dossier for regulatory review.",
        "emoji_logo": "🟢",
        "tags": "Claim substantiation, Evidence linking, Promotional review, MLR submission prep, GDPR, Internal audit trail, 21 CFR Part 11 eligible",
        "url": "https://bing.com",
        "provider": "Syneos Health",
        "is_enterprise": True,
    },
    {
        "name": "ERIS",
        "description": "Evidence and Reference Information System. Centralised repository for managing references, annotations, and source documents across medical writing projects. Ensures citation accuracy and consistency in regulatory submissions.",
        "emoji_logo": "📄",
        "tags": "Reference management, Citation verification, Source document linking, Cross-document consistency, GDPR, GCP-compliant audit log, Role-based access control",
        "url": "",
        "provider": "Syneos Health",
        "is_enterprise": True,
    },
    {
        "name": "Elicit",
        "description": "AI research assistant for systematic literature reviews. Extracts PICO data, summarises papers, supports SLR workflows.",
        "emoji_logo": "🔬",
        "tags": "Abstract screening, Data extraction, Evidence synthesis, PICO analysis, GDPR, No PII input policy, Terms reviewed",
        "url": "",
        "provider": "Ought",
        "is_enterprise": True,
    },
    {
        "name": "Consensus",
        "description": "Search peer-reviewed scientific literature and get an evidence consensus meter showing what the science says.",
        "emoji_logo": "📊",
        "tags": "Evidence queries, Literature search, Claim verification, HTA research, GDPR, No personal data required",
        "url": "",
        "provider": "Consensus NLP",
        "is_enterprise": True,
    },
    {
        "name": "NotebookLM (Google)",
        "description": "Upload documents and create an AI assistant that answers only from your sources, with citations.",
        "emoji_logo": "📖",
        "tags": "CSR analysis, Policy Q&A, Literature analysis, Protocol review, GDPR pending review, Do not upload PII",
        "url": "",
        "provider": "Google",
        "is_enterprise": True,
    },
    {
        "name": "DeepL Pro",
        "description": "AI translation for 29+ languages with superior quality for scientific and technical texts. No training on business data.",
        "emoji_logo": "🌍",
        "tags": "Document translation, Patient materials, Regulatory submissions, Labels and IFU, GDPR, Data deletion guarantee, ISO 27001",
        "url": "",
        "provider": "DeepL",
        "is_enterprise": True,
    },
    {
        "name": "BioRender",
        "description": "Create publication-ready scientific figures. Includes thousands of pre-licensed biological illustration assets.",
        "emoji_logo": "🎨",
        "tags": "MOA diagrams, Cell biology figures, Study design visuals, Patient pathway diagrams, Publication licence included, Icon library licensed",
        "url": "",
        "provider": "BioRender",
        "is_enterprise": True,
    },
    {
        "name": "Otter.ai Business",
        "description": "AI transcription and meeting notes. Auto-identifies speakers, generates action items, integrates with Zoom and Teams.",
        "emoji_logo": "🎙️",
        "tags": "Meeting transcription, Action item extraction, Advisory board notes, KOL interview notes, GDPR, SSO supported, Terms reviewed",
        "url": "",
        "provider": "Otter.ai",
        "is_enterprise": True,
    },
    {
        "name": "Perplexity Pro",
        "description": "Real-time web search with cited sources. Ideal for current events, guideline updates, competitive intelligence.",
        "emoji_logo": "🔍",
        "tags": "Current guidelines, Competitive landscape, News monitoring, Quick fact-checking with sources",
        "url": "",
        "provider": "Perplexity AI",
        "is_enterprise": True,
    }
]
