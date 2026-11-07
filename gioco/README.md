# gioco/ — Ferruccio: La Notte Immobile (motore web)

Pagina web statica: HTML, Canvas 2D, CSS, JavaScript a moduli ES, nessun build e nessuna
dipendenza. Architettura in `docs/architecture/architecture.md`; decisioni in ADR-0001/0002/0003.

## Avvio

Serve la cartella con un server statico (i moduli ES e `fetch` non funzionano da `file://`):

```sh
python3 -m http.server 8000 --directory gioco
# poi apri http://127.0.0.1:8000/
```

Parametri dell'URL:

| Parametro | Effetto |
|---|---|
| `?debug=1` | espone `window.__gioco` e scrive il numero di tick sul canvas |
| `?seme=1845` | seme della notte (senza, deriva dall'orologio) |
| `?debug=1&p.combattimento.portata=90` | override di un parametro (solo con `debug=1`; fuori range → errore in console e valore riportato nel range) |

`window.__gioco` (solo debug): `stato`, `tick(n)` (forza n tick, ritorna il contatore), `seme`,
`parametri` (`get`, `statistica`, `imposta`, `errori`, `tutti`), `eventi`, `input`, `ciclo`, `rng`,
`motoRidotto`, `imposta(flag, valore)` e `vaiA(stanza)` (ganci che rispondono `false` finché i
moduli dello stato narrativo e delle stanze non si registrano con `estendi(nome, fn)`).

## Test

```sh
node gioco/qa/fondazione.test.mjs   # unitari, senza browser (node:test)
node gioco/qa/pagina.test.js        # Playwright: avvia un server su porta libera, apre la pagina,
                                    # salva production/qa/evidence/fondazione-pagina.png
```

Entrambi escono con codice 1 se un caso fallisce. Il test di pagina usa il Chromium di Playwright
preinstallato; non eseguire `playwright install`.

## Struttura

```
gioco/
├── index.html                  pagina completa: <canvas id="scena"> 1280×720 logici + <div id="interfaccia">
├── stile/
│   ├── token.css               palette dell'art bible come variabili CSS (unico posto con i colori)
│   └── base.css                palco 16:9 senza scroll, canvas e interfaccia sovrapposti
├── motore/
│   ├── avvio.js                radice di composizione: carica i parametri, collega input e ciclo,
│   │                           renderer SEGNAPOSTO (sostituito dalla storia 005), window.__gioco
│   └── fondazione/
│       ├── tempo.js            passo fisso 16,667 ms, accumulatore, max 5 tick/frame, alpha, ticksDaMs
│       ├── ciclo.js            avvia/ferma, sistemi {tick(dt), disegna(alpha)}, stati menu|hub|notte|pausa
│       ├── input.js            tastiera, mouse (coordinate di scena), gamepad (zona morta);
│       │                       premuto/tenuto/rilasciato per azione, direzione() normalizzata
│       ├── rng.js              mulberry32: creaRng(seme), derivato(rng, etichetta), intero, scegli, mescola
│       ├── eventi.js           bus sincrono on/off/emit con errori isolati
│       └── parametri.js        JSON {base,min,max}, validazione, override da file e da URL (debug)
├── contenuti/parametri/
│   ├── ferruccio.json          statistiche del corpo (GDD controllo-ferruccio.md)
│   ├── combattimento.json      statistiche nominate del combattimento (GDD combattimento.md)
│   ├── input.json              mappa dei tasti per le 12 azioni del contratto
│   └── moto-ridotto.json       sovrascritture applicate con prefers-reduced-motion
└── qa/
    ├── fondazione.test.mjs     test unitari
    └── pagina.test.js          test Playwright
```

## Regole del codice

- Nessun numero di gioco nel motore: tutto in `contenuti/parametri/*.json` come `{base, min, max}`.
  `min`/`max` sono il clamp del valore **effettivo** dopo i doni (ADR-0002); dove il GDD dà un
  intervallo di uscita (es. `v_base` 150–330) si usa quello, altrimenti il Safe Range dei Tuning Knobs.
- Nessun generatore casuale nativo nel motore: solo `rng.js` (il test lo verifica con un grep).
- Nessuna stringa di gioco nel motore.
- Dipendenze solo verso il basso; verso l'alto si usano gli eventi.
- `tick(dt)` riceve `dt` in secondi (un passo fisso); i tempi dei GDD in ms si convertono una volta
  con `tempo.ticksDaMs`.
- L'input è il primo sistema registrato nel ciclo: `inizioTick()` fotografa i fronti prima degli altri.

## Valori provvisori da confermare con il game-designer

- `combattimento.larg_affondo` (32 px) e `combattimento.t_spinta_nemico` (150 ms): citati dal GDD
  senza numero.
- I `min`/`max` delle voci di feel (hit-stop, scossa, scie) e di `inclinazione_scatto_gradi`,
  `lampeggio_hz`, `mod_input_spinta`, `peso_inamovibile`: il GDD dà solo il valore corrente.
