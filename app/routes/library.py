from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required, current_user
from app import db
from app.models import Book, UserBook

library_bp = Blueprint("library", __name__, url_prefix="/library")


@library_bp.route("/")
@login_required
def personal_library():
    """Show the user's personal library"""
    user_books = UserBook.query.filter_by(user_id=current_user.id).all()
    return render_template("library.html", user_books=user_books)


@library_bp.route("/add", methods=["GET", "POST"])
@login_required
def add_book():
    """Add a book to the user's library"""
    if request.method == "POST":
        book_id = request.form.get("book_id")
        pages_read = request.form.get("pages_read", 0)
        chapters_read = request.form.get("chapters_read", 0)

        user_book = UserBook(
            user_id=current_user.id,
            book_id=book_id,
            pages_read=pages_read,
            chapters_read=chapters_read,
        )
        db.session.add(user_book)
        db.session.commit()
        flash("Book added to your library!", "success")
        return redirect(url_for("library.personal_library"))

    books = Book.query.all()
    return render_template("book_detail.html", books=books)


@library_bp.route("/progress/<int:userbook_id>", methods=["GET", "POST"])
@login_required
def update_progress(userbook_id):
    """Update reading progress for a book"""
    user_book = UserBook.query.get_or_404(userbook_id)

    if user_book.user_id != current_user.id:
        flash("Not authorized to update this book.", "danger")
        return redirect(url_for("library.personal_library"))

    if request.method == "POST":
        user_book.pages_read = request.form.get("pages_read", user_book.pages_read)
        user_book.chapters_read = request.form.get("chapters_read", user_book.chapters_read)
        db.session.commit()
        flash("Progress updated!", "success")
        return redirect(url_for("library.personal_library"))

    return render_template("progress.html", user_book=user_book)
