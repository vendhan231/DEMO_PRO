import os
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from .. import db
from ..models import Book, User
from ..mongo_service import (
    list_books as mongo_list_books,
    get_book_by_id as mongo_get_book_by_id,
    search_books as mongo_search_books,
    serialize_book,
    create_book as mongo_create_book,
    update_book_mongo as mongo_update_book,
    delete_book as mongo_delete_book,
    get_book_uploader,
    get_user_by_id as mongo_get_user_by_id,
    serialize_user,
    verify_password,
)
from ..services.cloudinary_service import (
    is_cloudinary_configured,
    delete_asset,
)

books_bp = Blueprint("books", __name__)


def verified_required(fn):
    from functools import wraps

    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        if current_app.config.get("USE_MONGO"):
            user = mongo_get_user_by_id(user_id)
            if not user or not user.get("email_verified", False):
                return jsonify({"error": "Email verification required"}), 403
            return fn(*args, **kwargs)

        user = User.query.get(user_id)
        if not user or not user.email_verified:
            return jsonify({"error": "Email verification required"}), 403
        return fn(*args, **kwargs)

    return wrapper


def allowed_cover_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in current_app.config["ALLOWED_COVER_EXTENSIONS"]


def allowed_book_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in current_app.config["ALLOWED_BOOK_EXTENSIONS"]


def handle_file_upload(file_key, folder_config_key, allowed_check_fn, max_size_key="MAX_CONTENT_LENGTH"):
    if file_key not in request.files:
        return None
    file = request.files[file_key]
    if not file or not file.filename:
        return None
    if not allowed_check_fn(file.filename):
        return {"error": f"Invalid file type for {file_key}"}
    file.seek(0, 2)
    file_size = file.tell()
    file.seek(0)
    max_size = current_app.config.get(max_size_key, 4 * 1024 * 1024)
    if file_size > max_size:
        return {"error": f"{file_key} exceeds maximum size of {max_size // (1024 * 1024)}MB"}
    filename = secure_filename(file.filename)
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    stem, ext = os.path.splitext(filename)
    filename = f"{stem}_{timestamp}{ext}"
    folder = current_app.config[folder_config_key]
    os.makedirs(folder, exist_ok=True)
    file.save(os.path.join(folder, filename))
    return filename


def get_current_user_id():
    return int(get_jwt_identity())


def is_cloudinary_url(url):
    if not url:
        return False
    return "cloudinary.com" in url or "res.cloudinary.com" in url


@books_bp.route("/", methods=["GET"])
def list_books():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 12, type=int)
    if current_app.config.get("USE_MONGO"):
        total, books = mongo_list_books(page=page, per_page=per_page)
        pages = (total + per_page - 1) // per_page if total else 1
        return jsonify({
            "books": books,
            "total": total,
            "pages": pages,
            "page": page,
            "per_page": per_page,
        }), 200

    books = Book.query.order_by(Book.created_at.desc()).paginate(page=page, per_page=per_page)
    return jsonify({
        "books": [b.to_dict() for b in books.items],
        "total": books.total,
        "pages": books.pages,
        "page": page,
        "per_page": per_page,
    }), 200


@books_bp.route("/<int:book_id>", methods=["GET"])
def get_book(book_id):
    if current_app.config.get("USE_MONGO"):
        book = mongo_get_book_by_id(book_id)
        if not book:
            return jsonify({"error": "Book Not Found"}), 404
        book_data = serialize_book(book)
        return jsonify({"book": book_data}), 200

    book = Book.query.get(book_id)
    if not book:
        return jsonify({"error": "Book Not Found"}), 404
    return jsonify({"book": book.to_dict()}), 200


@books_bp.route("/search", methods=["GET"])
def search_books():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"results": [], "message": "Book Not Available"}), 200

    if current_app.config.get("USE_MONGO"):
        results = mongo_search_books(q)
        return jsonify({
            "results": results,
            "message": "Book Not Available" if not results else None,
        }), 200

    search = f"%{q}%"
    results = Book.query.filter(
        db.or_(
            Book.title.ilike(search),
            Book.author.ilike(search),
            Book.category.ilike(search),
            Book.description.ilike(search),
        )
    ).all()

    return jsonify({
        "results": [b.to_dict() for b in results],
        "message": "Book Not Available" if not results else None,
    }), 200


@books_bp.route("/", methods=["POST"])
@verified_required
def add_book():
    user_id = get_current_user_id()
    title = request.form.get("title", "").strip()
    author = request.form.get("author", "").strip()
    category = request.form.get("category", "").strip()
    description = request.form.get("description", "").strip()
    price = request.form.get("price", type=float)

    cover_url = request.form.get("cover_url", "").strip()
    cover_public_id = request.form.get("cover_public_id", "").strip()
    book_file_url = request.form.get("book_file_url", "").strip()
    book_file_public_id = request.form.get("book_file_public_id", "").strip()

    if not title:
        return jsonify({"error": "Book title is required"}), 400
    if price is None:
        return jsonify({"error": "Price is required"}), 400

    use_cloudinary = is_cloudinary_configured()

    if use_cloudinary:
        if not cover_url:
            return jsonify({"error": "Book cover is required"}), 400
        cover_image = None
        book_file = None
    else:
        cover_result = handle_file_upload("cover_image", "COVERS_FOLDER", allowed_cover_file, "MAX_COVER_SIZE")
        if isinstance(cover_result, dict) and "error" in cover_result:
            return jsonify({"error": cover_result["error"]}), 400
        cover_image = cover_result

        book_file_result = handle_file_upload("book_file", "BOOKS_FOLDER", allowed_book_file, "MAX_BOOK_SIZE")
        if isinstance(book_file_result, dict) and "error" in book_file_result:
            return jsonify({"error": book_file_result["error"]}), 400
        book_file = book_file_result

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


