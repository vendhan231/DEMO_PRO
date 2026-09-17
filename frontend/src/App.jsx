import { Routes, Route } from "react-router-dom"
import { CartProvider } from "./context/CartContext"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import Home from "./pages/Home"
import Books from "./pages/Books"
import BookDetails from "./pages/BookDetails"
import SearchResults from "./pages/SearchResults"
import Login from "./pages/Login"
import Register from "./pages/Register"
import VerifyEmail from "./pages/VerifyEmail"
import ResendVerification from "./pages/ResendVerification"
import Cart from "./pages/Cart"
import AdminDashboard from "./pages/AdminDashboard"
import AddBook from "./pages/AddBook"
import EditBook from "./pages/EditBook"
import ManageBooks from "./pages/ManageBooks"
import InfoPage from "./pages/InfoPage"
import Orders from "./pages/Orders"

function App() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-bg-light flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/books" element={<Books />} />
            <Route path="/books/:id" element={<BookDetails />} />
            <Route path="/books/edit/:id" element={<EditBook />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/resend-verification" element={<ResendVerification />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/add-book" element={<AddBook />} />
            <Route path="/admin/add-book" element={<AddBook />} />
            <Route path="/admin/manage-books" element={<ManageBooks />} />
            <Route path="/info/:slug" element={<InfoPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </CartProvider>
  )
}

export default App
