#!/usr/bin/env bash
# RefrigeraSim — baixa os 5 vídeos gerados e prepara-os para a web.
#
# Os originais são HEVC (H.265) com UM único keyframe no arquivo inteiro.
# Servir isso direto quebra duas coisas:
#   1. o Firefox não decodifica HEVC — os vídeos simplesmente não aparecem;
#   2. o scrub do hero engasga, porque para mostrar o frame N o navegador
#      precisa decodificar todos os anteriores.
# Por isso o download é só a primeira metade: a recompressão abaixo é o que
# deixa os arquivos utilizáveis. NÃO pule essa etapa.
set -e
cd "$(dirname "$0")"

B="https://d8j0ntlcm91z4.cloudfront.net/user_3IZOrgGtP6buNjeGHc2EBMXsOHp"
ORIG="assets/videos/originais"
OUT="assets/videos"
mkdir -p "$ORIG"

echo "== 1/2 baixando originais =="
curl -fL -o "$ORIG/hero.mp4"    "$B/hf_20260915_195443_2603e7d6-ff93-47e3-8b3e-03b57417a5f4.mp4"
curl -fL -o "$ORIG/coil.mp4"    "$B/hf_20260915_195454_162ebfef-450b-43f0-8696-084e2094134c.mp4"
curl -fL -o "$ORIG/frost.mp4"   "$B/hf_20260915_195443_d4bff3ea-80f3-41ab-b111-6ec9f2aa1d41.mp4"
curl -fL -o "$ORIG/ac.mp4"      "$B/hf_20260915_195443_63ff9e5c-24e3-4b24-b90d-ec9d534cbd70.mp4"
curl -fL -o "$ORIG/comfort.mp4" "$B/hf_20260915_195453_bde72aff-39e4-4e70-9a56-b5f2e261d6d6.mp4"
echo "OK — 5 originais em $ORIG/"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo
  echo "!! ffmpeg NÃO encontrado — parando aqui."
  echo "!! Os arquivos em $ORIG/ ainda são HEVC e não servem para a página."
  echo "!! Instale o ffmpeg e rode este script de novo:"
  echo "!!   Windows  winget install Gyan.FFmpeg"
  echo "!!   macOS    brew install ffmpeg"
  echo "!!   Linux    sudo apt install ffmpeg"
  exit 1
fi

echo
echo "== 2/2 recomprimindo para H.264 =="

# hero-scrub.mp4 — o único guiado quadro a quadro pelo scroll.
# -g 1 -bf 0 => todo frame é keyframe, então cada seek decodifica 1 frame só.
# Fica ~3x maior que um encode normal; é o preço do scrub fluido.
echo "  hero-scrub.mp4 (all-intra, para o scrub do hero)"
ffmpeg -loglevel error -y -i "$ORIG/hero.mp4" -an \
  -c:v libx264 -preset slow -crf 23 -g 1 -bf 0 \
  -pix_fmt yuv420p -movflags +faststart "$OUT/hero-scrub.mp4"

# Os demais só rodam em loop: GOP normal, arquivos bem menores.
# +faststart põe o índice (moov) no começo => o vídeo começa a exibir
# sem precisar baixar o arquivo inteiro antes.
for n in hero coil frost ac comfort; do
  echo "  $n.mp4 (loop)"
  ffmpeg -loglevel error -y -i "$ORIG/$n.mp4" -an \
    -c:v libx264 -preset slow -crf 24 -g 48 \
    -pix_fmt yuv420p -movflags +faststart "$OUT/$n.mp4"
done

# posters = primeiro frame real de cada vídeo, para não haver salto visual
for n in hero coil frost ac comfort; do
  ffmpeg -loglevel error -y -i "$OUT/$n.mp4" -frames:v 1 -q:v 4 "assets/images/poster-$n.jpg"
done

echo
echo "OK — vídeos e posters prontos em $OUT/"
