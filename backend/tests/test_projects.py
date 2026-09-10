import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_projects():
    headers = {"Authorization": "Bearer mock-token"}
    response = client.get("/api/projects", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_create_project():
    headers = {"Authorization": "Bearer mock-token"}
    payload = {
        "space_id": "1",
        "title": "Deep Neural Networks",
        "description": "Transformers and Attention mechanisms"
    }
    response = client.post("/api/projects", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == payload["title"]
