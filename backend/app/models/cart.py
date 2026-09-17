from datetime import datetime
from .. import db

class Cart(db.Model):
    __tablename__ = "carts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", back_populates="cart", lazy=True)
    items = db.relationship("CartItem", back_populates="cart", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "items": [item.to_dict() for item in self.items],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @property
    def total_quantity(self):
        return sum(item.quantity for item in self.items)

    @property
    def total_amount(self):
        return sum(item.quantity * (item.book.price if item.book else 0) for item in self.items)


class CartItem(db.Model):
    __tablename__ = "cart_items"

    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey("carts.id"), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)
    quantity = db.Column(db.Integer, default=1, nullable=False)

    cart = db.relationship("Cart", back_populates="items", lazy=True)
    book = db.relationship("Book", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "cart_id": self.cart_id,
            "book_id": self.book_id,
            "quantity": self.quantity,
            "book": self.book.to_dict() if self.book else None,
            "unit_price": self.book.price if self.book else 0,
            "subtotal": (self.book.price if self.book else 0) * self.quantity,
        }


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(30), default="placed", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "total_amount": self.total_amount,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "items": [item.to_dict() for item in self.items],
        }


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    book_id = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(255), nullable=True)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    book_file = db.Column(db.String(255), nullable=True)
    order = db.relationship("Order", back_populates="items")

    def to_dict(self):
        return {
            "id": self.id,
            "book_id": self.book_id,
            "title": self.title,
            "author": self.author,
            "quantity": self.quantity,
            "unit_price": self.unit_price,
            "subtotal": self.unit_price * self.quantity,
            "book_file": self.book_file,
            "book_file_url": f"/uploads/books/{self.book_file}" if self.book_file else None,
        }
