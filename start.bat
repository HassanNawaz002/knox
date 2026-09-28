@echo off
echo ============================================================
echo  Samsung Knox Manage Dashboard - Enterprise Console
echo ============================================================
echo.

:: Start Backend
echo [1/2] Starting Knox API Backend (Port 5000)...
start "Knox Backend" cmd /k "cd /d %~dp0backend && node server.js"

:: Brief pause for backend to initialize
timeout /t 3 /nobreak > nul

:: Start Frontend
echo [2/2] Starting React Frontend (Port 3000)...
start "Knox Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================================
echo  Dashboard URLs:
echo  - Frontend:  http://localhost:3000
echo  - Backend:   http://localhost:5000
echo  - Health:    http://localhost:5000/health
echo  - Auth Test: http://localhost:5000/api/auth/test
echo ============================================================
echo.
echo Press any key to open the dashboard in your browser...
pause > nul
start http://localhost:3000
