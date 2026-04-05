import React from 'react'
import { FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi'

function DashboardCards({ totalBalance = 0, totalIncome = 0, totalExpenses = 0 }) {
  const formatAmount = (amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Balance Card */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600 font-medium">Total Balance</p>
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <FiDollarSign className="text-purple-600 text-xl" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900">{formatAmount(totalBalance)}</p>
      </div>

      {/* Total Income Card */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600 font-medium">Total Income</p>
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <FiTrendingUp className="text-orange-600 text-xl" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900">{formatAmount(totalIncome)}</p>
      </div>

      {/* Total Expenses Card */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600 font-medium">Total Expenses</p>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <FiTrendingDown className="text-red-600 text-xl" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900">{formatAmount(totalExpenses)}</p>
      </div>
    </div>
  )
}

export default DashboardCards
