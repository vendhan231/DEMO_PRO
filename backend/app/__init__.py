from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient

from .mongo_service import ensure_indexes

# This project is MongoDB-only. Some route modules still import `db` from the app
# package for compatibility with the existing code structure, so it must exist
# without reintroducing SQLite or any fallback database layer.
db = None
jwt = JWTManager()
cors = CORS()


def create_app(config_name=None):
    from .config import Config

    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)
    app.url_map.strict_slashes = False

    mongo_uri = app.config.get("MONGO_URI")
    if not mongo_uri:
        raise RuntimeError("MONGO_URI is not configured")

    try:
        with app.app_context():
            mongo_client = MongoClient(
                mongo_uri,
                serverSelectionTimeoutMS=app.config["MONGO_SERVER_SELECTION_TIMEOUT_MS"],
                connectTimeoutMS=app.config["MONGO_CONNECT_TIMEOUT_MS"],
            )
            mongo_db = mongo_client[app.config.get("MONGO_DATABASE_NAME", "bookverse")]
            mongo_db.command("ping")
            app.config["MONGO_CLIENT"] = mongo_client
            app.config["MONGO_DB"] = mongo_db
            app.config["USE_MONGO"] = True
            app.config["MONGO_ERROR"] = None
            ensure_indexes()
    except Exception as exc:
        raise RuntimeError(f"MongoDB connection failed: {exc}") from exc

    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}}, supports_credentials=True)

    from .routes import register_routes

    register_routes(app)

    @app.route("/uploads/<path:filename>")
    def serve_upload(filename):
        from flask import send_from_directory, current_app
        return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename, as_attachment=False)

    @app.route("/uploads/covers/<path:filename>")
    def serve_cover(filename):
        from flask import send_from_directory, current_app
        return send_from_directory(current_app.config["COVERS_FOLDER"], filename, as_attachment=False)

    @app.route("/uploads/books/<path:filename>")
    def serve_book(filename):
        from flask import send_from_directory, current_app
        return send_from_directory(current_app.config["BOOKS_FOLDER"], filename, as_attachment=False)

    @app.route("/health")
    def health():
        return {
            "status": "ok",
            "message": "BookVerse API is running",
            "database": "mongodb",
            "mongo": {"connected": True, "database": mongo_db.name},
        }

    return app
