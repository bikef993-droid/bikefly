@echo off
title Fly Aula - installazione
echo.
echo   Installo Fly Aula su questo computer...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; $wc=New-Object Net.WebClient; $wc.Encoding=[Text.Encoding]::UTF8; iex $wc.DownloadString('https://bikef993-droid.github.io/bikefly/flyaula/installa/installa.ps1')"
