import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useCart } from "../context/CartContext"
import api from "../services/api"
import { mediaUrl } from "../services/urls"
import { Edit, Trash2 } from "lucide-react"

const BookCard = ({ book, onUpdate, discountPercent = 0, inStock = true }) => {
  const [imgError, setImgError] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { isAuthenticated, user, isAdmin } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()

  const isOwner = user && book.uploaded_by && book.uploaded_by === user.id
  const canModify = isAuthenticated && (isAdmin || isOwner)

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      window.location.href = "/login"
      return
    }
    await addItem(book.id, 1)
  }

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this book?")) return
    setIsDeleting(true)
    try {
      await api.deleteBook(book.id)
      if (onUpdate) onUpdate()
      else window.location.href = "/books"
    } catch (err) {
      alert("Failed to delete book")
    } finally {
      setIsDeleting(false)
    }
  }

  const coverUrl = imgError
    ? null
    : book.cover_url || (book.cover_image ? mediaUrl(`/uploads/covers/${book.cover_image}`) : null)

  const discountedPrice = discountPercent > 0
    ? Math.round(book.price * (1 - discountPercent / 100))
    : Math.round(book.price || 0)

  return (
    <div className="group flex-shrink-0 w-48 bg-white rounded-xl shadow-sm border border-border-light p-3 flex flex-col">
      <div className="relative mb-3">
        <div className={`aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mx-auto w-full ${!inStock ? "grayscale" : ""}`}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={book.title}
              className="max-w-full max-h-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="text-4xl">📚</div>
          )}
        </div>

        {discountPercent > 0 && (
          <span className="discount-badge absolute top-1 left-1">
            {discountPercent}% OFF
          </span>
        )}

        {!inStock && (
          <span className="absolute top-1 right-1 bg-navy text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
            OUT OF STOCK
          </span>
        )}

        {canModify && (
          <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => navigate(`/books/edit/${book.id}`)}
              className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-100"
              title="Edit"
            >
              <Edit size={12} className="text-navy" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-100"
              title="Delete"
            >
              <Trash2 size={12} className="text-red" />
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleAddToCart}
        disabled={!inStock}
        className={inStock ? "btn-primary w-full py-2 text-sm mb-2" : "btn-disabled w-full py-2 text-sm mb-2"}
      >
        {inStock ? "Add to Cart" : "Out of Stock"}
      </button>

      <div className="mb-2">
        {discountPercent > 0 ? (
          <div className="flex items-center space-x-2">
            <span className="font-bold text-navy">₹{discountedPrice}</span>
            <span className="price-original">₹{Math.round(book.price || 0)}</span>
          </div>
        ) : (
          <span className="font-bold text-navy">₹{Math.round(book.price || 0)}</span>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-navy text-sm line-clamp-1 mb-0.5">{book.title}</h3>
        <p className="text-neutral-light text-xs line-clamp-1">{book.author}</p>
      </div>
    </div>
  )
}

export default BookCard
