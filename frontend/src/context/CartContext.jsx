import { createContext, useContext, useState, useCallback } from "react"
import api from "../services/api"

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within CartProvider")
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getCart()
      setCart(res.cart)
    } catch (err) {
      console.error("Failed to fetch cart:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const addItem = async (bookId, quantity = 1) => {
    try {
      const res = await api.addToCart(bookId, quantity)
      setCart(res.cart)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const updateItem = async (itemId, quantity) => {
    try {
      const res = await api.updateCartItem(itemId, quantity)
      setCart(res.cart)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const removeItem = async (itemId) => {
    try {
      const res = await api.removeCartItem(itemId)
      setCart(res.cart)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const clearCart = async () => {
    try {
      const res = await api.clearCart()
      setCart(res.cart)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const totalQuantity = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
  const totalPrice = cart?.items?.reduce((sum, item) => sum + item.subtotal, 0) || 0

  return (
    <CartContext.Provider value={{
      cart, loading, addItem, updateItem, removeItem, clearCart,
      totalQuantity, totalPrice, fetchCart
    }}>
      {children}
    </CartContext.Provider>
  )
}
