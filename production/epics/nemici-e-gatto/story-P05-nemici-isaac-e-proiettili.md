# Story P05: Nemici alla Isaac del Teatro e proiettili nemici

> **Epic**: Nemici e Gatto dei Quattro Canti
> **Status**: Done
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-09

## Context

**Perché esiste**: l'autore ha scritto nel Teatro (`gioco/teatro_marionette.html`, loop ~4619-4712, `popolaStanzaIsaac` ~3229,
`innescaEsplosioneBomba` ~3592, proiettili ~4398) il bestiario alla Isaac del nuovo design: vespa cieca, gatto che balza,
maschera corazzata (Host), bozzo esplosivo (La Bomba Ferma), guardia con la doppietta, statua torretta a croci, predoni dorati
della segreta, e i proiettili nemici che feriscono mezza maschera o intera. Il comando è «porta tutto sul nuovo motore». Questa
storia porta nel motore i comportamenti e i numeri del Teatro, trascritti in `nemici.json`, dentro la macchina a stati e il
direttore dei gettoni già esistenti (storie 019-020), e chiude la 021 (la statua e la guardia del GDD vecchio erano corpo a corpo:
il Teatro vince sulla regola).

**Fonte delle regole**: il Teatro. **Fonte dell'architettura**: `docs/architecture/architecture.md`, ADR-0002 (dati, eventi),
ADR-0003 (rng seminato). **Regola dell'autore (2026-11-08)**: nessun segno a terra che anticipi un attacco; il nemico si legge solo
dal corpo (postura di anticipo, occhi rossi nel lampo).

**Engine**: Web (browser): Canvas 2D, ES modules | **Risk**: LOW

---

## Acceptance Criteria

- [x] GIVEN `nemici.json`, WHEN si leggono le schede, THEN ci sono sette archetipi (gatto, vespa, statua, guardia + `maschera`, `bomba`,
      `predone`) che passano `validaSchede` (R2/R4, pezzi 3-6, sparo/esplosione mai con `avanza`, esplosione imparabile) e il blocco
      `proiettili_nemici` (velocità 185 px/s, gittata 360, r 6, danno per piano 1/1/2/2/2 maschere, boss 2); nessun numero nel codice
- [x] GIVEN una maschera, WHEN è chiusa (fuori da anticipo/lampo/colpo/recupero), THEN subisce solo `corazza.frazione_danno` (0,12) e
      ignora la spinta; WHEN attacca, THEN si apre nell'anticipo (gettone), lampo, ventaglio di 3 colpi su 25°, resta aperta nel
      recupero e si richiude per il cooldown; il colpo centrale ferisce Ferruccio di `danno.p1`; il corpo non si muove
- [x] GIVEN una guardia, WHEN attacca, THEN spara una doppietta di 2 colpi mirati (14° di apertura) con la linea di tiro libera, tenendo
      `d_attesa`; WHEN Ferruccio para un colpo, THEN il proiettile è riflesso (`danno_riflesso`, `v_riflesso`), torna a ferire la guardia e si spegne
- [x] GIVEN una statua, WHEN attacca, THEN non chiede il gettone, lancia 4 croci a `+` e la salva seguente a `×`, anche senza linea di
      vista; i proiettili si spengono sugli ostacoli e sui muri (motivo `ostacolo`) e non raggiungono Ferruccio dietro la colonna
- [x] GIVEN una bomba, WHEN Ferruccio è oltre `d_max` (93 px), THEN resta inerte; WHEN entra, THEN la miccia (anticipo 400 + lampo 350 ms,
      imparabile, senza gettone) e il Colpo è l'esplosione: danno pesante entro `r_giocatore`, `danno_nemici` (4) ai nemici entro
      `r_nemici`, 6 schegge radiali, `nemico.esplosione`, la bomba muore; uccisa prima esplode comunque, una sola volta
- [x] GIVEN un predone, THEN è `dorato` e le monete dei payload `nemico.morto` / `nemico.bottino` sono × `drop.molt_monete_dorato`
- [x] GIVEN un proiettile nemico, WHEN il fendente attivo lo tocca, THEN si spegne (motivo `spada`); a fine gittata `gittata`;
      `cancellaInRaggio` (Tamburello) e `potaSpenti` funzionano sulla lista condivisa
- [x] GIVEN il bot QA (para balzi e proiettili in arrivo, innesca le bombe e si allontana), WHEN gioca 30 stanze miste da 3 nemici con
      seme fisso, THEN tutte pulite, mai morto, maschere perse in media ≤ 1 per stanza (misurate 0,73; durata media 10,3 s)
