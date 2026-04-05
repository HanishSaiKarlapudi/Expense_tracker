#!/bin/bash
# Step-by-step setup guide for Expense Tracker

set -e  # Exit on error

echo "=========================================="
echo "Expense Tracker - Setup Script"
echo "=========================================="
echo ""

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "⚠️  Python not found. ML API will not work, but app will still function."
fi

echo "✅ Checking dependencies..."
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend/expense-tracker
npm install
cd ../..

# Install Python dependencies if Python is available
if command -v python &> /dev/null; then
    echo "📦 Installing Python dependencies for ML..."
    pip install -r requirements.txt
fi

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "To start the application:"
echo ""
echo "Option 1 - Using startup script:"
echo "  Windows: start-all.bat"
echo "  Linux/Mac: ./start-all.sh"
echo ""
echo "Option 2 - Manual startup (in separate terminals):"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 - ML API (optional but recommended):"
echo "  python ml_api.py"
echo ""
echo "Terminal 3 - Frontend:"
echo "  cd frontend/expense-tracker"
echo "  npm run dev"
echo ""
echo "Then access the app at: http://localhost:5173"
echo ""
