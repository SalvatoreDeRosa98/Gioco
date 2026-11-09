# Story P04: Menu di selezione, statistiche alla Isaac e sparo con le frecce (porting del Teatro, prima tranche di funzionalità)

> **Epic**: Interfaccia e QA (copre parte della 032 «Menu, slot, Continua»)
> **Status**: In Progress
> **Layer**: interfaccia (`motore/interfaccia/menu.js`, `stile/menu.css`), attori (`attori/statistiche.js`, `attori/combattimento.js`,
> `attori/ferruccio.js`), composizione (`avvio.js`), contenuti (`personaggi.json`, `oggetti-attivi.json`, `patto.json`, `boss.json`,
> `input.json`, `interfaccia.json › menu`, blocco `teatro` in `doni.json`)
> **Type**: UI + Logic
> **Estimate**: L
> **Manifest Version**: N/A
> **Last Updated**: 2026-11-09

## Context

**Fonte delle regole**: `gioco/teatro_marionette.html` — `PERSONAGGI_GIOCABILI` (~2360), `OGGETTI_ATTIVI` (~2381),
`CATALOGO_PATTO` (~2397), `POOL_BOSS`/`BOSS_FINALE` (~2515), `ricalcolaStatisticheIsaac` (~2652-2700), input (~2853),
attacco a 4 direzioni e proiettili (~3525-3680), `disegnaMenuSelezionePersonaggio` (~4042).
**Requirement**: il comando dell'autore «porta tutto sul nuovo motore». Questa storia porta il menu iniziale, le statistiche
per personaggio e lo sparo con le frecce, e trascrive in JSON le tabelle del Teatro che servono a queste tre cose (mai come
costanti nel codice). Il motore conserva hub, dialoghi, stato narrativo, Medaglione, notte salvata e profilo: il menu
precede l'hub, non lo sostituisce.
**ADR**: ADR-0001 (interfaccia in DOM sopra il canvas), ADR-0002 (parametri `{base,min,max}` e tabelle in `FILE_TABELLE`),
ADR-0003 (rng seminato: il pool dei boss è mescolato con `derivato(rng, 'boss-run')`).
**Regola dell'autore (2026-11-08)**: nessun segno a terra che anticipi un attacco. Applicata nel renderer alle righe toccate
(bersagli: niente striscia del balzo né anello del lampo: postura accucciata in `anticipo` e occhi rossi nel `lampo`; bracieri:
fiamma piena in `attivo`, braci in `anticipo`, nessun anello tratteggiato). `debug.js` (fil di ferro) non è grafica e non è
stato toccato.

---

## Acceptance Criteria

- [x] GIVEN `index.html` o `prova.html` senza parametri (meta `gioco-avvio` = `debug=1`), WHEN la pagina carica, THEN il ciclo è
  in `menu` e nel DOM c'è il menu (`.menu-teatro`) con le quattro carte di `personaggi.json` nell'ordine del JSON (nome, titolo,
  cuori da `hpHalf`, DMG e SPD calcolati, oggetto attivo e dono iniziale, descrizione), il predefinito evidenziato, i cinque slot
  con il riassunto (personaggio, notte, scintille, piano massimo) o «vuoto», «Cancella» con conferma in pagina
  (`pagina.test.js`, `prova.wire.test.js`; screenshot `menu-selezione.png`)
- [x] GIVEN il menu aperto, WHEN frecce/A-D o 1-4, Tab/W/S, Invio/Spazio o il mouse, THEN cambia personaggio, cambia slot, parte:
  il menu si nasconde, `personaggio.scelto` è emesso, il profilo dello slot ricorda il personaggio, il ciclo va in `hub` con le
  statistiche del personaggio applicate (maschere da `hpHalf`); uno slot diverso ricarica la pagina con `?slot=&personaggio=`
  (`pagina.test.js`: Invio senza debug, `__gioco.scegli` con debug)
- [x] GIVEN l'hub, WHEN `Esc` (azione `menu` di `input.json`) a dialogo chiuso, THEN si torna al menu (`apriMenu`) — provato in
  `menu.wire.test.js` (storia P05): scene automatiche chiuse con `avanza`, poi `premi('menu')` → ciclo in `menu`, menu visibile
- [x] GIVEN `&piano=N`, `&hub=1`, `&scena=`, `&slot=`, `&personaggio=`, WHEN la pagina carica, THEN il menu è saltato (tutte le suite
  Playwright esistenti restano verdi senza modifiche ai loro URL)
- [x] GIVEN i 4 personaggi e tre combinazioni di doni (blocco `teatro`) e patti, WHEN `calcolaStatistiche`, THEN DMG, SPD, cadenza
  (`cooldownTicks`), tipo e dimensione del proiettile, perforazione, overflow, bruciatura e catena coincidono con i valori
  calcolati a mano con le formule del Teatro; `applicaAlModificatori` li porta nei modificatori (`statistiche.test.mjs` 11/11)
- [x] GIVEN Ferruccio senza spada, WHEN una freccia è tenuta, THEN un proiettile parte in quella direzione ogni `cooldownTicks`
  (22 per Ferruccio) senza muoverlo; la freccia su mira in alto anche camminando a destra; Agnese spara coppie, Triplo Occhio
  ventagli di 3, Maschera dei 4 Venti in 4 direzioni; Anello → cremisi perforante, Tizzone → fuoco con bruciatura, Catena →
  fulmine al vicino, Piombo → overflow; con la spada (Taddeo) la freccia dà il fendente in quella direzione e J resta valido
  (`combattimento.test.mjs` 6 casi P04, 38/38)
