@echo off
REM Setup script for Windows

setlocal enabledelayedexpansion

echo ========================================
echo Expense Tracker - Windows Setup
echo ========================================
echo.

REM Check if Node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo OK: Node.js found
echo.

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Python not found. ML API will not work, but app will still function.
) else (
    echo OK: Python found
)

echo.
echo Installing dependencies...
echo.

REM Install backend
echo Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

REM Install frontend
echo Installing frontend dependencies...
cd frontend\expense-tracker
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..\..

REM Install Python dependencies if Python is available
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Installing Python dependencies for ML...
    pip install -r requirements.txt
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the application:
echo.
echo Option 1 - Using startup script:
echo   Double-click: start-all.bat
echo.
echo Option 2 - Manual startup (in separate terminals):
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   npm run dev
echo.
echo Terminal 2 - ML API ^(optional but recommended^):
echo   python ml_api.py
echo.
echo Terminal 3 - Frontend:
echo   cd frontend\expense-tracker
echo   npm run dev
echo.
echo Then access the app at: http://localhost:5173
echo.
pause
