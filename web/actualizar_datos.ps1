# Trae los datos nuevos que el pipeline sube a GitHub (git pull) para que la web los muestre.
# Lo ejecuta la tarea programada creada con web\programar_actualizacion.ps1, pero también
# se puede lanzar a mano:
#     powershell -ExecutionPolicy Bypass -File web\actualizar_datos.ps1
#
# Solo hace "avance rápido" (--ff-only): si la copia local tuviera commits propios o cambios
# que chocasen con lo que llega, no toca nada y lo deja anotado en el registro.

$raiz = Split-Path -Parent $PSScriptRoot
$registro = Join-Path $PSScriptRoot "actualizacion_datos.log"
$maxLineas = 1000

function Anotar($mensaje) {
    $linea = "{0}  {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $mensaje
    Add-Content -Path $registro -Value $linea -Encoding UTF8
}

# Sin ventanas de usuario/contraseña: si Git necesitara credenciales, que falle y se anote
$env:GIT_TERMINAL_PROMPT = "0"

Push-Location $raiz
try {
    $salida = & git pull --ff-only --quiet 2>&1
    if ($LASTEXITCODE -eq 0) {
        $ultimo = & git log -1 --format="%h %s"
        Anotar "OK  $ultimo"
    }
    else {
        Anotar ("ERROR (código $LASTEXITCODE)  " + (($salida | Out-String).Trim() -replace "\s+", " "))
    }
}
catch {
    Anotar "ERROR  $($_.Exception.Message)"
}
finally {
    Pop-Location
}

# El registro se recorta para que no crezca sin límite
$lineas = Get-Content -Path $registro -Encoding UTF8
if ($lineas.Count -gt $maxLineas) {
    $lineas | Select-Object -Last $maxLineas | Set-Content -Path $registro -Encoding UTF8
}
