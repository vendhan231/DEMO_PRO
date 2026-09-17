import os
from dotenv import load_dotenv

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

for env_path in [
    os.path.join(BACKEND_DIR, ".env"),
    os.path.join(PROJECT_ROOT, ".env"),
]:
    if os.path.exists(env_path):
        load_dotenv(env_path)

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
    MONGO_URI = os.environ.get("MONGO_URI")
    MONGO_DATABASE_NAME = os.environ.get("MONGO_DATABASE_NAME", "bookverse")
    VERCEL_URL = (os.environ.get("VERCEL_PROJECT_PRODUCTION_URL") or os.environ.get("VERCEL_URL", "")).strip()
    DEFAULT_FRONTEND_URL = f"https://{VERCEL_URL}" if VERCEL_URL else "http://localhost:5173"
    FRONTEND_URL = os.environ.get("FRONTEND_URL", DEFAULT_FRONTEND_URL).rstrip("/")
    CORS_ORIGINS = [origin.strip() for origin in os.environ.get("CORS_ORIGINS", FRONTEND_URL).split(",") if origin.strip()]
    MONGO_SERVER_SELECTION_TIMEOUT_MS = int(os.environ.get("MONGO_SERVER_SELECTION_TIMEOUT_MS", "10000"))
    MONGO_CONNECT_TIMEOUT_MS = int(os.environ.get("MONGO_CONNECT_TIMEOUT_MS", "10000"))
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = 86400
    UPLOAD_FOLDER = os.path.join(BACKEND_DIR, "uploads")
    COVERS_FOLDER = os.path.join(BACKEND_DIR, "uploads", "covers")
    BOOKS_FOLDER = os.path.join(BACKEND_DIR, "uploads", "books")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    ALLOWED_COVER_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
    ALLOWED_BOOK_EXTENSIONS = {"pdf"}
    EMAIL_HOST = os.environ.get("EMAIL_HOST", "")
    EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "0") or 0) or 587
    EMAIL_USER = os.environ.get("EMAIL_USER", "")
    EMAIL_PASSWORD = os.environ.get("EMAIL_PASSWORD", "")
    EMAIL_FROM = os.environ.get("EMAIL_FROM", "noreply@bookverse.com")
    MAX_COVER_SIZE = 5 * 1024 * 1024
    MAX_BOOK_SIZE = 50 * 1024 * 1024
