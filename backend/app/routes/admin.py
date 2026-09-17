import os
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from .. import db
from ..models import Book, User, Cart, CartItem
from ..mongo_service import (
    create_book as mongo_create_book,
    delete_book as mongo_delete_book,
    get_book_by_id as mongo_get_book_by_id,
    serialize_book,
    admin_stats as mongo_admin_stats,
    get_user_by_id,
    list_books as mongo_list_books,
)
from ..services.cloudinary_service import (
    is_cloudinary_configured,
    delete_asset,
)

admin_bp = Blueprint("admin", __name__)


def admin_required(fn):
    from functools import wraps

    @wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        if current_app.config.get("USE_MONGO"):
            user = get_user_by_id(user_id)
            if not user or user.get("role") != "admin":
                return jsonify({"error": "Access Denied"}), 403
            return fn(*args, **kwargs)

        user = User.query.get(user_id)
        if not user or user.role != "admin":
            return jsonify({"error": "Access Denied"}), 403
        return fn(*args, **kwargs)

    return wrapper


def allowed_cover_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in current_app.config["ALLOWED_COVER_EXTENSIONS"]


def allowed_book_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in current_app.config["ALLOWED_BOOK_EXTENSIONS"]


@admin_bp.route("/books", methods=["GET"])
@jwt_required()
@admin_required
def admin_list_books():
    if current_app.config.get("USE_MONGO"):
        total, books = mongo_list_books(page=1, per_page=1000)
        return jsonify({"books": books}), 200

    books = Book.query.order_by(Book.created_at.desc()).all()
    return jsonify({"books": [b.to_dict() for b in books]}), 200


@admin_bp.route("/books", methods=["POST"])
@jwt_required()
@admin_required
def admin_add_book():
    user_id = int(get_jwt_identity())
    title = request.form.get("title", "").strip()
    author = request.form.get("author", "").strip()
    category = request.form.get("category", "").strip()
    description = request.form.get("description", "").strip()
    price = request.form.get("price", type=float)

    cover_url = request.form.get("cover_url", "").strip()
    cover_public_id = request.form.get("cover_public_id", "").strip()
    book_file_url = request.form.get("book_file_url", "").strip()
    book_file_public_id = request.form.get("book_file_public_id", "").strip()

    if not title or not author or not category or price is None:
        return jsonify({"error": "Title, author, category, and price are required"}), 400

    use_cloudinary = is_cloudinary_configured()

    if use_cloudinary:
        if not cover_url:
            return jsonify({"error": "Book cover is required"}), 400
        cover_image = None
        book_file = None
    else:
        cover_image = None
        book_file = None

        if "cover_image" in request.files:
            file = request.files["cover_image"]
            if file and file.filename and allowed_cover_file(file.filename):
                filename = secure_filename(file.filename)
                timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
                stem, ext = os.path.splitext(filename)
                filename = f"{stem}_{timestamp}{ext}"
                folder = current_app.config["COVERS_FOLDER"]
                os.makedirs(folder, exist_ok=True)
                file.save(os.path.join(folder, filename))
                cover_image = filename

        if "book_file" in request.files:
            file = request.files["book_file"]
            if file and file.filename and allowed_book_file(file.filename):
                filename = secure_filename(file.filename)
                timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
                stem, ext = os.path.splitext(filename)
                filename = f"{stem}_{timestamp}{ext}"
                folder = current_app.config["BOOKS_FOLDER"]
                os.makedirs(folder, exist_ok=True)
                file.save(os.path.join(folder, filename))
                book_file = filename

    if current_app.config.get("USE_MONGO"):
        book = mongo_create_book(
            title, author, category, description, price,
            cover_image=cover_image,
            book_file=book_file,
            uploaded_by=user_id,
            cover_url=cover_url if use_cloudinary else None,
            cover_public_id=cover_public_id if use_cloudinary else None,
            book_file_url=book_file_url if use_cloudinary else None,
            book_file_public_id=book_file_public_id if use_cloudinary else None,
        )
        return jsonify({"message": "Book added successfully", "book": serialize_book(book)}), 201

    book = Book(
        title=title,
        author=author,
        category=category,
        description=description,
        price=price,
        cover_image=cover_image,
        book_file=book_file,
        uploaded_by=user_id,
    )
    db.session.add(book)
    db.session.commit()

    return jsonify({"message": "Book added successfully", "book": book.to_dict()}), 201


@admin_bp.route("/books/<int:book_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def admin_delete_book(book_id):
    if current_app.config.get("USE_MONGO"):
        book = mongo_get_book_by_id(book_id)
        if not book:
            return jsonify({"error": "Book Not Found"}), 404

        if is_cloudinary_configured():
            if book.get("cover_public_id"):
                delete_asset(book["cover_public_id"], "image")
            if book.get("book_file_public_id"):
                delete_asset(book["book_file_public_id"], "raw")

        mongo_delete_book(book_id)
        return jsonify({"message": "Book deleted successfully"}), 200

    book = Book.query.get(book_id)
    if not book:
        return jsonify({"error": "Book Not Found"}), 404

    if book.cover_image:
        cover_path = os.path.join(current_app.config["COVERS_FOLDER"], book.cover_image)
        if os.path.exists(cover_path):
            os.remove(cover_path)
    if book.book_file:
        file_path = os.path.join(current_app.config["BOOKS_FOLDER"], book.book_file)
        if os.path.exists(file_path):
            os.remove(file_path)

    db.session.delete(book)
    db.session.commit()

    return jsonify({"message": "Book deleted successfully"}), 200


@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
@admin_required
def admin_stats():
    if current_app.config.get("USE_MONGO"):
        stats = mongo_admin_stats()
        return jsonify({
            "total_books": stats["total_books"],
            "total_users": stats["total_users"],
            "total_cart_items": stats["total_cart_items"],
        }), 200

    total_books = Book.query.count()
    total_users = User.query.count()
    total_carts = Cart.query.count()
    total_cart_items = CartItem.query.count()
    return jsonify({
        "total_books": total_books,
        "total_users": total_users,
        "total_carts": total_carts,
        "total_cart_items": total_cart_items,
    }), 200