#!/usr/bin/env bash
# tools/qa-avventura-percorsi.sh — la prova dei percorsi dell'avventura (motore vero, niente browser).
# 1. storia principale (le due «strade di fuori» chiuse): vicoli ciechi, 17 finali, le combinazioni delle sei decisioni;
#    scrive production/qa/avventura-cammini.json (il cammino più corto verso ogni finale, usato da qa-avventura-cammino.js);
# 2. ogni strada di fuori da sola, per ogni valore del flag da cui dipende, e tutte e due insieme: nessun vicolo cieco
#    fra il bivio e il ritorno al bivio.
# (Tutto insieme lo spazio degli stati non finisce: principale × zone facoltative. Le zone non tolgono né consumano
#  niente della storia principale, quindi provarle a parte non perde casi.)
# Esce con 1 se una delle prove trova problemi.
cd "$(dirname "$0")/.." || exit 2
rosso=0
filtro() { grep -E "^Esplorazione|Vicoli|VICOLI|Finali raggiunti|Combinazioni|Mai raggiunti|Zona|Cammino|TETTO|problem|✗|ATTENZIONE|SENZA FINALE|Errori" ; }
uscita="$(mktemp)"
echo "== storia principale =="
node tools/avventura-esplora.js --chiudi casertavecchia.salita,anfiteatro.arcate --cammini --json production/qa/avventura-cammini.json > "$uscita" 2>&1 || rosso=1
grep -v "^      " "$uscita" | grep -v "^  — " | filtro
zona() { # nome, meta, flag, chiusi
  echo "== $1 ($3) =="
  node tools/avventura-esplora.js --da strada.bivio --meta "$2" --flag "$3" --chiudi "$4" --max 2000000 2>&1 | filtro || true
  node tools/avventura-esplora.js --da strada.bivio --meta "$2" --flag "$3" --chiudi "$4" --max 2000000 > /dev/null 2>&1 || rosso=1
}
for t in perdonato accusato; do zona "Casertavecchia" campane-perdono "taddeo=$t" anfiteatro.arcate,leucio.arrivo,reggia.cancello; done
for a in "agnese=risvegliata,sciarpa=al-collo" "agnese=sognante,sciarpa=alla-bottega"; do zona "Anfiteatro" arena-dimenticati "$a" casertavecchia.salita,leucio.arrivo,reggia.cancello; done
for t in perdonato accusato; do for a in "agnese=risvegliata,sciarpa=al-collo" "agnese=sognante,sciarpa=alla-bottega"; do
  zona "le due strade insieme" campane-perdono,arena-dimenticati "taddeo=$t,$a" leucio.arrivo,reggia.cancello; done; done
[ "$rosso" = 0 ] && echo && echo "PERCORSI: nessun problema" || { echo; echo "PERCORSI: ci sono problemi"; }
exit $rosso
