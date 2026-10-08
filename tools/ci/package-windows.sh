#!/usr/bin/env bash
# Esporta la build Windows ("Windows Desktop" in src/export_presets.cfg: exe unico
# con pck incorporato), aggiunge LEGGIMI.txt e crea build/Ferruccio-beta-windows.zip.
#
# Variabili:
#   GODOT_BIN    eseguibile di Godot            (default: ~/godot/godot)
#   PROJECT_DIR  cartella del progetto Godot    (default: src)
#   BUILD_DIR    cartella di uscita             (default: build)
#   LOG_DIR      dove salvare il log            (default: build/ci-logs)
#   GITHUB_SHA   commit da scrivere nel LEGGIMI (default: HEAD)
#
# Il percorso dell'exe deve restare coerente con export_path del preset
# (../build/windows/Ferruccio.exe, relativo a src/).
set -euo pipefail

GODOT_BIN="${GODOT_BIN:-$HOME/godot/godot}"
PROJECT_DIR="${PROJECT_DIR:-src}"
BUILD_DIR="${BUILD_DIR:-build}"
LOG_DIR="${LOG_DIR:-$BUILD_DIR/ci-logs}"
PRESET="Windows Desktop"
ZIP_NAME="Ferruccio-beta-windows.zip"
# Un exe esportato è il template (~100 MB) più il pck: sotto questa soglia qualcosa è andato storto.
MIN_EXE_BYTES=$((60 * 1024 * 1024))

# Godot risolve l'export_path rispetto alla cartella del progetto.
OUT_DIR="$BUILD_DIR/windows"
EXE="$OUT_DIR/Ferruccio.exe"
mkdir -p "$OUT_DIR" "$LOG_DIR"
rm -f "$EXE" "$OUT_DIR/LEGGIMI.txt" "$BUILD_DIR/$ZIP_NAME"

# Percorso assoluto dell'exe, per non dipendere da dove gira lo script.
EXE_ABS="$(cd "$OUT_DIR" && pwd)/Ferruccio.exe"

echo "::group::Esportazione \"$PRESET\""
if ! "$GODOT_BIN" --headless --path "$PROJECT_DIR" --export-release "$PRESET" "$EXE_ABS" \
		> "$LOG_DIR/export.log" 2>&1; then
	cat "$LOG_DIR/export.log"
	echo "::endgroup::"
	echo "::error::L'esportazione è fallita (vedi export.log)"
	exit 1
fi
tail -n 25 "$LOG_DIR/export.log"
echo "::endgroup::"

if [[ ! -f "$EXE" ]]; then
	echo "::error::Godot non ha prodotto $EXE"
	exit 1
fi
size=$(stat -c %s "$EXE")
echo "Dimensione di Ferruccio.exe: $((size / 1024 / 1024)) MB"
if (( size < MIN_EXE_BYTES )); then
	echo "::error::Ferruccio.exe è troppo piccolo (${size} byte): template o pck mancanti?"
	exit 1
fi
if grep -E -q '^(ERROR|SCRIPT ERROR):' "$LOG_DIR/export.log"; then
	echo "::warning::Ci sono righe ERROR nel log di esportazione (export.log)."
	grep -E '^(ERROR|SCRIPT ERROR):' "$LOG_DIR/export.log" | head -n 20
fi

# --- LEGGIMI.txt: UTF-8 con BOM e fine riga Windows, così il Blocco note lo legge bene ---
sha="${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || echo sconosciuto)}"
{
	printf '\xEF\xBB\xBF'
	sed 's/$/\r/' <<TXT
FERRUCCIO - La Menzogna dei Borbone  (versione beta per Windows)
Versione: commit ${sha:0:7} del $(date -u +%d/%m/%Y)

COME GIOCARE
1. Estrai lo zip in una cartella (tasto destro, "Estrai tutto...").
2. Fai doppio clic su Ferruccio.exe. Non serve installare nulla.
3. Se Windows mostra la schermata blu di SmartScreen ("Windows ha protetto il
   PC"), clicca su "Ulteriori informazioni" e poi su "Esegui comunque".
   Succede perché il gioco non è firmato digitalmente: è normale in una beta.

COMANDI
  A / D            muovi Ferruccio
  Spazio           salta (premilo due volte in aria: doppio salto)
  X                colpisci
  S + X in aria    colpo verso il basso
  C                scatto
  W oppure E       parla con i personaggi
  Esc              menu

Questa è una versione di prova: se qualcosa non va, racconta cosa stavi facendo.
TXT
} > "$OUT_DIR/LEGGIMI.txt"

# -j: file direttamente nella radice dello zip; -X: niente attributi extra; -9: compressione massima.
(cd "$OUT_DIR" && zip -j -X -9 -q "../$ZIP_NAME" Ferruccio.exe LEGGIMI.txt)
unzip -l "$BUILD_DIR/$ZIP_NAME"
echo "Creato $BUILD_DIR/$ZIP_NAME ($(( $(stat -c %s "$BUILD_DIR/$ZIP_NAME") / 1024 / 1024 )) MB)"
