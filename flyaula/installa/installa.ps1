# ==================================================================
#  FLY AULA - installazione con un clic (Windows 10 / 11)
#  Tre modi:
#   1 = PC singolo  (questo computer fa tutto: come il Razer)
#   2 = SERVER della scuola (il cervello per tutte le LIM)
#   3 = LIM collegata al server (leggerissima: niente cervello qui)
# ==================================================================
$ErrorActionPreference = 'Continue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$SITO = 'https://bikef993-droid.github.io/bikefly'
$DIR  = Join-Path $env:LOCALAPPDATA 'FlyAula'
$UTF8 = New-Object Text.UTF8Encoding $false
$wc = New-Object Net.WebClient
$wc.Encoding = [Text.Encoding]::UTF8

function Passo($n, $tot, $t) { Write-Host ''; Write-Host "[$n/$tot] $t" -ForegroundColor Cyan }
function Ok($t) { Write-Host "   OK  $t" -ForegroundColor Green }
function Ko($t) { Write-Host "   !!  $t" -ForegroundColor Yellow }
function Fine($codice) { Write-Host ''; Read-Host 'Premi Invio per chiudere' | Out-Null; exit $codice }
function Amministratore($cmd) {
  $b64 = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($cmd))
  try { Start-Process powershell -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList '-NoProfile', '-EncodedCommand', $b64; return $true } catch { return $false }
}
function Collegamento {
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
}

Clear-Host
Write-Host ''
Write-Host '   FLY AULA' -ForegroundColor Cyan
Write-Host '   l assistente della classe che resta a scuola' -ForegroundColor Gray
Write-Host ''
Write-Host '   Che cosa e questo computer?' -ForegroundColor White
Write-Host '     1 = un PC da solo (fa tutto lui, come per una prova)'
Write-Host '     2 = il SERVER della scuola (il cervello per tutte le LIM)'
Write-Host '     3 = una LIM collegata al server della scuola'
$scelta = ''
while ($scelta -notin @('1', '2', '3')) { $scelta = (Read-Host '   Scrivi 1, 2 o 3 e premi Invio').Trim() }
$ruolo = @{ '1' = 'singolo'; '2' = 'server'; '3' = 'lim' }[$scelta]
$TOT = if ($ruolo -eq 'lim') { 3 } else { 6 }

# ---------------- 1: i file ----------------
Passo 1 $TOT 'Scarico Fly Aula'
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

