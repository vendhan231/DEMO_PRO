from .. import db
from ..models import Cart, CartItem, Book


def get_or_create_cart(user_id):
    cart = Cart.query.filter_by(user_id=user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.session.add(cart)
        db.session.commit()
    return cart


def get_cart(user_id):
    return get_or_create_cart(user_id)


def add_to_cart(user_id, book_id, quantity=1):
    cart = get_or_create_cart(user_id)
    existing_item = CartItem.query.filter_by(cart_id=cart.id, book_id=book_id).first()
    if existing_item:
        existing_item.quantity += quantity
    else:
        item = CartItem(cart_id=cart.id, book_id=book_id, quantity=quantity)
        db.session.add(item)
    db.session.commit()
    return cart


def update_cart_item(user_id, item_id, quantity):
    cart = get_or_create_cart(user_id)
    item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
    if not item:
        return None
    item.quantity = quantity
    db.session.commit()
    return cart


def remove_cart_item(user_id, item_id):
    cart = get_or_create_cart(user_id)
    item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
    if not item:
        return None
    db.session.delete(item)
    db.session.commit()
    return cart


def clear_cart(user_id):
    cart = get_or_create_cart(user_id)
    CartItem.query.filter_by(cart_id=cart.id).delete()
    db.session.commit()
    return cart


def get_cart_total(user_id):
    cart = get_or_create_cart(user_id)
    return cart.total_amount
