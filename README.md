# Hirelume

Hirelume is a hiring and career-fit workspace with a static web frontend, an
Express API, and an Expo mobile prototype. Recruiters can publish jobs and
review applications; job seekers can apply with a CV or use the separate
job-fit analysis workflow.

> The API and web frontend have working flows described below. The Expo app in
> `mobile/` is currently a UI prototype: its sign-in and sign-up screens do not
> yet call the API.

## Features

- Recruiter and job-seeker accounts, JWT access tokens, rotating refresh tokens,
  and password-reset routes.
- Recruiter job creation and editing, public job links, application review,
  application status history, and private CV access.
- PDF and DOCX CV uploads and parsing; private CV and avatar file storage.
- Optional Gemini or Groq analysis for applications and job-fit analyses,
  including blind-mode processing for recruiter applications.
- Job-fit analyses from pasted job text, a job link, or up to three screenshots,
  with a per-user daily quota.
- Applicant result links, optional feedback, recruiter ratings, and analytics
  events.
- A static, multi-page web experience and an early Expo/React Native app shell.

## Technology

| Area | Technologies |
|---|---|
| API | Node.js 20+, Express 5, MongoDB, Mongoose |
| API validation and security | Zod, bcryptjs, JSON Web Tokens, CORS, Multer |
| CV processing and analysis | `pdf-parse`, Mammoth, Tesseract.js, Gemini API, Groq API |
| Email | Nodemailer, configured with an SMTP server |
| Web | Static HTML, CSS, and JavaScript; Vercel and Cloudflare Pages configuration is included |
| Mobile prototype | Expo, React Native, React, TypeScript, React Navigation |
| API tests | Node.js test runner, Supertest, and MongoDB Memory Server |

The root `package.json` provides Nodemailer and the Google Generative AI
dependency. The API and mobile app have their own package manifests.

## Repository layout

```text
.
├── backend/
│   ├── scripts/             # Database migration command
│   ├── src/
│   │   ├── config/          # Environment configuration and MongoDB connection
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Authentication, roles, uploads, rate limits, errors
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # Mounted API routes
│   │   ├── services/        # Analysis, parsing, email, and file storage
│   │   └── utils/
│   ├── private/             # Local CV and avatar storage
│   └── tests/
├── docs/                    # API contract and implementation-status documents
├── frontend/                # Static web pages, shared API client, Vercel config
├── mobile/                  # Expo / React Native prototype
├── OneDrive/Documents/
│   └── HIRELUME/Hirelume/   # Separate tracked Expo starter copy
├── package.json             # Root-level dependencies
└── wrangler.jsonc           # Cloudflare static-asset configuration
```

The nested `OneDrive/Documents/HIRELUME/Hirelume/` directory is a separate Expo
starter and is not used by the current web frontend or backend.

## Requirements

- Node.js 20 or newer and npm.
- MongoDB running locally or a MongoDB connection string.
- Optional: a Gemini or Groq API key for AI analysis.
- Optional: SMTP credentials for password-reset email.

## Local setup

Install root-level and API dependencies, then configure and start the backend.
In PowerShell from the repository root:

```powershell
npm ci
Set-Location backend
npm ci
Copy-Item .env.example .env
npm run dev
```

Edit `backend/.env` if your MongoDB or other configuration differs from the
defaults below. The default database URI is
`mongodb://127.0.0.1:27017/hirelume`. The API listens on port `8000` by
default; verify it at <http://localhost:8000/health>.

To serve the static site locally, open another terminal at the repository root:

```powershell
python -m http.server 5173 --directory frontend
```

Open <http://localhost:5173>. The web client's API URL is selected in
`frontend/api.js`: on localhost it uses `http://localhost:8000`; on other hosts
it currently uses `https://hirelume-api.onrender.com`. The API's default CORS
allowlist includes localhost on port `5173`.

### Mobile prototype

```powershell
Set-Location mobile
npm ci
npm run start
```

The package also defines `npm run android`, `npm run ios`, and `npm run web`.
The API URL defaults in `mobile/src/constants/config.ts` are
`http://10.0.2.2:8000/api` for Android emulators and
`http://localhost:8000/api` for iOS and web. The current mobile authentication
screens are placeholders and do not use that URL yet.

## Environment variables

Copy `backend/.env.example` to `backend/.env`. The API loads it through
`dotenv`. Values in angle brackets below are placeholders; do not commit real
credentials or tokens.

