const configuredOrigin = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "")
const API_ORIGIN = import.meta.env.DEV ? configuredOrigin : ""

export const apiUrl = (path) => `${API_ORIGIN}${path}`
export const mediaUrl = (path) => `${API_ORIGIN}${path}`
