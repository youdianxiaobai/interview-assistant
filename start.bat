@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title Interview Assistant - AI Coach

cd /d "%~dp0"

echo.
echo   ========================================
echo     Interview Assistant ^| AI Interview Coach
echo     Starting up...
echo   ========================================
echo.

:: 1. Kill existing process on port 3000
echo [1/3] Cleaning port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING" 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo        Done.

:: 2. Check dependencies
echo [2/3] Checking dependencies...
if not exist "node_modules\" (
    echo        First run - installing packages...
    call npm install
) else (
    echo        Ready.
)

:: 3. Start
echo [3/3] Starting Next.js dev server...
echo.
:: Get local IP for LAN sharing
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4" ^| findstr "192.168"') do set LAN_IP=%%a
set LAN_IP=%LAN_IP: =%

echo   ----------------------------------------
echo     Local:  http://localhost:3000
if defined LAN_IP echo     LAN:    http://%LAN_IP%:3000
echo     Press Ctrl+C to stop
echo     Keep this window open!
echo   ----------------------------------------
echo.

:: Auto-open browser after 5s delay (give server time to boot)
start "" /b cmd /c "ping -n 6 127.0.0.1 >nul && start http://localhost:3000"

:: Start Next.js (bind to all interfaces so LAN devices can access)
npx next dev -p 3000 -H 0.0.0.0

pause
