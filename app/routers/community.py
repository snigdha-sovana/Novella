from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import CommunityPost, CommunityMessage, Book, Profile
from app.schemas import (
    CommunityPostCreate,
    CommunityPostOut,
    CommunityMessageCreate,
    CommunityMessageOut,
)
from app.core.security import get_current_user, CurrentUser

router = APIRouter(prefix="/community", tags=["Community"])


async def ensure_profile_exists(db: AsyncSession, user_id: str, email: str):
    res = await db.execute(select(Profile).where(Profile.id == user_id))
    if not res.scalar_one_or_none():
        db.add(Profile(id=user_id, username=email.split("@")[0] if email else "reader"))
        await db.commit()


@router.get("/posts", response_model=List[CommunityPostOut])
async def list_community_posts(db: AsyncSession = Depends(get_db)):
    query = (
        select(CommunityPost, Profile.username, Book.title)
        .outerjoin(Profile, CommunityPost.user_id == Profile.id)
        .outerjoin(Book, CommunityPost.book_id == Book.id)
        .order_by(CommunityPost.created_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()

    output = []
    for post_obj, uname, btitle in rows:
        output.append({
            "id": post_obj.id,
            "user_id": post_obj.user_id,
            "book_id": post_obj.book_id,
            "title": post_obj.title,
            "content": post_obj.content,
            "created_at": post_obj.created_at,
            "username": uname or "Reader",
            "book_title": btitle,
        })
    return output


@router.post("/posts", response_model=CommunityPostOut, status_code=status.HTTP_201_CREATED)
async def create_community_post(
    post_in: CommunityPostCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await ensure_profile_exists(db, current_user.id, current_user.email)

    new_post = CommunityPost(
        user_id=current_user.id,
        book_id=post_in.book_id,
        title=post_in.title,
        content=post_in.content,
    )
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)

    prof_res = await db.execute(select(Profile).where(Profile.id == current_user.id))
    prof = prof_res.scalar_one_or_none()

    btitle = None
    if post_in.book_id:
        book_res = await db.execute(select(Book.title).where(Book.id == post_in.book_id))
        btitle = book_res.scalar_one_or_none()

    return {
        "id": new_post.id,
        "user_id": new_post.user_id,
        "book_id": new_post.book_id,
        "title": new_post.title,
        "content": new_post.content,
        "created_at": new_post.created_at,
        "username": prof.username if prof else "Reader",
        "book_title": btitle,
    }


@router.get("/messages", response_model=List[CommunityMessageOut])
async def list_community_messages(limit: int = 100, db: AsyncSession = Depends(get_db)):
    query = (
        select(CommunityMessage, Profile.username)
        .outerjoin(Profile, CommunityMessage.user_id == Profile.id)
        .order_by(CommunityMessage.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    rows = result.all()

    output = []
    for msg_obj, uname in reversed(rows):
        output.append({
            "id": msg_obj.id,
            "user_id": msg_obj.user_id,
            "message": msg_obj.message,
            "created_at": msg_obj.created_at,
            "username": uname or "Reader",
        })
    return output


@router.post("/messages", response_model=CommunityMessageOut, status_code=status.HTTP_201_CREATED)
async def post_community_message(
    msg_in: CommunityMessageCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await ensure_profile_exists(db, current_user.id, current_user.email)

    new_msg = CommunityMessage(
        user_id=current_user.id,
        message=msg_in.message,
    )
    db.add(new_msg)
    await db.commit()
    await db.refresh(new_msg)

    prof_res = await db.execute(select(Profile).where(Profile.id == current_user.id))
    prof = prof_res.scalar_one_or_none()

    return {
        "id": new_msg.id,
        "user_id": new_msg.user_id,
        "message": new_msg.message,
        "created_at": new_msg.created_at,
        "username": prof.username if prof else "Reader",
    }
