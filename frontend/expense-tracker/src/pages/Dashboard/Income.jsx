import React, { useState, useEffect } from 'react'
import { useDashboard } from '../../context/DashboardContext'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

function Income() {
  const navigate = useNavigate()
  const { income, fetchIncome, createIncome, deleteIncome, updateIncome } = useDashboard()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    source: 'Salary',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    loadIncome()
  }, [])

  const loadIncome = async () => {
    try {
      const currentDate = new Date()
      await fetchIncome(currentDate.getMonth() + 1, currentDate.getFullYear())
    } catch (error) {
      toast.error('Failed to load income')
    } finally {
      setLoading(false)
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

    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount)
      }

      if (editId) {
        await updateIncome(editId, data)
        toast.success('Income updated successfully')
        setEditId(null)
      } else {
        await createIncome(data)
        toast.success('Income added successfully')
      }

      setFormData({
        source: 'Salary',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      })
      setShowForm(false)
    } catch (error) {
      toast.error(error.message || 'Failed to save income')
    }
  }

  const handleEdit = (inc) => {
    setFormData({
      source: inc.source,
      amount: inc.amount.toString(),
      description: inc.description,
      date: new Date(inc.date).toISOString().split('T')[0]
    })
    setEditId(inc._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this income record?')) {
      try {
        await deleteIncome(id)
        toast.success('Income deleted successfully')
      } catch (error) {
        toast.error('Failed to delete income')
      }
    }
  }

  const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0)
  const avgIncome = income.length > 0 ? (totalIncome / income.length).toFixed(2) : '0.00'

  // Prepare monthly chart data from April to December
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() // 0-11
  const currentYear = currentDate.getFullYear()
  
  // Calculate total income for current month
  const currentMonthTotal = income.reduce((sum, inc) => {
    const incDate = new Date(inc.date)
    return incDate.getMonth() === currentMonth && incDate.getFullYear() === currentYear
      ? sum + inc.amount
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
          <h1 className="text-3xl font-bold text-gray-900">Income Management</h1>
          <p className="text-gray-600 mt-2">Track and manage your income sources</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Income</p>
            <p className="text-2xl font-bold text-green-600">₹{totalIncome.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Average Income</p>
            <p className="text-2xl font-bold text-blue-600">₹{avgIncome}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Transactions</p>
            <p className="text-2xl font-bold text-purple-600">{income.length}</p>
          </div>
        </div>

        {/* Income Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Income Overview</h2>
            <p className="text-gray-600 mb-6">Track your earnings over time and analyze your income trends.</p>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
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
                  cursor={{ fill: 'rgba(168, 85, 247, 0.1)' }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#a855f7"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Add Income Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">{editId ? 'Edit Income' : 'Add New Income'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Source</label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Salary</option>
                  <option>Freelance</option>
                  <option>Business</option>
                  <option>Investment</option>
                  <option>Bonus</option>
                  <option>Gift</option>
                  <option>Others</option>
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

              <div className="md:col-span-3">
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

              <div className="md:col-span-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
                >
                  {editId ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditId(null)
                    setFormData({
                      source: 'Salary',
                      amount: '',
                      description: '',
                      date: new Date().toISOString().split('T')[0]
                    })
                  }}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Income Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-8 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
          >
            + Add Income
          </button>
        )}

        {/* Income List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Income Records</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading income...</div>
          ) : income.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No income records found. Add your first income!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Source</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {income.map(inc => (
                    <tr key={inc._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {inc.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-green-600">₹{inc.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">{new Date(inc.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{inc.description || '-'}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(inc)}
                          className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(inc._id)}
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

export default Income
