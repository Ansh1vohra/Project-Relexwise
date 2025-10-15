#!/bin/bash

# Contract Processing Backend Startup Script

echo "Starting Contract Processing Backend..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found!"
    echo "Please create a .env file with the required environment variables."
    echo "See README.md for details."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create logs directory
if [ ! -d "logs" ]; then
    echo "Creating logs directory..."
    mkdir logs
fi

# Create chroma_db directory
if [ ! -d "chroma_db" ]; then
    echo "Creating ChromaDB directory..."
    mkdir chroma_db
fi

echo "Starting FastAPI server..."
python main.py
