#!/usr/bin/env bash
# prepara-pacchetto.sh — monta il pacchetto PortMaster di Ferruccio per R36S (linux aarch64) e lo zip.
#
# Uso:  ./prepara-pacchetto.sh [cartella dove mettere lo zip]
#
# Scarica (in scaricati/, fuori da git): node per linux-arm64 dal sito ufficiale, i moduli nativi
# precompilati per linux-arm64 (@napi-rs/canvas, @kmamal/sdl, node-web-audio-api). Monta pacchetto/
# (fuori da git) col gioco (la release a file unico), il lanciatore, i font e le impostazioni leggere.
# Controlla con file/readelf che ogni binario sia aarch64 e quale GLIBC chiede.
# Qui i binari NON si possono eseguire (questa macchina è x86-64): si prova solo sulla console.
set -euo pipefail

QUI="$(cd "$(dirname "$0")" && pwd)"
RADICE="$(cd "$QUI/../.." && pwd)"
DEST="${1:-$QUI/uscita}"
NODE_V="${NODE_V:-v22.23.4}"          # la stessa versione con cui è stato provato il lanciatore
CANVAS_V="${CANVAS_V:-1.1.0}"
SDL_V="${SDL_V:-0.11.13}"
AUDIO_V="${AUDIO_V:-2.2.0}"
GLIBC_CONSOLE="${GLIBC_CONSOLE:-2.30}" # ArkOS (base Ubuntu 19.10); vedi RAPPORTO.md
GIOCO="${GIOCO:-$RADICE/production/release/teatro.html}"

S="$QUI/scaricati"; P="$QUI/pacchetto"; F="$P/ferruccio"
mkdir -p "$S" "$DEST"
[ -f "$GIOCO" ] || { echo "manca $GIOCO (si rigenera con: node tools/teatro-release.js)"; exit 1; }

echo "== 1. node $NODE_V per linux-arm64 (nodejs.org)"
TAR="node-$NODE_V-linux-arm64.tar.xz"
[ -f "$S/$TAR" ] || curl -fsSL -o "$S/$TAR" "https://nodejs.org/dist/$NODE_V/$TAR"
curl -fsSL -o "$S/SHASUMS256-$NODE_V.txt" "https://nodejs.org/dist/$NODE_V/SHASUMS256.txt"
(cd "$S" && grep " $TAR\$" "SHASUMS256-$NODE_V.txt" | sha256sum -c -)
mkdir -p "$S/node-arm64"
tar -xJf "$S/$TAR" -C "$S/node-arm64" --strip-components=2 "node-$NODE_V-linux-arm64/bin/node"
tar -xJf "$S/$TAR" -C "$S/node-arm64" --strip-components=1 "node-$NODE_V-linux-arm64/LICENSE"

echo "== 2. moduli nativi per linux-arm64 (npm, senza script di installazione)"
M="$S/montaggio"
mkdir -p "$M"
echo '{"name":"montaggio","private":true}' > "$M/package.json"
(cd "$M" && npm install --no-audit --no-fund --os=linux --cpu=arm64 --libc=glibc --ignore-scripts \
  "@napi-rs/canvas@$CANVAS_V" "@kmamal/sdl@$SDL_V" "node-web-audio-api@$AUDIO_V" dejavu-fonts-ttf \
  @fontsource/noto-emoji @fontsource/noto-sans-symbols @fontsource/noto-sans-symbols-2 >/dev/null)
SDLTAR="sdl.node-v$SDL_V-linux-arm64.tar.gz"
[ -f "$S/$SDLTAR" ] || curl -fsSL -o "$S/$SDLTAR" "https://github.com/kmamal/node-sdl/releases/download/v$SDL_V/$SDLTAR"
mkdir -p "$S/sdl-arm64"
tar -xzf "$S/$SDLTAR" -C "$S/sdl-arm64"

