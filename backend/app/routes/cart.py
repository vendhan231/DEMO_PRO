from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models import Cart, CartItem, Book, Order, OrderItem
from ..mongo_service import (
    get_or_create_cart,
    add_to_cart as mongo_add_to_cart,
    update_cart_item as mongo_update_cart_item,
    remove_cart_item as mongo_remove_cart_item,
    clear_cart as mongo_clear_cart,
    serialize_cart,
    create_order_from_cart as mongo_create_order_from_cart,
    list_orders as mongo_list_orders,
    get_book_by_id as mongo_get_book_by_id,
)

cart_bp = Blueprint("cart", __name__)


def get_user_cart(user_id):
    if current_app.config.get("USE_MONGO"):
        cart = get_or_create_cart(user_id)
        return serialize_cart(cart)
    cart = Cart.query.filter_by(user_id=user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.session.add(cart)
        db.session.commit()
    return cart


@cart_bp.route("/", methods=["GET"])
@jwt_required()
def get_cart():
    user_id = int(get_jwt_identity())
    cart = get_user_cart(user_id)
    if current_app.config.get("USE_MONGO"):
        return jsonify({"cart": cart}), 200
    return jsonify({"cart": cart.to_dict()}), 200


@cart_bp.route("/items", methods=["POST"])
@jwt_required()
def add_to_cart():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    book_id = data.get("book_id")
    quantity = data.get("quantity", 1)

    if current_app.config.get("USE_MONGO"):
        book = mongo_get_book_by_id(book_id)
        if not book:
            return jsonify({"error": "Book Not Found"}), 404
        mongo_add_to_cart(user_id, book_id, quantity)
        return jsonify({"message": "Book added to cart", "cart": get_user_cart(user_id)}), 200

    book = Book.query.get(book_id)
    if not book:
        return jsonify({"error": "Book Not Found"}), 404

    cart = get_user_cart(user_id)
    existing_item = CartItem.query.filter_by(cart_id=cart.id, book_id=book_id).first()

    if existing_item:
        existing_item.quantity += quantity
    else:
        item = CartItem(cart_id=cart.id, book_id=book_id, quantity=quantity)
        db.session.add(item)

    db.session.commit()

    return jsonify({"message": "Book added to cart", "cart": cart.to_dict()}), 200


@cart_bp.route("/items/<int:item_id>", methods=["PUT"])
@jwt_required()
def update_cart_item(item_id):
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    quantity = data.get("quantity", 1)

    if quantity < 1:
        return jsonify({"error": "Quantity must be at least 1"}), 400

    if current_app.config.get("USE_MONGO"):
        cart = get_or_create_cart(user_id)
        item = next((item for item in serialize_cart(cart)["items"] if item["id"] == item_id), None)
        if not item:
            return jsonify({"error": "Cart item not found"}), 404
        mongo_update_cart_item(user_id, item_id, quantity)
        return jsonify({"message": "Cart updated", "cart": get_user_cart(user_id)}), 200

    cart = get_user_cart(user_id)
    item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()

    if not item:
        return jsonify({"error": "Cart item not found"}), 404

    item.quantity = quantity
    db.session.commit()

    return jsonify({"message": "Cart updated", "cart": cart.to_dict()}), 200


@cart_bp.route("/items/<int:item_id>", methods=["DELETE"])
@jwt_required()
def remove_cart_item(item_id):
    user_id = int(get_jwt_identity())
    if current_app.config.get("USE_MONGO"):
        cart = get_or_create_cart(user_id)
        item = next((item for item in serialize_cart(cart)["items"] if item["id"] == item_id), None)
        if not item:
            return jsonify({"error": "Cart item not found"}), 404
        mongo_remove_cart_item(user_id, item_id)
        return jsonify({"message": "Item removed from cart", "cart": get_user_cart(user_id)}), 200

    cart = get_user_cart(user_id)
    item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()

    if not item:
        return jsonify({"error": "Cart item not found"}), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({"message": "Item removed from cart", "cart": cart.to_dict()}), 200


@cart_bp.route("/clear", methods=["DELETE"])
@jwt_required()
def clear_cart():
    user_id = int(get_jwt_identity())
    if current_app.config.get("USE_MONGO"):
        mongo_clear_cart(user_id)
        return jsonify({"message": "Cart cleared", "cart": get_user_cart(user_id)}), 200

    cart = get_user_cart(user_id)
    CartItem.query.filter_by(cart_id=cart.id).delete()
    db.session.commit()

    return jsonify({"message": "Cart cleared", "cart": cart.to_dict()}), 200


@cart_bp.route("/checkout", methods=["POST"])
@jwt_required()
def checkout():
    user_id = int(get_jwt_identity())
    if current_app.config.get("USE_MONGO"):
        order = mongo_create_order_from_cart(user_id)
    else:
        cart = get_user_cart(user_id)
        if not cart.items:
            return jsonify({"error": "Your cart is empty"}), 400
        order = Order(user_id=user_id, total_amount=cart.total_amount, status="placed")
        for item in cart.items:
            order.items.append(OrderItem(book_id=item.book_id, title=item.book.title, author=item.book.author, quantity=item.quantity, unit_price=item.book.price, book_file=item.book.book_file))
        db.session.add(order)
        CartItem.query.filter_by(cart_id=cart.id).delete()
        db.session.commit()
        order = order.to_dict()
    if not order:
        return jsonify({"error": "Your cart is empty"}), 400
    return jsonify({"message": "Order placed successfully", "order": order}), 201


@cart_bp.route("/orders", methods=["GET"])
@jwt_required()
def orders():
    user_id = int(get_jwt_identity())
    if current_app.config.get("USE_MONGO"):
        return jsonify({"orders": mongo_list_orders(user_id)}), 200
    user_orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
    return jsonify({"orders": [order.to_dict() for order in user_orders]}), 200
