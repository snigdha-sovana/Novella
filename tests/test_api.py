import pytest
from fastapi.testclient import TestClient
from main import app
from app.routers.progress import compute_progress_details

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Welcome to BookJournal API"


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


class DummyProgress:
    def __init__(self, id, user_id, book_id, current_page, current_chapter, updated_at=None):
        self.id = id
        self.user_id = user_id
        self.book_id = book_id
        self.current_page = current_page
        self.current_chapter = current_chapter
        self.updated_at = updated_at


class DummyBook:
    def __init__(self, total_pages, total_chapters):
        self.total_pages = total_pages
        self.total_chapters = total_chapters


def test_progress_math_computation():
    prog = DummyProgress("p1", "u1", "b1", current_page=150, current_chapter=5)
    book = DummyBook(total_pages=300, total_chapters=10)

    computed = compute_progress_details(prog, book)
    assert computed["pages_remaining"] == 150
    assert computed["chapters_remaining"] == 5
    assert computed["completion_percentage"] == 50.0

    # Over-reading boundary case test
    prog_over = DummyProgress("p2", "u1", "b1", current_page=350, current_chapter=12)
    computed_over = compute_progress_details(prog_over, book)
    assert computed_over["pages_remaining"] == 0
    assert computed_over["chapters_remaining"] == 0
    assert computed_over["completion_percentage"] == 100.0
