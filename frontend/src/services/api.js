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

async function handleResponse(response) {
  const contentType = response.headers.get("content-type")
  const isJson = contentType && contentType.includes("application/json")

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`
    if (isJson) {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } else {
      const text = await response.text()
      errorMessage = text || errorMessage
    }
    const error = new Error(errorMessage)
    error.status = response.status
    error.response = response
    throw error
  }

  if (isJson) {
    return response.json()
  }
  return response.text()
}

const api = {
  register: (data) => fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, frontend_url: window.location.origin }),
  }).then(handleResponse),

  login: (data) => fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(handleResponse),

  verifyEmail: (token) => fetch(`${API_BASE_URL}/auth/verify-email/${token}`).then(handleResponse),

  resendVerification: (email) => fetch(`${API_BASE_URL}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, frontend_url: window.location.origin }),
  }).then(handleResponse),

  me: () => fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  }).then(handleResponse),

  getBooks: () => fetch(`${API_BASE_URL}/books`).then(handleResponse),
  getBook: (id) => fetch(`${API_BASE_URL}/books/${id}`).then(handleResponse),
  searchBooks: (q) => fetch(`${API_BASE_URL}/books/search?q=${encodeURIComponent(q)}`).then(handleResponse),

  addBook: (formData) => fetch(`${API_BASE_URL}/books`, {
    method: "POST",
    headers: getAuthHeadersNoJson(),
    body: formData,
  }).then(handleResponse),

  updateBook: (id, formData) => fetch(`${API_BASE_URL}/books/${id}`, {
    method: "PUT",
    headers: getAuthHeadersNoJson(),
    body: formData,
  }).then(handleResponse),

  deleteBook: (id) => fetch(`${API_BASE_URL}/books/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  }).then(handleResponse),

  getAdminStats: () => fetch(`${API_BASE_URL}/admin/stats`, {
    headers: getAuthHeaders(),
  }).then(handleResponse),

  getAllBooksAdmin: () => fetch(`${API_BASE_URL}/admin/books`, {
    headers: getAuthHeaders(),
  }).then(handleResponse),

  getCart: () => fetch(`${API_BASE_URL}/cart`, {
    headers: getAuthHeaders(),
  }).then(handleResponse),

  addToCart: (bookId, quantity = 1) => fetch(`${API_BASE_URL}/cart/items`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ book_id: bookId, quantity }),
  }).then(handleResponse),

  updateCartItem: (itemId, quantity) => fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ quantity }),
  }).then(handleResponse),

  removeCartItem: (itemId) => fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  }).then(handleResponse),

  clearCart: () => fetch(`${API_BASE_URL}/cart/clear`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  }).then(handleResponse),

  checkout: () => fetch(`${API_BASE_URL}/cart/checkout`, {
    method: "POST",
    headers: getAuthHeaders(),
  }).then(handleResponse),

  getOrders: () => fetch(`${API_BASE_URL}/cart/orders`, {
    headers: getAuthHeaders(),
  }).then(handleResponse),
}

export default api
