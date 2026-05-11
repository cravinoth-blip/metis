import json
import logging
from sqlalchemy import text
from database import SessionLocal
from models import Quiz, Question
from default_data.quiz_data import QUIZZES

logger = logging.getLogger(__name__)


def _ensure_correct_indices_column(db):
    """Add correct_indices column to questions table if it doesn't exist yet."""
    try:
        db.execute(text("ALTER TABLE questions ADD COLUMN correct_indices TEXT"))
        db.commit()
        logger.info("Added correct_indices column to questions table.")
    except Exception:
        db.rollback()  # Column already exists — that's fine


def seed_quizzes():
    db = SessionLocal()
    try:
        _ensure_correct_indices_column(db)

        for quiz_id, data in QUIZZES.items():
            # Upsert quiz
            quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
            if not quiz:
                db.add(Quiz(
                    id=quiz_id,
                    title=data["title"],
                    description=data.get("description"),
                    category=data.get("category"),
                    difficulty=data.get("difficulty", "Beginner"),
                    xp_reward=data.get("xp_reward", 100),
                    time_estimate=data.get("time_estimate"),
                    min_level=data.get("min_level", 1),
                    is_active=True,
                ))

            for i, q in enumerate(data.get("questions", [])):
                ci = q["correct_index"]
                existing = db.query(Question).filter(Question.id == q["id"]).first()
                if existing:
                    # Repair legacy rows that may have wrong type or missing correct_indices
                    existing.type = "single_choice"
                    existing.correct_indices = json.dumps([ci])
                else:
                    db.add(Question(
                        id=q["id"],
                        quiz_id=quiz_id,
                        question=q["question"],
                        options=json.dumps(q["options"]),
                        correct_index=ci,
                        correct_indices=json.dumps([ci]),
                        explanation=q.get("explanation", ""),
                        type="single_choice",
                        order=i,
                        is_active=True,
                    ))

        db.commit()
        logger.info("Quizzes seeded/repaired successfully.")
    except Exception as e:
        logger.error(f"Quiz seeding error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
