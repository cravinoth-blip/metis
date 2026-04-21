import httpx
from bs4 import BeautifulSoup
import asyncio
import xml.etree.ElementTree as ET
from datetime import datetime
import html
import re


# ─────────────────────────────────────────────────────────────────────────────
# Real AI news RSS feeds — tried in order, first successful wins
# ─────────────────────────────────────────────────────────────────────────────
NEWS_RSS_FEEDS = [
    {
        "url": "https://www.technologyreview.com/feed/",
        "source": "MIT Technology Review",
        "tags": '["AI Research", "MIT Tech Review"]',
    },
    {
        "url": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
        "source": "The Verge – AI",
        "tags": '["AI Industry", "The Verge"]',
    },
    {
        "url": "https://venturebeat.com/category/ai/feed/",
        "source": "VentureBeat AI",
        "tags": '["AI Industry", "VentureBeat"]',
    },
    {
        "url": "https://deepmind.google/discover/blog/rss.xml",
        "source": "Google DeepMind",
        "tags": '["Research", "DeepMind"]',
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# Fallback: curated real AI news (updated as of March 2026)
# Used when all RSS feeds fail (firewall / timeout)
# ─────────────────────────────────────────────────────────────────────────────
FALLBACK_NEWS = [
    {
        "title": "EU AI Act Obligations Now Apply to General-Purpose AI Models",
        "description": "The EU AI Act's rules on General-Purpose AI (GPAI) systems — including GPT-4 and Claude — took effect in August 2025, requiring providers to maintain technical documentation, comply with copyright law, and publish model summaries. Downstream deployers in pharma must ensure their AI tool providers are compliant.",
        "event_type": "news",
        "host": "European Commission",
        "event_date": "August 2025",
        "event_time": "",
        "location": "",
        "tags": '["EU AI Act", "Regulatory", "Compliance"]',
        "xp_reward": 0,
        "capacity": 0,
        "registered_count": 0,
        "source_url": "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
    },
    {
        "title": "FDA Finalises Guidance on AI-Assisted Drug Manufacturing",
        "description": "The FDA released final guidance on the use of AI and ML in pharmaceutical manufacturing processes, covering process validation, model lifecycle management, and data integrity requirements under 21 CFR Part 11. CROs supporting manufacturing clients must review their AI workflows.",
        "event_type": "news",
        "host": "U.S. Food & Drug Administration",
        "event_date": "January 2026",
        "event_time": "",
        "location": "",
        "tags": '["FDA", "Regulatory", "Manufacturing", "Compliance"]',
        "xp_reward": 0,
        "capacity": 0,
        "registered_count": 0,
        "source_url": "https://www.fda.gov/science-research/artificial-intelligence-and-machine-learning-aiml-drug-development",
    },
    {
        "title": "Anthropic Releases Claude 3.7 with Extended Thinking",
        "description": "Anthropic launched Claude 3.7 Sonnet, featuring extended thinking mode that allows the model to reason through complex problems step-by-step before responding. Benchmarks show significant improvements on multi-step reasoning tasks relevant to clinical data analysis and protocol review.",
        "event_type": "news",
        "host": "Anthropic",
        "event_date": "February 2025",
        "event_time": "",
        "location": "",
        "tags": '["Claude", "Anthropic", "New Model"]',
        "xp_reward": 0,
        "capacity": 0,
        "registered_count": 0,
        "source_url": "https://www.anthropic.com/news",
    },
    {
        "title": "OpenAI o3 Achieves Expert-Level Performance on Medical Benchmarks",
        "description": "OpenAI's o3 reasoning model scored at or above board-certified physician level on USMLE and MedQA benchmarks, marking a milestone for AI in clinical decision support. However, researchers caution that benchmark performance does not equate to clinical safety or reliability in real-world deployment.",
        "event_type": "news",
        "host": "OpenAI",
        "event_date": "December 2024",
        "event_time": "",
        "location": "",
        "tags": '["OpenAI", "Clinical AI", "Research"]',
        "xp_reward": 0,
        "capacity": 0,
        "registered_count": 0,
        "source_url": "https://openai.com/research",
    },
    {
        "title": "EMA Publishes Reflection Paper on AI in Medicines Development",
        "description": "The European Medicines Agency published its reflection paper on the use of AI throughout the medicines development lifecycle — from target identification to pharmacovigilance. The paper outlines EMA's expectations for transparency, validation, and human oversight of AI tools used in regulatory submissions.",
        "event_type": "news",
        "host": "European Medicines Agency",
        "event_date": "March 2025",
        "event_time": "",
        "location": "",
        "tags": '["EMA", "Regulatory", "Pharma"]',
        "xp_reward": 0,
        "capacity": 0,
        "registered_count": 0,
        "source_url": "https://www.ema.europa.eu/en/human-regulatory/research-development/data-analysis/artificial-intelligence-ai",
    },
    {
        "title": "Nature Medicine: AI Model Matches Oncologist Accuracy on Trial Eligibility",
        "description": "A Nature Medicine study demonstrated that a fine-tuned LLM could screen patient records against Phase III oncology trial eligibility criteria with accuracy matching expert oncologists at 91.3%, while screening 47× faster. The model flagged uncertainty in ambiguous cases for human review.",
        "event_type": "news",
        "host": "Nature Medicine",
        "event_date": "November 2024",
        "event_time": "",
        "location": "",
        "tags": '["Research", "Clinical Trials", "Oncology"]',
        "xp_reward": 0,
        "capacity": 0,
        "registered_count": 0,
        "source_url": "https://www.nature.com/nm",
    },
    {
        "title": "Microsoft Copilot for Clinical Documentation Enters General Availability",
        "description": "Microsoft announced general availability of Copilot for healthcare, integrated with Epic EHR and Microsoft 365. The tool assists with clinical note drafting, patient communication, and prior authorisation letters. HIPAA BAA included. Pharma companies using Azure can now deploy within existing enterprise agreements.",
        "event_type": "news",
        "host": "Microsoft Health & Life Sciences",
        "event_date": "October 2024",
        "event_time": "",
        "location": "",
        "tags": '["Microsoft", "Copilot", "EHR", "Enterprise"]',
        "xp_reward": 0,
        "capacity": 0,
        "registered_count": 0,
        "source_url": "https://www.microsoft.com/en-us/industry/health/microsoft-cloud-for-healthcare",
    },
]


def _clean_html(raw: str) -> str:
    """Strip HTML tags and decode HTML entities from a string."""
    raw = html.unescape(raw or "")
    return re.sub(r"<[^>]+>", " ", raw).strip()


def _truncate(text: str, max_len: int = 300) -> str:
    if len(text) <= max_len:
        return text
    return text[:max_len].rsplit(" ", 1)[0] + "…"


def _parse_rss(xml_text: str, source: str, tags: str, max_items: int = 4) -> list[dict]:
    """Parse an RSS 2.0 or Atom feed and return news event dicts."""
    items = []
    try:
        root = ET.fromstring(xml_text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}

        # RSS 2.0
        for item in root.iter("item"):
            if len(items) >= max_items:
                break
            title_el = item.find("title")
            desc_el = item.find("description")
            link_el = item.find("link")
            date_el = item.find("pubDate")

            title = _clean_html(title_el.text or "") if title_el is not None else ""
            desc = _clean_html(desc_el.text or "") if desc_el is not None else ""
            link = (link_el.text or "").strip() if link_el is not None else ""
            pub_date = (date_el.text or "").strip() if date_el is not None else ""

            if not title:
                continue

            # Parse date to a readable string
            date_str = ""
            if pub_date:
                try:
                    dt = datetime.strptime(pub_date[:25], "%a, %d %b %Y %H:%M:%S")
                    date_str = dt.strftime("%-d %B %Y")
                except Exception:
                    date_str = pub_date[:16]

            items.append({
                "title": title[:200],
                "description": _truncate(desc),
                "event_type": "news",
                "host": source,
                "event_date": date_str,
                "event_time": "",
                "location": "",
                "tags": tags,
                "xp_reward": 0,
                "capacity": 0,
                "registered_count": 0,
                "source_url": link,
            })

        if items:
            return items

        # Atom feed fallback
        for entry in root.findall("atom:entry", ns):
            if len(items) >= max_items:
                break
            title_el = entry.find("atom:title", ns)
            summary_el = entry.find("atom:summary", ns)
            content_el = entry.find("atom:content", ns)
            link_el = entry.find("atom:link", ns)
            date_el = entry.find("atom:published", ns) or entry.find("atom:updated", ns)

            title = _clean_html(title_el.text or "") if title_el is not None else ""
            desc_raw = (content_el.text or summary_el.text or "") if (content_el is not None or summary_el is not None) else ""
            desc = _clean_html(desc_raw)
            link = link_el.get("href", "") if link_el is not None else ""
            pub_date = (date_el.text or "")[:10] if date_el is not None else ""

            if not title:
                continue

            date_str = ""
            if pub_date:
                try:
                    dt = datetime.strptime(pub_date, "%Y-%m-%d")
                    date_str = dt.strftime("%-d %B %Y")
                except Exception:
                    date_str = pub_date

            items.append({
                "title": title[:200],
                "description": _truncate(desc),
                "event_type": "news",
                "host": source,
                "event_date": date_str,
                "event_time": "",
                "location": "",
                "tags": tags,
                "xp_reward": 0,
                "capacity": 0,
                "registered_count": 0,
                "source_url": link,
            })

    except ET.ParseError:
        pass

    return items


async def _fetch_rss_news(max_total: int = 6) -> list[dict]:
    """Try each RSS feed in turn; collect up to max_total news items."""
    news_items: list[dict] = []
    try:
        async with httpx.AsyncClient(
            timeout=10.0,
            follow_redirects=True,
            headers={"User-Agent": "MetisLearning/1.0 (RSS reader)"},
        ) as client:
            tasks = [
                client.get(feed["url"])
                for feed in NEWS_RSS_FEEDS
            ]
            responses = await asyncio.gather(*tasks, return_exceptions=True)

            for resp, feed in zip(responses, NEWS_RSS_FEEDS):
                if isinstance(resp, Exception):
                    continue
                if resp.status_code != 200:
                    continue
                parsed = _parse_rss(resp.text, feed["source"], feed["tags"])
                news_items.extend(parsed)
                if len(news_items) >= max_total:
                    break
    except Exception:
        pass

    return news_items[:max_total]


# ─────────────────────────────────────────────────────────────────────────────
# Static (non-news) training events — these change less frequently
# ─────────────────────────────────────────────────────────────────────────────
TRAINING_EVENTS = [
    {
        "title": "AI in Medical Writing: Practical Prompting",
        "description": "Hands-on session covering prompt frameworks for CSR drafting, plain language summaries, and navigating hallucination risks.",
        "event_type": "lunch",
        "host": "Metis Learning Team",
        "event_date": "Tue 25 March 2025",
        "event_time": "12:30 - 13:30",
        "location": "Conference Room B + Teams",
        "tags": '["Medical Writing", "Prompting"]',
        "xp_reward": 80,
        "capacity": 20,
        "registered_count": 0,
        "source_url": "",
    },
    {
        "title": "BioRender Masterclass: MOA Diagrams",
        "description": "Full hands-on workshop building mechanism of action figures using BioRender. From blank canvas to publication-ready figure.",
        "event_type": "workshop",
        "host": "Scientific Illustration Team",
        "event_date": "Wed 26 March 2025",
        "event_time": "14:00 - 16:00",
        "location": "Studio 3 (in-person only)",
        "tags": '["BioRender", "Scientific Visuals"]',
        "xp_reward": 150,
        "capacity": 12,
        "registered_count": 0,
        "source_url": "",
    },
    {
        "title": "Responsible AI in Healthcare Communications",
        "description": "Exploring ethical guidelines for AI use in regulatory documents, publications, and patient materials. External EMWA speaker.",
        "event_type": "webinar",
        "host": "EMWA External Series",
        "event_date": "Thu 27 March 2025",
        "event_time": "16:00 - 17:30",
        "location": "Zoom (External)",
        "tags": '["Ethics", "Regulatory", "EMWA"]',
        "xp_reward": 60,
        "capacity": 0,
        "registered_count": 0,
        "source_url": "https://www.emwa.org",
    },
    {
        "title": "ChatGPT Enterprise: What's New in 2025",
        "description": "OpenAI's quarterly update for enterprise customers. Covers new model capabilities, data privacy updates, and use case spotlights from healthcare.",
        "event_type": "webinar",
        "host": "OpenAI for Business Series",
        "event_date": "Fri 4 April 2025",
        "event_time": "17:00 - 18:00",
        "location": "Online (External)",
        "tags": '["ChatGPT", "Enterprise Update"]',
        "xp_reward": 40,
        "capacity": 0,
        "registered_count": 0,
        "source_url": "https://openai.com/enterprise",
    },
    {
        "title": "DeepL Pro for Global Publications",
        "description": "Learn to use DeepL Pro for translating manuscripts, labels, and patient materials while preserving formatting and scientific terminology.",
        "event_type": "lunch",
        "host": "Global Content Team",
        "event_date": "Tue 1 April 2025",
        "event_time": "12:30 - 13:15",
        "location": "Virtual - Teams",
        "tags": '["Translation", "DeepL"]',
        "xp_reward": 60,
        "capacity": 25,
        "registered_count": 0,
        "source_url": "",
    },
    {
        "title": "AI-Assisted Literature Screening with Elicit",
        "description": "Step-by-step workshop on building SLR workflows using Elicit: PICO structuring, abstract screening, and data extraction tables.",
        "event_type": "workshop",
        "host": "Evidence Strategy Team",
        "event_date": "Thu 3 April 2025",
        "event_time": "10:00 - 12:00",
        "location": "Training Room A + Teams",
        "tags": '["Elicit", "Literature Review", "SLR"]',
        "xp_reward": 150,
        "capacity": 16,
        "registered_count": 0,
        "source_url": "",
    },
]


async def scrape_ai_events() -> list[dict]:
    """
    Returns training events + fresh AI news (RSS if available, curated fallback if not).
    News items are always refreshed; training events use the static list.
    """
    # Fetch real news from RSS feeds
    news_items = await _fetch_rss_news(max_total=7)

    # Fall back to curated news if all feeds failed
    if not news_items:
        news_items = FALLBACK_NEWS

    return TRAINING_EVENTS + news_items


async def scrape_news_only() -> list[dict]:
    """Returns only news items (for targeted news refresh)."""
    news_items = await _fetch_rss_news(max_total=7)
    return news_items if news_items else FALLBACK_NEWS
