import React from 'react'
import moment from 'moment'

function TransactionItem({ type = 'expense', category = 'Shopping', amount = 430, date = new Date(), icon = '🛍️' }) {
  const formatAmount = (amt) => {
    return `${type === 'income' ? '+' : '-'}₹${amt.toLocaleString('en-IN')}`
  }

  const isIncome = type === 'income'

  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">
          {icon}
        </div>
        <div>
          <p className="font-medium text-gray-900">{category}</p>
          <p className="text-sm text-gray-500">{moment(date).format('DD MMM YYYY')}</p>
        </div>
      </div>
      <p className={`font-semibold text-lg ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
        {formatAmount(amount)}
      </p>
    </div>
  )
}

export default TransactionItem
