# Hirelume API

Node.js and Express backend for the Hirelume frontend. Requires Node.js 20 or newer.

## Run locally

```powershell
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

Make sure MongoDB is running locally, or set `MONGODB_URI` in `.env` to your MongoDB Atlas connection string. The API is at `http://localhost:8000`; check `/health` to see if it is running. Run `npm test` for the local checks. To run the database-backed API tests, set `MONGODB_TEST_URI` to a separate test database URI before running the tests; those tests clear their collections.

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

The app connects to MongoDB using `MONGODB_URI`. The example uses a local MongoDB server. For team development, use a shared MongoDB Atlas database and keep its connection string in `.env`, never in Git. The old local SQLite database is not used; it was empty when we switched.

Set a strong `SECRET_KEY` and the deployed frontend's origin in `CORS_ORIGIN` before deployment. Never commit `.env`, database files, uploaded CVs, or credentials.

## Code layout

- `src/core` — server, database, authentication, jobs
- `src/cv-pipeline` — applications, recruiter review, results
- `src/privacy-files` — private CV storage
- `src/ai-scoring` — reserved for AI work
- `src/flow2` — reserved for Flow 2
- `src/api-quality` — tests
