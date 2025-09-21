from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from . import db, login_manager


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    library_items = db.relationship("UserBook", back_populates="user")
    journals = db.relationship("JournalEntry", back_populates="user")
    reviews = db.relationship("Review", back_populates="user")
    messages = db.relationship("Message", back_populates="user")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(250), nullable=False)
    author = db.Column(db.String(200), nullable=False)
    genre = db.Column(db.String(100))
    tropes = db.Column(db.String(300))  # comma-separated string or JSON
    pages = db.Column(db.Integer)
    chapters = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    library_items = db.relationship("UserBook", back_populates="book")
    reviews = db.relationship("Review", back_populates="book")


class UserBook(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    book_id = db.Column(db.Integer, db.ForeignKey("book.id"))
    pages_read = db.Column(db.Integer, default=0)
    chapters_read = db.Column(db.Integer, default=0)
    status = db.Column(db.String(30), default="reading")  # reading/completed
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user = db.relationship("User", back_populates="library_items")
    book = db.relationship("Book", back_populates="library_items")
    journals = db.relationship("JournalEntry", back_populates="userbook")


class JournalEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    userbook_id = db.Column(db.Integer, db.ForeignKey("user_book.id"))
    title = db.Column(db.String(200))
    content = db.Column(db.Text)
    progress_pages = db.Column(db.Integer)
    progress_chapters = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="journals")
    userbook = db.relationship("UserBook", back_populates="journals")


class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    book_id = db.Column(db.Integer, db.ForeignKey("book.id"))
    rating = db.Column(db.Integer)  # 1–5 stars
    text = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="reviews")
    book = db.relationship("Book", back_populates="reviews")


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    room = db.Column(db.String(100))
    text = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="messages")
