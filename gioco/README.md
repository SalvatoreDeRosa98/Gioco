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
| `?debug=1&wire=1` | disegno DIAGNOSTICO in fil di ferro (`resa/debug.js`): pavimento 13×7, mura, Ferruccio, hitbox, fantocci; il ciclo entra subito in `notte` |
| `?debug=1&wire=1&fantoccio=attacca` | come sopra, con il fantoccio in basso che attacca a ciclo (anticipo 500 → lampo 150 → impatto a +252 ms) per provare la parata |
| `?debug=1&wire=1&piano=1&seme=1845` | storie 014-017: genera il piano 1 dal seme (`mondo/generazione.js`, modelli di `contenuti/modelli-stanza/piazza-dante/`), parte dall'ingresso; porte con stato, ostacoli, soglie, segnalini e fantocci segnaposto (`archetipo`) delle ondate, transizione della camera (250 ms), pianta del piano nell'angolo in alto a destra |

`window.__gioco` (solo debug): `stato`, `tick(n)` (forza n tick, ritorna il contatore), `seme`,
`parametri` (`get`, `statistica`, `imposta`, `errori`, `tutti`), `eventi`, `input`, `ciclo`, `rng`,
`motoRidotto`, `imposta(flag, valore)` e `vaiA(stanza)` (ganci che rispondono `false` finché i
moduli dello stato narrativo e delle stanze non si registrano con `estendi(nome, fn)`); dalle storie
007-011 anche `modificatori`, `campo`, `ferruccio`, `combattimento`, `bersagli`, `proiettili`, `wire`,
`tieni(azione)` / `lascia(azione)` e `premi(azione, n)` (giù, n tick forzati, su). Per un percorso
deterministico: `__gioco.ciclo.ferma()` e poi solo `tick`/`premi`. Con `?piano=N` (storie 014-017)
anche `piano` (la pianta), `stanza` (la stanza corrente: `stato`, `porte`, `segnalini`, `puntoArrivo`),
`notte` (`salvataggio()` = {seme, piano, stanza}, `statoDi(id)`), `camera` e `vaiA(id_stanza)` vero.

## Test

