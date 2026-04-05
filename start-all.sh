#!/bin/bash

# Expense Tracker - Complete Startup Script for Linux/Mac

echo "========================================"
echo "Expense Tracker - Complete Setup"
echo "========================================"
echo ""

# Start Backend
echo "Starting Backend Server on port 8000..."
cd d:/Expense_tracker_app/Expense_tracker/backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start ML API
echo ""
echo "Starting ML Prediction API on port 5001..."
cd d:/Expense_tracker_app/Expense_tracker
python ml_api.py &
ML_PID=$!

# Wait for ML API to start
sleep 2

# Start Frontend
echo ""
echo "Starting Frontend on port 5173..."
cd d:/Expense_tracker_app/Expense_tracker/frontend/expense-tracker
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "All services started!"
echo "========================================"
echo ""
echo "Backend:   http://localhost:8000"
echo "ML API:    http://localhost:5001"
echo "Frontend:  http://localhost:5173"
echo ""
echo "Access the app at http://localhost:5173"
echo ""
echo "Process IDs:"
echo "Backend:  $BACKEND_PID"
echo "ML API:   $ML_PID"
echo "Frontend: $FRONTEND_PID"
echo ""

# Wait for all processes
wait $BACKEND_PID $ML_PID $FRONTEND_PID