- [x] GIVEN `?debug=1&piano=1&seme=1845&nemico=<archetipo>`, WHEN si guarda il lampo, THEN il telegrafo è solo sul corpo (postura e
      occhi rossi), nessun segno a terra nel renderer; screenshot `production/qa/evidence/nemici-<archetipo>.png` per i sette archetipi
      (guardati: maschera aperta con occhi rossi, bomba con la scintilla; nessun corridoio, cuneo o cerchio a terra)
- [x] GIVEN i modelli `pd-n-07..10`, THEN le tavolozze comprendono maschera e bomba (come `popolaStanzaIsaac` mescola i sei tipi) e
      `modelli.js` ammette i nuovi archetipi; `seme.js 200` senza violatori
- [ ] GIVEN la vespa cieca del Teatro (vola contro di te senza sparare), THEN danno da contatto — NON fatto: il motore tiene la regola
      §2.2 del GDD (contatto passivo innocuo) e la picchiata telegrafata della 019; solo il gatto ha i numeri del Teatro allineati (cooldown 1100 ms)

---

## Implementation Notes

- `contenuti/parametri/nemici.json`: `proiettili_nemici`, `drop.molt_monete_dorato`, schede `maschera`/`bomba`/`predone`, statua e guardia
  riscritte come tiratori (`sparo`), `attacco.senza_gettone`, gatto `t_cd` 1100. Conversione dal Teatro: arena 488 px → campo 704 px (×1,45),
  60 fps → ms; «mezza maschera» del Teatro = maschera comune del motore (come già per il Colpo).
- `attori/ia/sparo.js` (nuovo, puro): `direzioniVentaglio`, `direzioniRadiali`, `direzioniSalva`.
- `attori/proiettili-nemici.js` (nuovo): `creaProiettileNemico` (contratto `{x, y, r, vivo, nemico, direzione, riflesso, motivo, tick, rifletti, cancella}`),
  `cancellaInRaggio`, `potaSpenti`. Parata: la regola 11 del motore vale (riflesso); il Teatro cancella i proiettili con la spada: entrambe.
- `attori/nemico.js`: blocchi facoltativi `sparo`/`esplosione`/`corazza`, `schedaProiettiliNemici`, `spara()`, `esplodi()`, corazza in
  `colpisci`, `aperta()`, flag `dorato`, nuovi getter; `creaNemico({…, proiettili, spada})`. `attori/ia/base.js`: `senzaGettone`.
- `mondo/modelli.js`: `ARCHETIPI` esteso; modelli `pd-n-07..10`.
- `resa/pixel-sprites.js`: sprite `bomba` (due frame, scintilla) e `predone` (guardia in oro) in un blocco delimitato; il renderer
  già disegnava il telegrafo solo sul corpo (nessun `segnoATerra` nel renderer pixel-art; resta in `debug.js` per il fil di ferro).
- `avvio.js` (blocchi `// --- squadra nemici ---`): `proiettili` e `spada` alla factory, `potaSpenti` a ogni tick della notte, `&nemico=` con il piano.
- Minimappa a esplorazione: il renderer dell'autore mostrava già solo le stanze visitate (controllato, non toccato).

## Evidenza

- `node gioco/qa/nemici.test.mjs` → 32/32 (`# bot misto: maschere perse 22 (0.73 per stanza); durata media 10.26 s, max 24.17; non pulite 0; morti 0`)
- `node gioco/qa/nemici.wire.test.js` → 7/7, screenshot `production/qa/evidence/nemici-{gatto,vespa,statua,guardia,maschera,bomba,predone}.png`
- Tutte le altre suite verdi (node:test, Playwright, `parametri.test.js`, `pagina.test.js`, `vetrina.test.js`, `pacchetto.test.js`, `stati64.js`, `seme.js 200`); `grep Math.random gioco/motore` vuoto.

## Decisioni

- Statua e bomba non chiedono il gettone al direttore (`senza_gettone`): nel Teatro sparano a cadenza fissa come pericoli ambientali; con un
  solo gettone al piano 1 avrebbero affamato gli altri attaccanti. Guardia e maschera lo chiedono.
- I cicli dei tiratori nel motore (≈1,9-2,1 s) sono più lenti dei 68-92 frame del Teatro: il telegrafo in tre tempi non si comprime sotto R2/R4.
- Il proiettile che trova Ferruccio invulnerabile continua a volare (Teatro); quello riflesso ferisce il primo nemico vivo che tocca, non solo chi ha sparato.
- La segreta con i predoni (tavolozza di `pd-s-01`, monete) è della squadra oggetti/segreta: qui c'è l'archetipo, il flag `dorato` e il payload.
- Il Tamburello usa `cancellaInRaggio(proiettili, {x, y, raggio})` (squadra oggetti); `nemico.esplosione` {x, y} è l'evento per aprire il muro segreto.
