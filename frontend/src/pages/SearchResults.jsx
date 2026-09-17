import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import api from "../services/api"
import BookCard from "../components/BookCard"
import { Search } from "lucide-react"

const SearchResults = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get("q") || ""
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const doSearch = async (q) => {
    if (!q.trim()) return
    setLoading(true)
    const res = await api.searchBooks(q)
    setResults(res.results || [])
    setSearched(true)
    setLoading(false)
  }

  useEffect(() => {
    if (query) {
      doSearch(query)
    }
  }, [query])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="relative max-w-2xl">
          <input
            type="text"
            placeholder="Search for products..."
            value={query}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams)
              params.set("q", e.target.value)
              navigate(`/search?${params.toString()}`)
            }}
            className="w-full pl-10 pr-12 py-2.5 border border-border-color rounded-full focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/20 text-sm"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-light" />
          <button
            onClick={() => navigate(`/search?q=${encodeURIComponent(query)}`)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange text-white p-1.5 rounded-full hover:bg-orange/90 transition-colors"
          >
            <Search size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Searching...</div>
      ) : searched && results.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-navy mb-2">Book Not Available</h3>
          <p className="text-neutral">No books found matching "{query}". Try a different search term.</p>
        </div>
      ) : searched && results.length > 0 ? (
        <div>
          <p className="text-sm text-neutral mb-4">
            Found {results.length} result(s) for "{query}"
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {results.map((book, i) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-navy mb-2">Search for Books</h3>
          <p className="text-neutral">Enter a search term above to find books.</p>
        </div>
      )}
    </div>
  )
}

export default SearchResults
