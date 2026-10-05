# API contract

Base URL: `http://localhost:8000/api`. JSON is used unless a route says `multipart/form-data`.

Authenticated routes require `Authorization: Bearer <access_token>`. Successful registration, login, and refresh responses contain:

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 86400,
  "refresh_token": "private-opaque-token",
  "user": { "id": "...", "name": "Ada", "email": "ada@example.com", "role": "recruiter", "avatar_url": null }
}
```

Errors use `{ "detail": "STABLE_ERROR_CODE" }`. Validation errors additionally include an `errors` array. Common HTTP statuses are 400 (bad input), 401 (authentication), 403 (role/access), 404 (missing or deliberately hidden resource), 409 (state conflict), 413 (file/payload limit), 422 (validation), 429 (rate limit), and 500 (unexpected failure).

`GET /health` sits outside the `/api` prefix and returns `{ "status":"ok", "service":"hirelume-backend", "version":"0.3.0" }` without authentication.

## Authentication and profile

### `POST /auth/register`

Request: `{ "name":"Ada", "email":"ada@example.com", "password":"at-least-8-chars", "role":"recruiter" }`. Role is `recruiter` or `job_seeker`. Response: the authentication object above. Status: 200; errors: 409 `ACCOUNT_ALREADY_EXISTS`, 422 `VALIDATION_ERROR`.

### `POST /auth/login`

Request: `{ "email":"ada@example.com", "password":"at-least-8-chars" }`. Response: the authentication object above. Status: 200; error: 401 `INVALID_CREDENTIALS`.

### `POST /auth/refresh`

Request: `{ "refresh_token":"private-opaque-token" }`. Response: a new authentication object; the submitted refresh token is revoked. Status: 200; error: 401 `INVALID_REFRESH_TOKEN`.

### `POST /auth/logout`

Request: `{ "refresh_token":"private-opaque-token" }`. Response: empty. Status: 204. Logout revokes the refresh token; clients should also discard their access token.

### `GET /auth/me`

Response: `{ "id":"...", "name":"Ada", "email":"ada@example.com", "role":"recruiter", "avatar_url":"/api/users/me/avatar" }`. Status: 200; error: 401.

### `POST /users/me/avatar`

Authenticated multipart request with one `avatar` file (PNG, JPEG, or WebP; 2 MB by default). Response: `{ "avatar_filename":"ada.png", "avatar_mime_type":"image/png", "avatar_uploaded_at":"...", "avatar_url":"/api/users/me/avatar" }`. Errors include `AVATAR_REQUIRED`, `AVATAR_UNSUPPORTED_FORMAT`, `AVATAR_INVALID_CONTENT`, and `AVATAR_TOO_LARGE`.

### `GET /users/me/avatar` and `DELETE /users/me/avatar`

GET returns the image bytes with the stored content type. DELETE returns `{ "message":"Avatar removed" }`. Both require authentication; GET may return 404 `AVATAR_NOT_FOUND`.

## Jobs

All `/jobs` routes require a recruiter account.

### `POST /jobs`

Request:

```json
{
  "title": "Backend Engineer",
  "description": "Build backend services.",
  "requirements": [{ "text": "Node.js experience", "requirement_type": "required" }],
  "feedback_enabled": true,
  "blind_mode": false
}
```

Response: `{ "id":"...", "title":"Backend Engineer", "status":"open", "public_token":"unguessable-token", "requirements":[{"id":"...","text":"Node.js experience","type":"required"}], "feedback_enabled":true, "blind_mode":false, "requirements_locked":false, ... }`. Status: 200.

### `GET /jobs`

Response: `[{ "id":"...", "title":"Backend Engineer", "status":"open", "public_token":"...", "applicants":3, "feedback_enabled":true, "blind_mode":false }]`. Status: 200.

### `GET /jobs/{id}`

Response: the full job object returned by job creation. Status: 200; error: 404 `JOB_NOT_FOUND`.

### `PATCH /jobs/{id}`

Request may contain any create-job field, for example `{ "title":"Senior Backend Engineer" }`. Requirements cannot be empty and cannot change after the first application. Response: the updated full job. Errors: 404 `JOB_NOT_FOUND`, 409 `JOB_REQUIREMENTS_LOCKED`, 422 `VALIDATION_ERROR`.

### `POST /jobs/{id}/close` and `POST /jobs/{id}/reopen`

No request body. Response: `{ "id":"...", "status":"closed" }` or `{ "id":"...", "status":"open" }`. Status: 200; error: 404 `JOB_NOT_FOUND`.

### `GET /jobs/{id}/applications`

Query parameters: `status=shortlisted|rejected|undecided`, `analysis_status=pending|processing|completed|failed`, `sort=score|date`, `order=asc|desc`, `page` (default 1), and `page_size` (default 20, maximum 100).

Response:

```json
{
  "total": 1,
  "page": 1,
  "page_size": 20,
  "pages": 1,
  "applicants": [{
    "id": "...", "name": "Candidate", "score": 88, "level": "strong",
    "reason": "Strong match", "skills": ["Node.js"], "experience": ["3 years APIs"],
    "needs_review": false, "status": "undecided", "analysis_status": "completed", "applied_at": "..."
  }]
}
```

## Public applications and results

### `GET /public/jobs/{token}`

No login. Response: `{ "id":"...", "status":"open", "title":"Backend Engineer", "description":"...", "requirements":[{"text":"Node.js experience","type":"required"}], "consent":{"version":"v1","text":"..."} }`. A closed job is returned with `status: "closed"`; an invalid token returns 404 `JOB_NOT_FOUND`.

### `POST /public/jobs/{token}/applications`

No login. Send multipart fields `name`, `email`, `phone`, `consent=true`, the exact `consent_version` returned by the public job, optional `feedback_opt_in=true|false`, and `cv` (PDF or DOCX, 5 MB by default).

Response: `{ "application_id":"...", "analysis_status":"pending", "result_token":"private-token", "message":"Application received" }`. Errors include `JOB_CLOSED`, `CONSENT_REQUIRED`, `CONSENT_VERSION_MISMATCH`, `DUPLICATE_APPLICATION`, `CV_REQUIRED`, `CV_UNSUPPORTED_FORMAT`, `CV_INVALID_CONTENT`, `CV_EMPTY`, `CV_TOO_LARGE`, and `RATE_LIMIT_EXCEEDED`.

### `POST /applications/link`

Requires a job-seeker account whose email matches the application. Request: `{ "result_token":"private-token" }`. Response: `{ "application_id":"...", "linked":true }`. Errors: 403 `APPLICATION_EMAIL_MISMATCH`, 404 `INVALID_RESULT_TOKEN`, 409 `APPLICATION_ALREADY_LINKED`.

### `GET /results/{token}`

The private token always exposes status and, after completion, interview questions. Example without eligible feedback: `{ "application_id":"...", "analysis_status":"completed", "feedback_enabled":true, "feedback_opt_in":true, "questions":["Tell us about an API you built"], "feedback_available":false }`.

Score, reason, skills, experience, and guidance are added only when all three conditions hold: the job enables feedback, the applicant opted in, and an authenticated job-seeker owns the linked application. Example additions: `{ "score":88, "match_level":"strong", "reason":"...", "skills":["Node.js"], "experience":["3 years APIs"], "guidance":["Add delivery metrics"] }`.

Pending/processing responses contain `message: "Analysis pending"`; failures contain `message: "Analysis unavailable"`. Error: 404 `INVALID_RESULT_TOKEN`.

## Recruiter application management

### `GET /applications/{id}`

Recruiter-only. Response: `{ "id":"...", "name":"Candidate", "email":"candidate@example.com", "phone":"...", "status":"undecided", "analysis_status":"completed", "score":88, "match_level":"strong", "reason":"...", "skills":[], "experience":[], "needs_review":false, "cv_url":"/api/applications/{id}/cv", "analysis":{...} }`. Error: 404 `APPLICATION_NOT_FOUND`.

### `GET /applications/{id}/cv`

Recruiter-only. Returns the original private CV as a download. Errors: 404 `APPLICATION_NOT_FOUND` or `CV_NOT_FOUND`.

### `PATCH /applications/{id}/status`

Recruiter-only. Request: `{ "status":"shortlisted" }`, where status is `shortlisted`, `rejected`, or `undecided`. Response: `{ "id":"...", "status":"shortlisted" }`. The authenticated actor and timestamp are saved.

### `GET /applications/{id}/status-history`

Recruiter-only. Response: `[{ "old_status":"undecided", "new_status":"shortlisted", "actor_user_id":"...", "created_at":"..." }]`, newest first.

### `DELETE /applications/{id}`

Allowed to the owning recruiter or linked applicant. Deletes the application, CV file/record, and analysis result. Response: empty, status 204. Unauthorized callers receive 404 `APPLICATION_NOT_FOUND` so record existence is not disclosed.

## Ratings and analytics

### `POST /ratings`

Authentication required. Request: `{ "application_id":"optional-linked-application-id", "value":5, "comment":"Helpful" }`. If `application_id` is supplied, the signed-in user must own it. The latest rating for that user/application pair is upserted. Response: `{ "id":"...", "value":5, "comment":"Helpful" }`, status 201.

### `POST /events`

May be anonymous and is rate-limited. Request: `{ "name":"result.viewed", "anonymous_id":"anonymous-123", "properties":{"source":"email"}, "occurred_at":"2026-09-30T12:00:00Z" }`. Authenticated requests may omit `anonymous_id`; anonymous requests may not. Properties are limited to 10 KB. Response: `{ "accepted":true }`, status 202.

## Flow 1 analysis

Set `ANALYSIS_PROVIDER=gemini` with `GEMINI_API_KEY`, or `ANALYSIS_PROVIDER=groq` with `GROQ_API_KEY`. Each submitted CV is parsed, optionally identity-redacted, scored in the background, and retried up to `ANALYSIS_MAX_ATTEMPTS`. Pending work is recovered when the server starts. With provider `none`, submissions remain pending. Flow 2 remains intentionally out of scope.
