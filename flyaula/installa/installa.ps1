# ==================================================================
#  FLY AULA - installazione con un clic (Windows 10 / 11)
#  1 scarica Fly Aula   2 installa il cervello (Ollama)
#  3 lo collega          4 scarica il modello
#  5 permesso per le foto dal telefono   6 icona sul desktop e avvio
# ==================================================================
$ErrorActionPreference = 'Continue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$SITO = 'https://bikef993-droid.github.io/bikefly'
$DIR  = Join-Path $env:LOCALAPPDATA 'FlyAula'
$wc = New-Object Net.WebClient
$wc.Encoding = [Text.Encoding]::UTF8

function Passo($n, $t) { Write-Host ''; Write-Host "[$n/6] $t" -ForegroundColor Cyan }
function Ok($t) { Write-Host "   OK  $t" -ForegroundColor Green }
function Ko($t) { Write-Host "   !!  $t" -ForegroundColor Yellow }
function Fine($codice) { Write-Host ''; Read-Host 'Premi Invio per chiudere' | Out-Null; exit $codice }

Clear-Host
Write-Host ''
Write-Host '   FLY AULA' -ForegroundColor Cyan
Write-Host '   l assistente della classe che resta su questo computer' -ForegroundColor Gray
Write-Host '   Ci vogliono 10-30 minuti (dipende da internet). Non chiudere questa finestra.' -ForegroundColor Gray

# ---------------- 1 ----------------
Passo 1 'Scarico Fly Aula'
New-Item -ItemType Directory -Force -Path $DIR | Out-Null
try {
  $lista = $wc.DownloadString("$SITO/flyaula/installa/file.txt") -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('#') }
  foreach ($f in $lista) {
    $dest = Join-Path $DIR ('app\' + $f.Replace('/', '\'))
    New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
    $wc.DownloadFile("$SITO/$f", $dest)
  }
  foreach ($s in 'server.ps1', 'avvia.ps1', 'icona.ico') { Copy-Item (Join-Path $DIR "app\flyaula\installa\$s") (Join-Path $DIR $s) -Force }
  $wc.DownloadString("$SITO/flyaula/installa/versione.txt").Trim() | Set-Content (Join-Path $DIR 'versione.txt')
  Ok "$($lista.Count) file in $DIR"
} catch {
  Ko 'Non riesco a scaricare Fly Aula: controlla la connessione a internet e riprova.'
  Fine 1
}

# ---------------- 2 ----------------
Passo 2 'Il cervello di Fly Aula (Ollama)'
$OLL = Join-Path $env:LOCALAPPDATA 'Programs\Ollama'
$exe = Join-Path $OLL 'ollama.exe'
if (-not (Test-Path $exe)) {
  $c = Get-Command ollama -ErrorAction SilentlyContinue
  if ($c) { $exe = $c.Source; $OLL = Split-Path $exe }
}
if (Test-Path $exe) { Ok 'Ollama c e gia' }
else {
  Write-Host '   Installo Ollama (qualche minuto)...'
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    winget install -e --id Ollama.Ollama --silent --accept-package-agreements --accept-source-agreements | Out-Host
  }
  if (-not (Test-Path $exe)) {
    try {
      $setup = Join-Path $env:TEMP 'OllamaSetup.exe'
      $wc.DownloadFile('https://ollama.com/download/OllamaSetup.exe', $setup)
      Start-Process $setup -ArgumentList '/VERYSILENT', '/NORESTART', '/SUPPRESSMSGBOXES' -Wait
    } catch {}
  }
  if (Test-Path $exe) { Ok 'Ollama installato' }
  else { Ko 'Ollama non si e installato. Scaricalo da ollama.com, installalo e rilancia questo programma.'; Fine 1 }
}

# ---------------- 3 ----------------
Passo 3 'Collego il cervello alla lavagna'
[Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', '*', 'User')
$env:OLLAMA_ORIGINS = '*'
Get-Process 'ollama app', 'ollama' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 2
$app = Join-Path $OLL 'ollama app.exe'
if (Test-Path $app) { Start-Process $app } else { Start-Process $exe -ArgumentList 'serve' -WindowStyle Hidden }
$acceso = $false
for ($i = 0; $i -lt 40 -and -not $acceso; $i++) {
  try { Invoke-WebRequest 'http://localhost:11434/api/tags' -UseBasicParsing -TimeoutSec 2 | Out-Null; $acceso = $true } catch { Start-Sleep 1 }
}
if ($acceso) { Ok 'Cervello acceso' } else { Ko 'Il cervello non risponde ancora: riavvia il computer e apri Fly Aula dall icona.' }

# ---------------- 4 ----------------
Passo 4 'Scarico il modello qwen2.5:7b (circa 4,7 GB, una volta sola)'
& $exe pull qwen2.5:7b
if ($LASTEXITCODE -eq 0) { Ok 'Modello pronto' } else { Ko 'Download non riuscito: rilancia l installazione con internet stabile.' }
Write-Host ''
$vis = Read-Host '   Vuoi che Fly Aula legga anche le FOTO delle pagine del libro? Scarica altri 6 GB. (S/N)'
if ($vis -match '^[sSyY]') {
  & $exe pull qwen2.5vl:7b
  if ($LASTEXITCODE -eq 0) { Ok 'Lettore di foto pronto' } else { Ko 'Lettore di foto non scaricato: Fly Aula funziona lo stesso.' }
}

# ---------------- 5 ----------------
Passo 5 'Permesso per le foto dal telefono (Windows chiede di confermare: tocca Si)'
$cmd = "netsh http add urlacl url=http://+:8780/ sddl='D:(A;;GX;;;WD)'; netsh advfirewall firewall delete rule name=FlyAula | Out-Null; netsh advfirewall firewall add rule name=FlyAula dir=in action=allow protocol=TCP localport=8780 profile=private,domain"
$b64 = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($cmd))
try {
  Start-Process powershell -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList '-NoProfile', '-EncodedCommand', $b64
  Ok 'Permesso dato'
} catch { Ko 'Permesso non dato: Fly Aula funziona lo stesso, ma senza foto dal telefono.' }

# ---------------- 6 ----------------
Passo 6 'Icona sul desktop e avvio'
$ws = New-Object -ComObject WScript.Shell
foreach ($dove in @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))) {
  $lnk = $ws.CreateShortcut((Join-Path $dove 'Fly Aula.lnk'))
  $lnk.TargetPath = "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe"
  $lnk.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$DIR\avvia.ps1`""
  $lnk.WorkingDirectory = $DIR
  $lnk.IconLocation = "$DIR\icona.ico"
  $lnk.WindowStyle = 7
  $lnk.Save()
}
Ok 'Icona Fly Aula sul desktop'
Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$DIR\avvia.ps1`""
Write-Host ''
Write-Host '   FATTO! Fly Aula si sta aprendo a tutto schermo.' -ForegroundColor Green
Write-Host '   Le prossime volte basta l icona Fly Aula sul desktop.' -ForegroundColor Green
Fine 0
