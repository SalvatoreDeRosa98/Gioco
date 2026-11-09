# Story P15: Cuciture fra squadre — segreta che combatte, esplosione sulla Crepa, Tamburello, eventi dei boss, zero numeri nello sparo

> **Epic**: Nemici e Gatto dei Quattro Canti
> **Status**: Done
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-09

## Context

**Perché esiste**: il porting del Teatro (`gioco/teatro_marionette.html`) è stato fatto da squadre parallele (personaggi, nemici,
oggetti, disegni). Fra una squadra e l'altra sono rimaste cuciture aperte, ognuna segnata nei commenti o nel README: la Stanza
Segreta non combatteva («i mob dorati spettano alla squadra nemici»), l'esplosione della Bomba Ferma non apriva la Crepa Dorata
(il Teatro lo fa in `innescaEsplosioneBomba` ~3604), feel e audio ascoltavano un evento-ponte (`bomba.esplosione`) riemesso da
`avvio.js`, il Tamburello azzerava la lista dei proiettili invece di chiamare `cancellaInRaggio`, e `sparaProiettili` teneva
sette numeri di gioco come fallback nel codice. Il **passo C** del piano di integrazione le chiude tutte, con i numeri del Teatro
trascritti in JSON.

**Fonte delle regole**: il Teatro (`popolaStanzaIsaac` 'segreta' ~3291: `nMobSoldi = 4 + min(2, floor(piano × 0,5))`, predoni
dorati; `verificaStanzaPulita` ~3718: 3 monete al centro della segreta ripulita; `innescaEsplosioneBomba` ~3604: la crepa si apre
se l'esplosione è a < 95 px dal centro del muro segreto; `usaOggettoAttivo` ~2771: il Tamburello azzera tutti i proiettili nemici e
respinge i mostri). **Fonte dell'architettura**: `docs/architecture/architecture.md`, ADR-0002 (dati, eventi), ADR-0003 (rng seminato).
**Regola dell'autore (2026-11-08)**: nessun segno a terra; qui non si tocca nulla di visibile.

**Engine**: Web (browser): Canvas 2D, ES modules | **Risk**: LOW

---

## Acceptance Criteria

- [x] GIVEN `TIPI_COMBATTIMENTO` (mondo/stanza.js), WHEN si legge, THEN include `segreta`; `pd-s-01` ha 8 punti di nascita e una tavolozza
      di soli `predone` (flag `dorato` in nemici.json); `nNemiciSegreta` = `n_base + min(n_extra_max, floor(p × n_per_piano))` da
      `stanze.json › segreta` (4 al piano 1, 5 ai piani 2-3, 6 dal 4), in **una sola ondata** (`mondo.test.mjs` «P15 segreta»)
- [x] GIVEN la segreta montata, WHEN Ferruccio entra, THEN `annuncio`, `stanza.chiusa` a `t_chiusura_porte`, `nNemiciSegreta` predoni
      nati nell'ondata 1, e dopo l'ultima morte `stanza.pulita {tipo: 'segreta', combattuta: true}` con le porte riaperte
- [x] GIVEN il bottino di un nemico `dorato`, WHEN cade (`oggetti/economia.js › suBottino`), THEN vale × `nemici.drop.molt_monete_dorato`
      rispetto allo stesso seme senza flag; senza nemici.json caricato il moltiplicatore non esiste (`mondo.test.mjs` «P15 economia»)
- [x] GIVEN la segreta ripulita, THEN lascia **anche** `economia.monete_segreta` monete al centro: il Teatro lo fa
      (`spawnaMonetaATerra(st, 320, 165, 3)` oltre al bottino dei predoni), quindi `segreta.js` lo conserva (decisione documentata nel suo header)
- [x] GIVEN una Bomba Ferma che esplode entro `esplosione.r_crepa` (138 px = 95 del Teatro × 1,45) dal rettangolo della finestra, WHEN la
      stanza è pulita, THEN la crepa si apre per la stessa via del colpo (`apri()`: porte sui due record, stanza rimontata senza muovere
      Ferruccio, `segreta.aperta`); oltre il raggio no; durante il combattimento l'apertura resta `inAttesa` e scatta al primo tick da
      `pulita` (`nemici.test.mjs` «P15 esplosione → Crepa Dorata»); il payload di `nemico.esplosione` porta `rCrepa`
- [x] GIVEN l'esplosione, THEN Ferruccio entro `r_giocatore` subisce il danno pesante imparabile — già così in `attori/nemico.js › esplodi`,
      verificato dal test P05 della bomba (nessuna modifica)
- [x] GIVEN i nomi degli eventi, THEN esiste **un solo evento** per l'esplosione: `nemico.esplosione` {x, y, rGiocatore, rNemici, rCrepa,
      schegge}; `resa/feel.js` (scossa `scossa.bomba_px`) e `audio/eventi-audio.js` (tonfo) lo ascoltano direttamente; il ponte
      `nemico.esplosione → bomba.esplosione` di avvio.js e le voci `esplosione`/`bomba.esplosione` della MAPPA_EVENTI sono rimossi
      (`feel.test.mjs`, `audio.test.mjs` aggiornati al nome unico)
- [x] GIVEN il Tamburello, WHEN si usa, THEN chiama `cancellaInRaggio` (attori/proiettili-nemici.js) con `raggio_proiettili` di
      oggetti-attivi.json (1500 px: copre la scena come il Teatro che li azzera tutti), i nemici entro `raggio` sono respinti radialmente
      con `spinta`, `attivo.usato` porta `cancellati` (`attivi.test.mjs` A4 e «P15 tamburello»)
