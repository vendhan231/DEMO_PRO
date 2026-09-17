const API_ORIGIN = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "")

export const apiUrl = (path) => `${API_ORIGIN}${path}`
export const mediaUrl = (path) => `${API_ORIGIN}${path}`
