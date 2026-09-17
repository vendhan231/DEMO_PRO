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

async function uploadToCloudinary(file, resourceType) {
  const token = localStorage.getItem("token")
  if (!token) throw new Error("Not authenticated")

  const signatureRes = await fetch(`${API_BASE_URL}/uploads/signature`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ resource_type: resourceType }),
  })

  const signatureData = await handleResponse(signatureRes)

  const formData = new FormData()
  formData.append("file", file)
  formData.append("api_key", signatureData.api_key)
  formData.append("timestamp", signatureData.timestamp.toString())
  formData.append("signature", signatureData.signature)
  if (signatureData.folder) formData.append("folder", signatureData.folder)

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/${resourceType}/upload`
  const uploadRes = await fetch(cloudinaryUrl, {
    method: "POST",
    body: formData,
  })

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text()
    throw new Error(`Cloudinary upload failed: ${errorText}`)
  }

  return uploadRes.json()
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

  uploadCover: (file) => uploadToCloudinary(file, "image"),
  uploadPdf: (file) => uploadToCloudinary(file, "raw"),

  addBook: (data) => fetch(`${API_BASE_URL}/books`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  updateBook: (id, data) => fetch(`${API_BASE_URL}/books/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
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

  clearCart: () => fetch(`${API_BASE_URL}/cart/clear", {
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
