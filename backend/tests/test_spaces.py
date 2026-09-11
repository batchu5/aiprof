import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_spaces():
    headers = {"Authorization": "Bearer dev-token-test"}
    response = client.get("/api/spaces", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "spaces" in data["data"]


def test_create_space():
    headers = {"Authorization": "Bearer dev-token-test"}
    payload = {
        "name": "Quantum Physics",
        "description": "Quantum mechanics and wave functions"
    }
    response = client.post("/api/spaces", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["name"] == payload["name"]
