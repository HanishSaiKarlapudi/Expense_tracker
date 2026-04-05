import React, { useState, useEffect } from 'react'
import { useDashboard } from '../../context/DashboardContext'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

function Expense() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { expenses, fetchExpenses, createExpense, deleteExpense, updateExpense, summary, fetchSummary } = useDashboard()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [safetyRating, setSafetyRating] = useState(null)
  const [safetyLoading, setSafetyLoading] = useState(false)
  const [formData, setFormData] = useState({
    category: 'Food',
    amount: '',
    description: '',
    paymentMethod: 'Cash',
    date: new Date().toISOString().split('T')[0]
  })
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    loadExpenses()
  }, [])

  useEffect(() => {
    if (summary) {
      calculateSafetyRating()
    }
  }, [summary])

  const loadExpenses = async () => {
    try {
      setLoading(true)
      const currentDate = new Date()
      await fetchExpenses(currentDate.getMonth() + 1, currentDate.getFullYear())
      await fetchSummary()
    } catch (error) {
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const calculateSafetyRating = async () => {
    try {
      setSafetyLoading(true)
      const response = await fetch('http://localhost:5001/safety-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_income: summary?.totalIncome || 0,
          total_expense: summary?.totalExpense || 0,
          monthly_budget: user?.monthlyBudget || 50000,
          prev_month_expense: summary?.totalExpense || 0
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSafetyRating(data)
      }
    } catch (error) {
      console.error('Error calculating safety rating:', error)
    } finally {
      setSafetyLoading(false)
    }
  }

  const getSafetyColor = (level) => {
    switch(level) {
      case 'safe': return 'text-green-600'
      case 'moderate': return 'text-blue-600'
      case 'caution': return 'text-yellow-600'
      case 'risk': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getSafetyBgColor = (level) => {
    switch(level) {
      case 'safe': return 'bg-green-50 border border-green-200'
      case 'moderate': return 'bg-blue-50 border border-blue-200'
      case 'caution': return 'bg-yellow-50 border border-yellow-200'
      case 'risk': return 'bg-red-50 border border-red-200'
      default: return 'bg-gray-50 border border-gray-200'
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!formData.category) {
      toast.error('Please select a category')
      return
    }

    if (!formData.date) {
      toast.error('Please select a date')
      return
    }

    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount)
      }

      if (editId) {
        await updateExpense(editId, data)
        toast.success('Expense updated successfully')
        setEditId(null)
      } else {
        await createExpense(data)
        toast.success('Expense added successfully')
      }

      setFormData({
        category: 'Food',
        amount: '',
        description: '',
        paymentMethod: 'Cash',
        date: new Date().toISOString().split('T')[0]
      })
      setShowForm(false)
      await loadExpenses()
    } catch (error) {
      console.error('Expense error:', error)
      toast.error(error.message || 'Failed to save expense')
    }
  }

  const handleEdit = (expense) => {
    setFormData({
      category: expense.category,
      amount: expense.amount.toString(),
      description: expense.description,
      paymentMethod: expense.paymentMethod,
      date: new Date(expense.date).toISOString().split('T')[0]
    })
    setEditId(expense._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id)
        toast.success('Expense deleted successfully')
      } catch (error) {
        toast.error('Failed to delete expense')
      }
    }
  }

  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const avgExpense = expenses.length > 0 ? (totalExpense / expenses.length).toFixed(2) : '0.00'

  // Prepare monthly chart data from April to December
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() // 0-11
  const currentYear = currentDate.getFullYear()
  
  // Calculate total expense for current month
  const currentMonthTotal = expenses.reduce((sum, exp) => {
    const expDate = new Date(exp.date)
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear
      ? sum + exp.amount
      : sum
  }, 0)
  
  // Create months array from April (month 3) to December (month 11)
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const chartData = months.map((month, index) => ({
    month,
    amount: index === 0 ? currentMonthTotal : 0 // Only April has data
  }))

  return (
    <DashboardLayout>
      <div className="p-8 min-h-screen bg-gray-50">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-600 mt-2">Track and manage your expenses</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Safety Rating Card */}
          {safetyRating && (
            <div className={`rounded-lg shadow p-6 ${getSafetyBgColor(safetyRating.level)}`}>
              <p className="text-gray-700 text-sm font-medium mb-2">Budget Safety Rating</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-3xl font-bold ${getSafetyColor(safetyRating.level)}`}>
                    {safetyRating.safety_score}%
                  </p>
                  <p className={`text-sm font-semibold ${getSafetyColor(safetyRating.level)}`}>
                    {safetyRating.status}
                  </p>
                </div>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getSafetyBgColor(safetyRating.level)} ${getSafetyColor(safetyRating.level)} text-2xl`}>
                  {safetyRating.safety_score >= 80 ? '✓' : safetyRating.safety_score >= 60 ? '≈' : '⚠'}
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">₹{(summary?.totalExpense || 0).toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Average Expense</p>
            <p className="text-2xl font-bold text-blue-600">₹{(summary?.totalExpense && expenses.length > 0 ? (summary.totalExpense / expenses.length) : 0).toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Transactions</p>
            <p className="text-2xl font-bold text-purple-600">{expenses.length}</p>
          </div>
        </div>

        {/* Expense Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Expense Overview</h2>
            <p className="text-gray-600 mb-6">Track your spending trends over time and gain insights into where your money goes.</p>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#999"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#999"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => `₹${value.toFixed(2)}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                  cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', r: 4 }}
                  activeDot={{ r: 6 }}
                  fill="url(#colorAmount)"
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Add Expense Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">{editId ? 'Edit Expense' : 'Add New Expense'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Food</option>
                  <option>Transportation</option>
                  <option>Entertainment</option>
                  <option>Utilities</option>
                  <option>Healthcare</option>
                  <option>Shopping</option>
                  <option>Education</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <DatePicker
                  selected={formData.date ? new Date(formData.date) : null}
                  onChange={(date) => {
                    if (date) {
                      setFormData(prev => ({ ...prev, date: date.toISOString().split('T')[0] }))
                    }
                  }}
                  maxDate={new Date()}
                  dateFormat="dd-MM-yyyy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select date"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Cash</option>
                  <option>Credit Card</option>
                  <option>Debit Card</option>
                  <option>UPI</option>
                  <option>Net Banking</option>
                  <option>Others</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
                >
                  {editId ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditId(null)
                    setFormData({
                      category: 'Food',
                      amount: '',
                      description: '',
                      paymentMethod: 'Cash',
                      date: new Date().toISOString().split('T')[0]
                    })
                  }}
                  className="w-full bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Expense Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-8 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            + Add Expense
          </button>
        )}

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Expenses</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No expenses found. Add your first expense!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Payment</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.map(expense => (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-red-600">₹{expense.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{expense.paymentMethod}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{expense.description || '-'}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(expense._id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Expense
