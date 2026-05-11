"""
Default badge seed data.

Fields:
  key         - unique machine identifier used in code to check/award the badge
  name        - display name
  description - short human-readable unlock condition
  emoji       - icon shown next to the badge
"""

BADGES = [
    {
        "key": "early_adopter",
        "name": "Early Adopter",
        "description": "Register as one of the first users on the platform.",
        "emoji": "🚀",
    },
    {
        "key": "ai_thinker",
        "name": "AI Thinker",
        "description": "Complete at least one quiz.",
        "emoji": "🧠",
    },
    {
        "key": "streak_master",
        "name": "Streak Master",
        "description": "Maintain a login streak of 7+ days.",
        "emoji": "🔥",
    },
    {
        "key": "course_crusher",
        "name": "Course Crusher",
        "description": "Complete at least one full learning path.",
        "emoji": "🎓",
    },
    {
        "key": "quiz_ace",
        "name": "Quiz Ace",
        "description": "Achieve a perfect score on any quiz.",
        "emoji": "⭐",
    },
    {
        "key": "top_5",
        "name": "Top 5",
        "description": "Reach the top 5 on the leaderboard.",
        "emoji": "🏆",
    },
    {
        "key": "ai_champion",
        "name": "AI Champion",
        "description": "Accumulate 1,000+ XP.",
        "emoji": "🤖",
    },
]
