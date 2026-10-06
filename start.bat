@echo off
TITLE SmartERP - Enterprise Platform Launcher
cls
echo ============================================================================
echo                      Starting SmartERP Enterprise Platform
echo  Modules: Auth, HR, CRM, Inventory, Sales, Procurement, Finance, Reports
echo ============================================================================
echo.

SET "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

:: Check if Node is in PATH, if not fallback to portable location
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Users\DELL\nodejs\node-v20.18.0-win-x64" (
        set "PATH=C:\Users\DELL\nodejs\node-v20.18.0-win-x64;%PATH%"
    )
)

:: Check Backend Virtualenv
if not exist "backend\.venv\Scripts\python.exe" (
    echo [INFO] Creating Python virtual environment in backend\.venv...
    python -m venv backend\.venv
    echo [INFO] Installing backend dependencies...
    backend\.venv\Scripts\pip install -r backend\requirements.txt
)

:: Check Frontend node_modules
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
)

echo [1/2] Launching FastAPI Backend (Uvicorn)...
start "SmartERP Backend (FastAPI)" cmd /k "cd /d "%ROOT_DIR%backend" && (if exist ".venv\Scripts\python.exe" (".venv\Scripts\python.exe" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001) else (python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001))"

echo [2/2] Launching React Vite Frontend...
start "SmartERP Frontend (Vite)" cmd /k "cd /d "%ROOT_DIR%frontend" && set "VITE_API_URL=http://localhost:8001/api/v1" && npm run dev -- --host 127.0.0.1 --port 5174"

echo.
echo ============================================================================
echo SmartERP servers are starting up in separate windows!
echo.
echo - Web Application: http://localhost:5174
echo - API Server:      http://localhost:8001
echo - Swagger Docs:    http://localhost:8001/docs
echo.
echo ============================================================================
echo.
pause
