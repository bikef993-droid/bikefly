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
$PORTA = 8780
$UTF8 = New-Object Text.UTF8Encoding $false
Remove-Item $PAG -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $PAG, $ORARI | Out-Null

function LeggiConfig {
  $c = @{ ruolo = 'singolo'; nome = ''; riserva = '' }
  try {
    $j = [IO.File]::ReadAllText($CFGF, $UTF8) | ConvertFrom-Json
    foreach ($k in 'ruolo', 'nome', 'riserva', 'server', 'aula') { if ($j.$k) { $c[$k] = [string]$j.$k } }
  } catch {}
  return $c
}
function SalvaConfig($c) { [IO.File]::WriteAllText($CFGF, ($c | ConvertTo-Json), $UTF8) }
$CFG = LeggiConfig
$SERVER = ($CFG.ruolo -eq 'server')

# un codice segreto per ogni aula (serve al telefono per mandare le foto)
$CODICI = @{}
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
      Testo $ctx 200 (@{ ruolo = $(if ($SERVER) { 'server' } else { 'singolo' }); nome = $CFG.nome; riserva = $CFG.riserva; parallelo = $par; ip = (IpLocale) } | ConvertTo-Json -Compress)
    }
    elseif ($p -eq '/fa/config' -and $locale) {
      if ($q.HttpMethod -eq 'POST') {
        $b = Corpo $q 20000
        try {
          $j = $b | ConvertFrom-Json
          if ($null -ne $j.nome) { $CFG.nome = ([string]$j.nome).Substring(0, [Math]::Min(60, ([string]$j.nome).Length)) }
          if ($null -ne $j.riserva) { $CFG.riserva = ([string]$j.riserva) -replace '[^\w\.\-:/]', '' }
          SalvaConfig $CFG
          Testo $ctx 200 '{"ok":true}'
        } catch { Testo $ctx 400 '{"errore":"json"}' }
      } else { Testo $ctx 200 ($CFG | ConvertTo-Json -Compress) }
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
      $ok = $pieno.StartsWith($ROOT + '\') -and (Test-Path $pieno -PathType Leaf)
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
