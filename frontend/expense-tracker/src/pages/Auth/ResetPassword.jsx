import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import AuthLayout from '../../components/layouts/AuthLayout'
import toast from 'react-hot-toast'
import { FiArrowLeft } from 'react-icons/fi'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [tokenValid, setTokenValid] = useState(null)
  const [resetSuccess, setResetSuccess] = useState(false)
  const navigate = useNavigate()

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  useEffect(() => {
    verifyToken()
  }, [token, email])

  const verifyToken = async () => {
    if (!token || !email) {
      setTokenValid(false)
      toast.error('Invalid reset link')
      return
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/password/verify-reset-token?token=${token}&email=${email}`
      )

      const data = await response.json()
      setTokenValid(data.valid)

      if (!data.valid) {
        toast.error(data.message || 'Reset link is invalid or expired')
      }
    } catch (error) {
      console.error('Error verifying token:', error)
      setTokenValid(false)
      toast.error('Error verifying reset link')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/password/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          email,
          newPassword,
          confirmPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResetSuccess(true)
        toast.success('Password reset successfully!')
        setTimeout(() => navigate('/login'), 2000)
      } else {
        toast.error(data.message || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verifying reset link...</p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  if (!tokenValid) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md mx-auto px-4">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold text-gray-800">Invalid Link</h1>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <p className="text-gray-700 text-center">
              This password reset link is invalid or has expired.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              to="/forgot-password"
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-center block"
            >
              Request New Link
            </Link>
            <Link
              to="/login"
              className="w-full px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium text-center block"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  if (resetSuccess) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md mx-auto px-4">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-gray-800">Password Reset!</h1>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <p className="text-gray-700 text-center">
              Your password has been reset successfully.
            </p>
            <p className="text-gray-600 text-center text-sm mt-4">
              Redirecting to login page...
            </p>
          </div>

          <Link
            to="/login"
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-center block"
          >
            Go to Login
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Reset Password</h1>
        <p className="text-center text-gray-600 mb-8">Enter your new password below</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 Characters"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-2"
          >
            <FiArrowLeft /> Back to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export default ResetPassword
