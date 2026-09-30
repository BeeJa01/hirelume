from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from app.database import Base


def now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)
    created_at = Column(DateTime, default=now, nullable=False)


class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    feedback_enabled = Column(Boolean, default=True, nullable=False)
    blind_mode = Column(Boolean, default=False, nullable=False)
    requirements_locked = Column(Boolean, default=False, nullable=False)
    status = Column(String(20), default="open", nullable=False)
    public_token = Column(String(64), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=now, nullable=False)
    updated_at = Column(DateTime, default=now, onupdate=now, nullable=False)
    closed_at = Column(DateTime, nullable=True)


class Requirement(Base):
    __tablename__ = "requirements"
    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    text = Column(String(500), nullable=False)
    requirement_type = Column(String(20), default="required", nullable=False)
    position = Column(Integer, default=0, nullable=False)


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("job_id", "email", name="uq_job_application_email"),)
    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    name = Column(String(160), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=False)
    cv_filename = Column(String(255), nullable=False)
    cv_path = Column(String(500), nullable=False)
    cv_locked = Column(Boolean, default=True, nullable=False)
    consent_given = Column(Boolean, default=False, nullable=False)
    consent_version = Column(String(50), nullable=False)
    consent_at = Column(DateTime, default=now, nullable=False)
    status = Column(String(30), default="undecided", nullable=False)
    analysis_status = Column(String(30), default="pending", nullable=False)
    analysis_attempts = Column(Integer, default=0, nullable=False)
    private_result_token = Column(String(96), unique=True, index=True, nullable=False)
    analysis_score = Column(Float, nullable=True)
    match_level = Column(String(30), nullable=True)
    reason = Column(Text, nullable=True)
    needs_review = Column(Boolean, default=False, nullable=False)
    applied_at = Column(DateTime, default=now, nullable=False)
    analysis_updated_at = Column(DateTime, nullable=True)


class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    id = Column(Integer, primary_key=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    score = Column(Float, nullable=False)
    match_level = Column(String(30), nullable=False)
    reason = Column(Text, nullable=False)
    result_json = Column(Text, nullable=False)
    prompt_version = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=now, nullable=False)


class StatusAudit(Base):
    __tablename__ = "status_audits"
    id = Column(Integer, primary_key=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    old_status = Column(String(30), nullable=False)
    new_status = Column(String(30), nullable=False)
    created_at = Column(DateTime, default=now, nullable=False)


class Rating(Base):
    __tablename__ = "ratings"
    id = Column(Integer, primary_key=True)
    analysis_id = Column(Integer, ForeignKey("analysis_results.id"), nullable=False)
    helpful = Column(Boolean, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime, default=now, nullable=False)


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True)
    event_name = Column(String(80), nullable=False, index=True)
    job_id = Column(Integer)
    application_id = Column(Integer)
    channel = Column(String(50))
    duration_ms = Column(Integer)
    created_at = Column(DateTime, default=now, nullable=False)
