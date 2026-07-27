import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.types import TypeDecorator
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's native UUID type for PostgreSQL database, and String(36) for SQLite.
    """
    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(UUID(as_uuid=False))
        else:
            return dialect.type_descriptor(String(36))


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(GUID, primary_key=True)  # Matches Supabase auth.users UUID
    username = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    library_items = relationship("UserLibrary", back_populates="user", cascade="all, delete-orphan")
    progress_items = relationship("Progress", back_populates="user", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")


class Book(Base):
    __tablename__ = "books"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False, index=True)
    name = Column(String, nullable=True)
    author = Column(String, nullable=False, index=True)
    isbn = Column(String, nullable=True, index=True)
    total_pages = Column(Integer, default=0)
    total_chapters = Column(Integer, default=0)
    cover_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    added_by = Column(GUID, ForeignKey("profiles.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    library_entries = relationship("UserLibrary", back_populates="book", cascade="all, delete-orphan")
    progress_records = relationship("Progress", back_populates="book", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntry", back_populates="book", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="book", cascade="all, delete-orphan")


class UserLibrary(Base):
    __tablename__ = "user_library"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    user_id = Column(GUID, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    book_id = Column(GUID, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=False, default="want_to_read")  # want_to_read, reading, completed
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("Profile", back_populates="library_items")
    book = relationship("Book", back_populates="library_entries")


class Progress(Base):
    __tablename__ = "progress"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    user_id = Column(GUID, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    book_id = Column(GUID, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    current_page = Column(Integer, default=0)
    current_chapter = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("Profile", back_populates="progress_items")
    book = relationship("Book", back_populates="progress_records")


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    user_id = Column(GUID, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    book_id = Column(GUID, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("Profile", back_populates="journal_entries")
    book = relationship("Book", back_populates="journal_entries")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    user_id = Column(GUID, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    book_id = Column(GUID, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1 to 5
    review_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("Profile", back_populates="reviews")
    book = relationship("Book", back_populates="reviews")


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    user_id = Column(GUID, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    book_id = Column(GUID, ForeignKey("books.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CommunityMessage(Base):
    __tablename__ = "community_messages"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    user_id = Column(GUID, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
