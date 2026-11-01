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
function Scarica($m) {
  # scarica un cervello; se internet salta, riprova una volta
  & $exe pull $m | Out-Host
  if ($LASTEXITCODE -ne 0) { Start-Sleep 10; & $exe pull $m | Out-Host }
  return ($LASTEXITCODE -eq 0)
}
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

# pezzi grandi presi da internet UNA volta (lettore di testo offline): se ci sono gia si tengono, se manca internet si salta
function PrendiEsterni($wc, $base, $vecchia) {
  try {
    $righe = $wc.DownloadString("$SITO/flyaula/installa/esterni.txt") -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('#') }
    foreach ($r in $righe) {
      $pz = @($r -split '\s+' | Where-Object { $_ })
      if ($pz.Count -lt 2 -or $pz[0] -notmatch '^flyaula/lib/[\w\-/\.]+$' -or $pz[0] -match '\.\.') { continue }
      $rel = $pz[0].Replace('/', '\'); $d = Join-Path $base $rel
      New-Item -ItemType Directory -Force -Path (Split-Path $d) | Out-Null
      $v = $null; if ($vecchia) { $v = Join-Path $vecchia $rel }
      if ($v -and (Test-Path $v) -and (Get-Item $v).Length -gt 0) { Copy-Item $v $d -Force; continue }
      foreach ($u in $pz[1..($pz.Count - 1)]) {
        if ($u -notmatch '^https://') { continue }
        try { $wc.DownloadFile($u, $d); if ((Get-Item $d).Length -gt 0) { break } } catch { Remove-Item $d -Force -ErrorAction SilentlyContinue }
      }
    }
  } catch {}
}
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
  PrendiEsterni $wc (Join-Path $DIR 'app') $null
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
  $codice = ''
  while ($codice -notmatch '^\d{6}$') { $codice = (Read-Host '   Codice delle LIM (6 cifre: lo trovi nel pannello del tecnico)').Trim() }
  [IO.File]::WriteAllText((Join-Path $DIR 'config.json'), (@{ ruolo = 'lim'; server = $srv; aula = $aula; codice = $codice } | ConvertTo-Json), $UTF8)
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

# ---- la scheda video vera: NVIDIA, AMD o Intel (marca, nome, memoria in MB) ----
# La scheda integrata (es. Intel UHD, meno di 3 GB) non conta: con quella le AI vanno sul processore.
function TrovaScheda {
  $best = @{ marca = ''; nome = ''; mb = 0 }
  try {
    foreach ($r in @(& nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits 2>$null)) {
      $p = ([string]$r).Split(','); if ($p.Count -lt 2) { continue }
      $m = 0; [void][int]::TryParse($p[1].Trim(), [ref]$m)
      if ($m -gt $best.mb) { $best = @{ marca = 'nvidia'; nome = $p[0].Trim(); mb = $m } }
    }
  } catch {}
  if ($best.mb -gt 0) { return $best }
  # AMD, Intel Arc e le altre: Windows scrive la memoria vera nel registro (WMI si ferma a 4 GB)
  try {
    $cls = 'HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}'
    foreach ($k in @(Get-ChildItem $cls -ErrorAction SilentlyContinue)) {
      if ($k.PSChildName -notmatch '^\d{4}$') { continue }
      $p = Get-ItemProperty $k.PSPath -ErrorAction SilentlyContinue; if (-not $p) { continue }
      $nome = [string]$p.DriverDesc; if (-not $nome) { continue }
      $byte = [uint64]0
      $q = $p.'HardwareInformation.qwMemorySize'
      if ($q -is [byte[]] -and $q.Length -ge 8) { $byte = [BitConverter]::ToUInt64($q, 0) } elseif ($q) { try { $byte = [uint64]$q } catch {} }
      if (-not $byte) {
        $d = $p.'HardwareInformation.MemorySize'
        if ($d -is [byte[]] -and $d.Length -ge 4) { $byte = [BitConverter]::ToUInt32($d, 0) } elseif ($d) { try { $byte = [uint64]([uint32]$d) } catch {} }
      }
      $m = [int]($byte / 1MB)
      $marca = if ($nome -match 'NVIDIA|GeForce|Quadro|Tesla') { 'nvidia' } elseif ($nome -match 'AMD|Radeon') { 'amd' } elseif ($nome -match 'Intel') { 'intel' } else { 'altro' }
      if ($m -ge 3000 -and $m -gt $best.mb) { $best = @{ marca = $marca; nome = $nome; mb = $m } }
    }
  } catch {}
  return $best
}

