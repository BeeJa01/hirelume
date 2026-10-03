# Hirelume web (frontend starter)

React + TypeScript + Vite + React Router. Covers the web screens the PRD gives Frontend:
Screens 2, 3, 4, the AI offer modal, and the web version of Screen 6.
Screens 1, 5 and 6 for job seekers belong to Mobile (Assumption A7). Sign-up/login is included
because recruiters and the applicant offer both need it.

## Run
```bash
npm install
cp .env.example .env     # VITE_USE_MOCK=true works with no backend
npm run dev
```
Mock mode demo: open `/login` (any email, password of 8+ characters), or the public page at `/j/demo-token`.
Use the email `dup@mail.test` on the apply form to see the duplicate-application error.
Set `VITE_USE_MOCK=false` to call the real backend (`/api` is proxied to `localhost:3000` in dev).

## Routes
| Path | Screen | Notes |
| --- | --- | --- |
| `/login`, `/register` | 1 | `/register?result=<private_token>` is the US-1.4 offer sign-up |
| `/recruiter` | 2 | Jobs list |
| `/recruiter/jobs/new` | 2 | Create job, Required / Nice-to-have list, feedback setting (default On) |
| `/recruiter/jobs/:id` | 2 + 3 | Share link, close/reopen, edit, ranked applicants, filter and sort |
| `/recruiter/applications/:id` | 3 | Requirement table with CV evidence, shortlist / reject / undecide |
| `/j/:token` | 4 | Public job page and application form, then the offer modal |
| `/result/:token` | 6 | Applicant result; interview questions always, score only if opted in |

## Where to change things
- `src/lib/types.ts` and `src/lib/api.ts`: all API shapes. The backend contract has routes only, so field names are proposals (PRD Appendix A, gap 1). Update these two files when Backend sends examples.
- `src/lib/mock.ts`: mock backend used until the real AI pipeline works (Backend stub due Mon 5 Oct).
- `src/lib/scoring.ts`: score formula, level thresholds (Decision 4), applicant-facing level copy (placeholder until Design and Tech Writing deliver).
- `src/lib/events.ts`: front-end analytics events from PRD Section 11.
- `src/styles.css`: temporary neutral theme. Swap the CSS tokens when the Design style guide lands.

## Guardrails from the PRD built in
- No pass/fail words anywhere an applicant can read (`ResultPage`, `APPLICANT_LEVEL`).
- Applicants never see rank or recruiter status.
- Offer modal only when the recruiter allowed feedback (A1). Declining shows interview questions only (A2).
- Requirements lock after the first application; the UI sends only title and description (Decision 2).
- Loading, empty and error states on every list and result; 360 px layout; 44 px tap targets.
- Analytics events never carry CV text or personal details.

## Placeholders to confirm with Backend
- Error shape `{ error: { code, message } }` and codes in `src/lib/errors.ts`.
- `POST /results/{private_token}/link` (new route, Appendix A gap 2, Assumption A3).
- Apply response `{ private_token }`; public job response includes `consent` and `feedback_enabled`.
- List route query options `status` and `sort`; applicant detail includes `cv_url`.
- Logout and refresh are client-side only until those routes exist.

## Not built yet
Flow 2 screens (Mobile), result rating (US-6.4), password reset, blind screening, per-candidate questions, 5-a-day quota display.