| Variable | Default / example | Purpose |
|---|---|---|
| `NODE_ENV` | unset; use `production` in production | Enables production startup checks. |
| `PORT` | `8000` | HTTP listen port. |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/hirelume` | MongoDB connection URI. |
| `SECRET_KEY` | `<generate-a-long-random-secret>` | HS256 access-token signing key. Must be explicitly set in production. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Access-token lifetime. |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `30` | Refresh-token lifetime. |
| `CORS_ORIGIN` | `http://localhost:5173,http://127.0.0.1:5173,https://hirelume-kappa.vercel.app` | Comma-separated allowed frontend origins. Must be explicitly set in production. |
| `UPLOAD_DIR` | `private/cvs` | Local CV storage directory. |
| `USER_UPLOAD_DIR` | `private/users` | Local avatar storage directory. |
| `MAX_FILE_SIZE_MB` | `5` | Maximum CV and screenshot upload size. |
| `USER_FILE_SIZE_MB` | `2` | Maximum avatar upload size. |
| `CONSENT_VERSION` | `v1` | Version required with public applications. |
| `CONSENT_TEXT` | `I consent to Hirelume storing and processing my application data for recruitment.` | Consent text returned by the public job endpoint. |
| `PUBLIC_RATE_LIMIT` | `60` | Default requests per rate-limit window for routes using the default limiter. |
| `PUBLIC_RATE_WINDOW_MINUTES` | `15` | Default rate-limit window in minutes. |
| `ANALYSIS_PROVIDER` | `none` | Set to `gemini` or `groq` to enable background AI analysis. |
| `ANALYSIS_MAX_ATTEMPTS` | `3` | Maximum attempts for transient analysis failures. |
| `FLOW2_DAILY_LIMIT` | `5` | Daily Flow 2 analysis quota; minimum is one. |
| `GEMINI_API_KEY` | `<your-gemini-api-key>` | Required when `ANALYSIS_PROVIDER=gemini`. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model name. |
| `GROQ_API_KEY` | `<your-groq-api-key>` | Required when `ANALYSIS_PROVIDER=groq`. |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | Groq model name. |
| `FRONTEND_URL` | `https://<your-frontend-host>` | Frontend base URL used to build password-reset links. |
| `SMTP_HOST` | `<smtp-host>` | SMTP host used for password-reset and shortlist emails. |
| `SMTP_PORT` | `587` | SMTP port; port `465` enables TLS mode. |
| `SMTP_USER` | `<smtp-username>` | SMTP authentication username. |
| `SMTP_PASS` | `<smtp-password>` | SMTP authentication password. |
| `EMAIL_FROM` | `<verified-sender-address>` | Sender address for outgoing emails. |
| `MONGODB_TEST_URI` | unset | Optional test-only MongoDB URI. If set, tests clear application collections in this database. |

The `.env.example` file contains the API's default local configuration. The
email-related variables and `FRONTEND_URL` are read directly by their services
and should be added to `.env` when those email flows are used. With
`ANALYSIS_PROVIDER=none`, analysis jobs are not queued and remain pending.

## Running and deploying

Development:

```powershell
Set-Location backend
npm run dev
```

Production API:

```powershell
Set-Location backend
npm start
```

Set `NODE_ENV=production`, a strong `SECRET_KEY`, and the deployed frontend
origin(s) in `CORS_ORIGIN` in the hosting environment before starting. The API
connects to MongoDB and initializes model indexes during startup. Configure
`MONGODB_URI` and enable persistent private storage for `UPLOAD_DIR` and
`USER_UPLOAD_DIR`; local filesystem storage must persist across deployments
because MongoDB stores references to those uploaded files.

The frontend is static and has no build script. `frontend/vercel.json` defines
clean URLs and rewrites; `wrangler.jsonc` points Cloudflare static assets at
`frontend/`. Update the API URL in `frontend/api.js` when deploying to a
different backend host. The mobile project is started separately from
`mobile/`.

### Database migration and seeding

There is no seed script. Register an account through the API to create an
initial user; registration accepts either the `recruiter` or `job_seeker` role.
The API initializes MongoDB indexes on startup.

For an existing database, run the migration once before deploying a version
that requires its index changes:

```powershell
Set-Location backend
npm run migrate
```

The migration removes superseded duplicate analysis-result records and creates
indexes. Back up the database before running it. It is a migration, not a
general-purpose seed command.

## API

Base URL: `http://localhost:8000`. API routes are under `/api`; the health
endpoint is `/health`. For authenticated requests, send the access token using the HTTP `Bearer`
authorization scheme.

