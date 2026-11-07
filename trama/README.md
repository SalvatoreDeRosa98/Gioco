# Trama — Ferruccio: La Menzogna dei Borbone

Questa cartella è il fondamento del progetto: la storia e l'ambientazione, l'unica cosa sopravvissuta
alle versioni precedenti. Tutto il resto (genere, motore, grafica) si costruisce sopra questi file.

| File | Cos'è | Chi lo modifica |
|---|---|---|
| `ferruccio-bibbia.md` | La bibbia narrativa dell'autore: backstory 1839-1845, nove archi, sei scelte, due finali, 64 combinazioni, conclusione cinematografica, stato del mondo dopo i finali, espansioni. **Fonte di verità.** | Solo l'autore |
| `inizio-memoria-e-doni.md` | Decisioni dell'autore (10 ottobre 2026) che integrano la bibbia sull'inizio, sulla Fucina del Ricordo e sui doni. | Solo l'autore |
| `storia.json` | Mappa macchina derivata dalla bibbia: 81 scene, 259 battute verbatim, 6 flag + 3 derivati, tabelle degli esiti. La consumano gioco e strumenti. | Rigenerata o corretta a partire dalla bibbia |
| `mappa-scene.md` | La stessa mappa in forma leggibile: per capitolo, scene, condizioni, scelte, tabelle. | Derivata |
| `archivio-v1/` | Materiale delle versioni precedenti (dialoghi v1, art bible v1, brief dell'avventura v2) tenuto come riferimento. | Nessuno |

## Le sei variabili della storia (bibbia §XIX)

| Flag | Valori | Dove si decide |
|---|---|---|
| `tonino_ricordo` | restituito / negato | Piazza Dante |
| `taddeo` | perdonato / accusato | Corso Trieste |
| `registro` | conservato / bruciato | Villa Comunale |
| `agnese` | risvegliata / sognante | San Leucio |
| `gregorio` | dialogo / attacco | Reggia, prima del Custode (dialogo solo con prove) |
| `violante` | uccisa / risparmiata | Reggia, finale |

Derivati: `lettera_agnese` (tonino_ricordo = restituito), `lettera_mariella` (taddeo = perdonato),
`prove` (registro = conservato oppure taddeo = perdonato).

## Luoghi (tutti reali, Caserta 1845)

Piazza Dante · Corso Trieste · Villa Comunale · Belvedere di San Leucio · Cortile d'Onore della Reggia.
Espansioni previste dalla bibbia: Casertavecchia, Acquedotto Carolino, Santa Maria Capua Vetere.

## Dubbi aperti emersi dall'estrazione (da sottoporre all'autore)

1. La Fucina del Ricordo (decisioni del 10 ottobre) fa parlare Gaetano; la bibbia §VI lo vuole presente
   solo attraverso oggetti e ricordi.
2. La sciarpa: la bibbia la presuppone sempre addosso a Ferruccio; le decisioni del 10 ottobre la legano
   alla scelta su Agnese.
3. Nel vecchio gioco Violante era stata rinominata «Donna Luciana»; la bibbia dice Violante. Qui si usa
   Violante finché l'autore non decide.
4. Dove si legge la lettera di Mariella e dove si trova il disegno della Reggia incompleta non è detto.
