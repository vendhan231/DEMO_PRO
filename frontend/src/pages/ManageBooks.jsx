import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"
import { Trash2, Edit } from "lucide-react"
import { mediaUrl } from "../services/urls"

const ManageBooks = () => {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const navigate = useNavigate()

  const fetchBooks = async () => {
    try {
      const res = await api.getAllBooksAdmin()
      setBooks(res.books || [])
    } catch (err) {
      console.error("Failed to fetch books:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  const handleDelete = async (bookId) => {
    try {
      await api.deleteBook(bookId)
      setBooks(books.filter((b) => b.id !== bookId))
      setDeleteConfirm(null)
    } catch (err) {
      console.error("Failed to delete book:", err)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading books...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-navy">Manage Books</h1>
        <button
          onClick={() => window.location.href = "/admin/add-book"}
          className="btn-primary px-4 py-2"
        >
          + Add New Book
        </button>
      </div>

      {books.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-border-light p-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-navy mb-2">No Books</h3>
          <p className="text-neutral">No books available. Add one to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-border-light overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-border-light">
                <th className="text-left py-3 px-4 font-semibold text-navy">Book</th>
                <th className="text-left py-3 px-4 font-semibold text-navy">Category</th>
                <th className="text-left py-3 px-4 font-semibold text-navy">Price</th>
                <th className="text-left py-3 px-4 font-semibold text-navy">Action</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className="border-b border-border-light last:border-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {book.cover_url || book.cover_image ? (
                        <img
                          src={book.cover_url || mediaUrl(`/uploads/covers/${book.cover_image}`)}
                          alt={book.title}
                          className="w-10 h-14 object-cover rounded"
                          onError={(e) => { e.target.style.display = "none" }}
                        />
                      ) : (
                        <span className="text-2xl">📚</span>
                      )}
                      <span className="font-medium text-navy">{book.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-neutral">{book.category}</td>
                  <td className="py-3 px-4 text-navy font-medium">₹{Math.round(book.price)}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => navigate(`/books/edit/${book.id}`)}
                      className="text-orange hover:text-orange/80 p-1 mr-2"
                      title="Edit book"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(book.id)}
                      className="text-red hover:text-red/80 p-1"
                      title="Delete book"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-navy mb-3">Delete Book</h3>
            <p className="text-neutral mb-6">
              Are you sure you want to delete this book? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="btn-danger px-4 py-2"
              >
                Delete Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageBooks
