import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useCart } from "../context/CartContext"
import api from "../services/api"
import { mediaUrl } from "../services/urls"
import { Truck, Shield, RotateCcw, Edit, Trash2 } from "lucide-react"

const BookDetails = () => {
  const { id } = useParams()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imgError, setImgError] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { isAuthenticated, user, isAdmin } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()

  const isOwner = user && book?.uploaded_by && book.uploaded_by === user.id
  const canModify = isAuthenticated && (isAdmin || isOwner)

  useEffect(() => {
    const fetchBook = async () => {
      const res = await api.getBook(id)
      if (res.book) {
        setBook(res.book)
      } else {
        navigate("/")
      }
      setLoading(false)
    }
    fetchBook()
  }, [id, navigate])

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login")
      return
    }
    await addItem(book.id, 1)
    navigate("/cart")
  }

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this book?")) return
    setIsDeleting(true)
    try {
      await api.deleteBook(book.id)
      navigate("/books")
    } catch {
      alert("Failed to delete book")
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading book details...</div>
  }

  if (!book) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-xl font-bold text-navy mb-2">Book Not Found</h3>
        <p className="text-neutral">The book you're looking for doesn't exist or has been removed.</p>
      </div>
    )
  }

  const coverUrl = imgError
    ? null
    : book.cover_url || (book.cover_image ? mediaUrl(`/uploads/covers/${book.cover_image}`) : null)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-border-light p-6 md:p-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className={`aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden mx-auto ${!book.stock ? "opacity-50" : ""}`}>
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={book.title}
                  className="w-full h-full object-contain"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">📚</div>
              )}
            </div>
            {(book.book_file_url || book.book_file) && (
              <div className="flex justify-center gap-4 mt-3 text-sm">
                <a
                  href={book.book_file_url || mediaUrl(`/uploads/books/${book.book_file}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue hover:underline"
                >
                  View PDF
                </a>
                <a
                  href={book.book_file_url || mediaUrl(`/uploads/books/${book.book_file}`)}
                  download
                  className="text-orange hover:underline"
                >
                  Download PDF
                </a>
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold text-navy">{book.title}</h1>
            <p className="text-neutral">by {book.author}</p>

            <span className="inline-block bg-gray-100 text-navy text-xs font-semibold px-3 py-1 rounded-full">
              {book.category}
            </span>

            <div className="flex items-center gap-3 mt-2">
              <span className="text-3xl font-bold text-orange">₹{Math.round(book.price)}</span>
              <span className="text-neutral text-sm">MRP: ₹{Math.round(book.price)}</span>
            </div>

            <div className="border-t border-border-light pt-4">
              <h3 className="font-semibold text-navy mb-2">Description</h3>
              <p className="text-neutral">{book.description || "No description available."}</p>
            </div>

            <div className="flex items-center space-x-6 mt-4 text-xs text-neutral">
              <div className="flex items-center space-x-1">
                <Truck size={14} />
                <span>Free shipping over ₹499</span>
              </div>
              <div className="flex items-center space-x-1">
                <RotateCcw size={14} />
                <span>7-day returns</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield size={14} />
                <span>Secure checkout</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 mt-4">
              <button
                onClick={handleAddToCart}
                className="btn-primary px-6 py-3 text-base font-semibold"
              >
                Add to Cart
              </button>
              {canModify && (
                <>
                  <button
                    onClick={() => navigate(`/books/edit/${book.id}`)}
                    className="btn-secondary px-4 py-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="btn-danger px-4 py-3"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </>
              )}
            </div>
          </div>
      </div>
    </div>
  </div>
)
}

export default BookDetails
