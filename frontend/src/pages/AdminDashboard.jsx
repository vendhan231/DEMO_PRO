import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"
import { Package, TrendingUp } from "lucide-react"

const AdminDashboard = () => {
  const [stats, setStats] = useState({ total_books: 0, total_users: 0, total_cart_items: 0 })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.getAdminStats()
        setStats(res)
      } catch (err) {
        console.error("Failed to fetch stats:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-navy mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-border-light p-6 text-center">
          <div className="text-3xl font-bold text-orange mb-1">{stats.total_books}</div>
          <p className="text-neutral">Total Books</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-border-light p-6 text-center">
          <div className="text-3xl font-bold text-orange mb-1">{stats.total_users}</div>
          <p className="text-neutral">Total Users</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-border-light p-6 text-center">
          <div className="text-3xl font-bold text-orange mb-1">{stats.total_cart_items}</div>
          <p className="text-neutral">Cart Items</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border-light p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Package size={20} className="text-navy" />
          <h2 className="text-xl font-bold text-navy">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/admin/add-book")}
            className="btn-primary w-full py-3 text-base font-semibold"
          >
            + Add New Book
          </button>
          <button
            onClick={() => navigate("/admin/manage-books")}
            className="btn-secondary w-full py-3 text-base font-semibold"
          >
            Manage Books
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
