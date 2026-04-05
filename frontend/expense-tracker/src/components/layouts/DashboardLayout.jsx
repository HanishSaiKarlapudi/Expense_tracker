import React, { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiLogOut, FiHome, FiMinus, FiPlus, FiTrendingUp, FiUser } from 'react-icons/fi'
import { AuthContext } from '../../context/AuthContext'

function DashboardLayout({ children }) {
  const navigate = useNavigate()
  const { user, logout } = useContext(AuthContext)
  const userName = user?.fullName || 'Guest'
  const userAvatar = user?.profileImageUrl

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Expense Tracker</h1>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-gray-200">
          <Link to="/profile" className="flex items-center gap-4 hover:opacity-80 transition">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl overflow-hidden">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">👨</span>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{userName}</p>
              <p className="text-sm text-gray-500">User</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-purple-50 transition"
          >
            <FiHome className="text-lg" />
            <span className="font-medium">Dashboard</span>
          </Link>

          <Link
            to="/income"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-purple-50 transition"
          >
            <FiPlus className="text-lg text-green-500" />
            <span className="font-medium">Income</span>
          </Link>

          <Link
            to="/expense"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-purple-50 transition"
          >
            <FiMinus className="text-lg text-red-500" />
            <span className="font-medium">Expense</span>
          </Link>

          <Link
            to="/suggestions"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-purple-50 transition"
          >
            <FiTrendingUp className="text-lg text-blue-500" />
            <span className="font-medium">Suggestions</span>
          </Link>

          <Link
            to="/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-purple-50 transition"
          >
            <FiUser className="text-lg text-purple-500" />
            <span className="font-medium">Profile</span>
          </Link>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
          >
            <FiLogOut className="text-lg" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

export default DashboardLayout
