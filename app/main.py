from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, jobs, public_jobs, applications, recruiter, flow2, ratings, events
from app.routers import results

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hirelume API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to the deployed frontend origin before production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(public_jobs.router, prefix="/api/public/jobs", tags=["Public Jobs"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(results.router, prefix="/api/results", tags=["Private Results"])
app.include_router(recruiter.router, prefix="/api/recruiter", tags=["Recruiter"])
app.include_router(flow2.router, prefix="/api/flow2", tags=["Flow 2"])
app.include_router(ratings.router, prefix="/api/ratings", tags=["Ratings"])
app.include_router(events.router, prefix="/api/events", tags=["Events"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "hirelume-backend", "version": app.version}
