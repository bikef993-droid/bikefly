# ==================================================================
#  FLY AULA - la lavagna locale / il server della scuola
#  Ruolo "singolo": serve Fly Aula a questo computer e riceve le foto
#                   delle pagine dal telefono del prof.
#  Ruolo "server":  in piu serve Fly Aula a tutte le LIM della scuola,
#                   tiene l'orario di ogni aula e le foto di ogni aula.
#  Dalla rete NON si possono cambiare impostazioni o orari: solo da qui.
# ==================================================================
$DIR  = Split-Path -Parent $MyInvocation.MyCommand.Path
$ROOT = [IO.Path]::GetFullPath((Join-Path $DIR 'app'))
$PAG  = Join-Path $DIR 'pagine'
$ORARI = Join-Path $DIR 'orari'
$CFGF = Join-Path $DIR 'config.json'
$MEMO = Join-Path $DIR 'memo'
$PROFD = Join-Path $DIR 'prof'
$PROFF = Join-Path $PROFD 'prof.json'
$PORTA = 8780
$UTF8 = New-Object Text.UTF8Encoding $false
Remove-Item $PAG -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $PAG, $ORARI, $MEMO, $PROFD | Out-Null

function LeggiConfig {
  $c = @{ ruolo = 'singolo'; nome = ''; riserva = ''; cervello = ''; cervello2 = ''; codicelim = ''; materie = ''; parole = ''; avvisi = ''; pinavvisi = ''; riposo = '' }
  try {
    $j = [IO.File]::ReadAllText($CFGF, $UTF8) | ConvertFrom-Json
    foreach ($k in 'ruolo', 'nome', 'riserva', 'server', 'aula', 'cervello', 'cervello2', 'codicelim', 'materie', 'parole', 'avvisi', 'pinavvisi', 'riposo') { if ($j.$k) { $c[$k] = [string]$j.$k } }
  } catch {}
  return $c
}
function SalvaConfig($c) { [IO.File]::WriteAllText($CFGF, ($c | ConvertTo-Json), $UTF8) }
$CFG = LeggiConfig
$SERVER = ($CFG.ruolo -eq 'server')
# il codice delle LIM: solo chi lo conosce (le LIM della scuola) puo scrivere nella memoria delle risposte
if (-not $CFG.codicelim) { $CFG.codicelim = -join (1..6 | ForEach-Object { Get-Random -Minimum 0 -Maximum 10 }); SalvaConfig $CFG }
# memoria della scheda video (MB): serve a Fly Aula per sapere se ci stanno DUE cervelli insieme
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
$SCHEDA = TrovaScheda
$VRAM = [int]$SCHEDA.mb

