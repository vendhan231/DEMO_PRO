import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import api from "../services/api"
import BookCard from "../components/BookCard"
import { ChevronLeft, ChevronRight } from "lucide-react"

const Books = () => {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [searchParams] = useSearchParams()
  const category = searchParams.get("category") || ""

  const fetchBooks = async (page = 1) => {
    setLoading(true)
    const res = await api.getBooks()
    const allBooks = res.books || []
    const filteredBooks = category === "fiction" || category === "non-fiction"
      ? allBooks.filter((book) => book.category?.toLowerCase().includes(category))
      : allBooks
    setBooks(filteredBooks)
    setTotalPages(res.pages || 1)
    setCurrentPage(res.page || 1)
    setLoading(false)
  }

  useEffect(() => {
    fetchBooks()
  }, [category])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-navy">{category ? `${category.replace("-", " ")} Books` : "All Books"}</h1>
      </div>

      {loading ? (
        <div className="text-center py-16">Loading books...</div>
      ) : books.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-navy mb-2">No Books Available</h3>
          <p className="text-neutral">There are currently no books in the store.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {books.map((book, i) => (
              <div key={book.id}>
                <BookCard book={book} discountPercent={i % 3 === 0 ? 15 : 0} inStock={i !== 4} />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-8">
              <button
                onClick={() => fetchBooks(currentPage - 1)}
                disabled={currentPage <= 1}
                className="carousel-btn"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-neutral">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => fetchBooks(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="carousel-btn"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Books
