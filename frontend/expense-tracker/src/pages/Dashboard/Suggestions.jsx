import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useDashboard } from '../../context/DashboardContext'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { FiAlertTriangle, FiTarget, FiBarChart2, FiTrendingDown, FiAward, FiDownload } from 'react-icons/fi'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

function Suggestions() {
  const { user, setUser, fetchUser } = useAuth()
  const { fetchSummary, summary } = useDashboard()
  const [budgetSettings, setBudgetSettings] = useState({
    monthlyBudget: user?.monthlyBudget || 50000,
    categoryBudgets: {
      Food: 10000,
      Transport: 5000,
      Entertainment: 5000,
      Shopping: 10000,
      Utilities: 5000,
      Others: 10000
    }
  })
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState('')
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [loading, setLoading] = useState(true)
  const [safetyRating, setSafetyRating] = useState(null)
  const [safetyLoading, setSafetyLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (summary) {
      calculateSafetyRating()
    }
  }, [summary])

  const loadData = async () => {
    try {
      setLoading(true)
      await fetchSummary()
      // Initialize category budgets from localStorage if exists
      const savedBudgets = localStorage.getItem('budgetSettings')
      if (savedBudgets) {
        setBudgetSettings(JSON.parse(savedBudgets))
      }
    } catch (error) {
      toast.error('Failed to load data')
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

  const handleBudgetChange = (field, value) => {
    if (field === 'monthlyBudget') {
      setBudgetSettings({ ...budgetSettings, monthlyBudget: parseFloat(value) })
    } else {
      setBudgetSettings({
        ...budgetSettings,
        categoryBudgets: {
          ...budgetSettings.categoryBudgets,
          [field]: parseFloat(value)
        }
      })
    }
  }

  const saveBudgetSettings = async () => {
    try {
      // Save to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/update-budget`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ monthlyBudget: budgetSettings.monthlyBudget })
      })

      if (response.ok) {
        // Save category budgets to localStorage
        localStorage.setItem('budgetSettings', JSON.stringify(budgetSettings))
        toast.success('Budget settings saved successfully!')
        setShowBudgetForm(false)
        
        // Update user context and fetch latest data
        if (user) {
          setUser({ ...user, monthlyBudget: budgetSettings.monthlyBudget })
        }
        
        // Fetch updated user data to ensure consistency across all components
        await fetchUser()
      } else {
        toast.error('Failed to save budget settings')
      }
    } catch (error) {
      toast.error('Error saving budget settings')
    }
  }

  const generateAiSuggestions = async () => {
    try {
      setLoadingSuggestions(true)
      
      // Get category data from expenses
      const categoryData = {}
      const expenses = Array.isArray(window.expenseData) ? window.expenseData : []
      expenses.forEach(exp => {
        categoryData[exp.category] = (categoryData[exp.category] || 0) + exp.amount
      })
      
      // Call ML API Gemini suggestions endpoint
      const response = await fetch('http://localhost:5001/gemini-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          total_income: summary?.totalIncome || 0,
          total_expense: summary?.totalExpense || 0,
          monthly_budget: budgetSettings.monthlyBudget,
          category_data: categoryData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate suggestions')
      }

      const data = await response.json()
      
      if (data.suggestions) {
        setAiSuggestions(data.suggestions)
        toast.success('✨ AI suggestions generated!')
      } else {
        throw new Error('No suggestions generated')
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
      // Fallback to backend suggestions
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/ai-suggestions`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const suggestionsText = data.suggestions.join('\n\n')
          setAiSuggestions(suggestionsText)
          toast.success('Suggestions generated (Fallback mode)')
        } else {
          toast.error('Failed to generate suggestions')
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError)
        toast.error('Unable to generate suggestions')
      }
    } finally {
      setLoadingSuggestions(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Budget insights and suggestions</h1>

        {/* Budget Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {/* Safety Rating Card */}
          {safetyRating && (
            <div className={`rounded-xl shadow-md p-6 ${getSafetyBgColor(safetyRating.level)}`}>
              <p className="text-gray-700 text-sm font-medium mb-3">Budget Safety Rating</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-3xl font-bold ${getSafetyColor(safetyRating.level)}`}>
                    {safetyRating.safety_score}%
                  </p>
                  <p className={`text-xs font-semibold ${getSafetyColor(safetyRating.level)} mt-1`}>
                    {safetyRating.status}
                  </p>
                </div>
                <div className={`text-3xl`}>
                  {safetyRating.safety_score >= 80 ? '✓' : safetyRating.safety_score >= 60 ? '≈' : '⚠'}
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-600 font-semibold">Monthly Budget</p>
              <FiTarget className="text-blue-600 text-2xl" />
            </div>
            <p className="text-3xl font-bold text-blue-900">₹{budgetSettings.monthlyBudget.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-orange-600 font-semibold">Total Spent</p>
              <FiBarChart2 className="text-orange-600 text-2xl" />
            </div>
            <p className="text-3xl font-bold text-orange-900">₹{(summary?.totalExpense || 0).toLocaleString('en-IN')}</p>
            <p className="text-sm text-orange-600 mt-2">{(((summary?.totalExpense || 0) / budgetSettings.monthlyBudget) * 100).toFixed(1)}% used</p>
          </div>

          <div className={`rounded-xl p-6 border ${
            (budgetSettings.monthlyBudget - (summary?.totalExpense || 0)) >= 0
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`font-semibold ${(budgetSettings.monthlyBudget - (summary?.totalExpense || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Remaining
              </p>
              <FiTrendingDown className={`text-2xl ${(budgetSettings.monthlyBudget - (summary?.totalExpense || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <p className={`text-3xl font-bold ${(budgetSettings.monthlyBudget - (summary?.totalExpense || 0)) >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              ₹{Math.abs(budgetSettings.monthlyBudget - (summary?.totalExpense || 0)).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-purple-600 font-semibold">Total Income</p>
              <FiAward className="text-purple-600 text-2xl" />
            </div>
            <p className="text-3xl font-bold text-purple-900">₹{(summary?.totalIncome || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Budget Settings Section */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">📊 Budget Settings</h2>
            <button
              onClick={() => setShowBudgetForm(!showBudgetForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {showBudgetForm ? 'Close' : 'Edit Budget'}
            </button>
          </div>

          {showBudgetForm ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Budget</label>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold">₹</span>
                  <input
                    type="number"
                    value={budgetSettings.monthlyBudget}
                    onChange={(e) => handleBudgetChange('monthlyBudget', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Budgets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(budgetSettings.categoryBudgets).map(([category, budget]) => (
                    <div key={category}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{category}</label>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">₹</span>
                        <input
                          type="number"
                          value={budget}
                          onChange={(e) => handleBudgetChange(category, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={saveBudgetSettings}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Save Budget
                </button>
                <button
                  onClick={() => setShowBudgetForm(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Monthly Budget</p>
                <p className="text-2xl font-bold text-gray-900">₹{budgetSettings.monthlyBudget.toLocaleString('en-IN')}</p>
              </div>
              {Object.entries(budgetSettings.categoryBudgets).map(([category, budget]) => (
                <div key={category} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{category}</p>
                  <p className="text-xl font-bold text-gray-900">₹{budget.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Suggestions Section */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">🤖 AI-Powered Suggestions</h2>
            <button
              onClick={generateAiSuggestions}
              disabled={loadingSuggestions}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
            >
              {loadingSuggestions ? 'Generating...' : 'Generate Suggestions'}
            </button>
          </div>

          {aiSuggestions && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="prose max-w-none">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{aiSuggestions}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(aiSuggestions)
                  toast.success('Copied to clipboard!')
                }}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
              >
                <FiDownload /> Copy Suggestions
              </button>
            </div>
          )}

          {!aiSuggestions && !loadingSuggestions && (
            <div className="text-center py-8 text-gray-500">
              <p>No suggestions yet. Click "Generate Suggestions" to get AI-powered insights based on your budget.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Suggestions