# un codice segreto per ogni aula (serve al telefono per mandare le foto)
$CODICI = @{}
# la fila delle domande: chi sta aspettando il cervello, e da quando (cosi la LIM puo dire "sei il 3o in fila")
$FILA = @{}
# i tempi di risposta di oggi (solo numeri: niente domande, niente nomi)
$TEMPI = @{ giorno = ''; n = 0; somma = 0; max = 0; memoria = 0; lente = 0 }
# ---- i prof: ognuno con il suo PIN (cifrato) e il suo archivio di verifiche ----
# prof.json: { "id": { nome, sale, hash } } - prof\<id>\mie.json - prof\<id>\archivio\<n>.json
$SESSIONI = @{}   # token -> @{ id; visto }  (si chiude da sola dopo 15 minuti senza usarla)
$TENTATIVI = @{}  # "id|ip" -> @{ n; fino }  (5 PIN sbagliati = 5 minuti di blocco)
function Casuale([int]$byte) { $b = New-Object byte[] $byte; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); return (($b | ForEach-Object { $_.ToString('x2') }) -join '') }
function HashPin([string]$pin, [string]$sale) {
  $sb = New-Object byte[] ($sale.Length / 2); for ($i = 0; $i -lt $sb.Length; $i++) { $sb[$i] = [Convert]::ToByte($sale.Substring($i * 2, 2), 16) }
  $k = New-Object Security.Cryptography.Rfc2898DeriveBytes($pin, $sb, 20000)
  return (($k.GetBytes(32) | ForEach-Object { $_.ToString('x2') }) -join '')
}
function LeggiProf { $t = @{}; try { $j = [IO.File]::ReadAllText($PROFF, $UTF8) | ConvertFrom-Json; foreach ($x in $j.PSObject.Properties) { $t[$x.Name] = @{ nome = [string]$x.Value.nome; sale = [string]$x.Value.sale; hash = [string]$x.Value.hash } } } catch {}; return $t }
function SalvaProf($t) { [IO.File]::WriteAllText($PROFF, ($t | ConvertTo-Json -Depth 4 -Compress), $UTF8) }
function CartellaDip { $c = Join-Path $PROFD 'dipartimento'; New-Item -ItemType Directory -Force -Path $c | Out-Null; return $c }
function CartellaArchivio($id) { $c = Join-Path (Join-Path $PROFD $id) 'archivio'; New-Item -ItemType Directory -Force -Path $c | Out-Null; return $c }
function ProfDi($q) {
  $t = [string]$q.Headers['X-FlyAula-Prof']
  if ($t -notmatch '^[0-9a-f]{32}$' -or -not $SESSIONI.ContainsKey($t)) { return $null }
  $s = $SESSIONI[$t]
  if (([DateTime]::UtcNow - $s.visto).TotalMinutes -gt 15) { $SESSIONI.Remove($t); return $null }
  $s.visto = [DateTime]::UtcNow
  return $s.id
}
function PinValido([string]$pin) { return $pin -match '^\d{4,6}$' }
function NomeAula([string]$a) {
  if (-not $a) { return '_' }
  $s = $a -replace '[^\p{L}\p{N}]', '_'
  if ($s.Length -gt 20) { $s = $s.Substring(0, 20) }
  return $s
}
function CodiceDi($aula) {
  if (-not $CODICI.ContainsKey($aula)) { $CODICI[$aula] = -join (1..6 | ForEach-Object { Get-Random -Minimum 0 -Maximum 10 }) }
  return $CODICI[$aula]
}
# ---- avvisi "un alunno sta male" (solo classe e ora, MAI la frase) ed errori di Fly Aula da tutte le LIM ----
$AVVF = Join-Path $DIR 'avvisi.json'
$ERRF = Join-Path $DIR 'errori.jsonl'
$TENTAV = @{ n = 0; fino = [DateTime]::MinValue }
$SFIDAF = Join-Path $DIR 'sfida.json'
# la settimana della sfida tra classi: il lunedi della settimana (uguale in ogni versione di PowerShell)
function Settimana { $o = (Get-Date).Date; return $o.AddDays(-(([int]$o.DayOfWeek + 6) % 7)).ToString('yyyy-MM-dd') }
# un programma esterno con un tempo massimo (nvidia-smi non deve mai bloccare il server)
function Esegui([string]$exe, [string]$argomenti, [int]$ms) {
  try {
    $pi = New-Object Diagnostics.ProcessStartInfo $exe, $argomenti; $pi.RedirectStandardOutput = $true; $pi.UseShellExecute = $false; $pi.CreateNoWindow = $true
    $pr = [Diagnostics.Process]::Start($pi); $out = $pr.StandardOutput.ReadToEndAsync()
    if (-not $pr.WaitForExit($ms)) { try { $pr.Kill() } catch {}; return $null }
    return $out.Result
  } catch { return $null }
}
function LeggiLista($f) { try { $j = [IO.File]::ReadAllText($f, $UTF8) | ConvertFrom-Json; return @($j | ForEach-Object { $_ }) } catch { return @() } }
function SalvaLista($f, $l, [int]$max) { $a = @($l); if ($a.Count -gt $max) { $a = $a[0..($max - 1)] }; [IO.File]::WriteAllText($f, (ConvertTo-Json -InputObject $a -Depth 4 -Compress), $UTF8) }
function Corto($x, [int]$n) { $s = ''; if ($null -ne $x) { $s = [string]$x }; $s = $s -replace '[\x00-\x1f]', ' '; if ($s.Length -gt $n) { $s = $s.Substring(0, $n) }; return $s }
function Adesso { return (Get-Date).ToString('dd\/MM\/yyyy HH:mm') }
function Ms { return [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() }
function SiNo($x) { if ($x) { return 'true' } else { return 'false' } }
# PIN della pagina avvisi: $null = giusto, altrimenti @(stato, risposta). 5 errori = 5 minuti di blocco
function PinAvvisi([string]$pin) {
  $ora = [DateTime]::UtcNow
  if (-not $CFG.pinavvisi) { return @(403, '{"errore":"nopin"}') }
  if ($TENTAV.fino -gt $ora) { return @(429, ('{"errore":"bloccato","secondi":' + [int](($TENTAV.fino - $ora).TotalSeconds + 1) + '}')) }
  if (-not $pin) { return @(403, '{"errore":"pin"}') }
  $pz = $CFG.pinavvisi.Split(':')
  if ((PinValido $pin) -and ((HashPin $pin $pz[0]) -eq $pz[1])) { $TENTAV.n = 0; return $null }
  $TENTAV.n++
  if ($TENTAV.n -ge 5) { $TENTAV.n = 0; $TENTAV.fino = $ora.AddMinutes(5); return @(429, '{"errore":"bloccato","secondi":300}') }
  return @(403, ('{"errore":"pin","resta":' + (5 - $TENTAV.n) + '}'))
}
# le parole d'allarme aggiunte dalla scuola: '' = nessuna, $null = non valide
function ParoleOk($l) {
  $a = @($l)
  if ($a.Count -gt 50) { return $null }
  $out = New-Object Collections.Generic.List[string]
  foreach ($x in $a) {
    $s = (([string]$x) -replace '\s+', ' ').Trim().ToLowerInvariant()
    if ($s.Length -lt 3 -or $s.Length -gt 60 -or $s -match '[<>{}\\\[\]]') { return $null }
    if (-not $out.Contains($s)) { $out.Add($s) }
  }
  if ($out.Count -eq 0) { return '' }
  return (ConvertTo-Json -InputObject $out.ToArray() -Compress)
}
function CartellaPagine($aula) { $p = Join-Path $PAG $aula; New-Item -ItemType Directory -Force -Path $p | Out-Null; return $p }

$ascolta = New-Object Net.HttpListener
$rete = $true
try { $ascolta.Prefixes.Add("http://+:$PORTA/"); $ascolta.Start() }
catch {
  $rete = $false
  $ascolta = New-Object Net.HttpListener
  $ascolta.Prefixes.Add("http://localhost:$PORTA/")
  $ascolta.Start()
}

$TIPI = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8';
  '.json' = 'application/json; charset=utf-8'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.svg' = 'image/svg+xml'; '.ttf' = 'font/ttf';
  '.ico' = 'image/x-icon'; '.txt' = 'text/plain; charset=utf-8' }

function IpLocale {
  try {
    $c = Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } | Select-Object -First 1
    if ($c) { return $c.IPv4Address[0].IPAddress }
  } catch {}
  try { return (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1).IPAddress } catch { return $null }
}
function Manda($ctx, [int]$stato, [string]$tipo, [byte[]]$dati) {
  $r = $ctx.Response
  $r.StatusCode = $stato
  $r.ContentType = $tipo
  $r.Headers.Add('Cache-Control', 'no-store')
  $r.ContentLength64 = $dati.Length
  $r.OutputStream.Write($dati, 0, $dati.Length)
  $r.Close()
}
function Testo($ctx, [int]$stato, [string]$s, [string]$tipo = 'application/json; charset=utf-8') { Manda $ctx $stato $tipo ($UTF8.GetBytes($s)) }
function Corpo($q, [int]$max) {
  if ($q.ContentLength64 -gt $max) { return $null }
  $sr = New-Object IO.StreamReader($q.InputStream, $UTF8)
  return $sr.ReadToEnd()
}

