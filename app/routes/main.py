from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required, current_user
from sqlalchemy import or_
from ..models import Book, Review, UserBook
from ..forms import BookForm, ReviewForm
from .. import db
from ..utils import paginate, search_books, get_page_args

bp = Blueprint("main", __name__)


@bp.route("/")
def index():
    """Landing page"""
    recent_books = Book.query.order_by(Book.created_at.desc()).limit(6).all()
    return render_template("index.html", books=recent_books)


@bp.route("/dashboard")
@login_required
def dashboard():
    """User dashboard with quick stats"""
    total_books = UserBook.query.filter_by(user_id=current_user.id).count()
    completed_books = UserBook.query.filter_by(
        user_id=current_user.id, status="completed"
    ).count()
    reading_books = UserBook.query.filter_by(
        user_id=current_user.id, status="reading"
    ).count()

    return render_template(
        "dashboard.html",
        total_books=total_books,
        completed_books=completed_books,
        reading_books=reading_books,
    )


@bp.route("/explore", methods=["GET"])
def explore():
    """Explore all available books, with optional search + pagination"""
    query = request.args.get("q", "")
    page, per_page = get_page_args()

    book_query = Book.query
    if query:
        book_query = search_books(book_query, query)

    results = paginate(book_query, page, per_page)

    return render_template(
        "explore.html",
        books=results["items"],
        page=results["page"],
        pages=results["pages"],
        query=query
    )


@bp.route("/book/<int:book_id>", methods=["GET", "POST"])
def book_detail(book_id):
    """Show details of a book and allow review"""
    book = Book.query.get_or_404(book_id)
    reviews = Review.query.filter_by(book_id=book.id).order_by(
        Review.created_at.desc()
    ).all()

    form = ReviewForm()
    if form.validate_on_submit():
        if not current_user.is_authenticated:
            flash("You need to log in to leave a review.", "warning")
            return redirect(url_for("auth.login"))

        review = Review(
            user_id=current_user.id,
            book_id=book.id,
            rating=form.rating.data,
            text=form.text.data,
        )
        db.session.add(review)
        db.session.commit()
        flash("Review submitted!", "success")
        return redirect(url_for("main.book_detail", book_id=book.id))

    return render_template("book_detail.html", book=book, reviews=reviews, form=form)


@bp.route("/add-book", methods=["GET", "POST"])
@login_required
def add_book():
    """Allow users to add new books to the library"""
    form = BookForm()
    if form.validate_on_submit():
        book = Book(
            title=form.title.data,
            author=form.author.data,
            genre=form.genre.data,
            tropes=form.tropes.data,
            pages=form.pages.data,
            chapters=form.chapters.data,
        )
        db.session.add(book)
        db.session.commit()
        flash("Book added successfully!", "success")
        return redirect(url_for("main.explore"))

    return render_template("add_book.html", form=form)
