#!/bin/bash
# gioco/qa/suite-completa.sh — Esegue tutte le suite di QA una dopo l'altra e riassume l'esito (storia P05).
# Uso: `bash gioco/qa/suite-completa.sh` dalla radice del repository. Esce con 1 se una suite è rossa.
cd "$(dirname "$0")/../.." || exit 1
fail=0
for f in gioco/qa/*.test.mjs; do
  out=$(node "$f" 2>&1); rc=$?
  echo "== $f rc=$rc $(echo "$out" | grep -E '^# (pass|fail)' | tr '\n' ' ')"
  if [ $rc -ne 0 ]; then fail=1; echo "$out" | tail -20; fi
done
for f in gioco/qa/parametri.test.js gioco/qa/pagina.test.js gioco/qa/*.wire.test.js gioco/qa/vetrina.test.js gioco/qa/pacchetto.test.js; do
  if [ ! -f "$f" ]; then echo "== $f ASSENTE"; continue; fi
  out=$(timeout 300 node "$f" 2>&1); rc=$?
  echo "== $f rc=$rc $(echo "$out" | grep -E 'casi verdi|^# ' | tail -1)"
  if [ $rc -ne 0 ]; then fail=1; echo "$out" | tail -20; fi
done
out=$(node gioco/qa/stati64.js 2>&1); echo "== stati64 rc=$? $(echo "$out" | tail -2 | tr '\n' ' ')"
out=$(node gioco/qa/seme.js 200 2>&1); echo "== seme rc=$? $(echo "$out" | tail -2 | tr '\n' ' ')"
echo "== Math.random nel motore: $(grep -rn 'Math.random' gioco/motore | wc -l)"
echo "FINE fail=$fail"
exit $fail
