import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_spaces():
    headers = {"Authorization": "Bearer mock-token"}
    response = client.get("/api/spaces", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_create_space():
    headers = {"Authorization": "Bearer mock-token"}
    payload = {
        "title": "Quantum Physics",
        "description": "Quantum mechanics and wave functions"
    }
    response = client.post("/api/spaces", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == payload["title"]
