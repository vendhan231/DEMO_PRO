import { NavLink, Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useCart } from "../context/CartContext"
import { useEffect, useState } from "react"
import { ShoppingCart, User, Package, Menu, X, Plus } from "lucide-react"

const Navbar = () => {
  const { user, logout, isAuthenticated, isVerified, isAdmin } = useAuth()
  const { totalQuantity, fetchCart } = useCart()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (isAuthenticated) fetchCart()
  }, [isAuthenticated, fetchCart])

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
    navigate("/login")
  }

  const categories = [
    ["New Arrivals", "new"],
    ["Bestsellers", "bestseller"],
    ["Fiction", "fiction"],
    ["Non-Fiction", "non-fiction"],
    ["Author Spotlight", "author"],
  ]

  const goTo = (path) => {
    setMobileMenuOpen(false)
    navigate(path)
  }

  return (
    <>
      <nav className="bg-blush sticky top-0 z-50 border-b border-blush-dark/30">
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-3">
              <span className="w-10 h-10 rounded-full bg-orange flex items-center justify-center">
                <span className="text-white font-serif text-xl">📚</span>
              </span>
              <div>
                <span className="font-serif text-2xl font-bold text-navy">BookVerse</span>
                <p className="text-xs text-neutral-light">Online Bookstore</p>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
              {categories.map(([label, value]) => (
                <NavLink
                  key={label}
                  to={`/books?category=${encodeURIComponent(value)}`}
                  className={({ isActive }) =>
                    `text-navy hover:text-orange transition-colors whitespace-nowrap ${
                      isActive ? "text-orange" : ""
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-5 text-sm font-medium">
            <button
              onClick={() => navigate("/add-book")}
              className="flex items-center space-x-1 text-navy hover:text-orange transition-colors"
              title={isAuthenticated && isVerified ? "Add Book" : "Sign in to add a book"}
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Book</span>
            </button>
            <button onClick={() => navigate(isAuthenticated ? "/orders" : "/login")} className="flex items-center space-x-1 text-navy hover:text-orange transition-colors">
              <Package size={18} />
              <span className="hidden sm:inline">Past Orders</span>
            </button>
            <button
              onClick={() => navigate("/cart")}
              className="relative flex items-center space-x-1 text-navy hover:text-orange transition-colors"
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">My Cart</span>
              {totalQuantity > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalQuantity}
                </span>
              )}
            </button>
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-navy hover:text-orange transition-colors"
              >
                <User size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1 text-navy hover:text-orange transition-colors"
              >
                <User size={18} />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="md:hidden text-navy hover:text-orange transition-colors p-1"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-blush-dark/30 bg-blush px-4 pb-4">
            <div className="grid grid-cols-2 gap-2 pt-3 text-sm">
              {categories.map(([label, value]) => (
                <button
                  key={label}
                  onClick={() => goTo(`/books?category=${encodeURIComponent(value)}`)}
                  className="text-left text-navy hover:text-orange py-2"
                >
                  {label}
                </button>
              ))}
              <button onClick={() => goTo("/add-book")} className="text-left text-navy hover:text-orange py-2">Add Book</button>
              <button onClick={() => goTo(isAuthenticated ? "/orders" : "/login")} className="text-left text-navy hover:text-orange py-2">Past Orders</button>
              <button onClick={() => goTo("/cart")} className="text-left text-navy hover:text-orange py-2">My Cart</button>
              {isAuthenticated && isAdmin && <button onClick={() => goTo("/admin/manage-books")} className="text-left text-navy hover:text-orange py-2">Manage Books</button>}
              {!isAuthenticated && <button onClick={() => goTo("/login")} className="text-left text-navy hover:text-orange py-2">Sign In</button>}
              {isAuthenticated && <button onClick={handleLogout} className="text-left text-navy hover:text-orange py-2">Logout</button>}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}

export default Navbar
