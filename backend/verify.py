import os
os.environ['MONGO_URI'] = 'mongodb+srv://demoproject:demoproject@cluster0.2oacwoq.mongodb.net/?appName=Cluster0'
os.environ['MONGO_DATABASE_NAME'] = 'bookverse'
from app import create_app
app = create_app()
with app.app_context():
    from app.mongo_service import get_db
    db = get_db()
    books = list(db.books.find({}))
    print(f'Total books in MongoDB: {len(books)}')
    for b in books:
        print(f'  - {b.get("title")} by {b.get("author")} (category: {b.get("category")}, price: {b.get("price")}, cover: {b.get("cover_image")})')
