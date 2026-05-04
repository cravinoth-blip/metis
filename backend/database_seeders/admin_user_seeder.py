import logging
from database import SessionLocal
from models import User
from auth import hash_password

logger = logging.getLogger(__name__)

def seed_admin_user():
    """Create default admin user if it doesn't exist."""
    db = SessionLocal()
    try:
        existing_admin = db.query(User).filter(User.email == "admin@metis.ai").first()
        if not existing_admin:
            admin_user = User(
                email="admin@metis.ai",
                username="admin",
                hashed_password=hash_password("MetisAdmin2024!"),
                full_name="Metis Administrator",
                department="Platform",
                avatar_initials="MA",
                is_admin=True,
                xp=9999,
                level=20
            )
            db.add(admin_user)
            db.commit()
            logger.info("Created default admin user: admin@metis.ai")
        else:
            logger.info("Admin user already exists.")
    except Exception as e:
        logger.error(f"Admin seeding error: {e}")
        db.rollback()
    finally:
        db.close()
