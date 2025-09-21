from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required, current_user
from app import db
from app.models import JournalEntry, UserBook

journals_bp = Blueprint("journals", __name__, url_prefix="/journals")


@journals_bp.route("/<int:userbook_id>", methods=["GET", "POST"])
@login_required
def journal_entries(userbook_id):
    """Add and view journal entries for a specific book"""
    user_book = UserBook.query.get_or_404(userbook_id)

    if user_book.user_id != current_user.id:
        flash("Not authorized to view this journal.", "danger")
        return redirect(url_for("library.personal_library"))

    if request.method == "POST":
        entry_text = request.form.get("entry")
        rating = request.form.get("rating", None)
        journal = JournalEntry(
            user_id=current_user.id,
            userbook_id=user_book.id,
            content=entry_text,
            rating=rating
        )
        db.session.add(journal)
        db.session.commit()
        flash("Journal entry added!", "success")
        return redirect(url_for("journals.journal_entries", userbook_id=userbook_id))

    entries = JournalEntry.query.filter_by(userbook_id=user_book.id).all()
    return render_template("journal_entry.html", user_book=user_book, entries=entries)
