import re
from datetime import datetime

from flask import current_app
from werkzeug.security import check_password_hash, generate_password_hash
from .services.cloudinary_service import signed_asset_url


def get_db():
    db = current_app.config.get("MONGO_DB")
    if db is None:
        raise RuntimeError("MongoDB is not configured")
    return db


def next_sequence(name):
    db = get_db()
    counter = db.counters.find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    return counter["seq"]


def ensure_indexes():
    db = get_db()
    db.users.create_index("email", unique=True)
    db.books.create_index("title")
    db.carts.create_index("user_id", unique=True)
    db.cart_items.create_index([("cart_id", 1), ("book_id", 1)], unique=True)


def serialize_user(user_doc):
    if not user_doc:
        return None
    return {
        "id": user_doc.get("id"),
        "name": user_doc.get("name"),
        "email": user_doc.get("email"),
        "role": user_doc.get("role", "customer"),
        "email_verified": user_doc.get("email_verified", False),
        "verification_token": user_doc.get("verification_token"),
        "verification_token_expires": user_doc.get("verification_token_expires").isoformat() if user_doc.get("verification_token_expires") else None,
        "created_at": user_doc.get("created_at").isoformat() if user_doc.get("created_at") else None,
    }


def create_user(name, email, password, role="customer", email_verified=False):
    db = get_db()
    user = db.users.find_one({"email": email.lower()})
    if user:
        return user

    now = datetime.utcnow()
    user_doc = {
        "id": next_sequence("users"),
        "name": name.strip(),
        "email": email.strip().lower(),
        "password_hash": generate_password_hash(password),
        "role": role,
        "email_verified": email_verified,
        "verification_token": None,
        "verification_token_expires": None,
        "verification_sent_at": None,
        "created_at": now,
    }
    db.users.insert_one(user_doc)
    return user_doc


def get_user_by_email(email):
    db = get_db()
    return db.users.find_one({"email": email.strip().lower()})


def get_user_by_id(user_id):
    db = get_db()
    return db.users.find_one({"id": int(user_id)})


def verify_password(user_doc, password):
    if not user_doc:
        return False
    return check_password_hash(user_doc.get("password_hash", ""), password)


def update_user_verification(email, token, expires_at):
    db = get_db()
    db.users.update_one(
        {"email": email.strip().lower()},
        {"$set": {"verification_token": token, "verification_token_expires": expires_at, "verification_sent_at": datetime.utcnow(), "email_verified": False}}
    )


def verify_user_token(token):
    db = get_db()
    return db.users.find_one({"verification_token": token})


def set_user_email_verified(user_id, verified=True):
    db = get_db()
    db.users.update_one(
        {"id": int(user_id)},
        {"$set": {"email_verified": verified, "verification_token": None, "verification_token_expires": None}}
    )


def serialize_book(book_doc):
    if not book_doc:
        return None
    payload = {
        "id": book_doc.get("id"),
        "title": book_doc.get("title"),
        "author": book_doc.get("author"),
        "category": book_doc.get("category"),
        "description": book_doc.get("description"),
        "price": book_doc.get("price"),
        "cover_image": book_doc.get("cover_image"),
        "cover_url": book_doc.get("cover_url"),
        "cover_public_id": book_doc.get("cover_public_id"),
        "book_file": book_doc.get("book_file"),
        "book_file_url": signed_asset_url(book_doc.get("book_file_public_id"), "raw") or book_doc.get("book_file_url"),
        "book_file_public_id": book_doc.get("book_file_public_id"),
        "uploaded_by": book_doc.get("uploaded_by"),
        "created_at": book_doc.get("created_at").isoformat() if book_doc.get("created_at") else None,
        "updated_at": book_doc.get("updated_at").isoformat() if book_doc.get("updated_at") else None,
    }
    return payload


def list_books(page=1, per_page=12):
    db = get_db()
    total = db.books.count_documents({})
    cursor = db.books.find({}).sort("created_at", -1).skip((page - 1) * per_page).limit(per_page)
    items = [serialize_book(doc) for doc in cursor]
    return total, items


