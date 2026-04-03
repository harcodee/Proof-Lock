# start-backend.ps1
# Starts the FastAPI backend on port 8000

$pythonPath = "C:\Users\harkee\AppData\Local\Programs\Python\Python314\python.exe"

if (!(Test-Path $pythonPath)) {
    # Fallback: try python on PATH
    $pythonPath = "python"
}

Set-Location "$PSScriptRoot\backend"
Write-Host "Starting backend on http://localhost:8000 ..." -ForegroundColor Cyan
& $pythonPath -m uvicorn main:app --reload --port 8000
