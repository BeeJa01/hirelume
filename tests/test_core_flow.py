import unittest
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Application


class CoreFlowTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        self.session_factory = sessionmaker(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)

        def override_get_db():
            session = self.session_factory()
            try:
                yield session
            finally:
                session.close()

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

    def tearDown(self):
        session = self.session_factory()
        try:
            for application in session.query(Application).all():
                Path(application.cv_path).unlink(missing_ok=True)
        finally:
            session.close()
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def register_recruiter(self, email="recruiter@example.com"):
        response = self.client.post(
            "/api/auth/register",
            json={
                "name": "Test Recruiter",
                "email": email,
                "password": "test-password-123",
                "role": "recruiter",
            },
        )
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["access_token"]

    def create_job(self, token):
        response = self.client.post(
            "/api/jobs",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Backend Engineer",
                "description": "Build and maintain backend services.",
                "requirements": [{"text": "Python experience"}],
            },
        )
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def apply(self, token, email="candidate@example.com"):
        return self.client.post(
            f"/api/public/jobs/{token}/applications",
            data={
                "name": "Test Candidate",
                "email": email,
                "phone": "555-0100",
                "consent": "true",
                "consent_version": "v1",
            },
            files={"cv": ("resume.pdf", b"%PDF-1.4 test", "application/pdf")},
        )

    def test_recruiter_candidate_workflow(self):
        token = self.register_recruiter()
        headers = {"Authorization": f"Bearer {token}"}
        job = self.create_job(token)

        public_job = self.client.get(f"/api/public/jobs/{job['public_token']}")
        self.assertEqual(public_job.status_code, 200)

        application = self.apply(job["public_token"])
        self.assertEqual(application.status_code, 200, application.text)
        application_data = application.json()
        application_id = application_data["application_id"]

        self.assertEqual(
            self.client.get("/api/auth/me", headers=headers).status_code,
            200,
        )
        self.assertEqual(
            self.client.get(f"/api/applications/{application_id}", headers=headers).status_code,
            200,
        )
        self.assertEqual(
            self.client.get(f"/api/applications/{application_id}/cv", headers=headers).status_code,
            200,
        )

        status = self.client.patch(
            f"/api/applications/{application_id}/status",
            headers=headers,
            json={"status": "shortlisted"},
        )
        self.assertEqual(status.status_code, 200, status.text)
        history = self.client.get(
            f"/api/applications/{application_id}/status-history", headers=headers
        )
        self.assertEqual(history.status_code, 200)
        self.assertEqual(len(history.json()), 1)

        result = self.client.get(f"/api/results/{application_data['result_token']}")
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(result.json()["analysis_status"], "pending")

    def test_rejects_oversized_password_and_duplicate_application(self):
        too_long = self.client.post(
            "/api/auth/register",
            json={
                "name": "Test Recruiter",
                "email": "long-password@example.com",
                "password": "x" * 73,
                "role": "recruiter",
            },
        )
        self.assertEqual(too_long.status_code, 422)

        token = self.register_recruiter()
        job = self.create_job(token)
        first = self.apply(job["public_token"])
        duplicate = self.apply(job["public_token"])
        self.assertEqual(first.status_code, 200, first.text)
        self.assertEqual(duplicate.status_code, 409)

    def test_rejects_invalid_application_uploads(self):
        token = self.register_recruiter()
        job = self.create_job(token)
        url = f"/api/public/jobs/{job['public_token']}/applications"
        form = {
            "name": "Test Candidate",
            "email": "candidate@example.com",
            "phone": "555-0100",
            "consent": "false",
            "consent_version": "v1",
        }

        no_consent = self.client.post(
            url,
            data=form,
            files={"cv": ("resume.pdf", b"%PDF-1.4 test", "application/pdf")},
        )
        self.assertEqual(no_consent.status_code, 400)

        unsupported = self.client.post(
            url,
            data={**form, "consent": "true"},
            files={"cv": ("resume.txt", b"resume", "text/plain")},
        )
        self.assertEqual(unsupported.status_code, 400)

        too_large = self.client.post(
            url,
            data={**form, "consent": "true"},
            files={"cv": ("resume.pdf", b"x" * (5 * 1024 * 1024 + 1), "application/pdf")},
        )
        self.assertEqual(too_large.status_code, 413)

    def test_recruiter_cannot_read_another_recruiters_job_or_application(self):
        owner_token = self.register_recruiter()
        job = self.create_job(owner_token)
        application = self.apply(job["public_token"])
        self.assertEqual(application.status_code, 200, application.text)

        other_token = self.register_recruiter("other@example.com")
        other_headers = {"Authorization": f"Bearer {other_token}"}
        self.assertEqual(
            self.client.get(f"/api/jobs/{job['id']}", headers=other_headers).status_code,
            404,
        )
        self.assertEqual(
            self.client.get(
                f"/api/applications/{application.json()['application_id']}",
                headers=other_headers,
            ).status_code,
            404,
        )


if __name__ == "__main__":
    unittest.main()