#!/usr/bin/env bash
# Importa il progetto, lo avvia headless per ~20 s in modalità demo (il giocatore
# corre, salta e colpisce da solo) ed esegue i test in tests/. Fallisce se nel log
# compare un errore di script o se un test non passa.
#
# Variabili:
#   GODOT_BIN     eseguibile di Godot            (default: ~/godot/godot)
#   PROJECT_DIR   cartella del progetto Godot    (default: src)
#   LOG_DIR       dove salvare i log             (default: build/ci-logs)
#   SMOKE_SECONDS durata massima della partita   (default: 25)
#
# Il controllo è volutamente solo sul testo del log: "SCRIPT ERROR" e "Parse Error"
# sono gli errori che in Godot 4 un file .gd rotto produce davvero a runtime.
# In headless non c'è un renderer, quindi gli errori di shader non si vedono qui.
set -euo pipefail

GODOT_BIN="${GODOT_BIN:-$HOME/godot/godot}"
PROJECT_DIR="${PROJECT_DIR:-src}"
LOG_DIR="${LOG_DIR:-build/ci-logs}"
SMOKE_SECONDS="${SMOKE_SECONDS:-25}"
FATAL_PATTERN='SCRIPT ERROR|Parse Error'

mkdir -p "$LOG_DIR"

echo "::group::Importazione delle risorse"
# Su un clone pulito .godot/imported non esiste: senza questo passo le texture
# non sono importate e la partita parte con errori di risorse mancanti.
if ! "$GODOT_BIN" --headless --path "$PROJECT_DIR" --import > "$LOG_DIR/import.log" 2>&1; then
	cat "$LOG_DIR/import.log"
	echo "::endgroup::"
	echo "::error::L'importazione del progetto è fallita (vedi import.log)"
	exit 1
fi
tail -n 20 "$LOG_DIR/import.log"
echo "::endgroup::"

echo "::group::Prova di avvio (${SMOKE_SECONDS} s)"
# Il gioco non si chiude da solo: il timeout (codice 124) è l'esito normale.
set +e
timeout --kill-after=5 "$SMOKE_SECONDS" \
	"$GODOT_BIN" --headless --path "$PROJECT_DIR" -- --play --room=0 --demo \
	> "$LOG_DIR/smoke.log" 2>&1
status=$?
set -e
tail -n 40 "$LOG_DIR/smoke.log"
echo "::endgroup::"

failed=0

if grep -E -n "$FATAL_PATTERN" "$LOG_DIR/smoke.log" "$LOG_DIR/import.log" > "$LOG_DIR/errori.txt"; then
	echo "::error::Errori di script nel log di avvio:"
	head -n 40 "$LOG_DIR/errori.txt"
	failed=1
else
	rm -f "$LOG_DIR/errori.txt"
fi

case "$status" in
	124) ;;  # arrivato al timeout: il gioco girava ancora
	0)   echo "::warning::Il gioco si è chiuso da solo prima del timeout (codice 0)." ;;
	*)   echo "::error::Il gioco è terminato in modo anomalo (codice ${status})."
	     failed=1 ;;
esac

# Gli altri "ERROR:" / "WARNING:" del motore non bloccano, ma li riassumo (messaggio e
# numero di ripetizioni) così non restano sepolti nel log.
if grep -E -q '^(ERROR|WARNING):' "$LOG_DIR/smoke.log"; then
	echo "Messaggi ERROR/WARNING del motore nel log di avvio (non bloccanti):"
	grep -E '^(ERROR|WARNING):' "$LOG_DIR/smoke.log" | sort | uniq -c | sort -rn | head -n 10 || true
fi

# Test automatici: ogni tests/**/*_test.gd è un piccolo esecutore (extends SceneTree)
# che esce con 0 se passa. Il progetto non usa ancora gdUnit4.
echo "::group::Test automatici"
while IFS= read -r test_file; do
	name="$(basename "$test_file" .gd)"
	if timeout --kill-after=5 180 "$GODOT_BIN" --headless --path "$PROJECT_DIR" -s "$(realpath "$test_file")" \
		> "$LOG_DIR/test-$name.log" 2>&1; then
		echo "superato: $test_file"
	else
		echo "::error::Test fallito: $test_file (vedi test-$name.log)"
		tail -n 30 "$LOG_DIR/test-$name.log"
		failed=1
	fi
done < <(find tests -name '*_test.gd' 2>/dev/null | sort)
echo "::endgroup::"

if [[ $failed -ne 0 ]]; then
	exit 1
fi
echo "Prova di avvio e test superati."
