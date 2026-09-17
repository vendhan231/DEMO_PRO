from .auth import auth_bp
from .books import books_bp
from .cart import cart_bp
from .admin import admin_bp
from .uploads import uploads_bp


def register_routes(app):
    app.register_blueprint(auth_bp, url_prefix="/api/auth", strict_slashes=False)
    app.register_blueprint(books_bp, url_prefix="/api/books", strict_slashes=False)
    app.register_blueprint(cart_bp, url_prefix="/api/cart", strict_slashes=False)
    app.register_blueprint(admin_bp, url_prefix="/api/admin", strict_slashes=False)
    app.register_blueprint(uploads_bp, url_prefix="/api/uploads", strict_slashes=False)
