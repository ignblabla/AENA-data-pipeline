# Arranca la web en local: backend (FastAPI) y frontend (Vite), cada uno en su ventana.
# Uso, desde la raíz del repositorio o desde web/:
#     powershell -ExecutionPolicy Bypass -File web\arrancar.ps1

$raiz = Split-Path -Parent $PSScriptRoot
$python = Join-Path $raiz "venv\Scripts\python.exe"
$frontend = Join-Path $PSScriptRoot "frontend"

if (-not (Test-Path $python)) {
    Write-Error "No se encuentra el entorno virtual en $python. Créalo con: python -m venv venv; venv\Scripts\pip install -r requirements.txt"
    exit 1
}

if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Write-Host "Instalando dependencias del frontend (solo la primera vez)..."
    Push-Location $frontend
    npm install
    Pop-Location
}

Start-Process powershell -WorkingDirectory $raiz -ArgumentList "-NoExit", "-Command", "& '$python' -m uvicorn app.main:app --reload --port 8000 --app-dir web/backend"
Start-Process powershell -WorkingDirectory $frontend -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "Web:             http://localhost:5173"
Write-Host "API (documentos): http://localhost:8000/docs"
Write-Host "Cierra las dos ventanas nuevas para detenerla."
