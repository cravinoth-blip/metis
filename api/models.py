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
    course_progresses = relationship("CourseProgress", back_populates="user")
    tool_usages = relationship("ToolUsage", back_populates="user")
    event_registrations = relationship("EventRegistration", back_populates="user")


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


class CourseProgress(Base):
    __tablename__ = "course_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(String, nullable=False)
    progress_pct = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="course_progresses")


class ToolUsage(Base):
    __tablename__ = "tool_usages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tool_name = Column(String, nullable=False)
    used_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="tool_usages")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    event_type = Column(String, default="webinar")  # lunch, workshop, webinar, news
    host = Column(String, default="")
    event_date = Column(String, default="")
    event_time = Column(String, default="")
    location = Column(String, default="")
    tags = Column(Text, default="[]")
    xp_reward = Column(Integer, default=0)
    capacity = Column(Integer, default=0)
    registered_count = Column(Integer, default=0)
    source_url = Column(String, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

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
    __tablename__ = "module_completions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(String, nullable=False)
    module_index = Column(Integer, nullable=False)
    xp_earned = Column(Integer, default=0)
    completed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
