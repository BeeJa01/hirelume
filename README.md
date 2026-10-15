# Hirelume API

Node.js and Express backend for Hirelume. Use Node.js 20.19.4 or newer.

## Run locally

Start MongoDB locally if you have it (after installing MongoDB Community Server). If it is not installed, the API starts an embedded database for local development:

```sh
mkdir -p "$HOME/data/db"
mongod --dbpath "$HOME/data/db" --bind_ip 127.0.0.1
```

In a second terminal, configure and start the API:

```sh
cd backend
cp .env.example .env
npm ci
# Set SECRET_KEY in backend/.env to a long random value.
npm run dev
```

Alternatively, set `MONGODB_URI` in `backend/.env` to your MongoDB Atlas connection string. The API listens on `0.0.0.0:5000`; check `http://localhost:5000/health` to confirm it is running.

To start the mobile app, use a third terminal:

```sh
cd mobile
npx expo start
```

On a physical phone, start Expo in LAN mode (not tunnel). The app uses the same computer IP as Metro, so it can reach `http://<your-computer-LAN-IP>:5000/api`. The phone must be on the same Wi-Fi as the computer. If you need to override that, set `EXPO_PUBLIC_API_URL` in `mobile/.env`. Android emulators use `http://10.0.2.2:5000/api`; iOS simulators can use `http://localhost:5000/api`.

Run backend checks with `npm test` from `backend/`. To run database-backed API tests, set `MONGODB_TEST_URI` to a separate test database URI; those tests clear its collections, not the app database.

The default CORS setting allows Vite at `localhost:5173` and `127.0.0.1:5173`. If your frontend uses another address, add it to `CORS_ORIGIN` in `.env`, separated by commas. Restart the API after changing it.

## Connect the frontend

Set the frontend API base URL to `http://localhost:5000/api`. For Vite, add this to the frontend's `.env`:

```text
VITE_API_BASE_URL=http://localhost:5000/api
```

Public job and application endpoints do not need a login. For recruiter endpoints, send the access token returned by `/auth/login` or `/auth/register`:

```js
fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
	headers: { Authorization: `Bearer ${accessToken}` },
});
```

To submit a CV, send `FormData`; let the browser set the multipart content type:

```js
const form = new FormData();
form.append('name', name);
form.append('email', email);
form.append('phone', phone);
form.append('consent', 'true');
form.append('consent_version', consentVersion);
form.append('cv', file);

fetch(`${import.meta.env.VITE_API_BASE_URL}/public/jobs/${publicToken}/applications`, {
	method: 'POST',
	body: form,
});
```

## Current scope

The backend includes accounts, jobs, authenticated job-description records, CV uploads, CV-versus-job analysis, interview-question generation, public job links, CV applications, recruiter review, and status history. Analysis uses the server-side OpenAI API and requires `OPENAI_API_KEY`.

## Authentication

`POST /api/auth/register` accepts `{ "name", "email", "password", "role" }`; `POST /api/auth/login` accepts `{ "email", "password" }`. Both return a user and a bearer access token. `GET /api/auth/me` returns the current user. Tokens are access-token-only; there is no refresh-token endpoint. Registration and login share a limit of 10 attempts per IP per 15 minutes.

Errors use `{ "success": false, "error": { "code", "message", "details?" } }`. Validation errors include field messages in `error.details`; authentication codes include `EMAIL_ALREADY_EXISTS`, `EMAIL_NOT_FOUND`, and `WRONG_PASSWORD`.

Profile photos are optional. Authenticated `POST /api/auth/me/avatar` accepts a multipart field named `file` (JPEG, PNG, or WebP, maximum 2 MB); `GET /api/auth/me/avatar` serves only the signed-in user's private image, and `DELETE /api/auth/me/avatar` removes it. The current-user payload includes `avatar_url` when a photo is present.

## Job description input

`POST /api/job-descriptions` saves a job description for the authenticated account. Send a bearer access token and a JSON body containing `rawText` (50–50,000 characters); optional fields are `title` and `company`. New records use `source: "text"` by default; image text reviewed in the mobile app is saved with `source: "image"`. The endpoint returns `id`, `source`, `rawText`, `title`, `company`, and `createdAt`.

Example Thunder Client request:

```http
POST http://localhost:5000/api/job-descriptions
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "rawText": "We are looking for an experienced software engineer to build and maintain customer-facing services. The role requires JavaScript, API design, testing, and collaboration with product and design teams."
}
```

Too-short text returns `422` with `{ "success": false, "error": { "code": "JOB_DESCRIPTION_TOO_SHORT", "message": "..." } }`; invalid fields use `VALIDATION_ERROR`. Authentication failures use the same `{ success: false, error: { code, message } }` envelope.