- [x] GIVEN il renderer, WHEN un nemico è in `anticipo` o `lampo` o un braciere è in `anticipo`/`attivo`, THEN nessuna linea,
  corridoio, cerchio o anello a terra: solo postura, occhi rossi, fiamma (verificato nelle righe del renderer; nessun test
  visivo dedicato: lo screenshot `combattimento-wire.png` è del fil di ferro)
- [ ] GIVEN l'azione `attivo` (Q), WHEN premuta con una tacca carica, THEN l'effetto dell'oggetto attivo (`oggetti-attivi.json`:
  Forbici, Tamburello, Ampolla) e la ricarica per stanza — **non fatto**: la mappa dei tasti e la tabella ci sono, l'uso no
- [ ] GIVEN il Patto d'Ombra, WHEN si stringe una reliquia, THEN costa una maschera massima e applica `mod` — **non fatto**:
  `patto.json` e `statistiche.stringiPatto` esistono, non c'è un luogo nel gioco dove stringerlo
- [ ] GIVEN `boss.json`, WHEN si entra nella stanza del boss, THEN il boss del pool con il suo comportamento — **parziale**: il pool
  è letto dal JSON e mescolato a seme (prima costanti in `avvio.js`), ma il boss nasce ancora come gatto provvisorio (storia P01)
- [ ] GIVEN le quattro carte del menu, THEN ogni personaggio ha il proprio sprite — **non fatto**: tutte le carte usano
  `SPRITE_FERRUCCIO.idle0` (gli sprite dei personaggi arrivano con le illustrazioni)

---

## Evidenza

- `node gioco/qa/menu.wire.test.js` 2/2 (storia P05: menu → Agnese → slot 2 → hub con HUD `2/2` → Esc → menu; freccia destra spara senza muovere); `node gioco/qa/statistiche.test.mjs` 11/11; `node gioco/qa/combattimento.test.mjs` 38/38 (32 + 6 P04);
  `node gioco/qa/pagina.test.js` 5/5; `node gioco/qa/prova.wire.test.js` 2/2; `node gioco/qa/pacchetto.test.js` 6/6.
- Screenshot (deviceScaleFactor 1, `production/qa/evidence/`): `menu-selezione.png` (menu con le quattro carte e i cinque
  slot), `menu-slot.png` (Agnese e slot 2 evidenziati), `fondazione-pagina.png` (hub subito dopo la scelta), `prova-pagina.png`, `pacchetto-file.png`.
- Tutte le altre suite verdi (vedi la tabella della P03 e il README).

## Decisioni

- **Il menu non conosce il ciclo**: `creaMenu().apri()` ritorna una Promise con `{personaggio, slot}`; `avvio.js` applica la
  scelta (`applicaScelta`), entra nell'hub e cambia stato. I tasti del menu sono tasti dell'interfaccia (codici fisici), non
  azioni di `input.json`: finché il menu è aperto li cattura in fase di cattura e li ferma, così il gioco sotto non si muove.
  `applicaScelta` chiude il menu anche quando la scelta arriva da `__gioco.scegli` (difetto trovato dal test di pagina).
- **Slot = chiavi del salvataggio**: cambiare slot ricarica la pagina con `?slot=&personaggio=` perché profilo, stato narrativo
  e notte salvata sono legati allo slot alla composizione; cinque slot come nel Teatro (nomi di slot, non valori di gioco).
- **Un corpo, più schede**: le statistiche del personaggio si applicano al corpo unico (`ferruccio.js`) tramite i modificatori
  (`applicaAlModificatori`): nessun secondo attore. `hpHalf` → `maschere_max`, `baseDmg`/`baseSpd` → moltiplicatori.
- **Le frecce sparano, WASD muove, J resta** (Teatro): `spara_*` in `input.json`; con la spada in mano (Taddeo, o dopo il
  Medaglione) la freccia dà il fendente nella sua direzione invece del proiettile.
- **Tabelle del Teatro in JSON** (`FILE_TABELLE`): `personaggi.json` (con le costanti `isaac` come `{base,min,max}`),
  `oggetti-attivi.json`, `patto.json`, `boss.json` (con `seme_sale`, `passo_seme_run`, `piano_finale_nel_ciclo` che prima
  erano numeri in `avvio.js`); i 13 oggetti di `CATALOGO_OGGETTI` sono il blocco `teatro` dei doni corrispondenti in `doni.json`
  (`id_teatro`, `tier`, `mod`), così il catalogo resta uno.
- **Renderer**: tolti i segni a terra alle righe toccate (regola dell'autore); la palette `P` nel codice del renderer non è
  stata spostata nei token in questa storia (non peggiorata: i colori nuovi usano `P`).

## Da fare (prossime storie del porting)

Uso di Q (oggetti attivi, ricarica per stanza), Patto d'Ombra in gioco (stanza o altare), boss del pool come nemici veri con
i loro pattern (senza segni a terra), nemici alla Isaac (vespa cieca, maschera d'osso, bomba, guardia a doppiette, statua a
croci), stanza segreta con la crepa dorata, 5 slot passivi con sostituzione, sipario narrativo tra i piani
(`getRaccontoAtto`), ciclo infinito dopo il piano 4, sprite per personaggio nel menu, `PIANO_FINALE`/`Math.min(900, …)` di
`risveglio.js` e `rng() < 0.65` di `banchetto.js` in JSON (segnalati nella P03).
