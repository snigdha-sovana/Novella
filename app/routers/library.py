from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import UserLibrary, Book, Progress, Profile
from app.schemas import UserLibraryCreate, UserLibraryUpdate, UserLibraryOut
from app.core.security import get_current_user, CurrentUser

router = APIRouter(prefix="/library", tags=["Personal Library"])


async def ensure_profile_exists(db: AsyncSession, user_id: str, email: str):
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        username = email.split("@")[0] if email else "reader"
        profile = Profile(id=user_id, username=username)
        db.add(profile)
        await db.commit()


@router.get("", response_model=List[UserLibraryOut])
async def get_user_library(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(UserLibrary)
        .options(selectinload(UserLibrary.book))
        .where(UserLibrary.user_id == current_user.id)
    )
    if status_filter:
        query = query.where(UserLibrary.status == status_filter)
    
    query = query.order_by(UserLibrary.added_at.desc())
    result = await db.execute(query)
    items = result.scalars().all()
    return items


@router.post("", response_model=UserLibraryOut, status_code=status.HTTP_201_CREATED)
async def add_to_library(
    item_in: UserLibraryCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await ensure_profile_exists(db, current_user.id, current_user.email)

    # Verify book exists
    book_res = await db.execute(select(Book).where(Book.id == item_in.book_id))
    book = book_res.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    # Check if already in user's library
    existing_res = await db.execute(
        select(UserLibrary).where(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == item_in.book_id,
        )
    )
    existing_item = existing_res.scalar_one_or_none()
    if existing_item:
        existing_item.status = item_in.status
        await db.commit()
        await db.refresh(existing_item)
        # Reload book relationship
        res = await db.execute(
            select(UserLibrary).options(selectinload(UserLibrary.book)).where(UserLibrary.id == existing_item.id)
        )
        return res.scalar_one()

    # Create new library entry
    new_item = UserLibrary(
        user_id=current_user.id,
        book_id=item_in.book_id,
        status=item_in.status,
    )
    db.add(new_item)

    # Ensure a progress record exists as well
    prog_res = await db.execute(
        select(Progress).where(
            Progress.user_id == current_user.id,
            Progress.book_id == item_in.book_id,
        )
    )
    if not prog_res.scalar_one_or_none():
        new_prog = Progress(
            user_id=current_user.id,
            book_id=item_in.book_id,
            current_page=0,
            current_chapter=0,
        )
        db.add(new_prog)

    await db.commit()

    # Fetch complete item with book relationship loaded
    res = await db.execute(
        select(UserLibrary).options(selectinload(UserLibrary.book)).where(UserLibrary.id == new_item.id)
    )
    return res.scalar_one()


@router.patch("/{library_id}", response_model=UserLibraryOut)
async def update_library_status(
    library_id: str,
    item_update: UserLibraryUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(UserLibrary)
        .options(selectinload(UserLibrary.book))
        .where(UserLibrary.id == library_id, UserLibrary.user_id == current_user.id)
    )
    result = await db.execute(query)
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Library item not found",
        )

    item.status = item_update.status
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{library_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_library(
    library_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(UserLibrary).where(
        UserLibrary.id == library_id, UserLibrary.user_id == current_user.id
    )
    result = await db.execute(query)
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Library item not found",
        )

    await db.delete(item)
    await db.commit()
    return None
