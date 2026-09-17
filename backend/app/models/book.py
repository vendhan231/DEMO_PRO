from datetime import datetime
from .. import db

class Book(db.Model):
    __tablename__ = "books"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(100), nullable=True)
    category = db.Column(db.String(100), nullable=True)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=True)
    cover_image = db.Column(db.String(255), nullable=True)
    book_file = db.Column(db.String(255), nullable=True)
    uploaded_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        data = {
            "id": self.id,
            "title": self.title,
            "author": self.author,
            "category": self.category,
            "description": self.description,
            "price": self.price,
            "cover_image": self.cover_image,
            "book_file": self.book_file,
            "uploaded_by": self.uploaded_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        data["cover_url"] = self.cover_url()
        data["book_file_url"] = self.book_file_url()
        return data

    def cover_url(self):
        if self.cover_image:
            return f"/uploads/covers/{self.cover_image}"
        return None

    def book_file_url(self):
        if self.book_file:
            return f"/uploads/books/{self.book_file}"
        return None
