@echo off
REM Expense Tracker - Complete Startup Script
REM This script starts all services needed for the app

echo ========================================
echo Expense Tracker - Complete Setup
echo ========================================
echo.

REM Check if backend is already running
echo Checking backend status...
cd d:\Expense_tracker_app\Expense_tracker\backend

echo.
echo Starting Backend Server on port 8000...
start "Expense Tracker Backend" cmd /k "npm run dev"

REM Wait a bit for backend to start
timeout /t 3

REM Try to start ML API
echo.
echo Starting ML Prediction API on port 5001...
cd d:\Expense_tracker_app\Expense_tracker
start "ML Prediction API" cmd /k "python ml_api.py"

REM Wait a bit for ML API to start
timeout /t 2

REM Start Frontend
echo.
echo Starting Frontend on port 5173...
cd d:\Expense_tracker_app\Expense_tracker\frontend\expense-tracker
start "Expense Tracker Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Backend:   http://localhost:8000
echo ML API:    http://localhost:5001
echo Frontend:  http://localhost:5173
echo.
echo Access the app at http://localhost:5173
echo.