@books_bp.route("/<int:book_id>", methods=["PUT"])
@verified_required
def update_book(book_id):
    user_id = get_current_user_id()
    if current_app.config.get("USE_MONGO"):
        book = mongo_get_book_by_id(book_id)
        if not book:
            return jsonify({"error": "Book Not Found"}), 404
        uploader = book.get("uploaded_by")
        user = mongo_get_user_by_id(user_id)
        if uploader != user_id and (not user or user.get("role") != "admin"):
            return jsonify({"error": "Access Denied"}), 403
        updates = {}
        if "title" in request.form:
            updates["title"] = request.form["title"].strip()
        if "author" in request.form:
            updates["author"] = request.form["author"].strip()
        if "category" in request.form:
            updates["category"] = request.form["category"].strip()
        if "description" in request.form:
            updates["description"] = request.form["description"].strip()
        if "price" in request.form:
            updates["price"] = float(request.form["price"])

        cover_url = request.form.get("cover_url", "").strip()
        cover_public_id = request.form.get("cover_public_id", "").strip()
        book_file_url = request.form.get("book_file_url", "").strip()
        book_file_public_id = request.form.get("book_file_public_id", "").strip()

        use_cloudinary = is_cloudinary_configured()

        if use_cloudinary:
            if cover_url:
                updates["cover_url"] = cover_url
                updates["cover_public_id"] = cover_public_id
                if book.get("cover_public_id") and book.get("cover_public_id") != cover_public_id:
                    delete_asset(book["cover_public_id"], "image")
            if book_file_url:
                updates["book_file_url"] = book_file_url
                updates["book_file_public_id"] = book_file_public_id
                if book.get("book_file_public_id") and book.get("book_file_public_id") != book_file_public_id:
                    delete_asset(book["book_file_public_id"], "raw")
        else:
            cover_result = handle_file_upload("cover_image", "COVERS_FOLDER", allowed_cover_file, "MAX_COVER_SIZE")
            if isinstance(cover_result, dict):
                return jsonify({"error": cover_result["error"]}), 400
            if cover_result:
                updates["cover_image"] = cover_result
            book_file_result = handle_file_upload("book_file", "BOOKS_FOLDER", allowed_book_file, "MAX_BOOK_SIZE")
            if isinstance(book_file_result, dict):
                return jsonify({"error": book_file_result["error"]}), 400
            if book_file_result:
                updates["book_file"] = book_file_result

        updated = mongo_update_book(book_id, updates)
        return jsonify({"message": "Book updated successfully", "book": serialize_book(updated)}), 200

    book = Book.query.get(book_id)
    if not book:
        return jsonify({"error": "Book Not Found"}), 404

    if book.uploaded_by != user_id and User.query.get(user_id).role != "admin":
        return jsonify({"error": "Access Denied"}), 403

    if "title" in request.form:
        book.title = request.form["title"].strip()
    if "author" in request.form:
        book.author = request.form["author"].strip()
    if "category" in request.form:
        book.category = request.form["category"].strip()
    if "description" in request.form:
        book.description = request.form["description"].strip()
    if "price" in request.form:
        book.price = float(request.form["price"])

    cover_result = handle_file_upload("cover_image", "COVERS_FOLDER", allowed_cover_file, "MAX_COVER_SIZE")
    if isinstance(cover_result, dict):
        return jsonify({"error": cover_result["error"]}), 400
    if cover_result:
        book.cover_image = cover_result

    book_file_result = handle_file_upload("book_file", "BOOKS_FOLDER", allowed_book_file, "MAX_BOOK_SIZE")
    if isinstance(book_file_result, dict):
        return jsonify({"error": book_file_result["error"]}), 400
    if book_file_result:
        book.book_file = book_file_result

    db.session.commit()
    return jsonify({"message": "Book updated successfully", "book": book.to_dict()}), 200


@books_bp.route("/<int:book_id>", methods=["DELETE"])
@verified_required
def delete_book(book_id):
    user_id = get_current_user_id()
    if current_app.config.get("USE_MONGO"):
        book = mongo_get_book_by_id(book_id)
        if not book:
            return jsonify({"error": "Book Not Found"}), 404
        uploader = book.get("uploaded_by")
        user = mongo_get_user_by_id(user_id)
        if uploader != user_id and (not user or user.get("role") != "admin"):
            return jsonify({"error": "Access Denied"}), 403

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

    user = User.query.get(user_id)
    if book.uploaded_by != user_id and user.role != "admin":
        return jsonify({"error": "Access Denied"}), 403

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