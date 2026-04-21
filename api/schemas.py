from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


# Auth schemas
class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = ""
    department: Optional[str] = ""


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    department: str
    avatar_initials: str
    is_admin: bool
    is_active: bool
    xp: int
    level: int
    streak: int
    last_login: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None


class AdminUserUpdate(BaseModel):
    is_admin: Optional[bool] = None
    xp: Optional[int] = None
    is_active: Optional[bool] = None
    department: Optional[str] = None


# Quiz schemas
class QuizQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_index: int
    explanation: str
    type: str = "multiple_choice"


class QuizInfo(BaseModel):
    id: str
    title: str
    description: str
    category: str
    difficulty: str
    xp_reward: int
    question_count: int
    time_estimate: str
    min_level: int = 1
    best_score: Optional[float] = None
    attempts: int = 0


class QuizDetail(BaseModel):
    id: str
    title: str
    description: str
    category: str
    difficulty: str
    xp_reward: int
    questions: List[QuizQuestion]
    min_level: int = 1


class QuizSubmit(BaseModel):
    answers: List[int]


class QuizResult(BaseModel):
    score_pct: float
    xp_earned: int
    correct_count: int
    total_questions: int
    passed: bool
    message: str
    new_xp: int
    new_level: int


class QuizAttemptOut(BaseModel):
    id: int
    quiz_id: str
    score_pct: float
    xp_earned: int
    completed_at: datetime

    class Config:
        from_attributes = True


# Stats schemas
class UserStats(BaseModel):
    xp: int
    level: int
    xp_to_next: int
    streak: int
    quiz_attempts: int
    courses_completed: int
    tools_used: int
    best_quiz_score: Optional[float]
    rank: Optional[int]


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    full_name: str
    department: str
    avatar_initials: str
    xp: int
    level: int
    is_current_user: bool = False


# Event schemas
class EventOut(BaseModel):
    id: int
    title: str
    description: str
    event_type: str
    host: str
    event_date: str
    event_time: str
    location: str
    tags: str
    xp_reward: int
    capacity: int
    registered_count: int
    source_url: str
    is_active: bool
    is_registered: bool = False

    class Config:
        from_attributes = True


class EventCreate(BaseModel):
    title: str
    description: str = ""
    event_type: str = "webinar"
    host: str = ""
    event_date: str = ""
    event_time: str = ""
    location: str = ""
    tags: str = "[]"
    xp_reward: int = 0
    capacity: int = 0
    source_url: str = ""


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    host: Optional[str] = None
    event_date: Optional[str] = None
    event_time: Optional[str] = None
    location: Optional[str] = None
    tags: Optional[str] = None
    xp_reward: Optional[int] = None
    capacity: Optional[int] = None
    is_active: Optional[bool] = None


# Admin schemas
class PlatformStats(BaseModel):
    total_users: int
    active_today: int
    quizzes_taken_today: int
    avg_score: float
    total_xp_awarded: int
    total_events: int


class ToolUsageOut(BaseModel):
    tool_name: str
    usage_count: int


class QuizStats(BaseModel):
    quiz_id: str
    title: str
    attempts: int
    avg_score: float
    pass_rate: float


class ToolLogRequest(BaseModel):
    tool_name: str


# Course / Learning Path schemas
class ModuleSection(BaseModel):
    type: str           # text | key_points | tip | warning | example | steps
    heading: str
    body: Optional[str] = None
    points: Optional[List[str]] = None


class ModuleContent(BaseModel):
    index: int
    title: str
    duration: str
    xp_reward: int
    sections: List[ModuleSection]
    completed: bool = False


class CourseSummary(BaseModel):
    id: str
    title: str
    description: str
    category: str
    level: str
    emoji: str
    color: str
    duration: str
    total_modules: int
    progress_pct: int
    modules_completed: List[int]


class ModuleCompleteResult(BaseModel):
    xp_earned: int
    new_xp: int
    new_level: int
    progress_pct: int
    course_completed: bool
    already_completed: bool
