import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import { User, Lock, Mail } from "lucide-react"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await api.login({ email, password })
      if (res.access_token) {
        login(res.access_token, res.user)
        if (res.email_verified === false || res.email_verified === true) {
          navigate("/")
        }
      } else {
        setError(res.error || "Invalid email or password")
      }
    } catch {
      setError("Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-border-light p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <span className="w-10 h-10 rounded-full bg-orange flex items-center justify-center">
                <span className="text-white font-serif text-xl">📚</span>
              </span>
              <span className="font-serif text-2xl font-bold text-navy">BookVerse</span>
            </div>
            <h1 className="text-2xl font-bold text-navy">Sign In</h1>
            <p className="text-neutral-light mt-1">Enter your email or mobile number</p>
          </div>

          {error && (
            <div className="bg-red/10 border border-red/20 text-red px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  required
                />
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-light" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Enter your password"
                  required
                />
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-light" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm font-semibold"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-border-light"></div>
              <span className="px-3 text-xs text-neutral-light">OR</span>
              <div className="flex-1 border-t border-border-light"></div>
            </div>

            <Link
              to="/register"
              className="block text-center btn-secondary w-full py-3 text-sm font-semibold"
            >
              Create a New Account
            </Link>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-neutral-light">
              Demo: admin@bookverse.com / admin123 or customer@bookverse.com / customer123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
