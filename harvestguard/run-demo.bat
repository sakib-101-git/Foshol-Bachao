@echo off
echo ========================================
echo   HarvestGuard Demo Launcher
echo   (Dhaan Bachao)
echo ========================================
echo.

echo Starting Backend Server...
start "HarvestGuard Backend" cmd /c "cd backend && npm start"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "HarvestGuard Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo ========================================
echo   Servers are starting...
echo.
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:5173
echo.
echo   Demo Login:
echo   Email: demo@harvestguard.com
echo   Password: demo123
echo ========================================
echo.
echo Press any key to open the app in browser...
pause >nul

start http://localhost:5173

