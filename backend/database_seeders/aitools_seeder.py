import logging
from database import SessionLocal
from models import AITool
from default_data.aitools_data import AI_TOOLS

logger = logging.getLogger(__name__)


def seed_ai_tools():
    db = SessionLocal()
    try:
        if db.query(AITool).count() > 0:
            logger.info("AI tools table already contains data — skipping seeding.")
            return

        logger.info("Seeding AI tools...")
        db.add_all([AITool(**tool) for tool in AI_TOOLS])
        db.commit()
        logger.info(f"Successfully seeded {len(AI_TOOLS)} AI tools.")

    except Exception as e:
        logger.error(f"AI tools seeding error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
