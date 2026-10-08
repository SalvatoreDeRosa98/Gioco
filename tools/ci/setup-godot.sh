#!/usr/bin/env bash
# Installa Godot 4.6-stable (editor Linux, usato in modalità headless) e i soli
# template di esportazione Windows. Pensato per la CI ma funziona anche in locale.
#
# Idempotente: se l'editor e i template ci sono già (cache di actions/cache) non
# scarica nulla. Ogni download è verificato con lo SHA-512 pubblicato da Godot per
# la 4.6-stable (SHA512-SUMS.txt della release), fissato qui sotto.
#
# Variabili (tutte facoltative):
#   GODOT_DIR            dove mettere l'editor        (default: ~/godot)
#   GODOT_TEMPLATES_DIR  dove mettere i template      (default: ~/.local/share/godot/export_templates/4.6.stable)
#
# In GitHub Actions scrive GODOT_BIN in $GITHUB_ENV per i passi successivi.
set -euo pipefail

VERSION="4.6-stable"
TEMPLATES_VERSION_TXT="4.6.stable"   # contenuto atteso di templates/version.txt
BASE_URL="https://github.com/godotengine/godot/releases/download/${VERSION}"

EDITOR_ZIP="Godot_v${VERSION}_linux.x86_64.zip"
EDITOR_SHA512="0c1bc5e8dca8f892a9a5fd0628b742f399fbd520e5f0051ecac021c0aa4ea5a8f0d237c8ed6b767b2afda7f7a4b32001118f1b04a82e335a5e35b947a1217940"
TEMPLATES_TPZ="Godot_v${VERSION}_export_templates.tpz"
TEMPLATES_SHA512="88bb7c3a98e9a1e43c98796c99ac8a4ac8a82a15d8c9b049fe478e8e6a43522067559400f799949c1a43ecb1702a8eb02aa7bed506babccf177f0cb509088d19"

GODOT_DIR="${GODOT_DIR:-$HOME/godot}"
TEMPLATES_DIR="${GODOT_TEMPLATES_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/godot/export_templates/${TEMPLATES_VERSION_TXT}}"
GODOT_BIN="${GODOT_DIR}/godot"

WORK_DIR="$(mktemp -d)"
trap 'rm -r -- "$WORK_DIR" 2>/dev/null || true' EXIT

# Scarica $1 in $2 e controlla lo SHA-512 $3.
download() {
	local name="$1" dest="$2" sha="$3"
	echo "Scarico ${name} ..."
	curl -fsSL --retry 5 --retry-delay 10 --retry-all-errors --connect-timeout 30 \
		-o "$dest" "${BASE_URL}/${name}"
	echo "${sha}  ${dest}" | sha512sum --check --status \
		|| { echo "::error::SHA-512 errato per ${name}" >&2; exit 1; }
}

# --- Editor ---------------------------------------------------------------
if [[ -x "$GODOT_BIN" ]]; then
	echo "Editor Godot già presente: $GODOT_BIN"
else
	mkdir -p "$GODOT_DIR"
	download "$EDITOR_ZIP" "$WORK_DIR/editor.zip" "$EDITOR_SHA512"
	unzip -o -j -q "$WORK_DIR/editor.zip" "Godot_v${VERSION}_linux.x86_64" -d "$WORK_DIR/editor"
	mv "$WORK_DIR/editor/Godot_v${VERSION}_linux.x86_64" "$GODOT_BIN"
	chmod +x "$GODOT_BIN"
fi

# --- Template di esportazione (solo Windows x86_64 release) ----------------
if [[ -f "$TEMPLATES_DIR/version.txt" && -f "$TEMPLATES_DIR/windows_release_x86_64.exe" ]]; then
	echo "Template già presenti: $TEMPLATES_DIR"
else
	mkdir -p "$TEMPLATES_DIR"
	# Il .tpz pesa ~1,2 GB: lo scarico nella cartella temporanea e ne estraggo solo
	# ciò che serve (il resto sono template per altre piattaforme).
	download "$TEMPLATES_TPZ" "$WORK_DIR/templates.tpz" "$TEMPLATES_SHA512"
	unzip -o -j -q "$WORK_DIR/templates.tpz" \
		"templates/version.txt" "templates/windows_release_x86_64*.exe" \
		-d "$TEMPLATES_DIR"
fi

# Il nome della cartella deve coincidere con version.txt, altrimenti Godot non trova i template.
if [[ "$(tr -d '[:space:]' < "$TEMPLATES_DIR/version.txt")" != "$TEMPLATES_VERSION_TXT" ]]; then
	echo "::error::version.txt dei template non è ${TEMPLATES_VERSION_TXT}" >&2
	exit 1
fi
[[ -f "$TEMPLATES_DIR/windows_release_x86_64.exe" ]] \
	|| { echo "::error::manca windows_release_x86_64.exe nei template" >&2; exit 1; }

echo "Versione installata: $("$GODOT_BIN" --version | tail -n 1)"
ls -la "$TEMPLATES_DIR"

if [[ -n "${GITHUB_ENV:-}" ]]; then
	echo "GODOT_BIN=${GODOT_BIN}" >> "$GITHUB_ENV"
fi
