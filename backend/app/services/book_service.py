from .. import db
from ..models import Book
from datetime import datetime


def get_all_books(page=1, per_page=12):
    pagination = Book.query.order_by(Book.created_at.desc()).paginate(page=page, per_page=per_page)
    return pagination


def get_book_by_id(book_id):
    return Book.query.get(book_id)


def search_books(query):
    search = f"%{query}%"
    results = Book.query.filter(
        db.or_(
            Book.title.ilike(search),
            Book.author.ilike(search),
            Book.category.ilike(search),
            Book.description.ilike(search),
        )
    ).all()
    return results


def create_book(title, author, category, description, price, cover_image=None, book_file=None):
    book = Book(
        title=title,
        author=author,
        category=category,
        description=description,
        price=price,
        cover_image=cover_image,
        book_file=book_file,
    )
    db.session.add(book)
    db.session.commit()
    return book


def delete_book(book_id):
    book = Book.query.get(book_id)
    if not book:
        return None
    db.session.delete(book)
    db.session.commit()
    return book
