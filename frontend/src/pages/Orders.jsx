import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../services/api"
import { mediaUrl } from "../services/urls"
import { Download, Eye } from "lucide-react"

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login")
      return
    }
    api.getOrders().then((res) => setOrders(res.orders || [])).finally(() => setLoading(false))
  }, [navigate])

  if (loading) return <div className="text-center py-12">Loading past orders...</div>

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Past Orders</h1>
        <Link to="/books" className="btn-secondary px-4 py-2">Continue Shopping</Link>
      </div>
      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-border-light p-12 text-center">
          <p className="text-4xl mb-4">📦</p>
          <h2 className="text-xl font-bold text-navy mb-2">No orders yet</h2>
          <p className="text-neutral mb-6">Your completed purchases will appear here.</p>
          <Link to="/books" className="btn-primary px-5 py-3">Browse Books</Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <section key={order.id} className="bg-white rounded-xl border border-border-light shadow-sm p-5">
              <div className="flex flex-wrap justify-between gap-2 border-b border-border-light pb-3 mb-3">
                <div>
                  <h2 className="font-bold text-navy">Order #{order.id}</h2>
                  <p className="text-sm text-neutral-light">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-orange font-bold">₹{Number(order.total_amount).toFixed(0)}</p>
                  <p className="text-sm text-green capitalize">{order.status}</p>
                </div>
              </div>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-navy">{item.title}</p>
                      <p className="text-sm text-neutral-light">{item.author} · Qty {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link to={`/books/${item.book_id}`} className="text-orange inline-flex items-center gap-1" title="View book"><Eye size={18} /> View</Link>
                      {(item.book_file_url || item.book_file) && <a href={item.book_file_url || mediaUrl(`/uploads/books/${item.book_file}`)} target="_blank" rel="noopener noreferrer" className="text-orange inline-flex items-center gap-1" title="View book file"><Eye size={18} /> Read</a>}
                      {(item.book_file_url || item.book_file) && <a href={item.book_file_url || mediaUrl(`/uploads/books/${item.book_file}`)} download className="text-orange inline-flex items-center gap-1" title="Download book"><Download size={18} /> Download</a>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export default Orders
