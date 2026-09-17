from flask import Flask
from sqlalchemy import inspect, text
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from pymongo import MongoClient

from .mongo_service import ensure_indexes

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()


def create_app(config_name=None):
    from .config import Config

    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)
    app.url_map.strict_slashes = False

    mongo_client = None
    mongo_db = None
    mongo_uri = app.config.get("MONGO_URI")

    if mongo_uri:
        try:
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
            ensure_indexes()
        except Exception as exc:
            mongo_client = None
            mongo_db = None
            app.config["MONGO_CLIENT"] = None
            app.config["MONGO_DB"] = None
            app.config["MONGO_ERROR"] = str(exc)
            app.config["USE_MONGO"] = False
    else:
        mongo_client = None
        mongo_db = None
        app.config["MONGO_CLIENT"] = None
        app.config["MONGO_DB"] = None
        app.config["MONGO_ERROR"] = "MONGO_URI is not configured"
        app.config["USE_MONGO"] = False

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}}, supports_credentials=True)

    from .models import User, Book, Cart, CartItem
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
        status = {"status": "ok", "message": "BookVerse API is running", "database": "sqlite"}
        if mongo_db is not None:
            status["database"] = "mongodb"
            status["mongo"] = {"connected": True, "database": mongo_db.name}
        elif app.config.get("MONGO_ERROR"):
            status["database"] = "sqlite"
            status["mongo"] = {"connected": False, "error": app.config.get("MONGO_ERROR")}
        return status

    with app.app_context():
        db.create_all()
        if "verification_sent_at" not in {column["name"] for column in inspect(db.engine).get_columns("users")}:
            db.session.execute(text("ALTER TABLE users ADD COLUMN verification_sent_at DATETIME"))
            db.session.commit()

    return app
