import { useState, useEffect } from "react"
import { useSearchParams, Link } from "react-router-dom"
import api from "../services/api"
import { Mail, Send, CheckCircle, XCircle } from "lucide-react"

const ResendVerification = () => {
  const [searchParams] = useSearchParams()
  const initialEmail = searchParams.get("email") || ""
  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail)
    }
  }, [initialEmail])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setStatus("error")
      setMessage("Please enter a valid email address")
      return
    }

    setLoading(true)
    setStatus("")
    setMessage("")

    try {
      const res = await api.resendVerification(email)
      if (res.error) {
        setStatus("error")
        setMessage(res.error)
      } else {
        setStatus("success")
        setMessage(res.message || "Verification email sent successfully.")
      }
    } catch {
      setStatus("error")
      setMessage("Failed to send verification email. Please try again.")
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
            <h1 className="text-2xl font-bold text-navy">Resend Verification Email</h1>
            <p className="text-neutral-light mt-1">Enter your email to receive a new verification link.</p>
          </div>

          {status === "error" && (
            <div className="bg-red/10 border border-red/20 text-red px-4 py-3 rounded-lg mb-4 text-sm">
              {message}
            </div>
          )}

          {status === "success" && (
            <div className="bg-green/10 border border-green/20 text-green px-4 py-3 rounded-lg mb-4 text-sm">
              {message}
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm font-semibold"
            >
              {loading ? "Sending..." : "Resend Verification Email"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral">
              Already verified?{" "}
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

export default ResendVerification
