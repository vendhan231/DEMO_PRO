import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import { Upload, X, FileText, Save, AlertCircle } from "lucide-react"

const AddBook = () => {
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [coverImage, setCoverImage] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [bookFile, setBookFile] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, isVerified } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login")
    } else if (!isVerified) {
      navigate("/resend-verification")
    }
  }, [isAuthenticated, isVerified, navigate])

  const handleCoverChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
        setError("Please upload a valid image file (JPG, PNG, or WEBP)")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Cover image must be less than 5MB")
        return
      }
      setCoverImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setCoverPreview(e.target.result)
      reader.readAsDataURL(file)
      setError("")
    }
  }

  const handleBookFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please upload a valid PDF file")
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        setError("Book file must be less than 50MB")
        return
      }
      setBookFile(file)
      setError("")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!title || !author || !category || !price) {
      setError("Please fill in all required fields marked with *")
      return
    }

    if (!coverImage) {
      setError("Please upload a book cover image")
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append("title", title)
    formData.append("author", author)
    formData.append("category", category)
    formData.append("description", description)
    formData.append("price", price)
    formData.append("cover_image", coverImage)
    if (bookFile) formData.append("book_file", bookFile)

    try {
      const res = await api.addBook(formData)
      if (res.book) {
        setSuccess("Book added successfully! Redirecting...")
        setTimeout(() => navigate("/books"), 1500)
      } else {
        setError(res.error || "Failed to add book")
      }
    } catch (err) {
      setError(err.message || "Failed to add book. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-orange hover:text-orange/80 mr-3"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-navy">Add New Book</h1>
      </div>

      {error && (
        <div className="bg-red/10 border border-red/20 text-red px-4 py-3 rounded-lg mb-4 flex items-center">
          <AlertCircle size={16} className="mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green/10 border border-green/20 text-green px-4 py-3 rounded-lg mb-4 flex items-center">
          <AlertCircle size={16} className="mr-2" />
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-border-light p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Book Cover *</label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => document.getElementById("cover-input").click()}
                className="btn-secondary px-4 py-2 text-sm"
              >
                <Upload size={16} className="mr-2" />
                Upload Cover
              </button>
              {coverPreview && (
                <button
                  type="button"
                  onClick={() => { setCoverImage(null); setCoverPreview(null) }}
                  className="text-neutral-light hover:text-navy"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <input
              id="cover-input"
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleCoverChange}
              className="hidden"
            />
            {coverPreview ? (
              <div className="mt-3 w-32 h-40 border border-border-light rounded-lg overflow-hidden">
                <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="mt-3 w-32 h-40 border-2 border-dashed border-border-light rounded-lg flex items-center justify-center text-neutral-light">
                <span>No preview</span>
              </div>
            )}
            <p className="text-xs text-neutral-light mt-1">JPG, PNG, WEBP (max 5MB)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Book Name / Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Enter book title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1">Author *</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="input-field"
                placeholder="Enter author name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Category *</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
                placeholder="e.g. Programming, Fiction"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1">Price (₹) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input-field"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Book PDF</label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => document.getElementById("pdf-input").click()}
                className="btn-secondary px-4 py-2 text-sm"
              >
                <FileText size={16} className="mr-2" />
                Upload PDF
              </button>
              {bookFile && (
                <button
                  type="button"
                  onClick={() => setBookFile(null)}
                  className="text-neutral-light hover:text-navy"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <input
              id="pdf-input"
              type="file"
              accept=".pdf"
              onChange={handleBookFileChange}
              className="hidden"
            />
            {bookFile && (
              <div className="mt-2 text-sm text-neutral">
                <span className="font-medium">{bookFile.name}</span>
                <span className="text-neutral-light"> ({(bookFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
            <p className="text-xs text-neutral-light mt-1">PDF files only (max 50MB)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Book Description / Details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="description-field"
              placeholder="Enter book description..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border-light">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !coverImage}
              className="btn-primary px-6 py-2 disabled:opacity-50"
            >
              {loading ? "Adding Book..." : "+ Add Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBook
