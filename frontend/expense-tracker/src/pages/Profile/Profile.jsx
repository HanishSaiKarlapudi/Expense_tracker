import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import toast from 'react-hot-toast'
import { FiEdit2, FiSave, FiX } from 'react-icons/fi'
import axios from 'axios'

function Profile() {
  const { user, setUser, fetchUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profilePreview, setProfilePreview] = useState(user?.profileImageUrl || null)
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    profileImageUrl: user?.profileImageUrl || ''
  })

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

  // Fetch latest user data when component mounts
  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        profileImageUrl: user.profileImageUrl || ''
      })
      setProfilePreview(user.profileImageUrl || null)
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePreview(reader.result)
        setFormData(prev => ({ ...prev, profileImageUrl: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.fullName.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    try {
      setLoading(true)
      const response = await axios.put(`${API_BASE}/auth/update-profile`, {
        fullName: formData.fullName,
        email: formData.email,
        profileImageUrl: formData.profileImageUrl
      })

      setUser(response.data.user)
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      
      // Fetch updated data to ensure consistency
      await fetchUser()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8 min-h-screen bg-gray-50">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your personal information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl">
          {!isEditing ? (
            // View Mode
            <div>
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-purple-100 rounded-full overflow-hidden flex items-center justify-center">
                    {profilePreview ? (
                      <img src={profilePreview} alt={formData.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">👨</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{user?.fullName}</h2>
                    <p className="text-gray-600">{user?.email}</p>
                    <p className="text-sm text-gray-500 mt-2">Member since {new Date(user?.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                >
                  <FiEdit2 size={18} />
                  Edit Profile
                </button>
              </div>

              {/* Account Info */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="text-gray-900 font-medium">{user?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email Address</p>
                    <p className="text-gray-900 font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Budget</p>
                    <p className="text-gray-900 font-medium">₹{user?.monthlyBudget?.toLocaleString('en-IN') || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Edit Mode
            <form onSubmit={handleSubmit}>
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">Profile Picture</label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-purple-100 rounded-full overflow-hidden flex items-center justify-center">
                    {profilePreview ? (
                      <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">👨</span>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="profilePicture"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="profilePicture"
                      className="inline-block bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 cursor-pointer transition"
                    >
                      Change Picture
                    </label>
                    <p className="text-xs text-gray-500 mt-2">Max file size: 5MB</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                >
                  <FiSave size={18} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      fullName: user?.fullName || '',
                      email: user?.email || '',
                      profileImageUrl: user?.profileImageUrl || ''
                    })
                    setProfilePreview(user?.profileImageUrl || null)
                  }}
                  className="flex items-center gap-2 flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  <FiX size={18} />
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Profile
