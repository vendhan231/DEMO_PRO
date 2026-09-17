import { useEffect, useState, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import { mediaUrl } from "../services/urls"
import BookCard from "../components/BookCard"
import { Search, MapPin, ChevronLeft, ChevronRight } from "lucide-react"

const Home = () => {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [heroResults, setHeroResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const carouselRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchBooks = async () => {
      const res = await api.getBooks()
      setBooks(res.books || [])
      setLoading(false)
    }
    fetchBooks()
  }, [])

  const heroSlides = [
    {
      id: 0,
      headline: "Discover Your Next Great Read",
      subtitle: "Thousands of books across all genres, delivered to your door",
    },
    {
      id: 1,
      headline: "New Arrivals Just In",
      subtitle: "Curated collections from award-winning authors",
    },
    {
      id: 2,
      headline: "Exclusive Deals This Week",
      subtitle: "Up to 50% off on bestselling titles",
    },
  ]

  const featuredBooks = books.slice(0, 7).map((book, i) => ({
    ...book,
    discountPercent: i % 2 === 0 ? 20 : 0,
    inStock: true,
  }))

  const bestsellers = books.slice(2, 9).map((book, i) => ({
    ...book,
    discountPercent: i % 3 === 0 ? 15 : 0,
    inStock: i !== 3,
  }))

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === "next" ? 300 : -300
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  const searchFromHero = async () => {
    const query = searchQuery.trim()
    if (!query) {
      setHeroResults(null)
      return
    }
    setSearching(true)
    const response = await api.searchBooks(query)
    setHeroResults(response.results || [])
    setSearching(false)
  }

  return (
    <div className="space-y-0">
      <div className="bg-white border-b border-border-light">
        <div className="container mx-auto px-4 py-3 flex items-center space-x-4">
          <button className="flex items-center space-x-2 text-sm text-navy hover:text-orange transition-colors">
            <MapPin size={16} />
            <span>Delivering to 10001, New York</span>
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search for products..."
              className="w-full pl-10 pr-4 py-2 border border-border-color rounded-full focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/20 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") searchFromHero()
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-light" />
          </div>

          <button
            onClick={searchFromHero}
            className="bg-orange text-white p-2 rounded-full hover:bg-orange/90 transition-colors"
            title="Search"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {heroResults !== null && (
        <div className="bg-white border-b border-border-light py-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-navy">Search results for "{searchQuery.trim()}"</h2>
              <button onClick={() => setHeroResults(null)} className="text-sm text-orange hover:text-orange/80">Clear</button>
            </div>
            {searching ? (
              <p className="text-neutral">Searching...</p>
            ) : heroResults.length === 0 ? (
              <p className="text-neutral">No books found. Try another title, author, or category.</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {heroResults.slice(0, 6).map((book) => <BookCard key={book.id} book={book} />)}
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className="relative h-[400px] overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(13, 35, 64, 0.78), rgba(88, 28, 135, 0.55)), url('${mediaUrl("/uploads/photography-of-shelves-of-books.jpg")}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {heroSlides.map((slide) => (
          <div
            key={slide.id}
            className={`absolute inset-0 flex items-center transition-opacity duration-500 ${
              slide.id === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="container mx-auto px-6 sm:px-4">
              <h1 className="text-white font-bold text-4xl md:text-5xl lg:text-6xl mb-2 drop-shadow-lg">
                {slide.headline}
              </h1>
              <p className="text-white/90 text-lg md:text-xl drop-shadow-md max-w-2xl">
                {slide.subtitle}
              </p>
              <div className="w-32 h-1 bg-green mt-4"></div>
            </div>
          </div>
        ))}

        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentSlide ? "bg-orange w-6" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="bg-bg-light py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-navy mb-1">Pre-Order Books</h2>
            <p className="text-sm text-neutral-light">Pre-order now and get up to 20% off</p>
          </div>

          <div className="relative">
            <div
              ref={carouselRef}
              className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2"
            >
              {loading ? (
                <div className="text-center py-8 w-full">Loading books...</div>
              ) : (
                featuredBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))
              )}
            </div>

            <button
              onClick={() => scrollCarousel("next")}
              className="carousel-btn absolute top-1/2 -translate-y-1/2 -right-3 z-10"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white py-8 border-t border-border-light">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-navy mb-1">Bestsellers</h2>
            <p className="text-sm text-neutral-light">Most popular books this week</p>
          </div>

          <div className="relative">
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
              {!loading &&
                bestsellers.map((book) => (
                  <BookCard key={book.id} book={book} discountPercent={book.discountPercent} inStock={book.inStock} />
                ))}
            </div>

            <button
              onClick={() => scrollCarousel("next")}
              className="carousel-btn absolute top-1/2 -translate-y-1/2 -right-3 z-10"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-bg-light py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-navy mb-1">All Books</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {loading ? (
              <div className="text-center py-8 w-full col-span-full">Loading books...</div>
            ) : (
              books.map((book) => (
                <Link key={book.id} to={`/books/${book.id}`} className="block group">
                  <div className="bg-white rounded-xl shadow-sm border border-border-light p-3 text-center group-hover:shadow-md transition-shadow">
                    <div className="aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden mx-auto mb-2 flex items-center justify-center">
                        {book.cover_url || book.cover_image ? (
                        <img
                          src={book.cover_url || mediaUrl(`/uploads/covers/${book.cover_image}`)}
                          alt={book.title}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => { e.target.style.display = "none" }}
                        />
                      ) : (
                        <span className="text-3xl">📚</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-navy text-sm line-clamp-1">{book.title}</h3>
                    <p className="text-orange font-bold">₹{Math.round(book.price)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
