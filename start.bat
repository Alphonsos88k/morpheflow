@echo off
rem morpheFlow launcher: double-click to start the app and open it in your browser.
rem Close this window (or press Ctrl+C) to stop the app.
title morpheFlow
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Get it from https://nodejs.org and run this again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo First run: installing dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed. See the messages above.
    pause
    exit /b 1
  )
)

rem Open the browser once the web server has had a few seconds to start.
if not defined MF_NO_BROWSER start "" /min cmd /c "timeout /t 4 /nobreak >nul & start "" http://127.0.0.1:5173"

echo Starting morpheFlow at http://127.0.0.1:5173 (close this window to stop)
call npm run dev
