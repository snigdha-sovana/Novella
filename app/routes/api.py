from flask import Blueprint, jsonify, request
from app.models import Book, UserBook, Journal
from flask_login import login_required, current_user
from app import db

api_bp = Blueprint("api", __name__, url_prefix="/api")


@api_bp.route("/books", methods=["GET"])
def get_books():
    books = Book.query.all()
    return jsonify([{
        "id": b.id,
        "title": b.title,
        "author": b.author,
        "genre": b.genre,
        "tropes": b.tropes,
        "pages": b.pages,
        "chapters": b.chapters
    } for b in books])


@api_bp.route("/library", methods=["GET"])
@login_required
def get_user_library():
    user_books = UserBook.query.filter_by(user_id=current_user.id).all()
    return jsonify([{
        "book_id": ub.book_id,
        "pages_read": ub.pages_read,
        "chapters_read": ub.chapters_read
    } for ub in user_books])


@api_bp.route("/journal/<int:userbook_id>", methods=["GET"])
@login_required
def get_journals(userbook_id):
    entries = Journal.query.filter_by(userbook_id=userbook_id).all()
    return jsonify([{
        "id": j.id,
        "content": j.content,
        "rating": j.rating
    } for j in entries])
