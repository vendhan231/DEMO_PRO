import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import { mediaUrl } from "../services/urls"
import { Trash2, Plus, Minus } from "lucide-react"

const CartPage = () => {
  const { cart, loading, updateItem, removeItem, clearCart } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login")
    }
  }, [isAuthenticated, navigate])

  const handleQuantityChange = async (itemId, newQty) => {
    if (newQty < 1) return
    await updateItem(itemId, newQty)
  }

  const handleCheckout = async () => {
    const res = await api.checkout()
    if (res.order) {
      setCheckoutSuccess(true)
      setTimeout(() => navigate("/orders"), 1200)
    }
  }

  const cartTotal = cart?.items?.reduce((sum, item) => sum + item.subtotal, 0) || 0

  if (loading) {
    return <div className="text-center py-12">Loading cart...</div>
  }

  if (checkoutSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold text-navy mb-4">
            Your order has been successfully placed!
          </h2>
          <p className="text-neutral mb-6">Thank you for shopping with BookVerse!</p>
          <Link to="/orders" className="btn-primary px-6 py-3">View Past Orders</Link>
        </div>
      </div>
    )
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-navy mb-2">Your Shopping Cart is empty</h2>
          <p className="text-neutral mb-6">You have no items in your cart. Start shopping to add items.</p>
          <Link to="/books" className="btn-primary px-6 py-3">
            Browse Books
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-navy mb-6">Shopping Cart</h1>

      <div className="space-y-4 mb-8">
        {cart.items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-border-light p-4 flex items-center gap-4">
            <div className="w-20 h-28 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {item.book?.cover_image ? (
                <img
                  src={mediaUrl(`/uploads/covers/${item.book.cover_image}`)}
                  alt={item.book.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = "none" }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">📚</div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-navy">{item.book?.title}</h3>
              <p className="text-neutral-light text-sm">{item.book?.author}</p>
              <p className="text-sm text-neutral-light mt-1">
                ₹{item.book?.price.toFixed(0)} × {item.quantity} = <span className="font-bold text-navy">₹{item.subtotal.toFixed(0)}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className={`w-7 h-7 rounded-full border flex items-center justify-center text-navy ${item.quantity <= 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center text-navy font-semibold">{item.quantity}</span>
              <button
                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                className="w-7 h-7 rounded-full border flex items-center justify-center text-navy hover:bg-gray-100"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              onClick={() => removeItem(item.id)}
              className="text-error hover:text-red-600 p-1"
              title="Remove item"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border-light p-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-neutral">Subtotal</span>
          <span className="font-bold text-navy">₹{cartTotal.toFixed(0)}</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-neutral">Shipping</span>
          <span className="text-green font-semibold">FREE (orders over ₹499)</span>
        </div>
        <div className="border-t border-border-light pt-3 flex justify-between items-center">
          <span className="text-navy font-semibold">Total</span>
          <span className="text-orange text-2xl font-bold">₹{cartTotal.toFixed(0)}</span>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleCheckout}
          className="btn-primary flex-1 py-3 text-base font-semibold"
        >
          Proceed to Checkout
        </button>
        <button
          onClick={clearCart}
          className="btn-secondary py-3 px-6"
        >
          Clear Cart
        </button>
      </div>
    </div>
  )
}

export default CartPage
