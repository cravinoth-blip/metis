from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List, Any, Dict
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
    full_name: Optional[str] = None
    email: Optional[str] = None
    is_admin: Optional[bool] = None
    xp: Optional[int] = None
    level: Optional[int] = None
    is_active: Optional[bool] = None
    department: Optional[str] = None


# Quiz schemas
class QuizQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_index: int
    correct_indices: List[int] = []
    explanation: str
    type: str = "single_choice"


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
    answers: List[Any]  # int for single_choice, List[int] for multiple_choice


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


# Event schem# ==============================================================================
# Event Schemas
# ==============================================================================


class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: str
    host: Optional[str] = None
    event_date: Optional[str] = None
    event_time: Optional[str] = None
    location: Optional[str] = None
    tags: Optional[str] = None
    xp_reward: int = 0
    capacity: Optional[int] = 0
    registered_count: Optional[int] = 0
    source_url: Optional[str] = None
    is_active: bool = True
    duration_minutes: Optional[int] = None
    registration_url: Optional[str] = None
    speaker: Optional[str] = None
    organizer: Optional[str] = None
    format: Optional[str] = None
    platform: Optional[str] = None


class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    speaker: Optional[str] = None
    organizer: Optional[str] = None
    host: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    event_date: Optional[str] = None
    event_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    format: Optional[str] = None
    platform: Optional[str] = None
    url: Optional[str] = None
    registration_url: Optional[str] = None
    xp_reward: Optional[int] = None
    capacity: Optional[int] = None
    is_active: Optional[bool] = None

class EventOut(EventBase):
    """Unified schema for sending Event data to the frontend."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    registered_count: int = 0
    is_registered: bool = False # Populated by the router logic
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


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


# Learning resource schemas (public)
class LearningModuleOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    order: int = 0
    duration_min: Optional[int] = None
    xp_reward: int = 0

    class Config:
        from_attributes = True


class LearningWithModulesOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    type: Optional[str] = None
    level: int = 1
    tags: Optional[str] = None
    estimated_duration_min: Optional[int] = None
    xp_reward: int = 0
    is_mandatory: bool = False
    module_count: int = 0
    modules: List[LearningModuleOut] = []

    class Config:
        from_attributes = True


# Admin-only learning schemas
class LearningOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    type: Optional[str] = None
    level: int = 1
    tags: Optional[str] = None
    estimated_duration_min: Optional[int] = None
    xp_reward: int = 0
    is_mandatory: bool = False
    is_active: bool = True
    module_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LearningCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    type: Optional[str] = None
    level: int = 1
    tags: Optional[str] = None
    estimated_duration_min: Optional[int] = None
    xp_reward: int = 0
    is_mandatory: bool = False


class LearningUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    type: Optional[str] = None
    level: Optional[int] = None
    tags: Optional[str] = None
    estimated_duration_min: Optional[int] = None
    xp_reward: Optional[int] = None
    is_mandatory: Optional[bool] = None
    is_active: Optional[bool] = None


# Shared properties
class LearningModuleBase(BaseModel):
    title: str
    description: Optional[str] = None
    content_text: Optional[str] = None
    content_url: Optional[str] = None
    order: int = 0
    duration_min: Optional[int] = None
    xp_reward: int = 0

# Properties to receive on module creation
class LearningModuleCreate(LearningModuleBase):
    learning_id: str

# Properties to receive on module update
class LearningModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content_text: Optional[str] = None
    content_url: Optional[str] = None
    order: Optional[int] = None
    duration_min: Optional[int] = None
    xp_reward: Optional[int] = None
    is_active: Optional[bool] = None

# Properties to return to client
class LearningModuleOut(LearningModuleBase):
    id: str
    learning_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LearningModuleDetailOut(BaseModel):
    id: str
    learning_id: str
    title: str
    description: Optional[str] = None
    duration_min: Optional[int] = 0
    xp_reward: Optional[int] = 0
    content_url: Optional[str] = None
    sections: List[Dict[str, Any]] = []



class LearningSummary(BaseModel):
    # Data from models.Learning
    id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    level: int
    duration: Optional[int] = None  # Maps to estimated_duration_min
    
    # Computed fields (calculated in the router for the current user)
    total_modules: int
    progress_pct: int
    modules_completed: List[int] = []

    # UI specific fields (often used in frontend cards)
    # If these aren't in your DB yet, you can set defaults or make them Optional
    emoji: Optional[str] = "📚" 
    color: Optional[str] = "#4F46E5"

    model_config = ConfigDict(from_attributes=True)

class LearningModuleOut(BaseModel):
    """Schema for individual modules within a learning resource."""
    id: str
    title: str
    order: int
    duration_min: Optional[int] = None
    xp_reward: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class LearningWithModulesOut(LearningSummary):
    """
    Used for the detail view where you need 
    the full list of modules objects included.
    """
    modules: List[LearningModuleOut]



class BuilderSection(BaseModel):
    type: str
    heading: Optional[str] = ""
    body: Optional[str] = ""
    points: Optional[List[str]] = []

class ModuleBuilderCreate(BaseModel):
    title: str
    duration: int = 10
    xp_reward: int = 50
    sections: List[BuilderSection] = []


class AIToolCreate(BaseModel):
    name: str
    description: Optional[str] = None
    emoji_logo: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    url: Optional[str] = None
    provider: Optional[str] = None
    is_enterprise: bool = False


class AIToolUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    emoji_logo: Optional[str] = None
    tags: Optional[str] = None
    url: Optional[str] = None
    category: Optional[str] = None
    provider: Optional[str] = None
    is_enterprise: Optional[bool] = None
    is_active: Optional[bool] = None


class AIToolOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    emoji_logo: Optional[str] = None
    tags: Optional[str] = None
    url: Optional[str] = None
    provider: Optional[str] = None
    category: Optional[str] = None
    is_enterprise: bool
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
