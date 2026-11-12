#!/usr/bin/env bash
# tools/qa-teatro-tutte.sh — fa girare TUTTE le prove Playwright del Teatro (tools/qa-teatro-*.js), una alla volta.
#
# Uso:  tools/qa-teatro-tutte.sh [file html] [cartella per foto e registri]
#       file html  di norma gioco/teatro_marionette.html (va bene anche production/release/teatro.html)
#       cartella   di norma una cartella temporanea nuova; dentro: <suite>/x-*.png e <suite>.log
# Variabili:  QA_SUITE="tocco morte"  solo queste suite (nomi senza qa-teatro- e .js)
#             QA_TEMPI=stretti        passa alle suite le soglie di tempo assolute (macchina libera)
#             QA_TETTO=900            secondi massimi per suite (oltre: rossa)
# Stampa una riga per suite (verde/rossa, secondi, carico della macchina) e il totale; esce con 1 se una è rossa.
# Le suite c e d scrivono le foto in production/qa/evidence/teatro-{c,d}-*.png (immagini tracciate): alla fine
# lo script rimette a posto SOLO quei file (git checkout) e toglie quelli nuovi che hanno creato.
set -u
RADICE="$(cd "$(dirname "$0")/.." && pwd)"
HTML="${1:-gioco/teatro_marionette.html}"
USCITA="${2:-$(mktemp -d "${TMPDIR:-/tmp}/qa-teatro-tutte.XXXXXX")}"
TETTO="${QA_TETTO:-900}"
mkdir -p "$USCITA"
cd "$RADICE" || exit 2

if [ -n "${QA_SUITE:-}" ]; then
  SUITE=($QA_SUITE)
else
  SUITE=()
  for f in tools/qa-teatro-*.js; do
    n="$(basename "$f" .js)"; n="${n#qa-teatro-}"
    [ "$n" = "comune" ] && continue # modulo di attrezzi, non una suite
    SUITE+=("$n")
  done
fi

# foto tracciate che c e d riscrivono: si rimettono a posto anche se lo script viene interrotto
rimetti_foto() {
  git checkout -q -- 'production/qa/evidence/teatro-c-*.png' 'production/qa/evidence/teatro-d-*.png' 2>/dev/null
  git clean -q -f -- 'production/qa/evidence/teatro-c-*.png' 'production/qa/evidence/teatro-d-*.png' 2>/dev/null
}
trap rimetti_foto EXIT

rosse=0; inizio=$(date +%s)
printf '%-22s %-6s %6s  %s\n' "suite" "esito" "sec" "carico"
for s in "${SUITE[@]}"; do
  f="tools/qa-teatro-$s.js"
  if [ ! -f "$f" ]; then printf '%-22s %-6s\n' "$s" "manca"; rosse=$((rosse + 1)); continue; fi
  mkdir -p "$USCITA/$s"
  t0=$(date +%s)
  timeout "$TETTO" node "$f" "$HTML" "$USCITA/$s/x" > "$USCITA/$s.log" 2>&1
  rc=$?
  dt=$(( $(date +%s) - t0 ))
  if [ $rc -eq 0 ]; then esito=verde; else esito=ROSSA; rosse=$((rosse + 1)); fi
  [ $rc -eq 124 ] && esito="ROSSA(tetto)"
  printf '%-22s %-6s %6s  %s\n' "$s" "$esito" "$dt" "$(cut -d' ' -f1 /proc/loadavg)"
done
tot=$(( $(date +%s) - inizio ))
echo "totale: ${#SUITE[@]} suite, $(( ${#SUITE[@]} - rosse )) verdi, $rosse rosse, ${tot} s — registri in $USCITA"
if [ "$rosse" -eq 0 ]; then exit 0; else exit 1; fi