# ---- che cervelli mettere e quante classi insieme, CALCOLATO sulla scheda vera ----
# Per ogni cervello: il suo peso + 0,8 GB fissi + per ogni classe insieme 0,4 GB (NVIDIA: memoria compressa)
# o 0,8 GB (AMD, Intel: memoria normale, piu sicura). Si lascia 0,6 GB a Windows e allo schermo.
# Si prova dal piano piu forte al piu leggero: il primo che ci sta vince. Mai piu di 8 classi insieme.
function PianoPer($marca, $mb, $ruolo) {
  $pesi = @{ 'gemma4:12b' = 8.0; 'qwen3.5:9b' = 6.6; 'qwen2.5:7b' = 4.7 }
  $piani = @(@('forte', @('gemma4:12b', 'qwen3.5:9b')), @('coppia', @('gemma4:12b', 'qwen2.5:7b')), @('uno', @('gemma4:12b')), @('leggero', @('qwen2.5:7b')))
  $gb = [double]$mb * 1.048576 / 1000 - 0.6
  $kv = if ($marca -eq 'nvidia') { 0.4 } else { 0.8 }
  $max = if ($ruolo -eq 'server') { if ($mb -ge 30000) { 8 } elseif ($mb -ge 22000) { 6 } else { 3 } } else { 1 }
  if ($mb -gt 0) {
    foreach ($pi in $piani) {
      $fisso = 0.0; foreach ($c in $pi[1]) { $fisso += $pesi[$c] + 0.8 }
      $classi = [Math]::Floor(($gb - $fisso) / ($kv * $pi[1].Count))
      if ($classi -ge 1) { return @{ piano = $pi[0]; cervelli = $pi[1]; classi = [int][Math]::Min($classi, $max) } }
    }
  }
  # niente scheda video (o troppo piccola): il cervello leggero, una domanda alla volta, sul processore
  return @{ piano = 'leggero'; cervelli = @('qwen2.5:7b'); classi = 1 }
}

