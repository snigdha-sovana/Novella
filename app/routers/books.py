import os
import uuid
import urllib.parse
from typing import List, Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_

from app.database import get_db
from app.models import Book, Profile
from app.schemas import BookCreate, BookOut, ThumbnailSyncResponse
from app.core.security import get_current_user, CurrentUser

router = APIRouter(prefix="/books", tags=["Books Catalog"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
UPLOAD_DIR = "uploads/covers"


def get_default_cover(title: str) -> str:
    encoded_title = urllib.parse.quote(title)
    return f"https://via.placeholder.com/300x450/1e293b/f8fafc?text={encoded_title}"


def save_thumbnail_bytes(image_bytes: bytes, ext: str, book_id: str) -> str:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    clean_ext = ext.lower() if ext.startswith(".") else f".{ext.lower()}"
    filename = f"{book_id}_{uuid.uuid4().hex[:8]}{clean_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(image_bytes)
    return f"/static/covers/{filename}"


async def fetch_cover_from_google_books(
    title: str, author: str, isbn: Optional[str] = None
) -> Optional[bytes]:
    """Fetch cover thumbnail image bytes from Google Books API (Primary API)."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, headers=headers) as client:
        search_url = "https://www.googleapis.com/books/v1/volumes"
        
        # Build search query: use ISBN if available, otherwise title + author
        if isbn and isbn.strip():
            query = f"isbn:{isbn.strip()}"
        elif title and author:
            query = f'intitle:"{title.strip()}" inauthor:"{author.strip()}"'
        elif title:
            query = f'intitle:"{title.strip()}"'
        else:
            return None

        params = {"q": query, "maxResults": 1}
        resp = await client.get(search_url, params=params)
        if resp.status_code != 200:
            return None

        data = resp.json()
        items = data.get("items", [])
        if not items and isbn:
            # Fallback if ISBN search yielded no hits: search title & author
            query = f'intitle:"{title.strip()}" inauthor:"{author.strip()}"'
            resp = await client.get(search_url, params={"q": query, "maxResults": 1})
            if resp.status_code == 200:
                items = resp.json().get("items", [])

        if not items:
            return None

        volume_info = items[0].get("volumeInfo", {})
        image_links = volume_info.get("imageLinks", {})

        # Try largest resolution cover first down to smallThumbnail
        img_url = (
            image_links.get("extraLarge")
            or image_links.get("large")
            or image_links.get("medium")
            or image_links.get("small")
            or image_links.get("thumbnail")
            or image_links.get("smallThumbnail")
        )
        if not img_url:
            return None

        # Standardize HTTP to HTTPS for Google Books images
        img_url = img_url.replace("http://", "https://")
        img_resp = await client.get(img_url)
        if img_resp.status_code == 200 and len(img_resp.content) > 500:
            return img_resp.content

        return None


async def fetch_cover_from_open_library(
    title: str, author: str, isbn: Optional[str] = None
) -> Optional[bytes]:
    """Fetch cover thumbnail image bytes from Open Library API (Secondary Fallback API)."""
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        # If ISBN is available, check Open Library covers by ISBN directly
        if isbn and isbn.strip():
            clean_isbn = isbn.strip()
            cover_url = f"https://covers.openlibrary.org/b/isbn/{clean_isbn}-L.jpg"
            img_resp = await client.get(cover_url)
            if img_resp.status_code == 200 and len(img_resp.content) > 500:
                return img_resp.content

        search_url = "https://openlibrary.org/search.json"
        params = {"title": title, "author": author, "limit": 1}
        resp = await client.get(search_url, params=params)
        if resp.status_code != 200:
            return None
        
        data = resp.json()
        docs = data.get("docs", [])
        if not docs:
            # Fallback search by title only
            resp = await client.get(search_url, params={"title": title, "limit": 1})
            if resp.status_code != 200:
                return None
            docs = resp.json().get("docs", [])
            if not docs:
                return None

        cover_i = docs[0].get("cover_i")
        if not cover_i:
            return None

        cover_url = f"https://covers.openlibrary.org/b/id/{cover_i}-L.jpg"
        img_resp = await client.get(cover_url)
        if img_resp.status_code == 200 and len(img_resp.content) > 500:
            return img_resp.content
        return None


async def fetch_cover_from_external_apis(
    title: str, author: str, isbn: Optional[str] = None
) -> Optional[bytes]:
    """
    Auto-fetch book thumbnail cover bytes using Google Books as primary API,
    falling back to Open Library as secondary API.
    """
    # 1. Primary: Google Books API
    img_bytes = await fetch_cover_from_google_books(title=title, author=author, isbn=isbn)
    if img_bytes:
        return img_bytes

    # 2. Secondary Fallback: Open Library API
    img_bytes = await fetch_cover_from_open_library(title=title, author=author, isbn=isbn)
    if img_bytes:
        return img_bytes

    return None


@router.get("", response_model=List[BookOut])
async def list_books(
    q: Optional[str] = Query(None, description="Search query for title or author"),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    query = select(Book)
    if q:
        search_pattern = f"%{q}%"
        query = query.where(
            or_(Book.title.ilike(search_pattern), Book.author.ilike(search_pattern))
        )
    query = query.offset(skip).limit(limit).order_by(Book.created_at.desc())
    result = await db.execute(query)
    books = result.scalars().all()
    return books


@router.post("/sync-thumbnails", response_model=ThumbnailSyncResponse)
async def sync_all_thumbnails(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Batch fetch missing thumbnails for all books in catalog using Google Books (primary) & Open Library (secondary)."""
    res = await db.execute(select(Book))
    books = res.scalars().all()
    
    updated_count = 0
    failed_count = 0

    for book in books:
        # Check if cover is missing or placeholder
        is_placeholder = not book.cover_url or "via.placeholder.com" in book.cover_url
        if is_placeholder:
            try:
                img_bytes = await fetch_cover_from_external_apis(book.title, book.author, book.isbn)
                if img_bytes:
                    saved_path = save_thumbnail_bytes(img_bytes, ".jpg", book.id)
                    book.cover_url = saved_path
                    updated_count += 1
                else:
                    failed_count += 1
            except Exception:
                failed_count += 1

    if updated_count > 0:
        await db.commit()

    return ThumbnailSyncResponse(
        total_books=len(books),
        updated_count=updated_count,
        failed_count=failed_count,
        message=f"Synced thumbnails: {updated_count} updated, {failed_count} skipped/failed out of {len(books)} books.",
    )


@router.get("/{book_id}", response_model=BookOut)
async def get_book(book_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return book


@router.post("", response_model=BookOut, status_code=status.HTTP_201_CREATED)
async def add_book(
    book_in: BookCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    prof_res = await db.execute(select(Profile).where(Profile.id == current_user.id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        profile = Profile(id=current_user.id, username=current_user.email.split("@")[0])
        db.add(profile)
        await db.commit()

    cover_url = book_in.cover_url
    if not cover_url or not cover_url.strip():
        # Attempt auto-fetch cover thumbnail first (Google Books primary, Open Library secondary)
        try:
            img_bytes = await fetch_cover_from_external_apis(book_in.title, book_in.author, book_in.isbn)
            if img_bytes:
                temp_id = str(uuid.uuid4())
                cover_url = save_thumbnail_bytes(img_bytes, ".jpg", temp_id)
            else:
                cover_url = get_default_cover(book_in.title)
        except Exception:
            cover_url = get_default_cover(book_in.title)

    new_book = Book(
        title=book_in.title,
        author=book_in.author,
        isbn=book_in.isbn,
        total_pages=book_in.total_pages,
        total_chapters=book_in.total_chapters,
        cover_url=cover_url,
        description=book_in.description,
        added_by=current_user.id,
    )
    db.add(new_book)
    await db.commit()
    await db.refresh(new_book)
    return new_book


@router.post("/{book_id}/thumbnail", response_model=BookOut)
async def upload_book_thumbnail(
    book_id: str,
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a custom image file for a book's thumbnail cover."""
    res = await db.execute(select(Book).where(Book.id == book_id))
    book = res.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{ext}'. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum limit of 10MB.",
        )

    ext = ext if ext else ".jpg"
    saved_path = save_thumbnail_bytes(file_bytes, ext, book.id)

    book.cover_url = saved_path
    await db.commit()
    await db.refresh(book)
    return book


@router.post("/{book_id}/fetch-thumbnail", response_model=BookOut)
async def fetch_book_thumbnail(
    book_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Auto-fetch thumbnail cover for a book using Google Books (primary) or Open Library (secondary)."""
    res = await db.execute(select(Book).where(Book.id == book_id))
    book = res.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    img_bytes = await fetch_cover_from_external_apis(book.title, book.author, book.isbn)
    if not img_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No thumbnail found on Google Books or Open Library for '{book.title}' by '{book.author}'.",
        )

    saved_path = save_thumbnail_bytes(img_bytes, ".jpg", book.id)
    book.cover_url = saved_path
    await db.commit()
    await db.refresh(book)
    return book