def get_book_by_id(book_id):
    db = get_db()
    return db.books.find_one({"id": int(book_id)})


def search_books(query):
    db = get_db()
    regex = {"$regex": re.escape(query.strip()), "$options": "i"}
    cursor = db.books.find(
        {
            "$or": [
                {"title": regex},
                {"author": regex},
                {"category": regex},
                {"description": regex},
            ]
        }
    ).sort("created_at", -1)
    return [serialize_book(doc) for doc in cursor]


def create_book(title, author, category, description, price, cover_image=None, book_file=None, uploaded_by=None, cover_url=None, cover_public_id=None, book_file_url=None, book_file_public_id=None):
    db = get_db()
    now = datetime.utcnow()
    book_doc = {
        "id": next_sequence("books"),
        "title": title.strip(),
        "author": author.strip(),
        "category": category.strip(),
        "description": description.strip() if description else None,
        "price": float(price),
        "cover_image": cover_image,
        "cover_url": cover_url,
        "cover_public_id": cover_public_id,
        "book_file": book_file,
        "book_file_url": book_file_url,
        "book_file_public_id": book_file_public_id,
        "uploaded_by": uploaded_by,
        "created_at": now,
        "updated_at": now,
    }
    db.books.insert_one(book_doc)
    return book_doc


def delete_book(book_id):
    db = get_db()
    result = db.books.delete_one({"id": int(book_id)})
    db.cart_items.delete_many({"book_id": int(book_id)})
    return result.deleted_count > 0


def update_book_mongo(book_id, updates):
    db = get_db()
    updates["updated_at"] = datetime.utcnow()
    db.books.update_one({"id": int(book_id)}, {"$set": updates})
    return db.books.find_one({"id": int(book_id)})


def get_book_uploader(book_id):
    db = get_db()
    book = db.books.find_one({"id": int(book_id)})
    return book.get("uploaded_by") if book else None


def serialize_cart(cart_doc):
    if not cart_doc:
        return None
    db = get_db()
    items = []
    for item in db.cart_items.find({"cart_id": cart_doc.get("id")}).sort("id", 1):
        book = get_book_by_id(item.get("book_id"))
        book_payload = serialize_book(book)
        items.append(
            {
                "id": item.get("id"),
                "cart_id": item.get("cart_id"),
                "book_id": item.get("book_id"),
                "quantity": item.get("quantity", 1),
                "book": book_payload,
                "unit_price": book_payload["price"] if book_payload else 0,
                "subtotal": (book_payload["price"] if book_payload else 0) * item.get("quantity", 1),
            }
        )
    return {
        "id": cart_doc.get("id"),
        "user_id": cart_doc.get("user_id"),
        "items": items,
        "created_at": cart_doc.get("created_at").isoformat() if cart_doc.get("created_at") else None,
        "updated_at": cart_doc.get("updated_at").isoformat() if cart_doc.get("updated_at") else None,
    }


def get_or_create_cart(user_id):
    db = get_db()
    cart = db.carts.find_one({"user_id": int(user_id)})
    if cart:
        return cart
    now = datetime.utcnow()
    cart = {
        "id": next_sequence("carts"),
        "user_id": int(user_id),
        "created_at": now,
        "updated_at": now,
    }
    db.carts.insert_one(cart)
    return cart


def add_to_cart(user_id, book_id, quantity=1):
    db = get_db()
    cart = get_or_create_cart(user_id)
    existing = db.cart_items.find_one({"cart_id": cart["id"], "book_id": int(book_id)})
    if existing:
        db.cart_items.update_one({"_id": existing["_id"]}, {"$inc": {"quantity": int(quantity)}})
    else:
        db.cart_items.insert_one(
            {
                "id": next_sequence("cart_items"),
                "cart_id": cart["id"],
                "book_id": int(book_id),
                "quantity": int(quantity),
            }
        )
    db.carts.update_one({"_id": cart["_id"]}, {"$set": {"updated_at": datetime.utcnow()}})
    return cart


