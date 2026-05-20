@echo off
:: Change to project directory
cd /d "C:\grc\task1"
:: Start the development server in a new window
start "Dev Server" cmd /c "npm run dev"
:: Wait a few seconds for Vite to be ready
timeout /t 5 > nul
:: Open the frontend in the default browser
start "" "http://localhost:5173/"
