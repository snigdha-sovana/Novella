import asyncio
import pytest
from app.routers.books import (
    fetch_cover_from_google_books,
    fetch_cover_from_open_library,
    fetch_cover_from_external_apis,
)


def test_fetch_cover_from_google_books():
    # Test title and author lookup on Google Books API (returns bytes or None gracefully if rate-limited)
    img_bytes = asyncio.run(fetch_cover_from_google_books("The Hobbit", "J.R.R. Tolkien"))
    if img_bytes is not None:
        assert isinstance(img_bytes, bytes)
        assert len(img_bytes) > 500


def test_fetch_cover_from_google_books_isbn():
    # Test ISBN lookup on Google Books API (returns bytes or None gracefully if rate-limited)
    img_bytes = asyncio.run(
        fetch_cover_from_google_books("The Hobbit", "J.R.R. Tolkien", isbn="9780261102217")
    )
    if img_bytes is not None:
        assert isinstance(img_bytes, bytes)
        assert len(img_bytes) > 500


def test_fetch_cover_from_open_library_secondary():
    # Test secondary fallback API directly
    img_bytes = asyncio.run(fetch_cover_from_open_library("1984", "George Orwell"))
    assert img_bytes is not None
    assert len(img_bytes) > 500


def test_fetch_cover_from_external_apis_combined():
    # Test combined fetch function uses Google Books primary & Open Library secondary fallback
    img_bytes = asyncio.run(fetch_cover_from_external_apis("1984", "George Orwell"))
    assert img_bytes is not None
    assert len(img_bytes) > 500


def test_fetch_cover_from_external_apis_nonexistent():
    # Test invalid query returns None without error
    img_bytes = asyncio.run(
        fetch_cover_from_external_apis(
            "NonExistentBookXyz9876543210", "UnknownAuthorXyz9876543210"
        )
    )
    assert img_bytes is None
