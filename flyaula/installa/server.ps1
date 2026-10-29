# ==================================================================
#  FLY AULA - la lavagna locale
#  Serve Fly Aula a questo computer (localhost) e riceve le foto delle
#  pagine dal telefono del prof sul Wi-Fi della scuola. Niente internet.
#  Dal telefono si puo SOLO aprire la pagina delle foto e mandare foto,
#  e solo con il codice segreto mostrato nel QR sulla lavagna.
# ==================================================================
$DIR  = Split-Path -Parent $MyInvocation.MyCommand.Path
$ROOT = [IO.Path]::GetFullPath((Join-Path $DIR 'app'))
$PAG  = Join-Path $DIR 'pagine'
$PORTA = 8780
Remove-Item $PAG -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $PAG | Out-Null
$CODICE = -join (1..6 | ForEach-Object { Get-Random -Minimum 0 -Maximum 10 })

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
  '.ico' = 'image/x-icon'; '.txt' = 'text/plain; charset=utf-8'; '.webmanifest' = 'application/manifest+json' }

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
function Testo($ctx, [int]$stato, [string]$s, [string]$tipo = 'application/json; charset=utf-8') { Manda $ctx $stato $tipo ([Text.Encoding]::UTF8.GetBytes($s)) }

while ($ascolta.IsListening) {
  try { $ctx = $ascolta.GetContext() } catch { break }
  try {
    $q = $ctx.Request
    $locale = [Net.IPAddress]::IsLoopback($q.RemoteEndPoint.Address)
    $p = $q.Url.AbsolutePath

    if ($p -eq '/fa/stato' -and $locale) {
      Testo $ctx 200 (@{ codice = $CODICE; ip = (IpLocale); rete = $rete; porta = $PORTA } | ConvertTo-Json -Compress)
    }
    elseif ($p -eq '/fa/ferma' -and $locale) {
      Testo $ctx 200 '{"ok":true}'
      $ascolta.Stop()
    }
    elseif ($p -eq '/fa/pagine' -and $locale) {
      if ($q.HttpMethod -eq 'DELETE') {
        Get-ChildItem $PAG -File | Remove-Item -Force
        Testo $ctx 200 '{"ok":true}'
      } else {
        $nomi = @(Get-ChildItem $PAG -Filter '*.jpg' | Sort-Object Name | ForEach-Object { $_.BaseName })
        Testo $ctx 200 (ConvertTo-Json -InputObject $nomi -Compress)
      }
    }
    elseif ($p -like '/fa/pagina/*' -and $locale) {
      $n = [IO.Path]::GetFileName($p)
      $f = Join-Path $PAG "$n.jpg"
      if ($n -match '^\d+$' -and (Test-Path $f)) { Manda $ctx 200 'image/jpeg' ([IO.File]::ReadAllBytes($f)) } else { Testo $ctx 404 '{}' }
    }
    elseif ($p -eq '/fa/carica' -and $q.HttpMethod -eq 'POST') {
      if ($q.QueryString['c'] -ne $CODICE) { Testo $ctx 403 '{"errore":"codice"}' }
      elseif ($q.ContentLength64 -gt 15MB -or @(Get-ChildItem $PAG -File).Count -ge 12) { Testo $ctx 413 '{"errore":"troppo"}' }
      else {
        $ms = New-Object IO.MemoryStream
        $q.InputStream.CopyTo($ms)
        $b = $ms.ToArray()
        if ($b.Length -gt 100 -and $b.Length -le 15MB -and $b[0] -eq 0xFF -and $b[1] -eq 0xD8) {
          [IO.File]::WriteAllBytes((Join-Path $PAG ([DateTime]::Now.ToString('HHmmssfff') + '.jpg')), $b)
          Testo $ctx 200 '{"ok":true}'
        } else { Testo $ctx 415 '{"errore":"serve una foto jpg"}' }
      }
    }
    else {
      # file di Fly Aula. Dal telefono: SOLO la pagina delle foto.
      $rel = [Uri]::UnescapeDataString($p).TrimStart('/')
      if ($rel -eq '') { $ctx.Response.Redirect('/flyaula/'); $ctx.Response.Close(); continue }
      if ($rel.EndsWith('/')) { $rel += 'index.html' }
      $pieno = [IO.Path]::GetFullPath((Join-Path $ROOT $rel))
      $ok = $pieno.StartsWith($ROOT + '\') -and (Test-Path $pieno -PathType Leaf)
      if (-not $locale -and $rel -ne 'flyaula/telefono.html') { $ok = $false }
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
