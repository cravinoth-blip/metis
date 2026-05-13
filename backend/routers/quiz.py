from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime
import json
from database import get_db
import models
import schemas
from auth import get_current_user, calculate_level, award_badge

router = APIRouter(tags=["quiz"])
_templates = Jinja2Templates(directory=str(Path(__file__).parent.parent / "templates"))


def _active_questions(quiz: models.Quiz) -> list[models.Question]:
    return sorted([q for q in quiz.questions if q.is_active], key=lambda q: q.order)


@router.get("/ui/skillgames", response_class=HTMLResponse)
def skillgames_ui(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quizzes_db = (
        db.query(models.Quiz)
        .options(joinedload(models.Quiz.questions))
        .filter(models.Quiz.is_active == True)
        .all()
    )
    quizzes = []
    for quiz in quizzes_db:
        best = db.query(func.max(models.QuizAttempt.score_pct)).filter(
            models.QuizAttempt.user_id == current_user.id,
            models.QuizAttempt.quiz_id == quiz.id,
        ).scalar()
        attempts = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.user_id == current_user.id,
            models.QuizAttempt.quiz_id == quiz.id,
        ).count()
        quizzes.append({
            "id":             quiz.id,
            "title":          quiz.title,
            "description":    quiz.description or "",
            "category":       quiz.category or "",
            "difficulty":     quiz.difficulty or "Beginner",
            "min_level":      quiz.min_level or 1,
            "question_count": len(_active_questions(quiz)),
            "xp_reward":      quiz.xp_reward,
            "best_score":     round(best) if best is not None else None,
            "attempts":       attempts,
        })
    categories = ["All"] + sorted({q["category"] for q in quizzes if q["category"]})
    return _templates.TemplateResponse("skillgames.html", {
        "request":    request,
        "quizzes":    quizzes,
        "user":       current_user,
        "categories": categories,
    })


@router.get("/", response_model=list[schemas.QuizInfo])
def list_quizzes(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quizzes_db = (
        db.query(models.Quiz)
        .options(joinedload(models.Quiz.questions))
        .filter(models.Quiz.is_active == True)
        .all()
    )
    result = []
    for quiz in quizzes_db:
        best = db.query(func.max(models.QuizAttempt.score_pct)).filter(
            models.QuizAttempt.user_id == current_user.id,
            models.QuizAttempt.quiz_id == quiz.id,
        ).scalar()
        attempts = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.user_id == current_user.id,
            models.QuizAttempt.quiz_id == quiz.id,
        ).count()
        result.append(schemas.QuizInfo(
            id=quiz.id,
            title=quiz.title,
            description=quiz.description or "",
            category=quiz.category or "",
            difficulty=quiz.difficulty or "Beginner",
            xp_reward=quiz.xp_reward,
            question_count=len(_active_questions(quiz)),
            time_estimate=quiz.time_estimate or "",
            min_level=quiz.min_level or 1,
            best_score=best,
            attempts=attempts,
        ))
    return result


@router.get("/{quiz_id}", response_model=schemas.QuizDetail)
def get_quiz(
    quiz_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = (
        db.query(models.Quiz)
        .options(joinedload(models.Quiz.questions))
        .filter(models.Quiz.id == quiz_id, models.Quiz.is_active == True)
        .first()
    )
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if current_user.level < (quiz.min_level or 1):
        raise HTTPException(
            status_code=403,
            detail=f"This quiz requires level {quiz.min_level}. You are level {current_user.level}.",
        )
    questions = []
    for q in _active_questions(quiz):
        try:
            ci = json.loads(q.correct_indices) if q.correct_indices else [q.correct_index]
        except Exception:
            ci = [q.correct_index]
        questions.append(schemas.QuizQuestion(
            id=q.id,
            question=q.question,
            options=json.loads(q.options),
            correct_index=q.correct_index,
            correct_indices=ci,
            explanation=q.explanation or "",
            type=q.type or "single_choice",
        ))
    return schemas.QuizDetail(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description or "",
        category=quiz.category or "",
        difficulty=quiz.difficulty or "Beginner",
        xp_reward=quiz.xp_reward,
        questions=questions,
        min_level=quiz.min_level or 1,
    )


@router.post("/{quiz_id}/submit", response_model=schemas.QuizResult)
def submit_quiz(
    quiz_id: str,
    submission: schemas.QuizSubmit,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user = db.merge(current_user)
    quiz = (
        db.query(models.Quiz)
        .options(joinedload(models.Quiz.questions))
        .filter(models.Quiz.id == quiz_id, models.Quiz.is_active == True)
        .first()
    )
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = _active_questions(quiz)
    if len(submission.answers) != len(questions):
        raise HTTPException(
            status_code=400,
            detail=f"Expected {len(questions)} answers, got {len(submission.answers)}",
        )

    def _is_correct(q: models.Question, answer) -> bool:
        if q.type == "multiple_choice" and q.correct_indices:
            try:
                correct = set(json.loads(q.correct_indices))
                given = set(answer) if isinstance(answer, list) else {answer}
                return given == correct
            except Exception:
                pass
        return answer == q.correct_index

    correct_count = sum(
        1 for i, answer in enumerate(submission.answers)
        if _is_correct(questions[i], answer)
    )
    score_pct = (correct_count / len(questions)) * 100
    passed = score_pct >= 70

    already_attempted = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.user_id == current_user.id,
        models.QuizAttempt.quiz_id == quiz_id,
    ).first() is not None

    if already_attempted:
        xp_earned = 0
    else:
        base_xp = quiz.xp_reward
        xp_earned = base_xp if passed else int(base_xp * 0.2)
        if score_pct == 100:
            xp_earned = int(base_xp * 1.2)

    db.add(models.QuizAttempt(
        user_id=current_user.id,
        quiz_id=quiz_id,
        score_pct=round(score_pct, 1),
        xp_earned=xp_earned,
        answers=json.dumps(submission.answers),
        completed_at=datetime.utcnow(),
    ))
    newly_awarded = []
    if xp_earned:
        current_user.xp += xp_earned
        level, _ = calculate_level(current_user.xp)
        current_user.level = level
        newly_awarded = award_badge(current_user, db)
    db.commit()

    if already_attempted:
        message = "Good effort! No XP for retakes, but practice makes perfect."
    elif score_pct == 100:
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
        new_level=current_user.level,
        awarded_badges=[{"emoji": b.emoji or "🏅", "name": b.name} for b in newly_awarded],
        is_retake=already_attempted,
    )


@router.get("/{quiz_id}/attempts", response_model=list[schemas.QuizAttemptOut])
def get_attempts(
    quiz_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.QuizAttempt)
        .filter(
            models.QuizAttempt.user_id == current_user.id,
            models.QuizAttempt.quiz_id == quiz_id,
        )
        .order_by(models.QuizAttempt.completed_at.desc())
        .all()
    )
