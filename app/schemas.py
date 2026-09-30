from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8)
    role: str

    @field_validator("password")
    @classmethod
    def bcrypt_password_fits(cls, value: str):
        if len(value.encode("utf-8")) > 72:
            raise ValueError("password must be no longer than 72 bytes")
        return value

    @field_validator("role")
    @classmethod
    def valid_role(cls, value: str):
        if value not in {"recruiter", "job_seeker"}:
            raise ValueError("role must be recruiter or job_seeker")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RequirementIn(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    requirement_type: str = "required"

    @field_validator("requirement_type")
    @classmethod
    def valid_type(cls, value: str):
        if value not in {"required", "nice_to_have"}:
            raise ValueError("requirement_type must be required or nice_to_have")
        return value


class JobCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    requirements: list[RequirementIn] = Field(min_length=1)
    feedback_enabled: bool = True
    blind_mode: bool = False


class JobUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    requirements: list[RequirementIn] | None = None
    feedback_enabled: bool | None = None
    blind_mode: bool | None = None


class StatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def valid_status(cls, value: str):
        if value not in {"shortlisted", "rejected", "undecided"}:
            raise ValueError("status must be shortlisted, rejected, or undecided")
        return value


class RatingIn(BaseModel):
    analysis_id: int
    helpful: bool
    comment: str | None = None


class EventIn(BaseModel):
    event_name: str = Field(min_length=1, max_length=80)
    job_id: int | None = None
    application_id: int | None = None
    channel: str | None = None
    duration_ms: int | None = Field(default=None, ge=0)


class Flow2AnalysisRequest(BaseModel):
    job_text: str | None = None
    job_link: str | None = None
