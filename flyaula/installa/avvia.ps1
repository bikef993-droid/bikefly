# ==================================================================
#  FLY AULA - avvio
#  LIM: apre Fly Aula dal server della scuola (gli aggiornamenti li ha il server)
#  PC singolo o server: 1 si aggiorna (se c e internet)  2 accende il cervello
#                       3 accende la lavagna  4 apre Fly Aula a tutto schermo
# ==================================================================
$DIR  = Split-Path -Parent $MyInvocation.MyCommand.Path
$SITO = 'https://bikef993-droid.github.io/bikefly'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$cfg = $null
try { $cfg = [IO.File]::ReadAllText((Join-Path $DIR 'config.json')) | ConvertFrom-Json } catch {}
$ruolo = if ($cfg -and $cfg.ruolo) { [string]$cfg.ruolo } else { 'singolo' }

function ApriFlyAula($url, $origine) {
  $edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
  $chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe", "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
  $browser = if ($edge) { $edge } else { $chrome }
  # sulle LIM l indirizzo del server e "http": questa opzione permette lo stesso il microfono
  $sicuro = if ($origine) { " --unsafely-treat-insecure-origin-as-secure=$origine" } else { '' }
  $opzioni = "--app=$url --start-fullscreen --user-data-dir=`"$DIR\profilo`" --no-first-run --no-default-browser-check --autoplay-policy=no-user-gesture-required$sicuro"
  if ($browser) { Start-Process $browser $opzioni } else { Start-Process $url }
}

if ($ruolo -eq 'lim') {
  $srv = [string]$cfg.server
  ApriFlyAula "http://$($srv):8780/flyaula/?aula=$([Uri]::EscapeDataString([string]$cfg.aula))" "http://$($srv):8780"
  exit 0
}

$aggiornata = $false
# 1) aggiornamenti automatici: si scarica tutto a parte, e si sostituisce solo se e tutto a posto
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

# 2) il cervello: se il motore non risponde, lo accendiamo noi
function Motore { try { Invoke-WebRequest 'http://127.0.0.1:11434/api/version' -UseBasicParsing -TimeoutSec 2 | Out-Null; $true } catch { $false } }
$OLL = Join-Path $env:LOCALAPPDATA 'Programs\Ollama'
$exe = Join-Path $OLL 'ollama.exe'
if (-not (Test-Path $exe)) { $c = Get-Command ollama -ErrorAction SilentlyContinue; if ($c) { $exe = $c.Source } }
if (-not (Motore)) {
  $app = Join-Path $OLL 'ollama app.exe'
  if ((Test-Path $app) -and -not (Get-Process 'ollama app' -ErrorAction SilentlyContinue)) { Start-Process $app }
  for ($i = 0; $i -lt 15 -and -not (Motore); $i++) { Start-Sleep 1 }
  # l app di Ollama a volte si apre ma il motore non parte: lo facciamo partire noi, nascosto
  if (-not (Motore) -and (Test-Path $exe)) {
    Start-Process $exe -ArgumentList 'serve' -WindowStyle Hidden
    for ($i = 0; $i -lt 30 -and -not (Motore); $i++) { Start-Sleep 1 }
  }
}

# 3) la lavagna (piccolo server: questo computer + Wi-Fi della scuola)
function Accesa { try { Invoke-WebRequest 'http://localhost:8780/fa/scuola' -UseBasicParsing -TimeoutSec 2 | Out-Null; $true } catch { $false } }
if ($aggiornata -and (Accesa)) {
  try { Invoke-WebRequest 'http://localhost:8780/fa/ferma' -UseBasicParsing -TimeoutSec 2 | Out-Null } catch {}
  Start-Sleep 1
}
if (-not (Accesa)) {
  Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$DIR\server.ps1`""
  for ($i = 0; $i -lt 30 -and -not (Accesa); $i++) { Start-Sleep -Milliseconds 500 }
}

# 4) Fly Aula a tutto schermo (sul server: anche il pannello del tecnico)
ApriFlyAula 'http://localhost:8780/flyaula/' ''
if ($ruolo -eq 'server') { Start-Process 'http://localhost:8780/flyaula/tecnico.html' }
