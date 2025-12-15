#!/bin/bash

# Start script for C++ backend server
# This script builds (if needed) and runs the backend server

cd "$(dirname "$0")/backend"

# Check if build directory exists
if [ ! -d "build" ]; then
    echo "Build directory not found. Creating and building..."
    mkdir build
    cd build
    cmake ..
    make
else
    echo "Build directory exists. Checking if rebuild is needed..."
    cd build
    make
fi

# Check if backend_server exists
if [ ! -f "backend_server" ]; then
    echo "Error: backend_server executable not found!"
    echo "Build may have failed. Please check the error messages above."
    exit 1
fi

# Check if config.json exists
if [ ! -f "../config.json" ]; then
    echo "Warning: config.json not found!"
    echo "Please copy config.example.json to config.json and add your OAuth credentials."
    echo "The server will start but OAuth login will not work."
    read -p "Press Enter to continue anyway, or Ctrl+C to cancel..."
fi

echo ""
echo "Starting C++ backend server on port 3001..."
echo "Press Ctrl+C to stop"
echo ""

./backend_server
