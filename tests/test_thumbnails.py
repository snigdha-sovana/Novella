import os
import pytest
from fastapi.testclient import TestClient
from main import app
from app.routers.books import save_thumbnail_bytes, ALLOWED_EXTENSIONS

client = TestClient(app)


def test_save_thumbnail_bytes():
    dummy_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    book_id = "test_book_123"
    saved_url = save_thumbnail_bytes(dummy_bytes, ".png", book_id)

    assert saved_url.startswith("/static/covers/test_book_123_")
    assert saved_url.endswith(".png")

    # Verify file actually exists on filesystem
    full_path = os.path.join("uploads", "covers", os.path.basename(saved_url))
    assert os.path.exists(full_path)

    # Clean up test file
    if os.path.exists(full_path):
        os.remove(full_path)


def test_static_files_serving():
    dummy_bytes = b"Hello Thumbnail Test Image"
    book_id = "test_static_456"
    saved_url = save_thumbnail_bytes(dummy_bytes, ".jpg", book_id)

    # Fetch via TestClient
    response = client.get(saved_url)
    assert response.status_code == 200
    assert response.content == dummy_bytes

    # Clean up
    full_path = os.path.join("uploads", "covers", os.path.basename(saved_url))
    if os.path.exists(full_path):
        os.remove(full_path)


def test_allowed_extensions_set():
    assert ".jpg" in ALLOWED_EXTENSIONS
    assert ".png" in ALLOWED_EXTENSIONS
    assert ".webp" in ALLOWED_EXTENSIONS
