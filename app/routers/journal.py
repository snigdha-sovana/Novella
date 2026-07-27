from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import JournalEntry, Review, Book, Profile
from app.schemas import JournalEntryCreate, JournalEntryOut, ReviewCreate, ReviewOut
from app.core.security import get_current_user, CurrentUser

router = APIRouter(tags=["Journal & Reviews"])


async def ensure_profile_exists(db: AsyncSession, user_id: str, email: str):
    res = await db.execute(select(Profile).where(Profile.id == user_id))
    if not res.scalar_one_or_none():
        db.add(Profile(id=user_id, username=email.split("@")[0] if email else "reader"))
        await db.commit()


# Journal Endpoints
@router.get("/journal", response_model=List[JournalEntryOut])
async def list_journal_entries(
    book_id: Optional[str] = Query(None),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(JournalEntry)
        .options(selectinload(JournalEntry.book))
        .where(JournalEntry.user_id == current_user.id)
    )
    if book_id:
        query = query.where(JournalEntry.book_id == book_id)
    
    query = query.order_by(JournalEntry.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/journal", response_model=JournalEntryOut, status_code=status.HTTP_201_CREATED)
async def create_journal_entry(
    entry_in: JournalEntryCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await ensure_profile_exists(db, current_user.id, current_user.email)

    book_res = await db.execute(select(Book).where(Book.id == entry_in.book_id))
    if not book_res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    new_entry = JournalEntry(
        user_id=current_user.id,
        book_id=entry_in.book_id,
        title=entry_in.title,
        content=entry_in.content,
    )
    db.add(new_entry)
    await db.commit()

    res = await db.execute(
        select(JournalEntry)
        .options(selectinload(JournalEntry.book))
        .where(JournalEntry.id == new_entry.id)
    )
    return res.scalar_one()


@router.delete("/journal/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_journal_entry(
    entry_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(JournalEntry).where(
            JournalEntry.id == entry_id,
            JournalEntry.user_id == current_user.id
        )
    )
    entry = res.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found")

    await db.delete(entry)
    await db.commit()
    return None


# Reviews Endpoints
@router.get("/reviews/book/{book_id}", response_model=List[ReviewOut])
async def get_book_reviews(book_id: str, db: AsyncSession = Depends(get_db)):
    query = (
        select(Review, Profile.username)
        .outerjoin(Profile, Review.user_id == Profile.id)
        .where(Review.book_id == book_id)
        .order_by(Review.created_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()

    output = []
    for review_obj, uname in rows:
        output.append({
            "id": review_obj.id,
            "user_id": review_obj.user_id,
            "book_id": review_obj.book_id,
            "rating": review_obj.rating,
            "review_text": review_obj.review_text,
            "created_at": review_obj.created_at,
            "username": uname or "Anonymous",
        })
    return output


@router.post("/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_or_update_review(
    review_in: ReviewCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await ensure_profile_exists(db, current_user.id, current_user.email)

    book_res = await db.execute(select(Book).where(Book.id == review_in.book_id))
    if not book_res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    # Check if user already reviewed this book
    res = await db.execute(
        select(Review).where(
            Review.user_id == current_user.id,
            Review.book_id == review_in.book_id
        )
    )
    existing_review = res.scalar_one_or_none()

    if existing_review:
        existing_review.rating = review_in.rating
        existing_review.review_text = review_in.review_text
        await db.commit()
        await db.refresh(existing_review)
        review_obj = existing_review
    else:
        review_obj = Review(
            user_id=current_user.id,
            book_id=review_in.book_id,
            rating=review_in.rating,
            review_text=review_in.review_text,
        )
        db.add(review_obj)
        await db.commit()
        await db.refresh(review_obj)

    # Get username
    prof_res = await db.execute(select(Profile).where(Profile.id == current_user.id))
    prof = prof_res.scalar_one_or_none()

    return {
        "id": review_obj.id,
        "user_id": review_obj.user_id,
        "book_id": review_obj.book_id,
        "rating": review_obj.rating,
        "review_text": review_obj.review_text,
        "created_at": review_obj.created_at,
        "username": prof.username if prof else "Anonymous",
    }