while ($ascolta.IsListening) {
  try { $ctx = $ascolta.GetContext() } catch { break }
  try {
    $q = $ctx.Request
    $locale = [Net.IPAddress]::IsLoopback($q.RemoteEndPoint.Address)
    $p = $q.Url.AbsolutePath
    $aula = NomeAula $q.QueryString['aula']
    # dalla rete: solo se questo PC e il server della scuola
    $daRete = $locale -or $SERVER

    if ($p -eq '/fa/scuola' -and $daRete) {
      $par = [Environment]::GetEnvironmentVariable('OLLAMA_NUM_PARALLEL', 'User')
      Testo $ctx 200 (@{ ruolo = $(if ($SERVER) { 'server' } else { 'singolo' }); nome = $CFG.nome; riserva = $CFG.riserva; cervello = $CFG.cervello; cervello2 = $CFG.cervello2; materie = $CFG.materie; parole = $CFG.parole; avvisi = $CFG.avvisi; riposo = $CFG.riposo; vram = $VRAM; marca = $SCHEDA.marca; scheda = $SCHEDA.nome; parallelo = $par; ip = (IpLocale) } | ConvertTo-Json -Compress)
    }
    elseif ($p -eq '/fa/config' -and $locale) {
      if ($q.HttpMethod -eq 'POST') {
        $b = Corpo $q 20000
        try {
          $j = $b | ConvertFrom-Json
          if ($null -ne $j.nome) { $CFG.nome = ([string]$j.nome).Substring(0, [Math]::Min(60, ([string]$j.nome).Length)) }
          if ($null -ne $j.riserva) { $CFG.riserva = ([string]$j.riserva) -replace '[^\w\.\-:/]', '' }
          if ($null -ne $j.cervello) { $CFG.cervello = (([string]$j.cervello) -replace '[^\w\.\-:]', '') }
          if ($null -ne $j.cervello2) { $CFG.cervello2 = (([string]$j.cervello2) -replace '[^\w\.\-:]', '') }
          if ($null -ne $j.materie) { $m = [string]$j.materie; if ($m.Length -le 3000 -and $m -match '^[\w\.\-:{}",]*$') { $CFG.materie = $m } }
          if ($null -ne $j.riposo) { $r = [string]$j.riposo; if ($r -eq '' -or ($r -match '^\d{1,3}$' -and [int]$r -ge 10 -and [int]$r -le 480)) { $CFG.riposo = $r } }
          $parOk = $true
          if ($null -ne $j.parole) { $pl = ParoleOk $j.parole; if ($null -eq $pl) { $parOk = $false } else { $CFG.parole = $pl } }
          if ($parOk) { SalvaConfig $CFG; Testo $ctx 200 '{"ok":true}' } else { Testo $ctx 400 '{"errore":"parole"}' }
        } catch { Testo $ctx 400 '{"errore":"json"}' }
      } else { $c2 = $CFG.Clone(); $c2.Remove('pinavvisi'); Testo $ctx 200 ($c2 | ConvertTo-Json -Compress) }
    }
    elseif ($p -eq '/fa/avviso' -and $daRete -and $q.HttpMethod -eq 'POST') {
      # una LIM ha visto una frase di disagio: arriva solo classe, aula e ora (se la scuola ha acceso gli avvisi)
      if (-not ($locale -or ([string]$q.Headers['X-FlyAula-Codice'] -eq $CFG.codicelim))) { Testo $ctx 403 '{"errore":"codice"}' }
      elseif ($CFG.avvisi -ne '1' -or -not $CFG.pinavvisi) { Testo $ctx 200 '{"ok":false,"spenti":true}' }
      else {
        $b = Corpo $q 2000
        if ($null -eq $b) { Testo $ctx 413 '{}' }
        else {
          if (-not $b) { $b = '{}' }
          $j = $null; try { $j = $b | ConvertFrom-Json } catch {}
          if ($j -isnot [Management.Automation.PSCustomObject]) { Testo $ctx 400 '{"errore":"json"}' }
          else {
            $l = @(LeggiLista $AVVF); $ora = Ms; $nome = Corto $q.QueryString['aula'] 20; $classe = Corto $j.classe 20
            if ($l.Count -and $l[0].aula -eq $nome -and $l[0].classe -eq $classe -and -not $l[0].visto -and ($ora - [long]$l[0].t) -lt 600000) { $l[0].volte = [int]$l[0].volte + 1; $l[0].t = $ora; $l[0].quando = Adesso }
            else { $l = @([pscustomobject]@{ id = (Casuale 4); t = $ora; quando = (Adesso); aula = $nome; classe = $classe; materia = (Corto $j.materia 30); volte = 1; visto = $false }) + $l }
            SalvaLista $AVVF $l 300
            Testo $ctx 200 '{"ok":true}'
          }
        }
      }
    }
    elseif ($p -eq '/fa/sfida' -and $daRete) {
      # la sfida tra classi: punti della settimana per classe (niente nomi di alunni)
      $sett = Settimana; $d = $null
      try { $d = [IO.File]::ReadAllText($SFIDAF, $UTF8) | ConvertFrom-Json } catch {}
      $punti = @{}; if ($d -and [string]$d.settimana -eq $sett -and $d.classi) { foreach ($x in $d.classi.PSObject.Properties) { $punti[$x.Name] = [int]$x.Value } }
      if ($q.HttpMethod -eq 'POST') {
        if (-not ($locale -or ([string]$q.Headers['X-FlyAula-Codice'] -eq $CFG.codicelim))) { Testo $ctx 403 '{"errore":"codice"}' }
        else {
          $j = $null; try { $j = (Corpo $q 1000) | ConvertFrom-Json } catch {}
          $cl = ''; $n = 0; if ($j -is [Management.Automation.PSCustomObject]) { $cl = (Corto $j.classe 12).Trim(); try { $n = [int]$j.punti } catch { $n = 0 } }
          if (([string]$j.classe).Trim().Length -gt 12 -or $cl -notmatch '^[\p{L}\p{N}\s\-]{1,12}$' -or $n -lt 1 -or $n -gt 20 -or (-not $punti.ContainsKey($cl) -and $punti.Count -ge 200)) { Testo $ctx 400 '{"errore":"dati"}' }
          else { $punti[$cl] = [int]$punti[$cl] + $n; [IO.File]::WriteAllText($SFIDAF, (@{ settimana = $sett; classi = $punti } | ConvertTo-Json -Compress), $UTF8); Testo $ctx 200 '{"ok":true}' }
        }
      } else {
        $l = @($punti.GetEnumerator() | Sort-Object -Property @{ Expression = { $_.Value }; Descending = $true }, @{ Expression = { $_.Key }; Descending = $false } | ForEach-Object { @{ classe = $_.Key; punti = $_.Value } })
        Testo $ctx 200 (@{ settimana = $sett; classifica = $l } | ConvertTo-Json -Depth 4 -Compress)
      }
    }
    elseif ($p -eq '/fa/salute' -and $locale) {
      # salute del server: scheda video, disco, dati
      $gpu = $null
      if ($SCHEDA.marca -eq 'nvidia') {
        $o = Esegui 'nvidia-smi' '--query-gpu=temperature.gpu,utilization.gpu,power.draw,memory.used,memory.total --format=csv,noheader,nounits' 4000
        if ($o) { $v = ($o -split "`n")[0] -split ','; if ($v.Count -ge 5) { $num = { param($x) $y = 0.0; if ([double]::TryParse(($x.Trim()), [Globalization.NumberStyles]::Float, [Globalization.CultureInfo]::InvariantCulture, [ref]$y)) { $y } else { $null } }; $gpu = @{ temp = (& $num $v[0]); uso = (& $num $v[1]); watt = (& $num $v[2]); mem = (& $num $v[3]); memTot = (& $num $v[4]) } } }
      }
      $disco = $null; try { $dr = New-Object IO.DriveInfo ([IO.Path]::GetPathRoot($DIR)); $disco = @{ libero = [long]$dr.AvailableFreeSpace; totale = [long]$dr.TotalSize } } catch {}
      $nArch = 0; try { $nArch = @(Get-ChildItem $PROFD -Recurse -Filter '*.json' -File).Count } catch {}
      $nErr = 0; try { if (Test-Path $ERRF) { $nErr = @([IO.File]::ReadAllLines($ERRF, $UTF8) | Where-Object { $_.Trim() }).Count } } catch {}
      Testo $ctx 200 (@{ gpu = $gpu; scheda = $SCHEDA.nome; disco = $disco; memo = @(Get-ChildItem $MEMO -File).Count; archivio = $nArch; errori = $nErr } | ConvertTo-Json -Depth 4 -Compress)
    }
    elseif ($p -eq '/fa/avvisi-nuovi' -and $locale) {
      $n = @(LeggiLista $AVVF | Where-Object { -not $_.visto }).Count
      Testo $ctx 200 ('{"nuovi":' + $n + ',"attivi":' + (SiNo ($CFG.avvisi -eq '1')) + ',"pin":' + (SiNo $CFG.pinavvisi) + '}')
    }
    elseif ($p -eq '/fa/avvisi' -and $locale) {
      $e = PinAvvisi ([string]$q.Headers['X-FlyAula-Pin'])
      if ($e) { Testo $ctx $e[0] $e[1] }
      else {
        $l = @(LeggiLista $AVVF); $ok = $true
        if ($q.HttpMethod -eq 'POST') {
          $j = $null; try { $j = (Corpo $q 2000) | ConvertFrom-Json } catch {}
          $a = ''; $idv = ''; if ($null -ne $j) { $a = [string]$j.azione; $idv = [string]$j.id }
          if ($a -eq 'visto') { foreach ($x in $l) { if ($x.id -eq $idv) { $x.visto = $true } } }
          elseif ($a -eq 'tutti') { foreach ($x in $l) { $x.visto = $true } }
          elseif ($a -eq 'svuota') { $l = @() }
          else { $ok = $false }
          if ($ok) { SalvaLista $AVVF $l 300 }
        }
        if ($ok) { Testo $ctx 200 (ConvertTo-Json -InputObject @($l) -Depth 4 -Compress) } else { Testo $ctx 400 '{"errore":"azione"}' }
      }
    }
    elseif ($p -eq '/fa/avvisi-imposta' -and $locale -and $q.HttpMethod -eq 'POST') {
      $j = $null; try { $j = (Corpo $q 2000) | ConvertFrom-Json } catch {}
      if ($j -isnot [Management.Automation.PSCustomObject]) { $j = [pscustomobject]@{ vuoto = 1 } }
      $e = $null; if ($CFG.pinavvisi) { $e = PinAvvisi ([string]$j.vecchio) }
      if ($e) { Testo $ctx $e[0] $e[1] }
      elseif ($null -ne $j.nuovo -and -not (PinValido ([string]$j.nuovo))) { Testo $ctx 400 '{"errore":"pin"}' }
      elseif ($j.attivi -eq $true -and -not $CFG.pinavvisi -and $null -eq $j.nuovo) { Testo $ctx 400 '{"errore":"nopin"}' }
      else {
        if ($null -ne $j.nuovo) { $sale = Casuale 16; $CFG.pinavvisi = $sale + ':' + (HashPin ([string]$j.nuovo) $sale) }
        if ($null -ne $j.attivi) { if ($j.attivi -eq $true) { $CFG.avvisi = '1' } else { $CFG.avvisi = '' } }
        SalvaConfig $CFG
        Testo $ctx 200 ('{"ok":true,"attivi":' + (SiNo ($CFG.avvisi -eq '1')) + ',"pin":' + (SiNo $CFG.pinavvisi) + '}')
      }
    }
    elseif ($p -eq '/fa/errore' -and $daRete -and $q.HttpMethod -eq 'POST') {
      # gli errori che Fly Aula ha fatto (e corretto) o che un prof ha segnalato, da tutte le LIM
      if (-not ($locale -or ([string]$q.Headers['X-FlyAula-Codice'] -eq $CFG.codicelim))) { Testo $ctx 403 '{"errore":"codice"}' }
      else {
        $b = Corpo $q 4000
        if ($null -eq $b) { Testo $ctx 413 '{}' }
        else {
          if (-not $b) { $b = '{}' }
          $j = $null; try { $j = $b | ConvertFrom-Json } catch {}
          if ($j -isnot [Management.Automation.PSCustomObject]) { Testo $ctx 400 '{"errore":"json"}' }
          else {
            $er = [ordered]@{}
            foreach ($k in @(@('quando', 40), @('classe', 20), @('livello', 20), @('materia', 30), @('modello', 40), @('tipo', 60), @('domanda', 200), @('dettaglio', 400))) { $er[$k[0]] = Corto $j.($k[0]) $k[1] }
            $er.aula = Corto $q.QueryString['aula'] 20; $er.t = Ms
            # una riga per errore (veloce anche con tante LIM); oltre 800 KB si tengono gli ultimi 1000
            [IO.File]::AppendAllText($ERRF, (ConvertTo-Json -InputObject $er -Compress) + "`n", $UTF8)
            if ((Get-Item $ERRF).Length -gt 800000) { $r = @([IO.File]::ReadAllLines($ERRF, $UTF8) | Where-Object { $_.Trim() }); if ($r.Count -gt 1000) { $r = $r[($r.Count - 1000)..($r.Count - 1)] }; [IO.File]::WriteAllText($ERRF, (($r -join "`n") + "`n"), $UTF8) }
            Testo $ctx 200 '{"ok":true}'
          }
        }
      }
    }
    elseif ($p -eq '/fa/errori' -and $locale) {
      if ($q.HttpMethod -eq 'DELETE') { [IO.File]::WriteAllText($ERRF, '', $UTF8); Testo $ctx 200 '{"ok":true}' }
      else {
        $r = @(); if (Test-Path $ERRF) { $r = @([IO.File]::ReadAllLines($ERRF, $UTF8) | Where-Object { $_.Trim() }) }
        [array]::Reverse($r)
        Testo $ctx 200 ('[' + ($r -join ',') + ']')
      }
    }
    elseif ($p -eq '/fa/orari' -and $locale) {
      $nomi = @(Get-ChildItem $ORARI -Filter '*.json' | ForEach-Object { $_.BaseName })
      Testo $ctx 200 (ConvertTo-Json -InputObject $nomi -Compress)
    }
    elseif ($p -eq '/fa/orario' -and $daRete) {
      $f = Join-Path $ORARI "$aula.json"
      if ($q.HttpMethod -eq 'POST' -and $locale) {
        $b = Corpo $q 200000
        try { $null = $b | ConvertFrom-Json; [IO.File]::WriteAllText($f, $b, $UTF8); Testo $ctx 200 '{"ok":true}' } catch { Testo $ctx 400 '{"errore":"json"}' }
      }
      elseif ($q.HttpMethod -eq 'DELETE' -and $locale) { Remove-Item $f -Force -ErrorAction SilentlyContinue; Testo $ctx 200 '{"ok":true}' }
      elseif (Test-Path $f) { Manda $ctx 200 'application/json; charset=utf-8' ([IO.File]::ReadAllBytes($f)) }
      else { Testo $ctx 404 '{}' }
    }
    elseif ($p -eq '/fa/memo' -and $daRete) {
      # la memoria delle risposte gia controllate: la stessa domanda in un altra aula arriva subito
      $k = [string]$q.QueryString['k']
      $codiceOk = $locale -or ([string]$q.Headers['X-FlyAula-Codice'] -eq $CFG.codicelim)
      if ($q.HttpMethod -eq 'DELETE' -and $locale -and -not $k) { Get-ChildItem $MEMO -File | Remove-Item -Force; Testo $ctx 200 '{"ok":true}' }
      elseif ($k -notmatch '^[0-9a-f]{16,64}$') { Testo $ctx 400 '{"errore":"chiave"}' }
      else {
        $f = Join-Path $MEMO "$k.json"
        if ($q.HttpMethod -eq 'DELETE') {
          # un prof ha segnalato un errore: quella risposta non si ripropone piu
          if ($codiceOk) { Remove-Item $f -Force -ErrorAction SilentlyContinue; Testo $ctx 200 '{"ok":true}' } else { Testo $ctx 403 '{"errore":"codice"}' }
        }
        elseif ($q.HttpMethod -eq 'POST') {
          if (-not $codiceOk) { Testo $ctx 403 '{"errore":"codice"}' }
          elseif ((Test-Path $f) -or @(Get-ChildItem $MEMO -File).Count -ge 5000) { Testo $ctx 200 '{"ok":false}' }
          else {
            $b = Corpo $q 30000
            if ($null -eq $b) { Testo $ctx 413 '{"errore":"troppo"}' }
            else { try { $null = $b | ConvertFrom-Json; [IO.File]::WriteAllText($f, $b, $UTF8); Testo $ctx 200 '{"ok":true}' } catch { Testo $ctx 400 '{"errore":"json"}' } }
          }
        }
        elseif ((Test-Path $f) -and ((Get-Date) - (Get-Item $f).LastWriteTime).TotalDays -lt 30) { Manda $ctx 200 'application/json; charset=utf-8' ([IO.File]::ReadAllBytes($f)) }
        else { Testo $ctx 404 '{}' }
      }
    }
    elseif ($p -eq '/fa/fila' -and $daRete) {
      $id = [string]$q.QueryString['id']
      $adesso = [DateTime]::UtcNow
      foreach ($x in @($FILA.Keys)) { if (($adesso - $FILA[$x].visto).TotalSeconds -gt 30 -or ($adesso - $FILA[$x].arrivo).TotalMinutes -gt 5) { $FILA.Remove($x) } }
      if ($id -notmatch '^[a-z0-9]{6,20}$') { Testo $ctx 400 '{"errore":"id"}' }
      elseif ($q.QueryString['azione'] -eq 'esci') { $FILA.Remove($id); Testo $ctx 200 '{"ok":true}' }
      else {
        if ($FILA.ContainsKey($id)) { $FILA[$id].visto = $adesso } elseif ($FILA.Count -lt 500) { $FILA[$id] = @{ arrivo = $adesso; visto = $adesso } }
        $mio = if ($FILA.ContainsKey($id)) { $FILA[$id].arrivo } else { $adesso }
        $davanti = @($FILA.Values | Where-Object { $_.arrivo -lt $mio }).Count
        $posti = [Environment]::GetEnvironmentVariable('OLLAMA_NUM_PARALLEL', 'User'); if (-not $posti) { $posti = 1 }
        Testo $ctx 200 ('{"davanti":' + $davanti + ',"posti":' + [int]$posti + '}')
      }
    }
    elseif ($p -eq '/fa/tempo' -and $daRete) {
      $oggi = (Get-Date).ToString('yyyy-MM-dd')
      if ($TEMPI.giorno -ne $oggi) { $TEMPI.giorno = $oggi; $TEMPI.n = 0; $TEMPI.somma = 0; $TEMPI.max = 0; $TEMPI.memoria = 0; $TEMPI.lente = 0 }
      $ms = 0
      if ([int]::TryParse([string]$q.QueryString['ms'], [ref]$ms) -and $ms -ge 0 -and $ms -le 600000) {
        $TEMPI.n++; $TEMPI.somma += $ms; if ($ms -gt $TEMPI.max) { $TEMPI.max = $ms }
        if ($q.QueryString['m'] -eq '1') { $TEMPI.memoria++ }
        if ($ms -gt 60000) { $TEMPI.lente++ }
      }
      Testo $ctx 200 '{"ok":true}'
    }
    elseif ($p -eq '/fa/tempi' -and $locale) {
      $oggi = (Get-Date).ToString('yyyy-MM-dd')
      if ($TEMPI.giorno -ne $oggi) { Testo $ctx 200 '{"n":0,"media":0,"max":0,"memoria":0,"lente":0}' }
      else { Testo $ctx 200 (@{ n = $TEMPI.n; media = $(if ($TEMPI.n) { [Math]::Round($TEMPI.somma / $TEMPI.n) } else { 0 }); max = $TEMPI.max; memoria = $TEMPI.memoria; lente = $TEMPI.lente } | ConvertTo-Json -Compress) }
    }
    elseif ($p -eq '/fa/prof/nomi' -and $daRete) {
      $t = LeggiProf
      $l = @($t.Keys | ForEach-Object { @{ id = $_; nome = $t[$_].nome } } | Sort-Object { $_.nome })
      Testo $ctx 200 (ConvertTo-Json -InputObject $l -Compress)
    }
    elseif ($p -eq '/fa/prof/entra' -and $daRete -and $q.HttpMethod -eq 'POST') {
      $j = $null; try { $j = (Corpo $q 2000) | ConvertFrom-Json } catch {}
      $t = LeggiProf; $id = [string]$j.id; $pin = [string]$j.pin
      $chi = "$id|$($q.RemoteEndPoint.Address)"; $ora = [DateTime]::UtcNow
      if ($TENTATIVI.ContainsKey($chi) -and $TENTATIVI[$chi].fino -gt $ora) { Testo $ctx 429 ('{"errore":"bloccato","secondi":' + [int]($TENTATIVI[$chi].fino - $ora).TotalSeconds + '}') }
      elseif ($id -notmatch '^[0-9a-f]{8}$' -or -not $t.ContainsKey($id) -or -not (PinValido $pin)) { Testo $ctx 400 '{"errore":"dati"}' }
      elseif ((HashPin $pin $t[$id].sale) -eq $t[$id].hash) {
        $TENTATIVI.Remove($chi)
        foreach ($x in @($SESSIONI.Keys)) { if (($ora - $SESSIONI[$x].visto).TotalMinutes -gt 15) { $SESSIONI.Remove($x) } }
        $tok = Casuale 16; $SESSIONI[$tok] = @{ id = $id; visto = $ora }
        Testo $ctx 200 (@{ token = $tok; id = $id; nome = $t[$id].nome } | ConvertTo-Json -Compress)
      } else {
        # 5 PIN sbagliati di fila: quel prof, da quel computer, si blocca per 5 minuti
        if (-not $TENTATIVI.ContainsKey($chi) -or $TENTATIVI[$chi].n -ge 5) { $TENTATIVI[$chi] = @{ n = 0; fino = $ora } }
        $TENTATIVI[$chi].n++
        if ($TENTATIVI[$chi].n -ge 5) { $TENTATIVI[$chi].fino = $ora.AddMinutes(5); Testo $ctx 429 '{"errore":"bloccato","secondi":300}' }
        else { Testo $ctx 403 ('{"errore":"pin","resta":' + (5 - $TENTATIVI[$chi].n) + '}') }
      }
    }
    elseif ($p -eq '/fa/prof/esci' -and $daRete) { $SESSIONI.Remove([string]$q.Headers['X-FlyAula-Prof']); Testo $ctx 200 '{"ok":true}' }
    elseif ($daRete -and @('/fa/prof/mie', '/fa/prof/cambiapin', '/fa/prof/archivio', '/fa/prof/foglio', '/fa/prof/condividi', '/fa/dip') -contains $p) {
      $id = ProfDi $q
      if (-not $id) { Testo $ctx 401 '{"errore":"entra"}' }
      elseif ($p -eq '/fa/prof/mie') {
        $f = Join-Path (Join-Path $PROFD $id) 'mie.json'
        if ($q.HttpMethod -eq 'POST') { $b = Corpo $q 5000; try { $null = $b | ConvertFrom-Json; New-Item -ItemType Directory -Force -Path (Split-Path $f) | Out-Null; [IO.File]::WriteAllText($f, $b, $UTF8); Testo $ctx 200 '{"ok":true}' } catch { Testo $ctx 400 '{"errore":"json"}' } }
        elseif (Test-Path $f) { Manda $ctx 200 'application/json; charset=utf-8' ([IO.File]::ReadAllBytes($f)) } else { Testo $ctx 200 '{}' }
      }
      elseif ($p -eq '/fa/prof/cambiapin') {
        $j = $null; try { $j = (Corpo $q 2000) | ConvertFrom-Json } catch {}
        $t = LeggiProf
        if ($q.HttpMethod -ne 'POST' -or -not (PinValido ([string]$j.nuovo)) -or -not (PinValido ([string]$j.vecchio)) -or (HashPin ([string]$j.vecchio) $t[$id].sale) -ne $t[$id].hash) { Testo $ctx 403 '{"errore":"pin"}' }
        else { $sale = Casuale 16; $t[$id].sale = $sale; $t[$id].hash = HashPin ([string]$j.nuovo) $sale; SalvaProf $t; Testo $ctx 200 '{"ok":true}' }
      }
      elseif ($p -eq '/fa/prof/condividi') {
        # una COPIA di un foglio del proprio archivio va nell archivio di dipartimento (la vedono gli altri prof, con il nome di chi l ha fatta)
        $n = [string]$q.QueryString['id']; $src = Join-Path (CartellaArchivio $id) "$n.json"
        if ($q.HttpMethod -ne 'POST' -or $n -notmatch '^[0-9a-f]{12}$' -or -not (Test-Path $src)) { Testo $ctx 404 '{}' }
        else {
          $dip = CartellaDip; $chiave = $id + $n; $dst = Join-Path $dip "$chiave.json"
          if (-not (Test-Path $dst) -and @(Get-ChildItem $dip -File).Count -ge 1000) { Testo $ctx 507 '{"errore":"pieno"}' }
          else {
            try {
              $j = [IO.File]::ReadAllText($src, $UTF8) | ConvertFrom-Json
              $j | Add-Member -NotePropertyName autore -NotePropertyValue ([string](LeggiProf)[$id].nome) -Force
              $j | Add-Member -NotePropertyName autoreId -NotePropertyValue $id -Force
              $j | Add-Member -NotePropertyName condiviso -NotePropertyValue ([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) -Force
              [IO.File]::WriteAllText($dst, ($j | ConvertTo-Json -Depth 30 -Compress), $UTF8)
              Testo $ctx 200 ('{"ok":true,"id":"' + $chiave + '"}')
            } catch { Testo $ctx 400 '{"errore":"json"}' }
          }
        }
      }
      elseif ($p -eq '/fa/dip') {
        # l archivio di dipartimento: lo vedono tutti i prof entrati con il loro PIN; cancella solo chi l ha condiviso
        $dip = CartellaDip; $n = [string]$q.QueryString['id']
        if ($n -and $n -notmatch '^[0-9a-f]{20}$') { Testo $ctx 400 '{"errore":"id"}' }
        elseif (-not $n) {
          $l = @(Get-ChildItem $dip -Filter '*.json' | Sort-Object LastWriteTime -Descending | ForEach-Object {
            try { $j = [IO.File]::ReadAllText($_.FullName, $UTF8) | ConvertFrom-Json; @{ id = $_.BaseName; tipo = [string]$j.tipo; titolo = [string]$j.titolo; materia = [string]$j.materia; classe = [string]$j.classe; autore = [string]$j.autore; mio = ([string]$j.autoreId -eq $id); data = [long]$j.condiviso } } catch {}
          })
          Testo $ctx 200 (ConvertTo-Json -InputObject $l -Compress)
        }
        elseif ($q.HttpMethod -eq 'DELETE') {
          if ($n.StartsWith($id)) { Remove-Item (Join-Path $dip "$n.json") -Force -ErrorAction SilentlyContinue; Testo $ctx 200 '{"ok":true}' } else { Testo $ctx 403 '{"errore":"non tuo"}' }
        }
        elseif (Test-Path (Join-Path $dip "$n.json")) { Manda $ctx 200 'application/json; charset=utf-8' ([IO.File]::ReadAllBytes((Join-Path $dip "$n.json"))) }
        else { Testo $ctx 404 '{}' }
      }
      elseif ($p -eq '/fa/prof/archivio') {
        # l elenco: solo i dati per riconoscerle (titolo, classe, materia, aula, data)
        $l = @(Get-ChildItem (CartellaArchivio $id) -Filter '*.json' | Sort-Object LastWriteTime -Descending | ForEach-Object {
          try { $j = [IO.File]::ReadAllText($_.FullName, $UTF8) | ConvertFrom-Json; @{ id = $_.BaseName; tipo = [string]$j.tipo; titolo = [string]$j.titolo; materia = [string]$j.materia; classe = [string]$j.classe; aula = [string]$j.aula; data = [string]$j.data } } catch {}
        })
        Testo $ctx 200 (ConvertTo-Json -InputObject $l -Compress)
      }
      else {
        # un foglio dell archivio: leggere, salvare (nuovo o sopra uno vecchio), togliere
        $cart = CartellaArchivio $id; $n = [string]$q.QueryString['id']
        if ($n -and $n -notmatch '^[0-9a-f]{12}$') { Testo $ctx 400 '{"errore":"id"}' }
        elseif ($q.HttpMethod -eq 'POST') {
          $b = Corpo $q 400000
          if ($null -eq $b) { Testo $ctx 413 '{"errore":"troppo"}' }
          elseif (-not $n -and @(Get-ChildItem $cart -File).Count -ge 300) { Testo $ctx 507 '{"errore":"pieno"}' }
          elseif ($n -and -not (Test-Path (Join-Path $cart "$n.json"))) { Testo $ctx 404 '{}' }
          else {
            try { $j = $b | ConvertFrom-Json; if (-not $j.titolo) { throw 'vuoto' }; if (-not $n) { $n = Casuale 6 }; [IO.File]::WriteAllText((Join-Path $cart "$n.json"), $b, $UTF8); Testo $ctx 200 ('{"ok":true,"id":"' + $n + '"}') }
            catch { Testo $ctx 400 '{"errore":"json"}' }
          }
        }
        elseif (-not $n) { Testo $ctx 400 '{"errore":"id"}' }
        elseif ($q.HttpMethod -eq 'DELETE') { Remove-Item (Join-Path $cart "$n.json") -Force -ErrorAction SilentlyContinue; Testo $ctx 200 '{"ok":true}' }
        elseif (Test-Path (Join-Path $cart "$n.json")) { Manda $ctx 200 'application/json; charset=utf-8' ([IO.File]::ReadAllBytes((Join-Path $cart "$n.json"))) }
        else { Testo $ctx 404 '{}' }
      }
    }
    elseif ($p -eq '/fa/prof/elenco' -and $locale) {
      # solo dal pannello del tecnico: i prof, con quante cose hanno nell archivio
      $t = LeggiProf
      $l = @($t.Keys | ForEach-Object { @{ id = $_; nome = $t[$_].nome; archivio = @(Get-ChildItem (Join-Path (Join-Path $PROFD $_) 'archivio') -File -ErrorAction SilentlyContinue).Count } } | Sort-Object { $_.nome })
      Testo $ctx 200 (ConvertTo-Json -InputObject $l -Compress)
    }
    elseif (($p -eq '/fa/prof/nuovo' -or $p -eq '/fa/prof/pin') -and $locale -and $q.HttpMethod -eq 'POST') {
      $j = $null; try { $j = (Corpo $q 2000) | ConvertFrom-Json } catch {}
      $t = LeggiProf; $nome = ([string]$j.nome).Trim(); $pin = [string]$j.pin
      if (-not (PinValido $pin)) { Testo $ctx 400 '{"errore":"pin"}' }
      elseif ($p -eq '/fa/prof/nuovo') {
        if (-not $nome -or $nome.Length -gt 40) { Testo $ctx 400 '{"errore":"nome"}' }
        elseif (@($t.Values | Where-Object { $_.nome -eq $nome }).Count) { Testo $ctx 409 '{"errore":"doppio"}' }
        elseif ($t.Count -ge 300) { Testo $ctx 507 '{"errore":"pieno"}' }
        else { $id = Casuale 4; $sale = Casuale 16; $t[$id] = @{ nome = $nome; sale = $sale; hash = (HashPin $pin $sale) }; SalvaProf $t; Testo $ctx 200 ('{"ok":true,"id":"' + $id + '"}') }
      }
      else {
        $id = [string]$j.id
        if (-not $t.ContainsKey($id)) { Testo $ctx 404 '{}' }
        else {
          $sale = Casuale 16; $t[$id].sale = $sale; $t[$id].hash = HashPin $pin $sale; SalvaProf $t
          foreach ($x in @($SESSIONI.Keys)) { if ($SESSIONI[$x].id -eq $id) { $SESSIONI.Remove($x) } }
          foreach ($x in @($TENTATIVI.Keys)) { if ($x.StartsWith("$id|")) { $TENTATIVI.Remove($x) } }
          Testo $ctx 200 '{"ok":true}'
        }
      }
    }
    elseif ($p -eq '/fa/prof' -and $locale -and $q.HttpMethod -eq 'DELETE') {
      $id = [string]$q.QueryString['id']; $t = LeggiProf
      if ($id -match '^[0-9a-f]{8}$' -and $t.ContainsKey($id)) {
        $t.Remove($id); SalvaProf $t; Remove-Item (Join-Path $PROFD $id) -Recurse -Force -ErrorAction SilentlyContinue
        foreach ($x in @($SESSIONI.Keys)) { if ($SESSIONI[$x].id -eq $id) { $SESSIONI.Remove($x) } }
        Testo $ctx 200 '{"ok":true}'
      } else { Testo $ctx 404 '{}' }
    }
    elseif ($p -eq '/fa/memo-quante' -and $locale) { Testo $ctx 200 ('{"quante":' + @(Get-ChildItem $MEMO -File).Count + '}') }
    elseif ($p -eq '/fa/stato' -and $daRete) {
      Testo $ctx 200 (@{ codice = (CodiceDi $aula); ip = (IpLocale); rete = $rete; porta = $PORTA } | ConvertTo-Json -Compress)
    }
    elseif ($p -eq '/fa/ferma' -and $locale) {
      Testo $ctx 200 '{"ok":true}'
      $ascolta.Stop()
    }
    elseif ($p -eq '/fa/pagine' -and $daRete) {
      $cart = CartellaPagine $aula
      if ($q.HttpMethod -eq 'DELETE') { Get-ChildItem $cart -File | Remove-Item -Force; Testo $ctx 200 '{"ok":true}' }
      else {
        $nomi = @(Get-ChildItem $cart -Filter '*.jpg' | Sort-Object Name | ForEach-Object { $_.BaseName })
        Testo $ctx 200 (ConvertTo-Json -InputObject $nomi -Compress)
      }
    }
    elseif ($p -like '/fa/pagina/*' -and $daRete) {
      $n = [IO.Path]::GetFileName($p)
      $f = Join-Path (CartellaPagine $aula) "$n.jpg"
      if ($n -match '^\d+$' -and (Test-Path $f)) { Manda $ctx 200 'image/jpeg' ([IO.File]::ReadAllBytes($f)) } else { Testo $ctx 404 '{}' }
    }
    elseif ($p -eq '/fa/carica' -and $q.HttpMethod -eq 'POST') {
      $cart = CartellaPagine $aula
      if ($q.QueryString['c'] -ne (CodiceDi $aula)) { Testo $ctx 403 '{"errore":"codice"}' }
      elseif ($q.ContentLength64 -gt 15MB -or @(Get-ChildItem $cart -File).Count -ge 12) { Testo $ctx 413 '{"errore":"troppo"}' }
      else {
        $ms = New-Object IO.MemoryStream
        $q.InputStream.CopyTo($ms)
        $b = $ms.ToArray()
        if ($b.Length -gt 100 -and $b.Length -le 15MB -and $b[0] -eq 0xFF -and $b[1] -eq 0xD8) {
          [IO.File]::WriteAllBytes((Join-Path $cart ([DateTime]::Now.ToString('HHmmssfff') + '.jpg')), $b)
          Testo $ctx 200 '{"ok":true}'
        } else { Testo $ctx 415 '{"errore":"serve una foto jpg"}' }
      }
    }
    else {
      # i file di Fly Aula
      $rel = [Uri]::UnescapeDataString($p).TrimStart('/')
      if ($rel -eq '') { $ctx.Response.Redirect('/flyaula/'); $ctx.Response.Close(); continue }
      if ($rel.EndsWith('/')) { $rel += 'index.html' }
      $pieno = [IO.Path]::GetFullPath((Join-Path $ROOT $rel))
      $ok = $pieno.StartsWith($ROOT + [IO.Path]::DirectorySeparatorChar) -and (Test-Path $pieno -PathType Leaf)
      if (-not $locale) {
        # dalla rete: la pagina delle foto sempre; Fly Aula intera solo se questo e il server
        $permesso = ($rel -eq 'flyaula/telefono.html') -or ($SERVER -and ($rel -like 'flyaula/*' -or $rel -like 'font/*') -and $rel -ne 'flyaula/tecnico.html' -and $rel -notlike 'flyaula/installa/*')
        if (-not $permesso) { $ok = $false }
      }
      if ($ok) {
        $t = $TIPI[[IO.Path]::GetExtension($pieno).ToLower()]
        if (-not $t) { $t = 'application/octet-stream' }
        Manda $ctx 200 $t ([IO.File]::ReadAllBytes($pieno))
      } else { Testo $ctx 404 'non trovato' 'text/plain; charset=utf-8' }
    }
  } catch {
    try { $ctx.Response.Abort() } catch {}
  }
}