### Screenshot OCR

`POST /api/job-descriptions/images/extract` accepts one to five JPEG, PNG, or WebP images as multipart fields named `images`. Each file is limited to 5 MB. The authenticated endpoint returns `{ "rawText": "..." }` for review and does not save it; save the reviewed text with `POST /api/job-descriptions` and `source: "image"`.

Example Thunder Client request:

```http
POST http://localhost:5000/api/job-descriptions/images/extract
Authorization: Bearer <access-token>
Content-Type: multipart/form-data
```

Add one or more `images` file fields with valid screenshots. Errors use `{ "success": false, "error": { "code": "...", "message": "..." } }`; relevant codes include `UNSUPPORTED_FILE_TYPE`, `FILE_TOO_LARGE`, `TOO_MANY_IMAGES`, `NO_TEXT_FOUND`, and `OCR_FAILED`.

### Job-page link extraction

`POST /api/job-descriptions/links/extract` accepts an authenticated JSON body with a public `http` or `https` job-posting URL. The backend follows at most five redirects, blocks private/internal addresses at every hop, applies a 12-second timeout and 3 MB HTML limit, and extracts readable job-posting text for review. It does not save the extracted draft. Save confirmed text with `POST /api/job-descriptions` and `source: "link"`.

Example Thunder Client request:

```http
POST http://localhost:5000/api/job-descriptions/links/extract
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "url": "https://careers.example.com/jobs/software-engineer"
}
```

Successful responses contain `{ "rawText": "..." }`. Failures use the standard error envelope and specific codes: `INVALID_URL`, `LINK_UNREACHABLE`, `LINK_TIMEOUT`, `LOGIN_REQUIRED`, `CONTENT_NOT_FOUND`, or `NOT_A_JOB_POSTING`. Pages that require JavaScript, authentication, or otherwise cannot provide reliable posting text should be entered by pasting the text or uploading a screenshot.

## Data and configuration

The app connects to MongoDB using `MONGODB_URI`. Keep the database connection string, `SECRET_KEY`, and `OPENAI_API_KEY` in `backend/.env`, never in Git. The backend uses `SECRET_KEY` for both token signing and verification. Analysis uses `OPENAI_MODEL` (defaults to `gpt-4o-mini`) and sends CV text with email addresses, phone numbers, and street-address patterns removed.

Set a strong `SECRET_KEY` and the deployed frontend's origin in `CORS_ORIGIN` before deployment. Never commit `.env`, database files, uploaded CVs, or credentials.

### CV upload and resume analysis

`POST /api/cvs/active` accepts one multipart file field named `file` (PDF, DOCX, JPEG, PNG, or WebP; maximum 5 MB). The API extracts text, stores the CV privately, and replaces the user's active CV. `GET /api/cvs/active` returns active CV metadata without its extracted text; `DELETE /api/cvs/active` removes it.

Example Thunder Client request:

```http
POST http://localhost:5000/api/cvs/active
Authorization: Bearer <access-token>
Content-Type: multipart/form-data
```

Attach a PDF, DOCX, or image as the `file` field.

`POST /api/analyses` accepts `{ "cvId": "<active-cv-id>", "jobDescriptionId": "<saved-job-description-id>" }`. It compares the owned CV and job description using the configured AI provider, validates the structured response, stores it, and returns the score, category breakdown, matched/missing keywords, strengths, gaps, and suggestions.

`POST /api/analyses/:analysisId/questions` generates and stores exactly three technical, three behavioral, and three CV-gap interview questions, each with an answer tip. `GET /api/analyses/:analysisId` returns a saved analysis; `GET /api/analyses` returns the user's 50 most recent analyses.

AI errors use the shared error envelope and distinguish missing server configuration (`AI_NOT_CONFIGURED`), provider timeouts (`AI_TIMEOUT`), provider rate limits (`AI_RATE_LIMITED`), and malformed structured results (`AI_INVALID_RESPONSE`). Text-based PDFs, DOCX files, and CV photos can be read; scanned PDFs without an embedded text layer currently return `EMPTY_CV` and should be uploaded as a photo or converted to a text-searchable PDF.

## Code layout

- `src/config` — environment settings and MongoDB connection
- `src/models` — MongoDB models
- `src/controllers` — API request handlers
- `src/routes` — API endpoints
- `src/middleware` — authentication, roles, uploads, and errors
- `src/services` — CV storage and parsing, job-description extraction, and AI analysis
- `src/utils` — shared helpers
- `private/cvs` — uploaded CVs; private and excluded from Git
- `tests` — application, CV, and blind-mode tests

Copy `backend/.env.example` to `backend/.env` for local settings. Keep `.env` and database credentials out of Git.
