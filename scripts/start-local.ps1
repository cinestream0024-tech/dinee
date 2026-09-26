[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDirectory = Join-Path $projectRoot ".local\runtime"
$logDirectory = Join-Path $runtimeDirectory "logs"

New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null

function Test-TcpPort {
    param([int]$Port)

    try {
        $client = [System.Net.Sockets.TcpClient]::new()
        $pending = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
        if (-not $pending.AsyncWaitHandle.WaitOne(500)) {
            $client.Dispose()
            return $false
        }
        $client.EndConnect($pending)
        $client.Dispose()
        return $true
    } catch {
        return $false
    }
}

function Wait-ForPort {
    param([int]$Port, [string]$Service)

    foreach ($attempt in 1..40) {
        if (Test-TcpPort -Port $Port) {
            return
        }
        Start-Sleep -Milliseconds 250
    }

    throw "$Service n'écoute pas sur le port $Port. Consultez $logDirectory."
}

if (-not (Test-TcpPort -Port 3306)) {
    throw "MySQL n'est pas démarré. Lancez-le depuis Laragon puis relancez ce script."
}
if (-not (Test-TcpPort -Port 80)) {
    throw "Apache n'est pas démarré. Lancez-le depuis Laragon puis relancez ce script."
}
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot "frontend\dist\index.html"))) {
    throw "Le build frontend manque. Exécutez npm run build dans frontend/."
}

if (Test-TcpPort -Port 8000) {
    Write-Host "backend est déjà démarré sur le port 8000."
} else {
    $php = (Get-Command php -ErrorAction Stop).Source
    $laravelRouter = Join-Path $projectRoot "backend\vendor\laravel\framework\src\Illuminate\Foundation\resources\server.php"
    $stdout = Join-Path $logDirectory "backend.out.log"
    $stderr = Join-Path $logDirectory "backend.err.log"
    $processOptions = @{
        FilePath = $php
        ArgumentList = @("-S", "127.0.0.1:8000", $laravelRouter)
        WorkingDirectory = Join-Path $projectRoot "backend\public"
        WindowStyle = "Hidden"
        RedirectStandardOutput = $stdout
        RedirectStandardError = $stderr
        PassThru = $true
    }
    $process = Start-Process @processOptions

    Set-Content -LiteralPath (Join-Path $runtimeDirectory "backend.pid") -Value $process.Id
    Wait-ForPort -Port 8000 -Service "backend"
    Write-Host "backend démarré (PID $($process.Id), port 8000)."
}

try {
    $response = Invoke-WebRequest -Uri "http://ledinee.test/api/v1/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -ne 200) {
        throw "Réponse HTTP inattendue : $($response.StatusCode)"
    }
} catch {
    throw "ledinee.test n'est pas joignable. Vérifiez Apache, le virtual host et le fichier hosts. $($_.Exception.Message)"
}

Write-Host "DINEE est prêt : http://ledinee.test"