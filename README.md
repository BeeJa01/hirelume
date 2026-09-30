# Hirelume Backend

FastAPI service for Hirelume.

## Run locally

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env  # Windows
# cp .env.example .env # macOS/Linux

uvicorn app.main:app --reload
```

Open Swagger at `http://127.0.0.1:8000/docs`.

## Frontend integration

The frontend can call the API with `fetch()`. Public job/application endpoints do not require login. Recruiter endpoints use:

`Authorization: Bearer <access_token>`

## Notes

Gemini integration is in `app/services/ai_service.py`. Confirm the provider's privacy and data-retention terms with the team before using real applicant CVs.

Use `API_CONTRACT.md` for the endpoints and `APPENDIX_A_STATUS.md` for implementation progress. Local environment files, databases, and uploaded files are excluded from Git; do not commit credentials or applicant documents.
