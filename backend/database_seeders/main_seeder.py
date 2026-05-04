import asyncio
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import specialized seeders
from database_seeders.admin_user_seeder import seed_admin_user
from database_seeders.event_seeder import seed_events
from database_seeders.learnings_seeder import seed_learnings

async def seed_database():
    """Run all seeding functions sequentially."""
    logger.info("Starting database seeding process...")
    
    # 1. Seed Admin User (Synchronous)
    seed_admin_user()
    
    # 2. Seed Events (Asynchronous)
    await seed_events()
    
    # 3. Seed Learnings/Courses (Asynchronous)
    await seed_learnings()
    
    logger.info("Database seeding completed successfully.")

if __name__ == "__main__":
    try:
        asyncio.run(seed_database())
    except KeyboardInterrupt:
        logger.info("Seeding interrupted by user.")
    except Exception as e:
        logger.critical(f"Global seeding failure: {e}")
