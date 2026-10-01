# API reference

Base URL: `http://localhost:8000/api`. The backend stores data in MongoDB.

Private routes need the JWT returned by `/auth/register` or `/auth/login`:

```text
Authorization: Bearer <access_token>
```

## Routes

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create an account |
| POST | `/auth/login` | Public | Sign in |
| GET | `/auth/me` | Signed in | Get the current user |
| POST | `/jobs` | Recruiter | Create a job |
| GET | `/jobs` | Recruiter | List the recruiter's jobs |
| GET | `/jobs/{id}` | Recruiter | Get a job |
| PATCH | `/jobs/{id}` | Recruiter | Edit a job |
| POST | `/jobs/{id}/close` | Recruiter | Close a job |
| POST | `/jobs/{id}/reopen` | Recruiter | Reopen a job |
| GET | `/jobs/{id}/applications` | Recruiter | List applicants |
| GET | `/public/jobs/{token}` | Public | View a job |
| POST | `/public/jobs/{token}/applications` | Public | Apply with a CV |
| GET | `/applications/{id}` | Recruiter | View an applicant |
| GET | `/applications/{id}/cv` | Recruiter | Download the applicant's CV |
| PATCH | `/applications/{id}/status` | Recruiter | Change applicant status |
| GET | `/applications/{id}/status-history` | Recruiter | View status changes |
| GET | `/results/{token}` | Private link | Check application result status |

## Create a job

Send JSON. Each job needs at least one requirement.

```json
{
  "title": "Backend Engineer",
  "description": "Build backend services.",
  "requirements": [
    { "text": "Node.js experience", "requirement_type": "required" }
  ],
  "feedback_enabled": true,
  "blind_mode": false
}
```

## Submit an application

Send `multipart/form-data` with these fields:

- `name`
- `email`
- `phone`
- `consent` (`true` or `false`)
- `consent_version`
- `cv` (PDF or DOCX, up to 5 MB)

The response includes `application_id`, `analysis_status`, and a private `result_token`. Analysis is not part of the current stage, so the status remains pending.

## Common errors

Errors return JSON with a `detail` field. Common status codes are `400` for invalid input, `401` for missing or invalid login, `403` for the wrong role, `404` for a missing or inaccessible item, `409` for duplicates or closed jobs, `413` for oversized CVs, and `422` for request validation errors.

## Not in this stage

AI analysis (Gemini/Groq), Flow 2, ratings, and analytics are not implemented yet. See [APPENDIX_A_STATUS.md](APPENDIX_A_STATUS.md).