# ================= LIM collegata al server =================
if ($ruolo -eq 'lim') {
  Passo 2 $TOT 'Collego questa LIM al server della scuola'
  $srv = ''; $info = $null
  while (-not $info) {
    $srv = (Read-Host '   Indirizzo del server (lo trovi nel pannello del tecnico, es. 192.168.1.20)').Trim() -replace '^https?://', '' -replace '[:/].*$', ''
    try { $info = Invoke-RestMethod "http://$($srv):8780/fa/scuola" -TimeoutSec 5 } catch { $info = $null }
    if (-not $info -or $info.ruolo -ne 'server') { Ko "Non trovo il server di Fly Aula su $srv. Controlla l indirizzo e che il server sia acceso."; $info = $null }
  }
  Ok "Server trovato$(if ($info.nome) { ': ' + $info.nome })"
  $aula = ''
  while (-not $aula) { $aula = (Read-Host '   Nome di quest aula o classe (es. 1A, 2B, Lab Informatica)').Trim() }
  [IO.File]::WriteAllText((Join-Path $DIR 'config.json'), (@{ ruolo = 'lim'; server = $srv; aula = $aula } | ConvertTo-Json), $UTF8)
  Ok "Questa LIM e l aula $aula"
  Passo 3 $TOT 'Icona sul desktop e avvio'
  Collegamento
  Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$DIR\avvia.ps1`""
  Write-Host ''
  Write-Host '   FATTO! Fly Aula si apre a tutto schermo, collegata al server della scuola.' -ForegroundColor Green
  Fine 0
}

# ================= PC singolo o SERVER =================
Passo 2 $TOT 'Il cervello di Fly Aula (Ollama)'
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

Passo 3 $TOT 'Collego il cervello'
[Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', '*', 'User'); $env:OLLAMA_ORIGINS = '*'
if ($ruolo -eq 'server') {
  # il cervello ascolta tutta la rete della scuola e risponde a piu classi insieme
  $mb = 0
  try { $mb = [int]((& nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>$null | Select-Object -First 1).Trim()) } catch {}
  $par = if ($mb -ge 30000) { 8 } elseif ($mb -ge 20000) { 6 } elseif ($mb -ge 15000) { 4 } elseif ($mb -ge 11000) { 3 } else { 2 }
  foreach ($v in @(@('OLLAMA_HOST', '0.0.0.0:11434'), @('OLLAMA_NUM_PARALLEL', "$par"), @('OLLAMA_KEEP_ALIVE', '24h'))) {
    [Environment]::SetEnvironmentVariable($v[0], $v[1], 'User'); Set-Item -Path "env:$($v[0])" -Value $v[1]
  }
  if ($mb) { Ok "Scheda video con $([Math]::Round($mb / 1024)) GB: $par domande insieme" } else { Ko "Scheda video NVIDIA non trovata: $par domande insieme (sara lento)" }
}
Get-Process 'ollama app', 'ollama' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 2
$app = Join-Path $OLL 'ollama app.exe'
if (Test-Path $app) { Start-Process $app } else { Start-Process $exe -ArgumentList 'serve' -WindowStyle Hidden }
$acceso = $false
for ($i = 0; $i -lt 120 -and -not $acceso; $i++) {
  try { Invoke-WebRequest 'http://localhost:11434/api/tags' -UseBasicParsing -TimeoutSec 2 | Out-Null; $acceso = $true } catch { Start-Sleep 1 }
}
if ($acceso) { Ok 'Cervello acceso' } else { Ko 'Il cervello non risponde ancora: riavvia il computer e apri Fly Aula dall icona.' }

Passo 4 $TOT 'Scarico il modello qwen2.5:7b (circa 4,7 GB, una volta sola)'
# il comando parla col cervello su questo PC (anche se il server ascolta tutta la rete)
$env:OLLAMA_HOST = '127.0.0.1:11434'
& $exe pull qwen2.5:7b
if ($LASTEXITCODE -ne 0) { Start-Sleep 10; & $exe pull qwen2.5:7b }
if ($LASTEXITCODE -eq 0) { Ok 'Modello pronto' } else { Ko 'Download non riuscito: rilancia l installazione con internet stabile.' }
Write-Host ''
$vis = Read-Host '   Vuoi che Fly Aula legga anche le FOTO delle pagine del libro? Scarica altri 6 GB. (S/N)'
if ($vis -match '^[sSyY]') {
  & $exe pull qwen2.5vl:7b
  if ($LASTEXITCODE -eq 0) { Ok 'Lettore di foto pronto' } else { Ko 'Lettore di foto non scaricato: Fly Aula funziona lo stesso.' }
}

Passo 5 $TOT 'Permessi di rete (Windows chiede di confermare: tocca Si)'
$porte = if ($ruolo -eq 'server') { '8780,11434' } else { '8780' }
$cmd = "netsh http add urlacl url=http://+:8780/ sddl='D:(A;;GX;;;WD)'; netsh advfirewall firewall delete rule name=FlyAula | Out-Null; netsh advfirewall firewall add rule name=FlyAula dir=in action=allow protocol=TCP localport=$porte profile=private,domain"
if (Amministratore $cmd) { Ok 'Permesso dato' } else { Ko 'Permesso non dato: senza, le LIM e i telefoni non raggiungono questo computer.' }
$cfg = @{ ruolo = $ruolo; nome = ''; riserva = '' }
if ($ruolo -eq 'server') { $cfg.nome = (Read-Host '   Nome della scuola (es. Romagnosi Piacenza)').Trim() }
[IO.File]::WriteAllText((Join-Path $DIR 'config.json'), ($cfg | ConvertTo-Json), $UTF8)

Passo 6 $TOT 'Icona sul desktop e avvio'
Collegamento
Ok 'Icona Fly Aula sul desktop'
Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$DIR\avvia.ps1`""
Write-Host ''
Write-Host '   FATTO! Fly Aula si sta aprendo a tutto schermo.' -ForegroundColor Green
if ($ruolo -eq 'server') {
  Write-Host '   Pannello del tecnico (orari, LIM, prova di carico): http://localhost:8780/flyaula/tecnico.html' -ForegroundColor Green
  try { $ip = (Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway } | Select-Object -First 1).IPv4Address[0].IPAddress; Write-Host "   Indirizzo da scrivere sulle LIM: $ip" -ForegroundColor Green } catch {}
}
Fine 0
