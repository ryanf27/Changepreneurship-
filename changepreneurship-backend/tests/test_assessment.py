from datetime import datetime, timedelta

from src.models.assessment import (
    Assessment,
    AssessmentResponse,
    User,
    UserSession,
    db,
)



def test_save_response_updates_existing_response(app, client):
    with app.app_context():
        user = User(username="tester", email="tester@example.com", password_hash="hashed")
        db.session.add(user)
        db.session.flush()

        session = UserSession(
            user_id=user.id,
            session_token="test-token",
            expires_at=datetime.utcnow() + timedelta(days=1),
            is_active=True,
        )
        db.session.add(session)

        assessment = Assessment(
            user_id=user.id,
            phase_id="self_discovery",
            phase_name="Self Discovery",
            started_at=datetime.utcnow(),
        )
        db.session.add(assessment)
        db.session.flush()

        existing_response = AssessmentResponse(
            assessment_id=assessment.id,
            section_id="section-1",
            question_id="q1",
            question_text="Original question",
            response_type="text",
        )
        existing_response.set_response_value("Original answer")
        db.session.add(existing_response)
        db.session.commit()

        assessment_id = assessment.id
        question_id = existing_response.question_id

    payload = {
        "section_id": "section-1",
        "question_id": question_id,
        "question_text": "Updated question",
        "response_type": "json",
        "response_value": {"answer": ["A", "B"]},
    }
    headers = {"Authorization": "Bearer test-token"}

    response = client.post(
        f"/api/assessment/{assessment_id}/response",
        json=payload,
        headers=headers,
    )

    assert response.status_code == 200

    with app.app_context():
        updated_response = AssessmentResponse.query.filter_by(
            assessment_id=assessment_id, question_id=question_id
        ).one()

        assert updated_response.response_type == "json"
        assert updated_response.question_text == "Updated question"
        assert updated_response.get_response_value() == {"answer": ["A", "B"]}
        assert updated_response.updated_at is not None
