# Appendix A — backend status

Updated 3 October 2026. Flow 2 is intentionally deferred.

## A.1 Backend checklist

| # | Capability | Screen | Status |
|---:|---|:---:|---|
| 1 | Sign up and log in with a role | 1 | Done; refresh, logout, and current-user routes are included |
| 2 | Create, edit, close, and reopen jobs with requirements and feedback settings | 2 | Done |
| 3 | Unguessable link per job | 2 | Done |
| 4 | Open a link without login; distinguish closed and missing jobs | 4 | Done |
| 5 | Apply without login; save consent; refuse duplicates and closed jobs | 4 | Done |
| 6 | Lock the CV after submission | 4 | Done |
| 7 | Analysis status and automatic retry | 3, 4 | Done when Gemini or Groq is configured; pending jobs recover on restart |
| 8 | Private result; conditional guidance; questions always | 6 | Done; feedback requires job permission, applicant opt-in, linked ownership, and authentication |
| 9 | Ranked list with reason, skills, experience, and needs-review flag | 3 | Done after analysis completes |
| 10 | Applicant detail with CV link | 3 | Done |
| 11 | Shortlist or reject, saving actor and time | 3 | Done |
| 12 | Flow 2 analysis | 5, 6 | Deferred by product decision |
| 13 | Stable error codes | All | Done |
| 14 | File limits and rate limits | 4, 5 | Done: size limits cover CVs/avatars; rate limits cover auth, applications, ratings, and events |
| 15 | Store ratings and analytics events | 6 | Done; ratings require authentication and ownership, anonymous events are rate-limited |
| 16 | Blind mode removes identity details before the AI call | 3 | Done |

## A.2 Contract and requirement gaps

| # | Gap | Resolution |
|---:|---|---|
| 1 | Contract lacked fields, status codes, error format, and examples | `API_CONTRACT.md` now documents every implemented route |
| 2 | No route to link an application to a new account | Added `POST /applications/link` with token, email, and role checks |
| 3 | Flow 2 read/confirm-text step | Deferred with Flow 2 |
| 4 | CV download/preview missing from contract and detail | Documented `GET /applications/{id}/cv`; detail now returns `cv_url` |
| 5 | No applicant-data deletion | Added `DELETE /applications/{id}` for the linked applicant or owning recruiter |
| 6 | Applicant list lacked filters, sorting, and paging | Added status/analysis filters, score/date sorting, and bounded paging |
| 7 | Feedback rule not enforced | Results expose feedback only to an authenticated, linked, opted-in applicant when enabled by the job |
| 8 | Logout, refresh, and current-user routes | All implemented |
| 9 | Flow 2 daily quota | Deferred with Flow 2 |
| 10 | Requirement-lock error code | Added `JOB_REQUIREMENTS_LOCKED` |
| 11 | Public job lacked consent wording/version | Both are returned and the submitted version is checked |
| 12 | Ratings/events validation and access rules | Implemented authenticated ratings and rate-limited anonymous events |

## Deployment notes

CV and avatar files use private local storage. A production deployment must attach persistent private storage or replace the storage service with an object-storage adapter. MongoDB schema changes are additive; run `npm run migrate` during deployment to deduplicate legacy analysis results and create the required indexes.

Database integration tests require a disposable `MONGODB_TEST_URI`; the suite deletes that database's collections. See [API_CONTRACT.md](API_CONTRACT.md) for the frontend contract.
