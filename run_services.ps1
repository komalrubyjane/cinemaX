# run_services.ps1
# Script to start Next.js Frontend, Node.js Backend, and Python AI Engine concurrently

Write-Host "Starting CineMatch Microservices..." -ForegroundColor Cyan

# Install Python requirements if ai_engine needs them
if (Test-Path .venv\Scripts\pip.exe) {
    Write-Host "Checking python dependencies..." -ForegroundColor Cyan
    & .venv\Scripts\pip.exe install -r .\ai_engine\requirements.txt -q
}

Write-Host "Services are starting in this window." -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000"
Write-Host "Backend:  http://localhost:5000"
Write-Host "AI Engine: http://localhost:8000"

# Use npx concurrently to run them all in this same console window
npx concurrently -c "green,cyan,magenta" -n "frontend,backend,ai_engine" `
    "cd frontend && npm run dev" `
    "cd backend && node server.js" `
    "cd ai_engine && ..\.venv\Scripts\python.exe -m uvicorn app:app --reload --port 8000"
