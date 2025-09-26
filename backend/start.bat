@echo off
REM Contract Processing Backend Startup Script for Windows

echo Starting Contract Processing Backend...

REM Check if .env file exists
if not exist ".env" (
    echo Error: .env file not found!
    echo Please create a .env file with the required environment variables.
    echo See README.md for details.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Create logs directory
if not exist "logs" (
    echo Creating logs directory...
    mkdir logs
)

REM Create chroma_db directory
if not exist "chroma_db" (
    echo Creating ChromaDB directory...
    mkdir chroma_db
)

echo Starting FastAPI server...
python main.py

pause