```sh
node gioco/qa/fondazione.test.mjs   # unitari, senza browser (node:test)
node gioco/qa/pagina.test.js        # Playwright: avvia un server su porta libera, apre la pagina,
                                    # salva production/qa/evidence/fondazione-pagina.png
node gioco/qa/combattimento.test.mjs      # unitari delle storie 007-011: ciclo simulato a tick fissi,
                                          # un caso per criterio Given-When-Then + prestazioni (20 bersagli)
node gioco/qa/combattimento.wire.test.js  # Playwright: ?debug=1&wire=1, cammina/colpisce/scatta/para,
                                          # salva production/qa/evidence/combattimento-wire.png
node gioco/qa/mondo.test.mjs              # unitari delle storie 014-017: porte, spawn (200 semi), colonna/panca,
                                          # stanza pulita, generazione (determinismo, 200 semi, riserva), camera
node gioco/qa/mondo.wire.test.js          # Playwright: ?debug=1&wire=1&piano=1&seme=1845, attraversa una porta,
                                          # pulisce una stanza; salva mondo-wire.png e mondo-pianta.png
node gioco/qa/seme.js 200 [--piano P] [--stampa K]   # genera N piani e riporta violatori e distribuzione dei tipi
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
│   │                           compone campo + Ferruccio + combattimento + fantocci, renderer
│   │                           SEGNAPOSTO (sostituito dalla storia 005) o debug wire, window.__gioco
│   ├── fondazione/
│   │   ├── tempo.js            passo fisso 16,667 ms, accumulatore, max 5 tick/frame, alpha, ticksDaMs
│   │   ├── ciclo.js            avvia/ferma, sistemi {tick(dt), disegna(alpha)}, stati menu|hub|notte|pausa
│   │   ├── input.js            tastiera, mouse (coordinate di scena), gamepad (zona morta);
│   │   │                       premuto/tenuto/rilasciato per azione, direzione() normalizzata
│   │   ├── rng.js              mulberry32: creaRng(seme), derivato(rng, etichetta), intero, scegli, mescola
│   │   ├── eventi.js           bus sincrono on/off/emit con errori isolati
│   │   └── parametri.js        JSON {base,min,max}, validazione, override da file e da URL (debug)
│   ├── oggetti/
│   │   └── modificatori.js     ADR-0002 minimo: valore(nome) = clamp((base+Σsomme)×Πmolt); applica()
│   │                           (la storia 023 aggiunge doni, flag e ganci)
│   ├── mondo/
│   │   ├── fisica.js           campo a griglia con mura/ostacoli, cerchio contro rettangoli con
│   │   │                       scivolamento, settore e rettangolo spazzato contro cerchi, linea di
│   │   │                       colpo, separazione dei cerchi (funzioni pure)
│   │   ├── modelli.js          legenda dei modelli di stanza, slot delle porte, vestibolo, validatore
│   │   │                       (regola 25), catalogo e caricatore (storie 014, 017)
│   │   ├── porte.js            porta: aperta/chiudendo/chiusa/aprendo, solido dinamico, attesa se occupata
│   │   ├── stanza.js           monta un modello nel campo condiviso; formule n_nemici/ondate/ricompensa;
│   │   │                       segnalini, anello di sicurezza, stati della stanza, eventi (storia 014)
│   │   ├── generazione.js      generaPiano puro dal seme: cammino, anelli, rami, foglie, doppie, modelli
│   │   │                       pesati, segreta, ricompense, H1-H10, Q, tentativi, riserva (storia 016)
│   │   ├── camera.js           scala min(1, L/larg, (A−hud)/alt), transizione 250 ms, inTransizione (015)
│   │   └── notte.js            piano + stanza corrente + passaggi; input ignorato in transizione; vaiA;
│   │                           salvataggio() = {seme, piano, stanza}
│   ├── attori/
│   │   ├── ferruccio.js        corpo: Fermo/Cammina/Scatta/Recupero scatto/Colpito/Morto, cariche,
│   │   │                       maschere, invulnerabilità, spinta (storie 007-008)
│   │   ├── combattimento.js    spada: Pronto/Fendente 1-3/Carica/Affondo/Parata/Controcolpo, buffer,
│   │   │                       combo, cancellazioni, danno decimale, ricevi(attacco) (storie 009-011)
│   │   └── bersaglio.js        contratto minimo dei bersagli, nemico FANTOCCIO con telegrafo in tre
│   │                           tempi e proiettile minimo (sostituiti dalle storie 019-020)
│   └── resa/
│       └── debug.js            disegno diagnostico in fil di ferro, solo con ?debug=1&wire=1
├── contenuti/parametri/
│   ├── ferruccio.json          statistiche del corpo (GDD controllo-ferruccio.md)
│   ├── combattimento.json      statistiche nominate del combattimento (GDD combattimento.md) + fantoccio
│   ├── stanza.json             griglia della stanza standard (13×7 celle da 64 px)
│   ├── stanze.json             regole della stanza (GDD stanze-porte: porte, spawn, ondate, ricompense, camera)
│   ├── generazione.json        parametri del generatore per piano (GDD generazione-piani)
│   ├── input.json              mappa dei tasti per le 12 azioni del contratto
│   └── moto-ridotto.json       sovrascritture applicate con prefers-reduced-motion
├── contenuti/modelli-stanza/piazza-dante/   14 modelli JSON del piano 1 + indice.json (storia 017)
├── contenuti/piani/piazza-dante-riserva.json piano di riserva disegnato a mano (esempio del GDD, Q = 100)
└── qa/
    ├── mondo.test.mjs / mondo.wire.test.js / seme.js   storie 014-017
    ├── fondazione.test.mjs          test unitari della fondazione
    ├── pagina.test.js               test Playwright della pagina
    ├── combattimento.test.mjs       test unitari delle storie 007-011
    └── combattimento.wire.test.js   test Playwright del modo wire
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
- Aggiunte dalle storie 007-011 (segnalate, da confermare): `combattimento.t_startup_affondo` (60),
  `t_recupero_affondo` (260), `lama_affondo` (46) dal prototipo; `t_buffer_parata` (0, manopola
  della storia 011); `v_riflesso` (380, da nemici.md); il gruppo `combattimento.fantoccio.*` (telegrafo
  del manichino: 500/150/252/200/700/1500, vita 6, r 16, peso 1); `stanza.json` (13×7×64).
- `armatura` esiste sia in `ferruccio.json` (0-1) sia in `combattimento.json` (0-2): la formula
  `danno_subito` legge `ferruccio.armatura`; va unificata con il game-designer (storia 023).
- Rampa di accelerazione: `v_eff / t_accel` lineare (regola 2). Con 60 ms la diagonale di 1 s da
  fermo dà 215,1 px: dentro i 220 ± 5 del criterio per 0,1 px. Se `t_accel` sale, il criterio salta.
