from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import json
from database import get_db
import models
import schemas
from auth import get_current_user, calculate_level
from quiz_data import QUIZZES

router = APIRouter(tags=["quiz"])


@router.get("/", response_model=list[schemas.QuizInfo])
def list_quizzes(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = []
    for quiz_id, quiz in QUIZZES.items():
        # Get user's best score for this quiz
        best = db.query(func.max(models.QuizAttempt.score_pct)).filter(
            models.QuizAttempt.user_id == current_user.id,
            models.QuizAttempt.quiz_id == quiz_id
        ).scalar()

        attempts = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.user_id == current_user.id,
            models.QuizAttempt.quiz_id == quiz_id
        ).count()

        result.append(schemas.QuizInfo(
            id=quiz["id"],
            title=quiz["title"],
            description=quiz["description"],
            category=quiz["category"],
            difficulty=quiz["difficulty"],
            xp_reward=quiz["xp_reward"],
            question_count=len(quiz["questions"]),
            time_estimate=quiz["time_estimate"],
            min_level=quiz.get("min_level", 1),
            best_score=best,
            attempts=attempts
        ))

    return result


@router.get("/{quiz_id}", response_model=schemas.QuizDetail)
def get_quiz(
    quiz_id: str,
    current_user: models.User = Depends(get_current_user)
):
    quiz = QUIZZES.get(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Check level requirement
    min_level = quiz.get("min_level", 1)
    if current_user.level < min_level:
        raise HTTPException(
            status_code=403,
            detail=f"This quiz requires level {min_level}. You are level {current_user.level}."
        )

    questions = [
        schemas.QuizQuestion(
            id=q["id"],
            question=q["question"],
            options=q["options"],
            correct_index=q["correct_index"],
            explanation=q["explanation"],
            type=q.get("type", "multiple_choice")
        )
        for q in quiz["questions"]
    ]

    return schemas.QuizDetail(
        id=quiz["id"],
        title=quiz["title"],
        description=quiz["description"],
        category=quiz["category"],
        difficulty=quiz["difficulty"],
        xp_reward=quiz["xp_reward"],
        questions=questions,
        min_level=min_level
    )


@router.post("/{quiz_id}/submit", response_model=schemas.QuizResult)
def submit_quiz(
    quiz_id: str,
    submission: schemas.QuizSubmit,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quiz = QUIZZES.get(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = quiz["questions"]
    if len(submission.answers) != len(questions):
        raise HTTPException(
            status_code=400,
            detail=f"Expected {len(questions)} answers, got {len(submission.answers)}"
        )

    # Calculate score
    correct_count = sum(
        1 for i, answer in enumerate(submission.answers)
        if answer == questions[i]["correct_index"]
    )
    score_pct = (correct_count / len(questions)) * 100
    passed = score_pct >= 70

    # Calculate XP
    base_xp = quiz["xp_reward"]
    if passed:
        xp_earned = base_xp
    else:
        xp_earned = int(base_xp * 0.2)

    # Bonus for perfect score
    if score_pct == 100:
        xp_earned = int(base_xp * 1.2)  # 20% bonus

    # Record attempt
    attempt = models.QuizAttempt(
        user_id=current_user.id,
        quiz_id=quiz_id,
        score_pct=round(score_pct, 1),
        xp_earned=xp_earned,
        answers=json.dumps(submission.answers),
        completed_at=datetime.utcnow()
    )
    db.add(attempt)

    # Update user XP and level
    current_user.xp += xp_earned
    level, _ = calculate_level(current_user.xp)
    current_user.level = level

    db.commit()

    if score_pct == 100:
        message = "Perfect score! Outstanding achievement!"
    elif passed:
        message = "Well done! You passed!"
    elif score_pct >= 50:
        message = "Good effort! Review the material and try again."
    else:
        message = "Keep practicing! You'll get there."

    return schemas.QuizResult(
        score_pct=round(score_pct, 1),
        xp_earned=xp_earned,
        correct_count=correct_count,
        total_questions=len(questions),
        passed=passed,
        message=message,
        new_xp=current_user.xp,
        new_level=current_user.level
    )


@router.get("/{quiz_id}/attempts", response_model=list[schemas.QuizAttemptOut])
def get_attempts(
    quiz_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempts = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.user_id == current_user.id,
        models.QuizAttempt.quiz_id == quiz_id
    ).order_by(models.QuizAttempt.completed_at.desc()).all()

    return attempts
