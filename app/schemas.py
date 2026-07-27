from datetime import datetime
from uuid import UUID
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator


def coerce_uuid_to_str(v: Any) -> Any:
    if isinstance(v, UUID):
        return str(v)
    return v


# Profile Schemas
class ProfileBase(BaseModel):
    username: Optional[str] = None
    avatar_url: Optional[str] = None


class ProfileOut(ProfileBase):
    id: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("id", mode="before")
    @classmethod
    def val_id(cls, v):
        return coerce_uuid_to_str(v)


# Book Schemas
class BookBase(BaseModel):
    title: str = Field(..., min_length=1)
    author: str = Field(..., min_length=1)
    isbn: Optional[str] = None
    total_pages: int = Field(default=0, ge=0)
    total_chapters: int = Field(default=0, ge=0)
    cover_url: Optional[str] = None
    description: Optional[str] = None


class BookCreate(BookBase):
    pass


class BookOut(BookBase):
    id: str
    added_by: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("id", "added_by", mode="before")
    @classmethod
    def val_id(cls, v):
        return coerce_uuid_to_str(v)


# User Library Schemas
class UserLibraryCreate(BaseModel):
    book_id: str
    status: str = Field(default="want_to_read")  # want_to_read, reading, completed


class UserLibraryUpdate(BaseModel):
    status: str  # want_to_read, reading, completed


class UserLibraryOut(BaseModel):
    id: str
    user_id: str
    book_id: str
    status: str
    added_at: Optional[datetime] = None
    book: Optional[BookOut] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("id", "user_id", "book_id", mode="before")
    @classmethod
    def val_id(cls, v):
        return coerce_uuid_to_str(v)


# Progress Schemas
class ProgressUpdate(BaseModel):
    current_page: int = Field(default=0, ge=0)
    current_chapter: int = Field(default=0, ge=0)


class ProgressOut(BaseModel):
    id: str
    user_id: str
    book_id: str
    current_page: int
    current_chapter: int
    total_pages: int = 0
    total_chapters: int = 0
    pages_remaining: int = 0
    chapters_remaining: int = 0
    completion_percentage: float = 0.0
    updated_at: Optional[datetime] = None
    book: Optional[BookOut] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("id", "user_id", "book_id", mode="before")
    @classmethod
    def val_id(cls, v):
        return coerce_uuid_to_str(v)


# Journal Entry Schemas
class JournalEntryCreate(BaseModel):
    book_id: str
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)


class JournalEntryOut(BaseModel):
    id: str
    user_id: str
    book_id: str
    title: str
    content: str
    created_at: Optional[datetime] = None
    book: Optional[BookOut] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("id", "user_id", "book_id", mode="before")
    @classmethod
    def val_id(cls, v):
        return coerce_uuid_to_str(v)


# Review Schemas
class ReviewCreate(BaseModel):
    book_id: str
    rating: int = Field(..., ge=1, le=5)
    review_text: Optional[str] = None


class ReviewOut(BaseModel):
    id: str
    user_id: str
    book_id: str
    rating: int
    review_text: Optional[str] = None
    created_at: Optional[datetime] = None
    username: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("id", "user_id", "book_id", mode="before")
    @classmethod
    def val_id(cls, v):
        return coerce_uuid_to_str(v)


# Community Post Schemas
class CommunityPostCreate(BaseModel):
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    book_id: Optional[str] = None


class CommunityPostOut(BaseModel):
    id: str
    user_id: str
    book_id: Optional[str] = None
    title: str
    content: str
    created_at: Optional[datetime] = None
    username: Optional[str] = None
    book_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("id", "user_id", "book_id", mode="before")
    @classmethod
    def val_id(cls, v):
        return coerce_uuid_to_str(v)


# Community Message Schemas (Live Chat)
class CommunityMessageCreate(BaseModel):
    message: str = Field(..., min_length=1)


class CommunityMessageOut(BaseModel):
    id: str
    user_id: str
    message: str
    created_at: Optional[datetime] = None
    username: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("id", "user_id", mode="before")
    @classmethod
    def val_id(cls, v):
        return coerce_uuid_to_str(v)


class ThumbnailSyncResponse(BaseModel):
    total_books: int
    updated_count: int
    failed_count: int
    message: str
