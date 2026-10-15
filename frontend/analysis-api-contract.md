# HireLume: "Check your fit" (job seeker standalone) - API contract

For the backend dev. The frontend pages are already built against this. None of these routes exist in the backend yet.
If a path or field name changes, tell the frontend dev: it is a one-place change in `api.js` (`seekerFlow.paths`).

Rules for all routes: JWT `Authorization: Bearer`, role `job_seeker` only, errors as `{ "detail": "CODE" }`, snake_case, same style as the existing API.

## Daily limit
5 analyses per user per day, resets at midnight (Africa/Lagos). Over the limit -> `429 DAILY_LIMIT_REACHED`. Only `POST /api/analyses` counts.

## 1. List my analyses  `GET /api/analyses?limit=3`
```json
{ "quota": { "limit": 5, "used": 2, "remaining": 3 },
  "analyses": [ { "id": "...", "status": "completed", "job_title": "Business Development Officer",
                  "company": "Greenfield Agro Ltd", "score": 67, "match_level": "good", "created_at": "2026-10-01T09:00:00Z" } ] }
```
Newest first. `limit` optional (default 20). `status`: `pending | processing | completed | failed`.
`match_level`: `strong | good | partial` (the design shows Strong / Good / Partial).

## 2. Read the job from screenshots  `POST /api/analyses/job/screenshots`
`multipart/form-data`, field `images` (1 to 3 files, JPG or PNG, 5 MB each) -> `{ "text": "..." }`
Errors: `JOB_IMAGES_REQUIRED`, `JOB_IMAGE_UNSUPPORTED`, `JOB_IMAGE_TOO_LARGE`, `JOB_TEXT_NOT_READABLE`.
Needs OCR or a vision model (a text-only model cannot read images). Does not count towards the daily limit.

## 3. Read the job from a link  `POST /api/analyses/job/link`
`{ "url": "https://..." }` -> `{ "text": "..." }`. Errors: `JOB_LINK_INVALID`, `JOB_LINK_NOT_READABLE` (login walls, empty pages).

## 4. Check the CV (optional)  `POST /api/analyses/cv/check`
`multipart`, field `cv` -> `{ "readable": true }`. Error: `CV_NOT_READABLE`, plus the existing `CV_UNSUPPORTED_FORMAT`, `CV_EMPTY`, `CV_TOO_LARGE`.
Used to show the green "Readable" tick. If you do not build it, the page just hides the tick.

## 5. Start an analysis  `POST /api/analyses`
`multipart`: `job_text` (string), `source` (`text | screenshot | link`), `cv` (file).
CV types per the design: PDF, Word (.docx) or image, 5 MB max, English.
Response `201`: `{ "id": "...", "status": "pending" }`. Run the analysis in the background (as `queueAnalysis` does today).
Errors: `DAILY_LIMIT_REACHED`, `JOB_TEXT_REQUIRED`, `JOB_TEXT_TOO_SHORT`, `CV_REQUIRED`, `CV_NOT_READABLE`, the existing `CV_*` codes.
Privacy (shown on the page): send only the CV content and job text to the AI, never email, phone or address.

## 6. Get one analysis  `GET /api/analyses/:id`
Only the owner. Not found / not yours -> `404 ANALYSIS_NOT_FOUND`.
```json
{ "id": "...", "status": "completed", "step": 3,
  "job_title": "Business Development Officer", "company": "Greenfield Agro Ltd",
  "source": "text", "created_at": "2026-10-01T09:00:00Z",
  "score": 67, "match_level": "good",
  "reason": "You meet three of the five Required skills fully and two partly...",
  "requirements": [ { "text": "2+ years in sales or business development", "type": "required",
                      "result": "met", "evidence": "3 years as a Sales Representative" } ],
  "matched_skills": ["Sales experience"], "missing_skills": ["Agribusiness knowledge"],
  "tips": ["Add one proposal you wrote, and the result."],
  "next_steps": [ { "title": "Update your CV", "detail": "Use the tips next to this." } ],
  "questions": [ { "group": "about_role", "text": "Why do you want to work in business development for an agribusiness?" } ] }
```
- `step` (1 to 4) is optional while `pending/processing`: 1 reading CV, 2 reading job, 3 comparing, 4 writing results.
- `requirements[].type`: `required | nice_to_have`. `requirements[].result`: `met | partly_met | not_found`. Required skills count double in the score.
- `questions[].group`: `about_role | your_experience | gaps`. 8 to 10 questions in total.
- `job_title` and `company` are read from the job text by the AI, so they are available as soon as it has run.
- While not completed, the result fields can be missing. When `status` is `failed`, the page offers "Try again".

## 7. Try again  `POST /api/analyses/:id/retry`
Only for `failed` analyses, owner only. Re-runs the AI step on the stored job text and CV. -> `{ "id": "...", "status": "pending" }`. Does not use another daily analysis.

## Already existing and reused
`POST /api/events` for the "Helpful / Not helpful" buttons (names `analysis_result_feedback`, `analysis_questions_feedback`).
