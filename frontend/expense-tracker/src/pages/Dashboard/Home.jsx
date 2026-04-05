import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboard } from '../../context/DashboardContext'
import { useAuth } from '../../context/AuthContext'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import toast from 'react-hot-toast'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

function Home() {
  const { user, logout } = useAuth()
  const { summary, monthlyData, fetchSummary, fetchMonthlyData } = useDashboard()
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboard()
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboard, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      await Promise.all([fetchSummary(), fetchMonthlyData(6)])
    } catch (error) {
      console.error('Dashboard error:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.fullName.split(' ')[0]}!</h1>
            <p className="text-gray-600">Here's your financial overview</p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 md:mt-0 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Income */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Income</p>
                <p className="text-2xl font-bold text-green-600">₹{summary?.totalIncome?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          {/* Total Expense */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Expense</p>
                <p className="text-2xl font-bold text-red-600">₹{summary?.totalExpense?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="text-4xl">💸</div>
            </div>
          </div>

          {/* Budget Used */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Budget Used</p>
                <p className="text-2xl font-bold text-orange-600">{summary?.budgetUsed || '0'}%</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          {/* Budget Remaining */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Budget Remaining</p>
                <p className={`text-2xl font-bold ${summary?.budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{Math.abs(summary?.budgetRemaining || 0).toFixed(2)}
                </p>
              </div>
              <div className="text-4xl">{summary?.budgetRemaining >= 0 ? '✅' : '⚠️'}</div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Monthly Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="expense" stroke="#3B82F6" name="Expense" />
                <Line type="monotone" dataKey="income" stroke="#10B981" name="Income" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          {summary?.categoryWise && summary.categoryWise.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Expense by Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={summary.categoryWise}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ _id, amount }) => `${_id}: ₹${amount.toFixed(0)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {summary.categoryWise.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/expense')}
              className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition font-medium"
            >
              + Add Expense
            </button>
            <button
              onClick={() => navigate('/income')}
              className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition font-medium"
            >
              + Add Income
            </button>
            <button
              onClick={() => navigate('/suggestions')}
              className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 transition font-medium"
            >
              💡 Get Suggestions
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Home;