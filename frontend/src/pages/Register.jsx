import { useState } from "react"
import { Link } from "react-router-dom"
import api from "../services/api"
import { User, Mail, Lock } from "lucide-react"

const Register = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    if (!name || !email || !password) {
      setError("All fields are required")
      return
    }

    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    try {
      const res = await api.register({ name, email, password, confirm_password: confirm })
      if (res.message && res.requires_verification) {
        setRegistered(true)
      } else if (res.error) {
        setError(res.error)
      } else {
        setRegistered(true)
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-sm border border-border-light p-8 text-center">
            <div className="w-16 h-16 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail size={32} className="text-green" />
            </div>
            <h1 className="text-2xl font-bold text-navy mb-4">Check Your Email</h1>
            <p className="text-neutral mb-6">
              Registration successful! Please check your email and verify your account.
            </p>
            <p className="text-sm text-neutral-light mb-6">
              Check the email sent to <span className="font-medium text-navy">{email}</span> for a verification link.
            </p>
            <Link
              to={`/resend-verification?email=${encodeURIComponent(email)}`}
              className="text-orange hover:text-orange/80 font-medium text-sm"
            >
              Didn't receive the email? Resend verification
            </Link>
            <div className="border-t border-border-light my-6"></div>
            <Link to="/login" className="btn-primary w-full py-3 text-sm font-semibold">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
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
            <h1 className="text-2xl font-bold text-navy">Create Account</h1>
            <p className="text-neutral-light mt-1">Sign up to start shopping</p>
          </div>

          {error && (
            <div className="bg-red/10 border border-red/20 text-red px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Enter your name"
                  required
                />
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-light" />
              </div>
            </div>

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
                  placeholder="Min 6 characters"
                  required
                />
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-light" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Confirm your password"
                  required
                />
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-light" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm font-semibold mt-2"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral">
              Already have an account?{" "}
              <Link to="/login" className="text-orange font-medium hover:text-orange/80">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
