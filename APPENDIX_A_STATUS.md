# Appendix A Backend Status

Based on Product Definition Pack v1.0.

| # | Appendix A item | Status | Backend note |
|---|---|---|---|
| 1 | Sign up / log in with roles | YES | JWT auth + recruiter/job seeker roles |
| 2 | Create/edit/close job, requirements, feedback setting | YES | Requirements lock after first application |
| 3 | Unique hard-to-guess job link | YES | Random public token |
| 4 | Public job link | YES | Public job endpoint |
| 5 | No-login application + consent + duplicate/closed checks | YES | Multipart application endpoint |
| 6 | CV lock after submission | YES | `cv_locked=true` and no applicant edit endpoint |
| 7 | Analysis status + automatic retry | NEEDS WORK | Status fields exist; worker/retry queue still needed |
| 8 | Private result token + feedback rules + interview questions | NEEDS WORK | Token/result route exists; full feedback/question generation pending |
| 9 | Ranked applicants + explanation data | NEEDS WORK | Applicant list exists; real analysis/ranking still pending |
| 10 | Applicant detail + private CV access | YES | Ownership-scoped detail + CV endpoint implemented |
| 11 | Recruiter status changes + actor/time audit | YES | Status endpoint + audit history implemented |
| 12 | Flow 2 analysis | NEEDS WORK | Endpoint scaffolded; persistence/AI processing pending |
| 13 | Required error codes | NEEDS WORK | Stable code catalogue documented; response standardisation still needed |
| 14 | File and rate limits | NEEDS WORK | 5 MB CV validation exists; Flow 2 daily quota enforcement pending |
| 15 | Ratings + analytics events | NEEDS WORK | Basic endpoints exist; complete event ownership/analytics implementation pending |
| 16 | Blind mode preprocessing | NEEDS WORK | Field exists; preprocessing not implemented |