def update_cart_item(user_id, item_id, quantity):
    db = get_db()
    cart = get_or_create_cart(user_id)
    db.cart_items.update_one({"id": int(item_id), "cart_id": cart["id"]}, {"$set": {"quantity": int(quantity)}})
    db.carts.update_one({"_id": cart["_id"]}, {"$set": {"updated_at": datetime.utcnow()}})
    return cart


def remove_cart_item(user_id, item_id):
    db = get_db()
    cart = get_or_create_cart(user_id)
    db.cart_items.delete_one({"id": int(item_id), "cart_id": cart["id"]})
    db.carts.update_one({"_id": cart["_id"]}, {"$set": {"updated_at": datetime.utcnow()}})
    return cart


def clear_cart(user_id):
    db = get_db()
    cart = get_or_create_cart(user_id)
    db.cart_items.delete_many({"cart_id": cart["id"]})
    db.carts.update_one({"_id": cart["_id"]}, {"$set": {"updated_at": datetime.utcnow()}})
    return cart


def create_order_from_cart(user_id):
    db = get_db()
    cart = get_or_create_cart(user_id)
    items = []
    total = 0
    for item in db.cart_items.find({"cart_id": cart["id"]}).sort("id", 1):
        book = get_book_by_id(item["book_id"])
        if not book:
            continue
        quantity = int(item.get("quantity", 1))
        price = float(book.get("price", 0))
        items.append({"id": next_sequence("order_items"), "book_id": book["id"], "title": book.get("title"), "author": book.get("author"), "quantity": quantity, "unit_price": price, "book_file": book.get("book_file"), "book_file_url": book.get("book_file_url")})
        total += price * quantity
    if not items:
        return None
    order = {"id": next_sequence("orders"), "user_id": int(user_id), "total_amount": total, "status": "placed", "created_at": datetime.utcnow()}
    db.orders.insert_one(order)
    for item in items:
        item["order_id"] = order["id"]
        db.order_items.insert_one(item)
    clear_cart(user_id)
    return serialize_order(order)


def serialize_order(order):
    if not order:
        return None
    db = get_db()
    items = []
    for item in db.order_items.find({"order_id": order.get("id")}).sort("id", 1):
        book = get_book_by_id(item.get("book_id"))
        book_file_url = item.get("book_file_url")
        if not book_file_url and book:
            book_file_url = signed_asset_url(book.get("book_file_public_id"), "raw") or book.get("book_file_url") or (f"/uploads/books/{book.get('book_file')}" if book.get("book_file") else None)
        if not book_file_url and item.get("book_file"):
            book_file_url = f"/uploads/books/{item.get('book_file')}"
        items.append({"id": item.get("id"), "book_id": item.get("book_id"), "title": item.get("title"), "author": item.get("author"), "quantity": item.get("quantity", 1), "unit_price": item.get("unit_price", 0), "subtotal": item.get("unit_price", 0) * item.get("quantity", 1), "book_file": item.get("book_file"), "book_file_url": book_file_url})
    return {"id": order.get("id"), "user_id": order.get("user_id"), "total_amount": order.get("total_amount", 0), "status": order.get("status", "placed"), "created_at": order.get("created_at").isoformat() if order.get("created_at") else None, "items": items}


def list_orders(user_id):
    db = get_db()
    return [serialize_order(order) for order in db.orders.find({"user_id": int(user_id)}).sort("created_at", -1)]


def cart_total_amount(user_id):
    db = get_db()
    cart = get_or_create_cart(user_id)
    total = 0
    for item in db.cart_items.find({"cart_id": cart["id"]}):
        book = get_book_by_id(item["book_id"])
        if book:
            total += float(book["price"]) * int(item.get("quantity", 1))
    return total


def admin_stats():
    db = get_db()
    return {
        "total_books": db.books.count_documents({}),
        "total_users": db.users.count_documents({}),
        "total_carts": db.carts.count_documents({}),
        "total_cart_items": db.cart_items.count_documents({}),
    }
