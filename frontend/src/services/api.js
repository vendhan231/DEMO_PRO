import { apiUrl } from "./urls"

const API_BASE_URL = apiUrl("/api")

const getAuthHeaders = () => {
  const token = localStorage.getItem("token")
  const headers = { "Content-Type": "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

const getAuthHeadersNoJson = () => {
  const token = localStorage.getItem("token")
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

const api = {
  register: (data) => fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, frontend_url: window.location.origin }),
  }).then(r => r.json()),

  login: (data) => fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(r => r.json()),

  verifyEmail: (token) => fetch(`${API_BASE_URL}/auth/verify-email/${token}`).then(r => r.json()),

  resendVerification: (email) => fetch(`${API_BASE_URL}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, frontend_url: window.location.origin }),
  }).then(r => r.json()),

  me: () => fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  }).then(r => r.json()),

  getBooks: () => fetch(`${API_BASE_URL}/books`).then(r => r.json()),
  getBook: (id) => fetch(`${API_BASE_URL}/books/${id}`).then(r => r.json()),
  searchBooks: (q) => fetch(`${API_BASE_URL}/books/search?q=${encodeURIComponent(q)}`).then(r => r.json()),

  addBook: (formData) => fetch(`${API_BASE_URL}/books`, {
    method: "POST",
    headers: getAuthHeadersNoJson(),
    body: formData,
  }).then(r => r.json()),

  updateBook: (id, formData) => fetch(`${API_BASE_URL}/books/${id}`, {
    method: "PUT",
    headers: getAuthHeadersNoJson(),
    body: formData,
  }).then(r => r.json()),

  deleteBook: (id) => fetch(`${API_BASE_URL}/books/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  }).then(r => r.json()),

  getAdminStats: () => fetch(`${API_BASE_URL}/admin/stats`, {
    headers: getAuthHeaders(),
  }).then(r => r.json()),

  getAllBooksAdmin: () => fetch(`${API_BASE_URL}/admin/books`, {
    headers: getAuthHeaders(),
  }).then(r => r.json()),

  getCart: () => fetch(`${API_BASE_URL}/cart`, {
    headers: getAuthHeaders(),
  }).then(r => r.json()),

  addToCart: (bookId, quantity = 1) => fetch(`${API_BASE_URL}/cart/items`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ book_id: bookId, quantity }),
  }).then(r => r.json()),

  updateCartItem: (itemId, quantity) => fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ quantity }),
  }).then(r => r.json()),

  removeCartItem: (itemId) => fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  }).then(r => r.json()),

  clearCart: () => fetch(`${API_BASE_URL}/cart/clear`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  }).then(r => r.json()),

  checkout: () => fetch(`${API_BASE_URL}/cart/checkout`, {
    method: "POST",
    headers: getAuthHeaders(),
  }).then(r => r.json()),

  getOrders: () => fetch(`${API_BASE_URL}/cart/orders`, {
    headers: getAuthHeaders(),
  }).then(r => r.json()),
}

export default api