Registration and login return an access token, a refresh token, and a public
user object. Refresh and logout use the `refresh_token` in a JSON request body.
Routes marked **Recruiter** or **Job seeker** require both a valid access token
and that account role. **Owner** means the handler checks that the signed-in
user owns the relevant job or application.

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/` | Public | Return service name, version, and links to health/API base paths. |
| `GET` | `/health` | Public | Return API health status. |
| `POST` | `/api/auth/register` | Public | Create a recruiter or job-seeker account. |
| `POST` | `/api/auth/login` | Public | Authenticate and issue access/refresh tokens. |
| `POST` | `/api/auth/refresh` | Public; refresh token required | Revoke the submitted refresh token and issue a new token pair. |
| `POST` | `/api/auth/logout` | Public; refresh token required | Revoke a refresh token. |
| `GET` | `/api/auth/me` | Signed in | Return the current user. |
| `POST` | `/api/auth/forgot-password` | Public | Request a reset email without disclosing whether the account exists. |
| `POST` | `/api/auth/reset-password` | Public | Set a password using a valid reset token. |
| `POST` | `/api/users/me/avatar` | Signed in | Upload an avatar (`multipart/form-data`, field `avatar`). |
| `GET` | `/api/users/me/avatar` | Signed in | Retrieve the current user's avatar. |
| `DELETE` | `/api/users/me/avatar` | Signed in | Remove the current user's avatar. |
| `POST` | `/api/jobs` | Recruiter | Create a job and its public token. |
| `GET` | `/api/jobs` | Recruiter | List the recruiter's jobs. |
| `GET` | `/api/jobs/:id` | Recruiter; owner | Get a job. |
| `PATCH` | `/api/jobs/:id` | Recruiter; owner | Update job fields; requirements lock after an application is submitted. |
| `POST` | `/api/jobs/:id/close` | Recruiter; owner | Close a job. |
| `POST` | `/api/jobs/:id/reopen` | Recruiter; owner | Reopen a job. |
| `GET` | `/api/jobs/:id/applications` | Recruiter; owner | List applicants with status, analysis-status, sort, and pagination filters. |
| `POST` | `/api/applications/link` | Job seeker | Link an application to the signed-in account using its result token and matching email. |
| `DELETE` | `/api/applications/:id` | Signed-in owner or owning recruiter | Delete an application and associated stored CV/results. |
| `GET` | `/api/applications/:id` | Recruiter; job owner | Get applicant details and available analysis. |
| `PATCH` | `/api/applications/:id/status` | Recruiter; job owner | Set status to `shortlisted`, `rejected`, or `undecided`. |
| `GET` | `/api/applications/:id/status-history` | Recruiter; job owner | Read status-change history. |
| `PATCH` | `/api/shortlist/:applicationId/shortlist` | Signed-in recruiter; job owner | Shortlist an application and attempt notification/email delivery. The current controller has an initialization-order error involving `applicant`; this route may return `500` until that is corrected. |
| `GET` | `/api/public/jobs/:token` | Public | Get a public job and its consent text/version. |
| `POST` | `/api/public/jobs/:token/applications` | Public | Submit an application with a PDF or DOCX CV. |
| `GET` | `/api/applications/:id/cv` | Recruiter; job owner | Download an applicant's private CV. |
| `GET` | `/api/results/:token` | Result token; bearer optional | Read result status and, when permitted, result details/feedback. |
| `POST` | `/api/flow2/analyses` | Job seeker | Create a job-fit draft from one job-text, job-link, or screenshot source; CV is optional at this stage. |
| `POST` | `/api/flow2/analyses/:id/confirm` | Job seeker; owner | Confirm extracted/pasted job text; queues analysis if a CV is already attached. |
| `POST` | `/api/flow2/analyses/:id/cv` | Job seeker; owner | Upload a CV for a draft awaiting one; queues analysis when accepted. |
| `POST` | `/api/flow2/analyses/:id/retry` | Job seeker; owner | Retry an analysis in `failed` state. |
| `GET` | `/api/flow2/analyses/:id` | Job seeker; owner | Read a job-fit analysis. |
| `POST` | `/api/ratings` | Signed in | Create or update a 1–5 rating, optionally for an owned application. |
| `POST` | `/api/events` | Optional bearer | Record an event; unauthenticated requests must include `anonymous_id`. |

The CV routes are also mounted as compatibility aliases beneath `/api/cvs`
(for example, `/api/cvs/public/jobs/:token`). Prefer the `/api` paths in the
table. Some authentication and upload routes have tighter per-route rate
limits; the API returns `429` with `detail: "RATE_LIMIT_EXCEEDED"` when a
request limit is exceeded.

### Example: register

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Taylor Candidate",
  "email": "taylor@example.com",
  "password": "<at-least-8-characters>",
  "role": "job_seeker"
}
```

