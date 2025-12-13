@echo off
REM YouTube Channel Analytics Dashboard - Quick Start
REM This script starts a local HTTP server to view the dashboard

echo.
echo ========================================
echo YouTube Channel Analytics Dashboard
echo ========================================
echo.
echo Starting local server on port 8000...
echo.
echo Open your browser and go to:
echo http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python -m http.server 8000

pause