echo "== 3. monto $P"
mkdir -p "$F/node" "$F/gioco" "$F/lanciatore/font" "$F/dati" "$F/node_modules"
cp "$S/node-arm64/node" "$F/node/node"
cp "$S/node-arm64/LICENSE" "$F/node/LICENSE-node.txt"
cp "$GIOCO" "$F/gioco/teatro.html"
cp "$QUI"/lanciatore/*.js "$F/lanciatore/"
"$QUI/prepara-font.sh" "$F/lanciatore/font" "$M/node_modules"
# moduli: copia senza collegamenti simbolici (la scheda SD è FAT/exFAT: non li regge)
for m in @napi-rs/canvas @napi-rs/canvas-linux-arm64-gnu @kmamal/sdl node-web-audio-api; do
  mkdir -p "$F/node_modules/$m"
  cp -rL "$M/node_modules/$m/." "$F/node_modules/$m/"
done
rm -rf "$F/node_modules/@kmamal/sdl/scripts" "$F/node_modules/@kmamal/sdl/binding.gyp" "$F/node_modules/@kmamal/sdl/dist"
mkdir -p "$F/node_modules/@kmamal/sdl/dist"
cp "$S/sdl-arm64/sdl.node" "$F/node_modules/@kmamal/sdl/dist/sdl.node"
# La SDL2 in dotazione al modulo (2.32.8) chiede GLIBC 2.34: su ArkOS non si carica. Non sta quindi accanto
# a sdl.node (che la troverebbe per prima) ma in una cartella a parte, che Ferruccio.sh mette nel percorso
# delle librerie solo se la console ha una GLIBC abbastanza nuova; altrimenti vale la SDL2 della console.
mkdir -p "$F/sdl-in-dotazione"
cp -L "$(ls "$S"/sdl-arm64/libSDL2-2.0.so.0.* | head -n 1)" "$F/sdl-in-dotazione/libSDL2-2.0.so.0"
# del Web Audio nativo serve solo il binario arm64
find "$F/node_modules/node-web-audio-api" -name '*.node' ! -name '*linux-arm64-gnu*' -delete
cp "$QUI/modello-pacchetto/Ferruccio.sh" "$P/Ferruccio.sh"
cp "$QUI/modello-pacchetto/FerruccioMisura.sh" "$P/FerruccioMisura.sh"
cp "$QUI/modello-pacchetto/impostazioni.json" "$QUI/modello-pacchetto/lancio.conf" "$QUI/modello-pacchetto/port.json" "$QUI/modello-pacchetto/ISTRUZIONI.txt" "$F/"
chmod +x "$P/Ferruccio.sh" "$P/FerruccioMisura.sh" "$F/node/node"
# i file di lancio devono avere i fine riga di Linux (LF): con CRLF bash non li esegue
if grep -q $'\r' "$P/Ferruccio.sh" "$P/FerruccioMisura.sh" "$F/lancio.conf"; then echo "ERRORE: fine riga CRLF nei file di lancio"; exit 1; fi
if find "$P" -type l | grep -q .; then echo "ERRORE: nel pacchetto ci sono collegamenti simbolici"; find "$P" -type l; exit 1; fi

echo "== 4. controllo dei binari (architettura e GLIBC chiesta; la console ha GLIBC $GLIBC_CONSOLE)"
V="$F/verifica-binari.txt"; : > "$V"; guasti=0
while IFS= read -r -d '' b; do
  tipo="$(file -b "$b")"
  case "$tipo" in ELF*) ;; *) continue ;; esac
  # «|| true»: un binario senza simboli GLIBCXX fa fallire grep, e con pipefail lo script si fermerebbe
  glibc="$(readelf -V "$b" 2>/dev/null | grep -o 'GLIBC_[0-9.]*' | sed 's/GLIBC_//' | sort -uV | tail -n 1 || true)"
  glibcxx="$(readelf -V "$b" 2>/dev/null | grep -o 'GLIBCXX_[0-9.]*' | sed 's/GLIBCXX_//' | sort -uV | tail -n 1 || true)"
  serve="$(readelf -d "$b" 2>/dev/null | grep NEEDED | sed 's/.*\[\(.*\)\]/\1/' | tr '\n' ' ' || true)"
  esito="ok"
  case "$tipo" in *aarch64*) ;; *) esito="NON AARCH64"; guasti=$((guasti + 1)) ;; esac
  if [ -n "$glibc" ] && [ "$(printf '%s\n%s\n' "$glibc" "$GLIBC_CONSOLE" | sort -V | tail -n 1)" != "$GLIBC_CONSOLE" ]; then
    case "$b" in
      */sdl-in-dotazione/*) esito="solo con GLIBC>=$glibc" ;; # facoltativa: su ArkOS si usa la SDL2 della console
      *) esito="GLIBC TROPPO NUOVA"; guasti=$((guasti + 1)) ;;
    esac
  fi
  printf '%-58s %-20s GLIBC<=%-5s GLIBCXX<=%-7s %s MB\n   chiede: %s\n' "${b#$P/}" "$esito" "${glibc:--}" "${glibcxx:--}" "$(( $(stat -c %s "$b") / 1048576 ))" "$serve" | tee -a "$V"
done < <(find "$P" -type f \( -name '*.node' -o -name 'node' -o -name '*.so*' \) -print0 | sort -z)
echo "binari con problemi: $guasti" | tee -a "$V"

echo "== 5. zip"
ZIP="$DEST/ferruccio-r36s-v2.zip"
python3 - "$P" "$ZIP" <<'PY'
import os, sys, zipfile
radice, dest = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for cart, _, nomi in sorted(os.walk(radice)):
        for n in sorted(nomi):
            p = os.path.join(cart, n)
            z.write(p, os.path.relpath(p, radice))
PY
echo "pacchetto: $(du -sh "$P" | cut -f1) in $P"
echo "zip: $(du -h "$ZIP" | cut -f1)  $ZIP"
[ "$guasti" = "0" ] || { echo "ATTENZIONE: $guasti binari non adatti alla console (vedi sopra)"; exit 3; }
