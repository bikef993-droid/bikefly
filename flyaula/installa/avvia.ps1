# ==================================================================
#  FLY AULA - avvio
#  1 si aggiorna da sola (se c e internet)   2 accende il cervello
#  3 accende la lavagna   4 apre Fly Aula a tutto schermo
# ==================================================================
$DIR  = Split-Path -Parent $MyInvocation.MyCommand.Path
$SITO = 'https://bikef993-droid.github.io/bikefly'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$aggiornata = $false

# 1) aggiornamenti automatici: si scarica tutto in una cartella a parte,
#    e solo se e tutto a posto si sostituisce la versione vecchia
try {
  $wc = New-Object Net.WebClient
  $wc.Encoding = [Text.Encoding]::UTF8
  $nuova = $wc.DownloadString("$SITO/flyaula/installa/versione.txt").Trim()
  $mia = Get-Content (Join-Path $DIR 'versione.txt') -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($nuova -and $nuova -ne $mia) {
    $lista = $wc.DownloadString("$SITO/flyaula/installa/file.txt") -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('#') }
    $tmp = Join-Path $DIR 'nuova'
    Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
    foreach ($f in $lista) {
      $d = Join-Path $tmp $f.Replace('/', '\')
      New-Item -ItemType Directory -Force -Path (Split-Path $d) | Out-Null
      $wc.DownloadFile("$SITO/$f", $d)
    }
    Remove-Item (Join-Path $DIR 'app') -Recurse -Force -ErrorAction SilentlyContinue
    Rename-Item $tmp 'app'
    foreach ($s in 'server.ps1', 'avvia.ps1', 'icona.ico') { Copy-Item (Join-Path $DIR "app\flyaula\installa\$s") (Join-Path $DIR $s) -Force }
    Set-Content (Join-Path $DIR 'versione.txt') $nuova
    $aggiornata = $true
  }
} catch {}

# 2) il cervello
if (-not (Get-Process ollama -ErrorAction SilentlyContinue)) {
  $OLL = Join-Path $env:LOCALAPPDATA 'Programs\Ollama'
  $app = Join-Path $OLL 'ollama app.exe'
  if (Test-Path $app) { Start-Process $app }
  elseif (Test-Path (Join-Path $OLL 'ollama.exe')) { Start-Process (Join-Path $OLL 'ollama.exe') -ArgumentList 'serve' -WindowStyle Hidden }
}

# 3) la lavagna (piccolo server solo su questo computer e sul Wi-Fi della scuola)
function Accesa { try { Invoke-WebRequest 'http://localhost:8780/fa/stato' -UseBasicParsing -TimeoutSec 2 | Out-Null; $true } catch { $false } }
if ($aggiornata -and (Accesa)) {
  try { Invoke-WebRequest 'http://localhost:8780/fa/ferma' -UseBasicParsing -TimeoutSec 2 | Out-Null } catch {}
  Start-Sleep 1
}
if (-not (Accesa)) {
  Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$DIR\server.ps1`""
  for ($i = 0; $i -lt 30 -and -not (Accesa); $i++) { Start-Sleep -Milliseconds 500 }
}

# 4) Fly Aula a tutto schermo, senza barre del browser
$url = 'http://localhost:8780/flyaula/'
$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
$chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe", "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
$browser = if ($edge) { $edge } else { $chrome }
$opzioni = "--app=$url --start-fullscreen --user-data-dir=`"$DIR\profilo`" --no-first-run --no-default-browser-check --autoplay-policy=no-user-gesture-required"
if ($browser) { Start-Process $browser $opzioni } else { Start-Process $url }
