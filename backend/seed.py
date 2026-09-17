from app import create_app, db
from app.models import User, Book
from app.mongo_service import create_user, create_book, get_user_by_email, get_book_by_id

app = create_app()

with app.app_context():
    db.create_all()

    if app.config.get("USE_MONGO"):
        if not get_user_by_email("admin@bookverse.com"):
            create_user("Admin User", "admin@bookverse.com", "admin123", role="admin", email_verified=True)
        if not get_user_by_email("customer@bookverse.com"):
            create_user("Test Customer", "customer@bookverse.com", "customer123", role="customer", email_verified=True)

        mongo_db = app.config.get("MONGO_DB")
        existing_titles = {book["title"].lower() for book in mongo_db.books.find({}, {"title": 1})}

        sample_books = [
            {
                "title": "Python Programming Basics",
                "author": "Demo Author",
                "category": "Programming",
                "description": "Introduction to Python programming covering fundamentals, data structures, and practical examples.",
                "price": 499.0,
                "cover_image": "python.jpg",
            },
            {
                "title": "Web Development with Flask",
                "author": "Demo Author",
                "category": "Web Development",
                "description": "Learn Flask framework from scratch to building full web applications in Python.",
                "price": 399.0,
                "cover_image": "flask.jpg",
            },
            {
                "title": "JavaScript for Beginners",
                "author": "Demo Author",
                "category": "Programming",
                "description": "Complete guide to JavaScript for absolute beginners with interactive examples.",
                "price": 349.0,
                "cover_image": "javascript.jpg",
            },
            {
                "title": "Modern HTML & CSS",
                "author": "Demo Author",
                "category": "Web Development",
                "description": "Master modern HTML5 and CSS3 techniques for responsive web design.",
                "price": 299.0,
                "cover_image": "htmlcss.jpg",
            },
            {
                "title": "Database Fundamentals",
                "author": "Demo Author",
                "category": "Database",
                "description": "Core database concepts, SQL, and design principles for beginners.",
                "price": 449.0,
                "cover_image": "database.jpg",
            },
            {
                "title": "Python Through Projects",
                "author": "Demo Author",
                "category": "Programming",
                "description": "Learn Python by building real-world projects including web apps and data analysis.",
                "price": 599.0,
                "cover_image": "python_projects.jpg",
            },
        ]

        for book_data in sample_books:
            if book_data["title"].lower() not in existing_titles:
                create_book(
                    title=book_data["title"],
                    author=book_data["author"],
                    category=book_data["category"],
                    description=book_data["description"],
                    price=book_data["price"],
                    cover_image=book_data["cover_image"],
                )
                existing_titles.add(book_data["title"].lower())

        print("Database seeded successfully!")
        print("Seeded Mongo users and books")
        raise SystemExit(0)

    if not User.query.filter_by(email="admin@bookverse.com").first():
        admin = User(name="Admin User", email="admin@bookverse.com", role="admin")
        admin.email_verified = True
        admin.set_password("admin123")
        db.session.add(admin)

    if not User.query.filter_by(email="customer@bookverse.com").first():
        customer = User(name="Test Customer", email="customer@bookverse.com", role="customer")
        customer.email_verified = True
        customer.set_password("customer123")
        db.session.add(customer)

    sample_books = [
        {
            "title": "Python Programming Basics",
            "author": "Demo Author",
            "category": "Programming",
            "description": "Introduction to Python programming covering fundamentals, data structures, and practical examples.",
            "price": 499.0,
            "cover_image": "python.jpg",
        },
        {
            "title": "Web Development with Flask",
            "author": "Demo Author",
            "category": "Web Development",
            "description": "Learn Flask framework from scratch to building full web applications in Python.",
            "price": 399.0,
            "cover_image": "flask.jpg",
        },
        {
            "title": "JavaScript for Beginners",
            "author": "Demo Author",
            "category": "Programming",
            "description": "Complete guide to JavaScript for absolute beginners with interactive examples.",
            "price": 349.0,
            "cover_image": "javascript.jpg",
        },
        {
            "title": "Modern HTML & CSS",
            "author": "Demo Author",
            "category": "Web Development",
            "description": "Master modern HTML5 and CSS3 techniques for responsive web design.",
            "price": 299.0,
            "cover_image": "htmlcss.jpg",
        },
        {
            "title": "Database Fundamentals",
            "author": "Demo Author",
            "category": "Database",
            "description": "Core database concepts, SQL, and design principles for beginners.",
            "price": 449.0,
            "cover_image": "database.jpg",
        },
        {
            "title": "Python Through Projects",
            "author": "Demo Author",
            "category": "Programming",
            "description": "Learn Python by building real-world projects including web apps and data analysis.",
            "price": 599.0,
            "cover_image": "python_projects.jpg",
        },
    ]

    for book_data in sample_books:
        if not Book.query.filter_by(title=book_data["title"]).first():
            book = Book(**book_data)
            db.session.add(book)

    db.session.commit()
    print("Database seeded successfully!")
    print(f"Users: {User.query.count()}")
    print(f"Books: {Book.query.count()}")
