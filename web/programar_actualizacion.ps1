# Crea una tarea programada de Windows que ejecuta web\actualizar_datos.ps1 cada 10 minutos
# mientras tu sesión está iniciada, en segundo plano y sin abrir ventanas.
#
#     powershell -ExecutionPolicy Bypass -File web\programar_actualizacion.ps1           # crearla (o recrearla)
#     powershell -ExecutionPolicy Bypass -File web\programar_actualizacion.ps1 -Quitar   # quitarla
#
# También se puede ver, pausar o borrar en el "Programador de tareas" de Windows.

param(
    [switch]$Quitar,
    [int]$Minutos = 10
)

$nombre = "AENA - actualizar datos de la web"

if ($Quitar) {
    if (Get-ScheduledTask -TaskName $nombre -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $nombre -Confirm:$false
        Write-Host "Tarea '$nombre' eliminada."
    }
    else {
        Write-Host "No existe la tarea '$nombre'."
    }
    return
}

$script = Join-Path $PSScriptRoot "actualizar_datos.ps1"

# conhost --headless ejecuta PowerShell sin que aparezca ninguna ventana
$accion = New-ScheduledTaskAction -Execute "conhost.exe" `
    -Argument "--headless powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$script`"" `
    -WorkingDirectory (Split-Path -Parent $PSScriptRoot)

# Empieza ahora y se repite indefinidamente
$disparador = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes $Minutos)

$ajustes = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5)

# Con tu usuario y solo con la sesión iniciada: no hace falta guardar ninguna contraseña
$usuario = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $nombre -Action $accion -Trigger $disparador -Settings $ajustes -Principal $usuario `
    -Description "Hace git pull del repositorio AENA-data-pipeline para que la web muestre los datos más recientes." `
    -Force | Out-Null

Write-Host "Tarea '$nombre' creada: se ejecuta cada $Minutos minutos."
Write-Host "Registro de ejecuciones: $(Join-Path $PSScriptRoot 'actualizacion_datos.log')"
