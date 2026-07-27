import os
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.future import select

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
from app.models import Book
from app.routers.books import fetch_cover_from_external_apis, save_thumbnail_bytes, get_default_cover
from app.core.security import get_current_user, CurrentUser

from app.routers import books, library, progress, journal, community


async def seed_initial_books():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Book))
        existing = res.scalars().all()
        if not existing:
            initial_books = [
                {
                    "title": "The Alchemist",
                    "author": "Paulo Coelho",
                    "isbn": "9780062315007",
                    "total_pages": 208,
                    "total_chapters": 2,
                    "description": "Combining magic, mysticism, wisdom and wonder into an inspiring tale of self-discovery, The Alchemist has become a modern classic."
                },
                {
                    "title": "The Hobbit",
                    "author": "J.R.R. Tolkien",
                    "isbn": "9780261102217",
                    "total_pages": 310,
                    "total_chapters": 19,
                    "description": "Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life, seldom heading further than the pantry of his hobbit-hole in Bag End."
                },
                {
                    "title": "1984",
                    "author": "George Orwell",
                    "isbn": "9780451524935",
                    "total_pages": 328,
                    "total_chapters": 24,
                    "description": "A dystopian novel depicting a totalitarian regime where Big Brother exercises complete control over citizens."
                },
                {
                    "title": "Atomic Habits",
                    "author": "James Clear",
                    "isbn": "9780735211292",
                    "total_pages": 320,
                    "total_chapters": 20,
                    "description": "An Easy & Proven Way to Build Good Habits & Break Bad Ones."
                }
            ]
            for b_data in initial_books:
                try:
                    img_bytes = await fetch_cover_from_external_apis(b_data["title"], b_data["author"], b_data["isbn"])
                    if img_bytes:
                        temp_id = str(uuid.uuid4())
                        cover_url = save_thumbnail_bytes(img_bytes, ".jpg", temp_id)
                    else:
                        cover_url = get_default_cover(b_data["title"])
                except Exception:
                    cover_url = get_default_cover(b_data["title"])
                
                new_book = Book(
                    title=b_data["title"],
                    author=b_data["author"],
                    isbn=b_data["isbn"],
                    total_pages=b_data["total_pages"],
                    total_chapters=b_data["total_chapters"],
                    cover_url=cover_url,
                    description=b_data["description"]
                )
                db.add(new_book)
            await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure upload directory exists
    os.makedirs("uploads/covers", exist_ok=True)
    # Ensure database schema tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed starter catalog books in background if database is empty
    import asyncio
    asyncio.create_task(seed_initial_books())

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Serve uploaded thumbnail static files
os.makedirs("uploads/covers", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local dev from Vite on any port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include Routers
app.include_router(books.router, prefix=settings.API_V1_STR)
app.include_router(library.router, prefix=settings.API_V1_STR)
app.include_router(progress.router, prefix=settings.API_V1_STR)
app.include_router(journal.router, prefix=settings.API_V1_STR)
app.include_router(community.router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "message": "Welcome to BookJournal API",
        "version": settings.VERSION,
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}


@app.get("/api/v1/auth/me")
async def get_me(user: CurrentUser = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "metadata": user.metadata,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
