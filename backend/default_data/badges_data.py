"""
Default badge seed data.

Fields:
  key               - unique machine identifier used in code to check/award the badge
  name              - display name
  description       - short human-readable unlock condition
  points_required   - an integer specifying minimum nr of points to get the badge
  emoji             - icon shown next to the badge
"""

BADGES = [
    {
        "key": "gold",
        "name": "Gold Badge",
        "description": "Collect 5000 XP points",
        "points_required": 5000,
        "emoji": "🏆",
    },
    {
        "key": "silver",
        "name": "Silver Badge",
        "description": "Collect 1000 XP points",
        "points_required": 1000,
        "emoji": "🥈",
    },
    {
        "key": "bronze",
        "name": "Bronze Badge",
        "description": "Collect 100 XP points",
        "points_required": 100,
        "emoji": "🥉",
    }
]
