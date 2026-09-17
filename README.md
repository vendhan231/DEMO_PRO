# BookVerse - Online Bookstore

A full-stack online bookstore built with a **React** frontend (Vite + Tailwind CSS) and a **Python/Flask** backend (SQLAlchemy + JWT).

## Features

- **User Authentication**: Register, login, logout with JWT-based auth
- **Book Management**: Admin can add, view, and delete books (with cover image and optional PDF upload)
- **Book Browsing**: Responsive card grid with search across title, author, category, and description
- **Shopping Cart**: Add, update quantity, remove items, clear cart, live totals
- **Admin Dashboard**: Stats overview, book management table with delete confirmation

## Tech Stack

| Layer        | Technology          |
|-------------|---------------------|
| Frontend    | React.js, Vite, Tailwind CSS |
| Backend     | Python, Flask       |
| API         | REST API            |
| ORM         | SQLAlchemy          |
| Database    | SQLite (demo)       |
| Auth        | Flask-JWT-Extended  |
| Styling     | Tailwind CSS        |

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
python seed.py          # Seeds the database with sample books and demo users
python app.py           # Runs on http://127.0.0.1:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev             # Runs on http://localhost:5173
```

## Demo Credentials

| Role    | Email                  | Password     |
|---------|------------------------|--------------|
| Admin   | admin@bookverse.com    | admin123     |
| Customer| customer@bookverse.com | customer123  |

## Project Structure

```
bookverse/
├── backend/
│   ├── app.py              # App entry point
│   ├── seed.py             # Database seed script
│   ├── requirements.txt
│   ├── .env
│   ├── app/
│   │   ├── __init__.py     # App factory
│   │   ├── config.py       # Configuration
│   │   ├── models/         # User, Book, Cart, CartItem
│   │   ├── routes/         # auth, books, cart, admin
│   │   ├── services/       # Auth, book, cart services
│   │   └── uploads/        # covers/, books/
│   └── database/           # bookstore.db
├── frontend/
│   ├── vite.config.js
│   └── src/
│       ├── components/     # Navbar, Footer, BookCard
│       ├── pages/          # Home, Books, BookDetails, Search, Login, Register, Cart, Admin
│       ├── services/       # API client
│       ├── context/        # AuthContext, CartContext
│       └── ...
├── README.md
└── .gitignore
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user info

### Books
- `GET /api/books` - List all books (paginated)
- `GET /api/books/<id>` - Get a single book
- `GET /api/books/search?q=<query>` - Search books

### Admin (requires admin role)
- `GET /api/admin/books` - List all books (admin)
- `POST /api/admin/books` - Add a new book (multipart form)
- `DELETE /api/admin/books/<id>` - Delete a book
- `GET /api/admin/stats` - Get dashboard stats

### Cart
- `GET /api/cart` - Get current user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/<id>` - Update cart item quantity
- `DELETE /api/cart/items/<id>` - Remove item from cart
- `DELETE /api/cart/clear` - Clear entire cart