- [x] GIVEN il Re-Gatto, WHEN atterra dal balzo, THEN emette `boss.atterraggio {x, y}`; GIVEN le Mani di Donna Luciana, WHEN si schiantano,
      THEN `boss.mani_schianto {x, y, mani[]}` — già emessi da `attori/boss/re-gatto.js` e `donna-luciana.js`, ora coperti anche in
      `nemici.test.mjs` «P15 feel dei boss» con il controllo del payload
- [x] GIVEN la maschera, THEN espone `aperta` (booleano: chiusa a riposo, aperta nell'anticipo); il proiettile nemico espone `riflesso`
      (falso in volo, vero dopo `rifletti`, stato `riflesso`) — contratto per la squadra sprite (`nemici.test.mjs` «P15 contratto»)
- [x] GIVEN `attori/combattimento.js › sparaProiettili`, THEN nessun letterale `?? 3.9 | 3 | 4 | 0.22 | 9 | 8 | 2` né `max(220, … × 3.4)`:
      i valori stanno in `combattimento.json › proiettile` (`scala_px`, `velocita_px_frame`, `r_base`, `offset_doppia`, `angolo_triplo`,
      `offset_bocca`, `alzata`, `portata_min`, `molt_portata`, `r_bersaglio_senza_raggio`) e un test legge il sorgente e li cerca
      (`combattimento.test.mjs` «P15 sparaProiettili»)
- [x] GIVEN le suite, THEN tutte verdi: ogni `*.test.mjs`, `parametri.test.js`, `pagina.test.js`, ogni `*.wire.test.js`, `vetrina.test.js`,
      `pacchetto.test.js`, `stati64.js`, `seme.js 200`, `grep Math.random gioco/motore` vuoto (`suite-completa.sh`)
- [x] GIVEN `oggetti.wire.test.js` (seme 1845), WHEN Ferruccio entra nella segreta aperta, THEN `combatte`, `nNemici` predoni tutti `dorato`,
      `stanza.chiusa`, poi `pulita` con le monete a terra; screenshot `production/qa/evidence/segreta-predoni.png` (guardato)
- [ ] Non fatto, fuori perimetro: la palette `P` di `resa/renderer.js` e il disegno della maschera aperta / del proiettile riflesso (squadra S)

## Evidenza

- `node gioco/qa/mondo.test.mjs` 24/24, `node gioco/qa/nemici.test.mjs` 35/35, `node gioco/qa/attivi.test.mjs` 8/8,
  `node gioco/qa/combattimento.test.mjs` 39/39, `node gioco/qa/feel.test.mjs` 7/7, `node gioco/qa/audio.test.mjs` 13/13,
  `node gioco/qa/economia.test.mjs` 14/14, `node gioco/qa/boss.test.mjs` 19/19, `node gioco/qa/architettura.test.mjs` 6/6,
  `node gioco/qa/parametri.test.js` 4/4; `bash gioco/qa/suite-completa.sh` → `FINE fail=0` (vedi `test_output` della consegna).
- `node gioco/qa/oggetti.wire.test.js` 1/1 → `production/qa/evidence/segreta-predoni.png` (predoni dorati nella segreta, porte chiuse).
- **Verifica indipendente (2026-11-09)**: l'albero era stato consegnato con tre PNG di evidenza (`prova-pagina`, `vetrina-stanze`,
  `vetrina-stanze-grigi`) riscritti da una seconda corsa della suite partita dopo il commit. Correzione: le suite Playwright riscrivono
  i PNG con byte diversi a ogni corsa, quindi dopo la corsa completa i PNG rigenerati si guardano e si committano come evidenza del
  build corrente (o si ripristinano con `git checkout`), `suite-completa.sh` ne stampa il conteggio e il README fissa la regola.

## Decisioni

- **Un solo nome di evento**: vince quello che emette lo stato (`nemico.esplosione`), non quello che il feel si aspettava
  (`bomba.esplosione`): meno ponti in avvio.js, nessun doppio payload; i dati `resa.scossa.bomba_*` restano con il loro nome.
- **Esplosione durante il combattimento**: il Teatro apre il muro subito; il motore rimonta la stanza in `apri()`, cosa che durante
  un'ondata resetterebbe lo stato: l'apertura è quindi messa `inAttesa` e scatta al primo tick da `pulita` (le porte sono chiuse comunque,
  quindi il giocatore non perde nulla). Cambiando stanza l'attesa decade.
- **`monete_segreta` conservate**: il Teatro paga la segreta ripulita con 3 monete al centro **oltre** al bottino dei predoni dorati, quindi
  la regola resta (2 monete piccole di `economia.json`, valore da confermare con il game-designer).
- **Bottino dorato in economia**: `economia.js` ignora da sempre le monete calcolate dal nemico e tira dalla sua tabella; il flag `dorato`
  del payload moltiplica quel tiro (× `molt_monete_dorato`), con guardia `parametri.ha` per i mondi di prova senza nemici.json.
- **`r_bersaglio_senza_raggio`**: il `b.r ?? 20` del colpo dei proiettili era un numero di gioco nascosto; ora è in `combattimento.json`.
- `TIPO_SEGRETA_COMBATTE` in stanza.js è un id di tipo (come `TIPO_BOSS`), non una stringa di gioco.
