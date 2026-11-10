#!/usr/bin/env bash
# prepara-font.sh — copia in una cartella i font che il lanciatore registra (uguali su ogni macchina).
# Uso: ./prepara-font.sh [cartella di arrivo] [node_modules da cui prenderli]
# DejaVu (testi) e Noto Emoji / Noto Sans Symbols (i simboli e le emoji che il gioco scrive: monete,
# bombe, chiavi, i tasti Ⓐ Ⓑ Ⓧ Ⓨ…). I file «simboli-*» finiscono in coda a ogni ctx.font.
set -euo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
DEST="${1:-$QUI/lanciatore/font}"
NM="${2:-$QUI/node_modules}"
mkdir -p "$DEST"
for f in DejaVuSansMono.ttf DejaVuSansMono-Bold.ttf DejaVuSerif.ttf DejaVuSerif-Bold.ttf DejaVuSans.ttf DejaVuSans-Bold.ttf; do
  cp "$NM/dejavu-fonts-ttf/ttf/$f" "$DEST/$f"
done
n=1
for f in "$NM"/@fontsource/noto-emoji/files/noto-emoji-emoji-400-normal.woff2 \
         "$NM"/@fontsource/noto-sans-symbols/files/noto-sans-symbols-symbols-400-normal.woff2 \
         "$NM"/@fontsource/noto-sans-symbols-2/files/noto-sans-symbols-2-symbols-400-normal.woff2; do
  if [ -f "$f" ]; then cp "$f" "$DEST/simboli-$n-$(basename "$f")"; n=$((n + 1)); fi
done
cat > "$DEST/LICENZE-font.txt" <<'EOF'
DejaVu Sans, DejaVu Sans Mono, DejaVu Serif: licenza Bitstream Vera / DejaVu (libera, ridistribuibile).
Noto Emoji, Noto Sans Symbols, Noto Sans Symbols 2: SIL Open Font License 1.1 (Google).
EOF
echo "font in $DEST: $(ls "$DEST" | wc -l) file"
