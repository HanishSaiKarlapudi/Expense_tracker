import React from 'react'

function AuthLayout({ children }) {
  return (
    <div className="w-full h-screen flex bg-white">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-12 py-12 overflow-y-auto">
        <h1 className="text-3xl font-bold text-black mb-8">Expense Tracker</h1>
        {children}
      </div>

      {/* Right Side - Cards & Chart */}
      <div className="w-1/2 hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-purple-50 to-purple-100 px-8 py-12 overflow-y-auto relative">
        {/* Purple decorative shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-20"></div>

        {/* Card */}
        <div className="relative z-10 bg-white rounded-2xl shadow-lg p-6 mb-8 w-full max-w-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Track Your Income & Expenses</p>
              <p className="text-3xl font-bold text-black">₹4,30,000</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl">
              📈
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative z-10 bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">All Transactions</h3>
            <button className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-200">
              View More
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-6">2nd Jan to 21th Dec</p>

          {/* Simple bar chart representation */}
          <div className="flex items-end justify-between h-48 gap-2">
            {[120, 160, 190, 160, 70, 200, 220].map((height, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1">
                <div className="w-full flex flex-col items-center mb-2">
                  <div className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t" style={{ height: `${(height / 220) * 160}px` }}></div>
                </div>
                <span className="text-xs text-gray-600 font-medium">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][idx]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout