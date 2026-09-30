# Hirelume API Contract Backend Working Draft

Version: 0.2.0

## Base

- Base path: `/api`
- Authentication: JWT Bearer for recruiter/job-seeker protected routes.
- Public Flow 1 job/application routes do not require login.
- JSON is used for normal requests/responses.
- Multipart form data is used for CV/screenshot uploads.

## Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register recruiter/job seeker |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Return current authenticated user |
| POST | `/jobs` | Create job |
| GET | `/jobs` | List recruiter's jobs |
| GET | `/jobs/{job_id}` | Get job |
| PATCH | `/jobs/{job_id}` | Edit job and requirements before first application |
| POST | `/jobs/{job_id}/close` | Close job |
| POST | `/jobs/{job_id}/reopen` | Reopen job |
| GET | `/public/jobs/{token}` | Open public job link |
| POST | `/public/jobs/{token}/applications` | Submit no-login application + consent + CV |
| GET | `/jobs/{job_id}/applications` | Get ranked applicants |
| GET | `/applications/{id}` | Get applicant detail |
| GET | `/applications/{id}/cv` | Private recruiter CV access |
| PATCH | `/applications/{id}/status` | Shortlist/reject/undecide |
| GET | `/applications/{id}/status-history` | Status audit history |
| GET | `/results/{private_token}` | Applicant private result |
| POST | `/flow2/analyses` | Start Flow 2 analysis |
| GET | `/flow2/analyses/{id}` | Get Flow 2 analysis status/result |
| POST | `/ratings` | Submit result rating |
| POST | `/events` | Record analytics event |

## Job requirements

Requirements use `required` or `nice_to_have`. Once the first application is created, requirements are locked. Title/description and feedback settings remain editable according to the product rules.

## Application

Required fields:

- name
- email
- phone
- consent
- consent_version
- CV (PDF/DOCX)

MVP CV limit: 5 MB. Duplicate applications are rejected per job/email. CV is locked after submission.

## Analysis lifecycle

Supported states:

`pending` → `processing` → `completed`

Failure/operational states may include:

`failed`, `queued`, `needs_review`

The backend stores analysis attempts and exposes the current status. Automatic worker retry/queue processing remains a follow-up implementation item.

## Private result

Each application receives a cryptographically random private result token. The token is used by `/api/results/{private_token}`. Recruiter endpoints remain ownership-scoped.

## Error codes

The API should use stable machine-readable codes such as:

- `AUTH_REQUIRED`
- `INVALID_CREDENTIALS`
- `JOB_NOT_FOUND`
- `JOB_CLOSED`
- `DUPLICATE_APPLICATION`
- `CONSENT_REQUIRED`
- `CV_UNSUPPORTED_FORMAT`
- `CV_TOO_LARGE`
- `CV_EMPTY`
- `APPLICATION_NOT_FOUND`
- `CV_NOT_FOUND`
- `INVALID_RESULT_TOKEN`
- `ANALYSIS_PENDING`
- `AI_FAILURE`
- `RATE_LIMITED`

## AI boundary

Gemini is accessed only through `app/services/ai_service.py`.

Required implementation constraints from the Product Definition Pack:

- structured JSON response
- versioned prompts
- low randomness for rating
- maximum two AI calls per analysis
- final score calculated in backend code
- current provider terms/limits and data protections must be confirmed before real applicant data is used
- use test data while protections are not confirmed

## Implementation status

Implemented:

- authentication
- recruiter ownership checks
- job CRUD/close/reopen
- requirements and requirement lock
- public job link
- no-login application + consent + CV validation
- private result token
- recruiter applicant list/detail
- private CV access
- recruiter status audit
- private result endpoint
- Flow 2 request/status scaffold
- ratings/events scaffolds
- Gemini service boundary

Not implemented yet:

- real CV text extraction and readability checks
- real Gemini calls after provider/data-protection confirmation
- background analysis worker and automatic retry up to the product limit
- complete structured AI response validation
- final ranking/explanation implementation
- blind-mode preprocessing
- Flow 2 persisted analysis records and daily quota enforcement
- production object storage/private file delivery
- database migrations
- automated tests
