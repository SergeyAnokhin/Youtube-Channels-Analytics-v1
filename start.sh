#!/bin/bash

# YouTube Channel Analytics Dashboard - Quick Start
# This script starts a local HTTP server to view the dashboard

echo ""
echo "========================================"
echo "YouTube Channel Analytics Dashboard"
echo "========================================"
echo ""
echo "Starting local server on port 8000..."
echo ""
echo "Open your browser and go to:"
echo "http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
# Check if Python 2 is available
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 8000
# Check if Node.js is available
elif command -v npx &> /dev/null; then
    echo "Using Node.js HTTP Server..."
    npx http-server -p 8000
else
    echo "Error: Please install Python or Node.js to run the server"
    echo ""
    echo "Python: https://www.python.org/downloads/"
    echo "Node.js: https://nodejs.org/"
    exit 1
fi
