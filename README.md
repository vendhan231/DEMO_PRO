# BookVerse - Online Bookstore

BookVerse is a full-stack online bookstore with a React/Vite frontend and a
Flask REST API backed by MongoDB Atlas. The frontend and API are prepared for
one Vercel project and one public domain.

## Architecture

```text
Browser
  |
  +-- React/Vite pages at /
  +-- Flask API at /api/*
			 |
			 +-- MongoDB Atlas
```

Vercel serves the compiled frontend and invokes the Flask application as a
Python serverless function. The browser uses same-origin `/api/...` requests
in production; there is no separate backend deployment or backend domain.

## Features

- User registration, email verification, login, logout, and JWT sessions
- MongoDB-backed book browsing, search, and administration
- Cover image and PDF upload endpoints
- Shopping cart and order workflows
- Admin dashboard and protected management endpoints

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Backend | Python 3.14.x, Flask |
| Database | MongoDB / MongoDB Atlas |
| Authentication | Flask-JWT-Extended |
| Deployment | One Vercel project |

## Project Structure

```text
DEMO_PRO/
├── api/
│   └── index.py              # Vercel Python function adapter
├── backend/
│   ├── app/                  # Flask app, routes, models, and services
│   ├── requirements.txt      # Local/traditional backend dependencies
│   ├── .env.example          # Backend environment template
│   ├── .python-version       # Python 3.14
│   └── wsgi.py               # Local Gunicorn entry point
├── frontend/
│   ├── src/                  # React application
│   ├── package.json
│   └── .env.example          # Optional local API origin
├── requirements.txt          # Dependencies installed by Vercel
├── vercel.json               # API routing, Python runtime, and SPA fallback
└── README.md
```

MongoDB is the only database architecture used by the backend. No SQLite
fallback is configured.

## Local Development

### Backend

Create a local environment from `backend/.env.example`, then configure a
MongoDB connection and application secrets. From the repository root:

```bash
cd backend
python -m pip install -r requirements.txt
python wsgi.py
```

The local API listens on `http://127.0.0.1:5000` when started this way. For
traditional hosting, `gunicorn wsgi:app` remains the production-style local
entry point.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite serves the frontend at `http://localhost:5173`. During development,
`VITE_API_URL` may point to a local Flask origin. In production it is ignored:
the frontend always uses the same Vercel origin for API and upload URLs.

## Environment Variables

### Vercel project variables

Add these variables in the single Vercel project. Keep them server-side and do
not use the `VITE_` prefix for secrets:

```text
MONGO_URI=mongodb+srv://...
MONGO_DATABASE_NAME=bookverse
SECRET_KEY=<long-random-secret>
JWT_SECRET_KEY=<long-random-secret>
```

Email delivery is optional for local startup, but account verification email
delivery requires:

```text
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=...
EMAIL_PASSWORD=...
EMAIL_FROM=noreply@example.com
```

Vercel supplies `VERCEL_URL` automatically. `FRONTEND_URL` and `CORS_ORIGINS`
are optional for same-origin production requests, but may be set when an
additional trusted frontend origin must call the API:

```text
FRONTEND_URL=https://your-project.vercel.app
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Use placeholders only in the committed files `backend/.env.example` and
`frontend/.env.example`. Never commit `.env`, passwords, MongoDB credentials,
JWT secrets, or SMTP credentials.

## Vercel Deployment

Import the repository as one Vercel project with the repository root as the
project root. Do not create a separate backend project and do not configure a
Render service.

The root `vercel.json` performs these jobs:

1. Builds `frontend` with Vite into `frontend/dist`.
2. Uses `api/index.py` with Vercel's Python 3.12 runtime.
3. Sends `/api` and `/api/*` requests to the Flask function first.
4. Serves generated assets through the filesystem handler.
5. Sends remaining paths to `index.html` for React client-side routing.

The API rule appears before the SPA fallback, so `/api/*` is never swallowed by
React routing. Routes such as `/books`, `/login`, and `/admin` continue to work
when refreshed directly.

From the repository root, validate the production build with:

```bash
npm install
npm run build
```

Vercel runs the configured install and build commands automatically. Test a
deployment with:

```bash
curl -i https://your-project.vercel.app/health
curl -i https://your-project.vercel.app/api/books
```

## MongoDB Atlas

Keep the existing MongoDB database and collections. In MongoDB Atlas:

1. Configure network access for Vercel according to your Atlas plan.
2. Ensure the database user in `MONGO_URI` can read and write the existing
	BookVerse database.
3. Do not reset, reseed, or delete production collections.

The Flask app creates one MongoDB client when the serverless module is loaded;
warm Vercel invocations reuse the loaded application module. Cold starts create
a new client as expected for serverless execution.

## File Uploads

The existing upload API and response formats are preserved. Vercel's runtime
filesystem is ephemeral, so files written under `backend/uploads` are not a
durable production storage solution. Configure a persistent object-storage
service and adapt the upload implementation before relying on uploaded covers
or PDFs in production.

## API Endpoints

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/verify-email/<token>`
- `POST /api/auth/resend-verification`

### Books

- `GET /api/books`
- `GET /api/books/<id>`
- `GET /api/books/search?q=<query>`

### Admin

- `GET /api/admin/books`
- `POST /api/admin/books`
- `DELETE /api/admin/books/<id>`
- `GET /api/admin/stats`

### Cart and Orders

- `GET /api/cart`
- `POST /api/cart/items`
- `PUT /api/cart/items/<id>`
- `DELETE /api/cart/items/<id>`
- `DELETE /api/cart/clear`
- `POST /api/cart/checkout`
- `GET /api/cart/orders`
