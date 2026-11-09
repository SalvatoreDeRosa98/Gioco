# Story P05: Verifica di pagina del menu, degli slot e delle frecce; suite completa (porting del Teatro, chiusura del passo 1)

> **Epic**: Interfaccia e QA (chiude la 032 «Menu, slot, Continua» insieme a P03 e P04)
> **Status**: Done
> **Layer**: QA (`gioco/qa/menu.wire.test.js`, `gioco/qa/suite-completa.sh`), documentazione (`gioco/README.md`, storie 032 e P04)
> **Type**: UI + QA
> **Estimate**: S
> **Manifest Version**: N/A (nessun control manifest)
> **Last Updated**: 2026-11-09

## Context

**Fonte delle regole**: `gioco/teatro_marionette.html` — `PERSONAGGI_GIOCABILI` (~2360), `disegnaMenuSelezionePersonaggio` (~4042),
input a 4 direzioni (~2853, ~3525). **Requisito**: il passo 1 del porting (personaggi, menu, 5 slot, frecce, statistiche alla
Isaac) era già implementato nella storia P04 (dati in `personaggi.json`, `oggetti-attivi.json`, `patto.json`, `boss.json`,
stanze per piano 5/7/8/9 in `generazione.json`; `attori/statistiche.js`; `interfaccia/menu.js`; frecce in `input.json` e
`attori/combattimento.js`). Mancavano la **verifica di pagina** del percorso completo menu → hub → Esc → menu e dello sparo
con la freccia, chiesta dall'autore («menu.wire.test.js: index.html → menu visibile, scelta di Agnese con la tastiera, slot 2,
inizio → hub, HUD con 2 cuori; frecce sparano: proiettile emesso verso destra senza muoversi»), gli screenshot
`menu-selezione.png` e `menu-slot.png`, la chiusura formale della 032 e uno strumento che esegua tutte le suite in fila.
Nessuna riga del motore è cambiata: la verifica ha trovato il motore conforme.

**Richiesta dell'autore relé dal flusso**: «velocizza x 5» — il passo è stato chiuso con il minimo di scrittura: un test, uno
script, documentazione.

---

## Acceptance Criteria

- [x] GIVEN `index.html` senza parametri (meta `gioco-avvio` = `debug=1`), WHEN la pagina carica, THEN il ciclo è in `menu`,
  `.menu-teatro` è visibile con una `.menu-carta` per personaggio nell'ordine di `personaggi.json` e i cinque
  `.menu-slot-voce`, il predefinito evidenziato (`menu.wire.test.js` caso 1; screenshot `menu-selezione.png`)
- [x] GIVEN il menu, WHEN `Digit2` poi `ArrowDown`, THEN `menu().personaggio` è il secondo dell'ordine (Agnese) e `menu().slot`
  è `2`, carta e slot evidenziati nel DOM (screenshot `menu-slot.png`, guardato: carta di Agnese e «Slot 2» in oro)
- [x] GIVEN Agnese e lo slot 2, WHEN `Enter`, THEN la pagina ricarica con `?slot=2&personaggio=agnese` e parte nell'hub di
  Piazza Dante (ciclo `hub`, `hub.attivo`, menu chiuso), `statistiche.id` = `agnese`, maschere massime = `ceil(hpHalf/2)` = 2
  lette dal JSON (non fissate nel test), HUD `.hud-maschere .valore` = `2/2`
- [x] GIVEN l'hub con le scene automatiche della notte 1 chiuse con `avanza`, WHEN `premi('menu')` (Esc), THEN il ciclo torna in
  `menu`, il menu è visibile e ricorda personaggio e slot correnti
- [x] GIVEN `?debug=1&wire=1&piano=1&seme=1845&personaggio=ferruccio` (senza spada), WHEN `spara_destra` (ArrowRight) è tenuta per
  `2 × cooldownTicks + 2` tick, THEN almeno due proiettili con `vx > 0` e `vy = 0` e Ferruccio con `x`, `y` invariati
  (`menu.wire.test.js` caso 2)
- [x] GIVEN `bash gioco/qa/suite-completa.sh`, WHEN eseguito dalla radice, THEN tutte le suite (node:test, parametri, pagina, wire,
  vetrina, pacchetto, stati64, seme 200, grep `Math.random`) girano in fila e lo script esce con 1 se una è rossa
- [x] Zero errori in console in entrambi i casi; nessun `Math.random` nel motore; nessun test disabilitato o cancellato
- [ ] GIVEN le quattro carte, THEN ogni personaggio ha il proprio sprite — **non fatto** (resta nella P04: tutte le carte usano
  lo sprite di Ferruccio finché la squadra disegni non consegna gli sprite)
- [ ] Mezze maschere a schermo (cuori a metà come nel Teatro) — **non fatto**: il corpo conta maschere intere
  (`maschereMax = ceil(hpHalf/2)`, decisione della P04); l'HUD mostra `2/2`

---

## Evidenza

- `node gioco/qa/menu.wire.test.js` → `2/2 casi verdi`.
- `bash gioco/qa/suite-completa.sh` (2026-11-09): 14 suite node:test 257/257 (boss-provvisorio 5, combattimento 38, condizioni 37,
  doni.integrazione 9, doni 27, economia 13, fondazione 28, incontri 23, mondo 21, nemici 24, notte 9, prova 3, ricordi 9,
  statistiche 11); `parametri.test.js`, `pagina.test.js`, 11 suite `*.wire.test.js`, `vetrina.test.js`, `pacchetto.test.js`
  tutte rc=0; `stati64.js` 0 conflitti; `seme.js 200` 0 violatori; `grep Math.random gioco/motore` → 0.
- Screenshot (deviceScaleFactor 1, `production/qa/evidence/`): `menu-selezione.png`, `menu-slot.png`.

## Decisioni

- **Nessuna modifica al motore**: il passo 1 era già coperto dalla P04 (commit `bb48f43` e precedenti); questa storia aggiunge
  solo verifica e documentazione. Le tabelle che il comando chiedeva in `nemici.json` (pool dei boss, Donna Luciana) stanno in
  `boss.json` (scelta della P04: file dedicato in `FILE_TABELLE`), le stanze per piano 5/7/8/9 sono già i `n_min` per piano di
  `generazione.json`: non sono state duplicate.
- **Esc a dialogo aperto è ignorato** (regola della P04: `!incontri.dialogo()`): alla notte 1 l'hub apre da solo la targa, quindi
  il test chiude prima le scene automatiche con `avanza` rispettando `incontri.antirimbalzo`, come fa `hub.wire.test.js`.
- **Il cambio di slot ricarica la pagina** (`?slot=&personaggio=`): il test aspetta la nuova URL con `waitForURL` invece di
  cercare l'hub nella stessa pagina; è il comportamento documentato della P04 (profilo, stato narrativo e notte salvata sono
  legati allo slot alla composizione).
- **I valori attesi vengono dai JSON serviti** (`personaggi.json` per ordine, predefinito e `hpHalf`; `input.json` per
  `spara_destra`; `cooldownTicks` dalle statistiche vive): il test resta un test anche se l'autore cambia i numeri.
- **Da confermare con l'autore** (ereditato dalla P04): i dialoghi restano quelli di Ferruccio anche giocando Agnese, Taddeo o
  Pulcinella d'Ombra (il corpo è uno, cambia la scheda).
- **Storia 032 → Done tramite P03/P04/P05**: il design del menu è quello del Teatro (quattro carte, cinque slot) e non quello
  del GDD vecchio (tre slot, Nuova notte / Continua / Opzioni); le opzioni passano a una storia futura.
