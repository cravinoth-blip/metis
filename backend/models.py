from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, default="")
    department = Column(String, default="")
    avatar_initials = Column(String, default="")
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak = Column(Integer, default=0)
    last_login = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    quiz_attempts = relationship("QuizAttempt", back_populates="user")
    # Updated from course_progresses
    learning_progresses = relationship("LearningProgress", back_populates="user")
    tool_usages = relationship("ToolUsage", back_populates="user")
    event_registrations = relationship("EventRegistration", back_populates="user")
    completed_learning_modules = relationship("CompletedUserModule", back_populates="user")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quiz_id = Column(String, nullable=False)
    score_pct = Column(Float, default=0.0)
    xp_earned = Column(Integer, default=0)
    answers = Column(Text, default="[]")
    completed_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="quiz_attempts")

class LearningProgress(Base):
    """Renamed from CourseProgress"""
    __tablename__ = "learning_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    learning_id = Column(String, nullable=False) # Changed from course_id
    progress_pct = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="learning_progresses")

class ToolUsage(Base):
    __tablename__ = "tool_usages"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tool_name = Column(String, nullable=False)
    used_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="tool_usages")

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(String, nullable=False)
    host = Column(String, nullable=True) # Ensure this exists if seeder uses it
    event_date = Column(String, nullable=True)
    event_time = Column(String, nullable=True)
    location = Column(String, nullable=True)
    tags = Column(String, nullable=True) # SQLite stores lists as strings
    xp_reward = Column(Integer, default=0)
    capacity = Column(Integer, default=0)
    registered_count = Column(Integer, default=0)
    source_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    duration_minutes = Column(Integer, nullable=True)
    registration_url = Column(String, nullable=True)
    speaker = Column(String, nullable=True)
    organizer = Column(String, nullable=True)
    format = Column(String, nullable=True)
    platform = Column(String, nullable=True)
    
    registrations = relationship("EventRegistration", back_populates="event")

class EventRegistration(Base):
    __tablename__ = "event_registrations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    registered_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="event_registrations")
    event = relationship("Event", back_populates="registrations")

class ModuleCompletion(Base):
    """Refactored to use learning_id"""
    __tablename__ = "module_completions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    learning_id = Column(String, nullable=False) # Changed from course_id
    module_index = Column(Integer, nullable=False)
    xp_earned = Column(Integer, default=0)
    completed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class Learning(Base):
    __tablename__ = "learnings"
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, nullable=True)
    type = Column(String, nullable=True)
    level = Column(Integer, default=1)
    tags = Column(String, nullable=True)
    estimated_duration_min = Column(Integer, nullable=True)
    is_mandatory = Column(Boolean, default=False)
    xp_reward = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    modules = relationship("LearningModule", back_populates="learning", order_by="LearningModule.order")

class LearningModule(Base):
    __tablename__ = "learning_modules"
    id = Column(String, primary_key=True, index=True)
    learning_id = Column(String, ForeignKey("learnings.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True) 
    content_text = Column(Text, nullable=True) 
    content_url = Column(String, nullable=True) 
    order = Column(Integer, nullable=False, default=0)
    duration_min = Column(Integer, nullable=True)
    xp_reward = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    learning = relationship("Learning", back_populates="modules")
    completions = relationship("CompletedUserModule", back_populates="module")

class CompletedUserModule(Base):
    __tablename__ = "completed_users_modules"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    module_id = Column(String, ForeignKey("learning_modules.id"), nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="completed_learning_modules")
    module = relationship("LearningModule", back_populates="completions")

class AITool(Base):
    __tablename__ = "ai_tools"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    emoji_logo = Column(String, nullable=True)
    category = Column(String, nullable=True)
    tags = Column(String, nullable=True)
    url = Column(String, nullable=True)
    provider = Column(String, nullable=True)
    is_enterprise = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class LearningSummary(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    level: int
    
    # Maps to estimated_duration_min in your DB
    duration: Optional[int] = None
    
    # Progress related fields (calculated in the router)
    total_modules: int
    progress_pct: int
    modules_completed: List[int] = []

    # Optional UI fields (if you decide to add these to the DB later)
    # emoji: Optional[str] = None
    # color: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
