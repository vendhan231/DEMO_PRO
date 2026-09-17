import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import api from "../services/api"
import { Mail, CheckCircle, XCircle } from "lucide-react"

const VerifyEmail = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState("verifying")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await api.verifyEmail(token)
        if (res.error) {
          setStatus("error")
          setMessage(res.error)
        } else {
          setStatus("success")
          setMessage(res.message)
          setTimeout(() => navigate("/login"), 3000)
        }
      } catch (err) {
        setStatus("error")
        setMessage("Verification failed. Please try again.")
      }
    }

    if (token) {
      verify()
    } else {
      setStatus("error")
      setMessage("No verification token provided.")
    }
  }, [token, navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-border-light p-8 text-center">
          {status === "verifying" && (
            <>
              <div className="w-16 h-16 bg-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail size={32} className="text-blue animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold text-navy mb-4">Verifying Your Email</h1>
              <p className="text-neutral">Please wait while we verify your email address...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-green" />
              </div>
              <h1 className="text-2xl font-bold text-navy mb-4">Email Verified!</h1>
              <p className="text-neutral mb-6">{message}</p>
              <p className="text-sm text-neutral-light mb-6">
                A welcome email has also been sent to your inbox.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="btn-primary w-full py-3 text-sm font-semibold"
              >
                Sign In Now
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle size={32} className="text-red" />
              </div>
              <h1 className="text-2xl font-bold text-navy mb-4">Verification Failed</h1>
              <p className="text-neutral mb-6">{message}</p>
              <button
                onClick={() => navigate("/resend-verification")}
                className="btn-primary w-full py-3 text-sm font-semibold mb-3"
              >
                Resend Verification Email
              </button>
              <Link to="/login" className="text-sm text-neutral-light hover:text-navy">
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
