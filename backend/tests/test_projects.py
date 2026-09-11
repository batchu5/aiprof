import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_projects():
    headers = {"Authorization": "Bearer dev-token-test"}
    response = client.get("/api/projects", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)


def test_create_project():
    headers = {"Authorization": "Bearer dev-token-test"}
    # Create space first to get valid space_id
    space_res = client.post("/api/spaces", json={"name": "Project Test Space"}, headers=headers)
    assert space_res.status_code == 200
    space_id = space_res.json()["data"]["id"]

    payload = {
        "space_id": space_id,
        "name": "Deep Neural Networks",
        "description": "Transformers and Attention mechanisms"
    }
    response = client.post("/api/projects", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["name"] == payload["name"]