The successful response includes both tokens and the public account fields.
`expires_in` is in seconds (the default access-token lifetime is 86,400
seconds).

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "expires_in": 86400,
  "refresh_token": "<opaque-refresh-token>",
  "user": {
    "id": "<user-id>",
    "name": "Taylor Candidate",
    "email": "taylor@example.com",
    "role": "job_seeker",
    "avatar_filename": null,
    "avatar_mime_type": null,
    "avatar_uploaded_at": null,
    "avatar_url": null
  }
}
```

### Example: create a job

```http
POST /api/jobs
Content-Type: application/json
```

Include the authenticated recruiter's access token using the `Bearer`
authorization scheme.

```json
{
  "title": "Backend Engineer",
  "description": "Build and maintain backend services.",
  "requirements": [
    { "text": "Node.js experience", "requirement_type": "required" },
    { "text": "MongoDB experience", "requirement_type": "nice_to_have" }
  ],
  "feedback_enabled": true,
  "blind_mode": false
}
```

The response includes the job `id`, status, generated `public_token`, job
settings, requirements, and timestamps. Use the token in the public-job URL.

### Example: submit an application

Send `multipart/form-data` with `name`, `email`, `phone`, `consent`,
`consent_version`, optional `feedback_opt_in`, and `cv`. The CV must be a PDF
or DOCX and fit within `MAX_FILE_SIZE_MB`.

```bash
curl -X POST "http://localhost:8000/api/public/jobs/<public_token>/applications" \
  -F "name=Taylor Candidate" \
  -F "email=taylor@example.com" \
  -F "phone=+1-555-0100" \
  -F "consent=true" \
  -F "consent_version=v1" \
  -F "cv=@./resume.pdf;type=application/pdf"
```

Example response:

```json
{
  "application_id": "<application-id>",
  "analysis_status": "pending",
  "result_token": "<private-result-token>",
  "message": "Application received"
}
```

### Flow 2 inputs

`POST /api/flow2/analyses` accepts multipart fields `job_text`, `job_link`,
`screenshots` (up to three images), and optionally `cv`. Provide exactly one
job source. A draft starts in `awaiting_confirmation`; confirm it with at least
50 characters of job text. If no CV was attached, upload one through the
`/:id/cv` endpoint. Flow 2 CVs must be valid PDF or DOCX files. Upload size is
controlled by `MAX_FILE_SIZE_MB`.

## Errors and troubleshooting

The API returns JSON errors, commonly `{ "detail": "ERROR_CODE" }`.
Validation errors use HTTP `422` and include an `errors` array; invalid JSON
returns `400`, unauthorized requests return `401`, role/consent conflicts may
return `403` or `409`, missing resources return `404`, oversized uploads
return `413`, and unexpected server failures return `500` with
`INTERNAL_SERVER_ERROR`. Unknown routes return `ROUTE_NOT_FOUND`.

| Symptom | Check |
|---|---|
| API exits before listening | Confirm MongoDB is reachable and `MONGODB_URI` is correct. In production, explicitly set `SECRET_KEY` and `CORS_ORIGIN`. |
| Browser reports a CORS error | Add the exact web origin to comma-separated `CORS_ORIGIN`, then restart the API. |
| Login works but a private route returns `401` | Send the current access token with the `Bearer` authorization scheme; refresh expired access using the refresh-token endpoint. |
| CV/avatar upload is rejected | Check field names (`cv` or `avatar`), accepted file formats, and configured size limits. |
| Analysis stays pending | `ANALYSIS_PROVIDER` defaults to `none`; choose `gemini` or `groq` and set its matching API key. |
| Password reset email is not delivered | Configure `FRONTEND_URL`, SMTP host/port/user/password, and `EMAIL_FROM`; inspect backend logs and SMTP provider settings. |
| Uploaded files disappear after deployment | Configure persistent private storage for both upload directories; the database stores file paths rather than the file contents. |
| Local mobile app cannot reach API | Use `10.0.2.2` for an Android emulator; device/simulator networking differs from the host browser. |

## Tests

Run the backend test suite:

```powershell
Set-Location backend
npm test
```

Tests use MongoDB Memory Server by default. If `MONGODB_TEST_URI` is set, the
tests use that database and clear collections between cases; never point it at
a development or production database. No root-level test or lint script is
defined.

## Contributing

1. Create a focused branch for your change.
2. Keep changes scoped to the relevant web, API, or mobile surface and follow
   the existing style.
3. Add or update tests for API behavior and run `npm test` from `backend/`.
4. Update this README or the relevant implementation documentation when
   behavior, setup, configuration, or endpoints change.
5. Open a pull request describing the change, verification performed, and any
   configuration or migration impact.

Do not commit `.env` files, API keys, database credentials, uploaded CVs, or
other private applicant data. The route table above reflects the currently
mounted API; older contract/status documents elsewhere in the repository may
not yet describe all implemented routes.