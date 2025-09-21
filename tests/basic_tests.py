# tests/test_basic.py
import pytest
from app import create_app, db

@pytest.fixture
def client():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"
    })

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client

def test_homepage(client):
    response = client.get("/")
    assert response.status_code == 200