Passo 3 $TOT 'Collego il cervello'
[Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', '*', 'User'); $env:OLLAMA_ORIGINS = '*'
# la scheda video vera (NVIDIA, AMD o Intel) e il piano calcolato su di lei
$sch = TrovaScheda
$mb = $sch.mb; $marca = $sch.marca
$pp = PianoPer $marca $mb $ruolo
$piano = $pp.piano; $cervelli = $pp.cervelli
# impostazioni del motore per ogni marca (quelle che non vanno bene per questa scheda si tolgono)
$imp = @{ OLLAMA_MAX_LOADED_MODELS = '3'; OLLAMA_FLASH_ATTENTION = $null; OLLAMA_KV_CACHE_TYPE = $null; OLLAMA_VULKAN = $null }
if ($marca -eq 'nvidia') { $imp.OLLAMA_FLASH_ATTENTION = '1'; $imp.OLLAMA_KV_CACHE_TYPE = 'q8_0' }   # memoria compressa: piu posto per le classi
if ($marca -eq 'intel' -or $marca -eq 'altro') { $imp.OLLAMA_VULKAN = '1' }                          # Intel Arc: si prova la via Vulkan (se non va, Fly Aula se ne accorge)
foreach ($k in $imp.Keys) {
  [Environment]::SetEnvironmentVariable($k, $imp[$k], 'User')
  if ($imp[$k]) { Set-Item -Path "env:$k" -Value $imp[$k] } else { Remove-Item -Path "env:$k" -ErrorAction SilentlyContinue }
}
$nomeScheda = if ($mb) { "$($sch.nome) ($([Math]::Round($mb / 1024)) GB)" } else { 'nessuna scheda video adatta' }
if ($ruolo -eq 'server') {
  # il cervello ascolta tutta la rete della scuola e risponde a piu classi insieme
  $par = $pp.classi
  foreach ($v in @(@('OLLAMA_HOST', '0.0.0.0:11434'), @('OLLAMA_NUM_PARALLEL', "$par"), @('OLLAMA_KEEP_ALIVE', '24h'))) {
    [Environment]::SetEnvironmentVariable($v[0], $v[1], 'User'); Set-Item -Path "env:$($v[0])" -Value $v[1]
  }
  if ($mb) { Ok "Scheda video $nomeScheda`: $par classi insieme, cervelli: $($cervelli -join ' + ')" } else { Ko "Scheda video non trovata: una domanda alla volta, sul processore (sara lento)" }
} else {
  # PC singolo: una domanda alla volta (cosi c e piu posto per la coppia)
  [Environment]::SetEnvironmentVariable('OLLAMA_NUM_PARALLEL', '1', 'User'); $env:OLLAMA_NUM_PARALLEL = '1'
  if ($mb) { Ok "Scheda video $nomeScheda`: cervelli $($cervelli -join ' + ')" } else { Ko 'Scheda video non trovata: Fly Aula usera il processore (piu lenta)' }
}
Get-Process 'ollama app', 'ollama' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 2
# il motore parte NASCOSTO (niente finestra di Ollama con le sue "app"); se non va, si prova con l app di Ollama
$acceso = $false
if (Test-Path $exe) {
  Start-Process $exe -ArgumentList 'serve' -WindowStyle Hidden
  for ($i = 0; $i -lt 40 -and -not $acceso; $i++) {
    try { Invoke-WebRequest 'http://127.0.0.1:11434/api/tags' -UseBasicParsing -TimeoutSec 2 | Out-Null; $acceso = $true } catch { Start-Sleep 1 }
  }
}
$app = Join-Path $OLL 'ollama app.exe'
if (-not $acceso -and (Test-Path $app)) {
  Start-Process $app
  for ($i = 0; $i -lt 60 -and -not $acceso; $i++) {
    try { Invoke-WebRequest 'http://127.0.0.1:11434/api/tags' -UseBasicParsing -TimeoutSec 2 | Out-Null; $acceso = $true } catch { Start-Sleep 1 }
  }
}
if ($acceso) { Ok 'Cervello acceso' } else { Ko 'Il cervello non risponde ancora: riavvia il computer e apri Fly Aula dall icona.' }

# il comando parla col cervello su questo PC (anche se il server ascolta tutta la rete)
$env:OLLAMA_HOST = '127.0.0.1:11434'
$pronti = 0
Passo 4 $TOT "Scarico i cervelli: $($cervelli -join ' + ') (una volta sola)"
foreach ($m in $cervelli) {
  if (Scarica $m) { $pronti++; Ok "Cervello pronto: $m" } else { Ko "$m non scaricato" }
}
if ($cervelli.Count -eq 2 -and $pronti -eq 2) { Ok 'Coppia pronta: uno scrive, l altro controlla' }
if ($pronti -eq 0 -and $cervelli -notcontains 'qwen2.5:7b') {
  Ko 'Provo con il cervello di riserva qwen2.5:7b (4,7 GB)'
  if (Scarica 'qwen2.5:7b') { $pronti++; Ok 'Cervello di riserva pronto' }
}
if ($pronti -eq 0) { Ko 'Download non riuscito: rilancia l installazione con internet stabile.' }
# il cervello che VEDE (lavagna, foto del libro, verifiche fotografate):
# da 12 GB in su si scarica SEMPRE; sulle schede piu piccole si chiede (rallenterebbe le risposte in classe)
if ($pronti -gt 0 -and $mb -ge 12288) {
  Write-Host ''; Write-Host '   Scarico il cervello che VEDE per la lavagna e le foto (circa 6 GB)...'
  if (Scarica 'qwen3-vl:8b') { Ok 'Cervello che vede pronto: qwen3-vl:8b' }
  elseif (Scarica 'qwen2.5vl:7b') { Ok 'Cervello che vede pronto: qwen2.5vl:7b' }
  else { Ko 'Cervello che vede non scaricato: la lavagna corregge solo i conti. Rilancia l installazione con internet stabile.' }
}
elseif ($pronti -gt 0 -and $mb -ge 6144) {
  Write-Host ''
  $vis = Read-Host '   La scheda video e piccola. Vuoi lo stesso il cervello che VEDE (parole sulla lavagna, foto)? 3 GB, le risposte possono rallentare. (S/N)'
  if ($vis -match '^[sSyY]') { if (Scarica 'qwen3-vl:4b') { Ok 'Cervello che vede pronto: qwen3-vl:4b' } else { Ko 'Non scaricato: Fly Aula funziona lo stesso.' } }
}

Passo 5 $TOT 'Permessi di rete (Windows chiede di confermare: tocca Si)'
$porte = if ($ruolo -eq 'server') { '8780,11434' } else { '8780' }
$cmd = "netsh http add urlacl url=http://+:8780/ sddl='D:(A;;GX;;;WD)'; netsh advfirewall firewall delete rule name=FlyAula | Out-Null; netsh advfirewall firewall add rule name=FlyAula dir=in action=allow protocol=TCP localport=$porte profile=private,domain"
if (Amministratore $cmd) { Ok 'Permesso dato' } else { Ko 'Permesso non dato: senza, le LIM e i telefoni non raggiungono questo computer.' }
# se Fly Aula era gia installata si tengono le scelte di prima (server di riserva, cervelli scelti con la gara)
$vecchio = $null
try { $vecchio = [IO.File]::ReadAllText((Join-Path $DIR 'config.json'), $UTF8) | ConvertFrom-Json } catch {}
$cfg = @{ ruolo = $ruolo; nome = ''; riserva = '' }
foreach ($k in 'riserva', 'cervello', 'cervello2') { if ($vecchio -and $vecchio.$k) { $cfg[$k] = [string]$vecchio.$k } }
if ($ruolo -eq 'server') {
  $prima = if ($vecchio -and $vecchio.nome) { [string]$vecchio.nome } else { '' }
  $n = (Read-Host "   Nome della scuola (es. Romagnosi Piacenza)$(if ($prima) { ' - Invio per tenere: ' + $prima })").Trim()
  $cfg.nome = if ($n) { $n } else { $prima }
}
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
