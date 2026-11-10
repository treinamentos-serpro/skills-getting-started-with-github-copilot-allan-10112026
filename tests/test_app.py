from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app


@pytest.fixture(autouse=True)
def restore_activities():
    original_activities = deepcopy(activities)
    yield
    activities.clear()
    activities.update(original_activities)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_root_redirects_to_static_index(client):
    response = client.get("/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_activity_details(client):
    response = client.get("/activities")

    assert response.status_code == 200
    assert response.json() == activities
    for activity in response.json().values():
        assert set(activity) == {"description", "schedule", "max_participants", "participants"}


def test_signup_adds_participant(client):
    email = "new-student@mergington.edu"

    response = client.post("/activities/Art%20Club/signup", params={"email": email})

    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for Art Club"}
    assert email in activities["Art Club"]["participants"]


def test_signup_rejects_duplicate_without_changing_participants(client):
    activity_name = "Chess Club"
    email = activities[activity_name]["participants"][0]
    participants_before = activities[activity_name]["participants"].copy()

    response = client.post(
        f"/activities/{activity_name.replace(' ', '%20')}/signup",
        params={"email": email},
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Student already signed up for this activity"}
    assert activities[activity_name]["participants"] == participants_before


def test_signup_returns_not_found_for_unknown_activity(client):
    response = client.post(
        "/activities/Unknown%20Club/signup",
        params={"email": "new-student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}


def test_remove_signup_removes_participant(client):
    activity_name = "Chess Club"
    email = activities[activity_name]["participants"][0]

    response = client.delete(
        f"/activities/{activity_name.replace(' ', '%20')}/signup",
        params={"email": email},
    )

    assert response.status_code == 200
    assert response.json() == {"message": f"Removed {email} from {activity_name}"}
    assert email not in activities[activity_name]["participants"]


def test_remove_signup_returns_not_found_for_unknown_activity(client):
    response = client.delete(
        "/activities/Unknown%20Club/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}


def test_remove_signup_returns_not_found_for_unregistered_participant(client):
    activity_name = "Chess Club"
    participants_before = activities[activity_name]["participants"].copy()

    response = client.delete(
        f"/activities/{activity_name.replace(' ', '%20')}/signup",
        params={"email": "not-registered@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Student is not signed up for this activity"}
    assert activities[activity_name]["participants"] == participants_before


@pytest.mark.parametrize("method", ["post", "delete"])
def test_signup_routes_require_email(client, method):
    response = getattr(client, method)("/activities/Art%20Club/signup")

    assert response.status_code == 422
