from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Progress, Book, Profile
from app.schemas import ProgressUpdate, ProgressOut
from app.core.security import get_current_user, CurrentUser

router = APIRouter(prefix="/progress", tags=["Reading Progress"])


async def ensure_profile_exists(db: AsyncSession, user_id: str, email: str):
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    if not result.scalar_one_or_none():
        db.add(Profile(id=user_id, username=email.split("@")[0] if email else "reader"))
        await db.commit()


def compute_progress_details(progress_obj: Progress, book_obj: Optional[Book] = None) -> dict:
    total_pages = book_obj.total_pages if book_obj else 0
    total_chapters = book_obj.total_chapters if book_obj else 0

    cur_page = progress_obj.current_page or 0
    cur_chap = progress_obj.current_chapter or 0

    pages_rem = max(0, total_pages - cur_page) if total_pages > 0 else 0
    chaps_rem = max(0, total_chapters - cur_chap) if total_chapters > 0 else 0

    percentage = 0.0
    if total_pages > 0:
        percentage = round(min(100.0, max(0.0, (cur_page / total_pages) * 100)), 1)
    elif total_chapters > 0:
        percentage = round(min(100.0, max(0.0, (cur_chap / total_chapters) * 100)), 1)

    return {
        "id": progress_obj.id,
        "user_id": progress_obj.user_id,
        "book_id": progress_obj.book_id,
        "current_page": cur_page,
        "current_chapter": cur_chap,
        "total_pages": total_pages,
        "total_chapters": total_chapters,
        "pages_remaining": pages_rem,
        "chapters_remaining": chaps_rem,
        "completion_percentage": percentage,
        "updated_at": progress_obj.updated_at,
        "book": book_obj,
    }


@router.get("", response_model=List[ProgressOut])
async def list_user_progress(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Progress)
        .options(selectinload(Progress.book))
        .where(Progress.user_id == current_user.id)
    )
    result = await db.execute(query)
    records = result.scalars().all()
    
    output = []
    for r in records:
        output.append(compute_progress_details(r, r.book))
    return output


@router.get("/{book_id}", response_model=ProgressOut)
async def get_book_progress(
    book_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    book_res = await db.execute(select(Book).where(Book.id == book_id))
    book = book_res.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    query = select(Progress).where(
        Progress.user_id == current_user.id,
        Progress.book_id == book_id
    )
    result = await db.execute(query)
    progress_item = result.scalar_one_or_none()

    if not progress_item:
        await ensure_profile_exists(db, current_user.id, current_user.email)
        progress_item = Progress(
            user_id=current_user.id,
            book_id=book_id,
            current_page=0,
            current_chapter=0,
        )
        db.add(progress_item)
        await db.commit()
        await db.refresh(progress_item)

    return compute_progress_details(progress_item, book)


@router.put("/{book_id}", response_model=ProgressOut)
async def update_book_progress(
    book_id: str,
    progress_in: ProgressUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    book_res = await db.execute(select(Book).where(Book.id == book_id))
    book = book_res.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    query = select(Progress).where(
        Progress.user_id == current_user.id,
        Progress.book_id == book_id
    )
    result = await db.execute(query)
    progress_item = result.scalar_one_or_none()

    await ensure_profile_exists(db, current_user.id, current_user.email)

    if not progress_item:
        progress_item = Progress(
            user_id=current_user.id,
            book_id=book_id,
            current_page=progress_in.current_page,
            current_chapter=progress_in.current_chapter,
        )
        db.add(progress_item)
    else:
        progress_item.current_page = progress_in.current_page
        progress_item.current_chapter = progress_in.current_chapter

    await db.commit()
    await db.refresh(progress_item)

    return compute_progress_details(progress_item, book)
