import { Link } from "react-router-dom"

const Footer = () => {
  return (
    <footer className="bg-navy text-gray-400 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-orange flex items-center justify-center">
                <span className="text-white font-serif text-lg">📚</span>
              </span>
              <span className="font-serif text-xl font-bold text-white">BookVerse</span>
            </div>
            <p className="text-xs text-gray-500">Your online bookstore destination</p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Customer Service</h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/info/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/info/shipping" className="hover:text-white transition-colors">Shipping Policy</Link></li>
              <li><Link to="/info/returns" className="hover:text-white transition-colors">Returns & Exchanges</Link></li>
              <li><Link to="/info/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Shop</h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/books" className="hover:text-white transition-colors">All Books</Link></li>
              <li><Link to="/search" className="hover:text-white transition-colors">Search</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">About</h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/info/about" className="hover:text-white transition-colors">About BookVerse</Link></li>
              <li><Link to="/info/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/info/blog" className="hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-6 pt-6 text-center text-xs text-gray-500">
          <p>&copy; 2024 BookVerse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
