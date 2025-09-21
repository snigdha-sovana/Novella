from math import ceil
from flask import request

def paginate(query, page, per_page=10):
    """
    Paginate SQLAlchemy queries.
    :param query: SQLAlchemy query object
    :param page: current page number (int)
    :param per_page: items per page
    :return: dict with items, page, pages, total
    """
    total = query.count()
    pages = ceil(total / per_page) if total else 1
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": items,
        "page": page,
        "pages": pages,
        "total": total
    }


def search_books(queryset, keyword):
    """
    Filter books by keyword in title, author, genre, or tropes.
    :param queryset: SQLAlchemy query (Book model)
    :param keyword: string
    :return: filtered query
    """
    if not keyword:
        return queryset

    keyword = f"%{keyword.lower()}%"
    return queryset.filter(
        (queryset.column_descriptions[0]['entity'].title.ilike(keyword)) |
        (queryset.column_descriptions[0]['entity'].author.ilike(keyword)) |
        (queryset.column_descriptions[0]['entity'].genre.ilike(keyword)) |
        (queryset.column_descriptions[0]['entity'].tropes.ilike(keyword))
    )


def get_page_args():
    """
    Extract pagination args from request (Flask).
    Defaults: page=1, per_page=10
    """
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 10))
    except ValueError:
        page, per_page = 1, 10
    return page, per_page
