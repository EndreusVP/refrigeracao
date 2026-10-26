@echo off
REM RefrigeraSim - baixa os 5 videos gerados e prepara-os para a web.
REM
REM Os originais sao HEVC (H.265) com UM unico keyframe no arquivo inteiro.
REM Servir isso direto quebra duas coisas:
REM   1. o Firefox nao decodifica HEVC - os videos nao aparecem;
REM   2. o scrub do hero engasga, porque para mostrar o frame N o navegador
REM      precisa decodificar todos os anteriores.
REM O download e so a primeira metade: a recompressao e o que deixa os
REM arquivos utilizaveis. NAO pule essa etapa.

cd /d "%~dp0"
set B=https://d8j0ntlcm91z4.cloudfront.net/user_3IZOrgGtP6buNjeGHc2EBMXsOHp
set ORIG=assets\videos\originais
set OUT=assets\videos
if not exist "%ORIG%" mkdir "%ORIG%"

echo == 1/2 baixando originais ==
curl -fL -o "%ORIG%\hero.mp4"    "%B%/hf_20260915_195443_2603e7d6-ff93-47e3-8b3e-03b57417a5f4.mp4"
curl -fL -o "%ORIG%\coil.mp4"    "%B%/hf_20260915_195454_162ebfef-450b-43f0-8696-084e2094134c.mp4"
curl -fL -o "%ORIG%\frost.mp4"   "%B%/hf_20260915_195443_d4bff3ea-80f3-41ab-b111-6ec9f2aa1d41.mp4"
curl -fL -o "%ORIG%\ac.mp4"      "%B%/hf_20260915_195443_63ff9e5c-24e3-4b24-b90d-ec9d534cbd70.mp4"
curl -fL -o "%ORIG%\comfort.mp4" "%B%/hf_20260915_195453_bde72aff-39e4-4e70-9a56-b5f2e261d6d6.mp4"
echo OK - 5 originais em %ORIG%\

where ffmpeg >nul 2>nul
if errorlevel 1 (
  echo.
  echo !! ffmpeg NAO encontrado - parando aqui.
  echo !! Os arquivos em %ORIG%\ ainda sao HEVC e nao servem para a pagina.
  echo !! Instale com:  winget install Gyan.FFmpeg
  echo !! Feche e reabra o terminal, depois rode este script de novo.
  pause
  exit /b 1
)

echo.
echo == 2/2 recomprimindo para H.264 ==

REM hero-scrub.mp4 - o unico guiado quadro a quadro pelo scroll.
REM -g 1 -bf 0 => todo frame e keyframe, cada seek decodifica 1 frame so.
echo   hero-scrub.mp4 (all-intra, para o scrub do hero)
ffmpeg -loglevel error -y -i "%ORIG%\hero.mp4" -an -c:v libx264 -preset slow -crf 23 -g 1 -bf 0 -pix_fmt yuv420p -movflags +faststart "%OUT%\hero-scrub.mp4"

REM Os demais so rodam em loop: GOP normal, arquivos bem menores.
REM +faststart poe o indice (moov) no comeco => exibe sem baixar tudo antes.
for %%n in (hero coil frost ac comfort) do (
  echo   %%n.mp4 ^(loop^)
  ffmpeg -loglevel error -y -i "%ORIG%\%%n.mp4" -an -c:v libx264 -preset slow -crf 24 -g 48 -pix_fmt yuv420p -movflags +faststart "%OUT%\%%n.mp4"
)

REM posters = primeiro frame real de cada video, sem salto visual
for %%n in (hero coil frost ac comfort) do (
  ffmpeg -loglevel error -y -i "%OUT%\%%n.mp4" -frames:v 1 -q:v 4 "assets\images\poster-%%n.jpg"
)

echo.
echo OK - videos e posters prontos em %OUT%\
pause
