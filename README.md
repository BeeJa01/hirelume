# Hirelume API

Node.js and Express backend for the Hirelume frontend. Requires Node.js 20 or newer.

## Run locally

```powershell
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

Make sure MongoDB is running locally, or set `MONGODB_URI` in `.env` to your MongoDB Atlas connection string. The API is at `http://localhost:8000`; check `/health` to see if it is running. Run `npm test` for the local checks. To run the database-backed API tests, set `MONGODB_TEST_URI` to a separate test database URI; those tests clear its collections, not the app database.

The default CORS setting allows Vite at `localhost:5173` and `127.0.0.1:5173`. If your frontend uses another address, add it to `CORS_ORIGIN` in `.env`, separated by commas. Restart the API after changing it.

## Connect the frontend

Set the frontend API base URL to `http://localhost:8000/api`. For Vite, add this to the frontend's `.env`:

```text
VITE_API_BASE_URL=http://localhost:8000/api
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

See [API_CONTRACT.md](API_CONTRACT.md) for endpoints and request fields.

## Current scope

The first stage includes accounts, jobs, public job links, CV applications, recruiter review, and status history. AI analysis, Flow 2, ratings, and analytics are not wired up yet.

## Data and configuration

The app connects to MongoDB using `MONGODB_URI`. The example uses a local MongoDB server. For team development, use a shared MongoDB Atlas database and keep its connection string in `.env`, never in Git.

Set a strong `SECRET_KEY` and the deployed frontend's origin in `CORS_ORIGIN` before deployment. Never commit `.env`, database files, uploaded CVs, or credentials.

## Code layout

- `src/config` — environment settings and MongoDB connection
- `src/models` — MongoDB models
- `src/controllers` — API request handlers
- `src/routes` — API endpoints
- `src/middleware` — authentication, roles, uploads, and errors
- `src/services` — CV storage; parsing and blind mode are not implemented yet
- `src/utils` — shared helpers
- `private/cvs` — uploaded CVs; private and excluded from Git
- `tests` — application, CV, and blind-mode tests

Copy `.env.example` to `.env` for local settings. Keep `.env` and database credentials out of Git.
