from app.config import settings


class AIService:
    """Single Gemini boundary for Hirelume.

    Keep all provider-specific SDK calls in this file. The Product Definition
    Pack requires structured JSON, versioned prompts, low randomness, and no
    more than two AI calls per analysis. Final scoring remains backend code.
    """

    prompt_version = "v1"

    def __init__(self):
        self.enabled = bool(settings.gemini_api_key and settings.gemini_model)

    def analyze(self, *, job, cv_text):
        if not self.enabled:
            raise RuntimeError("AI service is not configured")
        raise NotImplementedError("Gemini analysis implementation pending provider/data-protection confirmation")

    def generate_interview_questions(self, *, job, cv_text, gaps):
        if not self.enabled:
            raise RuntimeError("AI service is not configured")
        raise NotImplementedError("Gemini interview implementation pending provider/data-protection confirmation")


ai_service = AIService()
