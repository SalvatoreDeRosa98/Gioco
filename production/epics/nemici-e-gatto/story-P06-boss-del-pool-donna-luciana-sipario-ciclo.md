# Story P06: Boss del pool, Donna Luciana, sipario narrativo e ciclo infinito

> **Epic**: Nemici e Gatto dei Quattro Canti
> **Status**: Done
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: L
> **Manifest Version**: N/A (nessun control manifest: `/create-control-manifest` non eseguito)
> **Last Updated**: 2026-11-09

## Context

**Perché esiste**: l'autore ha scritto nel Teatro (`gioco/teatro_marionette.html`: `POOL_BOSS`/`BOSS_FINALE` ~2515, `getRaccontoAtto`
~2535, `moltCiclo`/`moltVel` ~3231, boss del piano ~3390, comportamenti dei boss nel `loop()` ~4448-4619, `disegnaSiparioNarrativo` ~5366)
il pool dei cinque boss alla Isaac, Donna Luciana come boss finale del piano 4, il sipario narrativo degli atti e il ciclo infinito.
Il comando è «porta tutto sul nuovo motore». Questa storia porta nel motore i pattern e i numeri del Teatro, trascritti in
`boss.json` e `nemici.json › boss`, sopra la fabbrica dei nemici (storia 019/P05), con lo stato della run in un modulo suo
(`mondo/run.js`). **Supera la storia 022** (il Gatto dei Quattro Canti del GDD vecchio: graffio a ventaglio, Caduta dei Quattro Canti) e
la **P01** provvisoria: il Gatto è ora il `re-gatto` del pool con il pattern `monstro_jump` del Teatro.

**Fonte delle regole**: il Teatro. **Fonte dell'architettura**: `docs/architecture/architecture.md`, ADR-0002 (dati, eventi),
ADR-0003 (rng seminato), ADR-0006 (profilo). **Regola dell'autore (2026-11-08)**: nessun segno a terra che anticipi un attacco; il
boss si legge solo dal corpo (postura di anticipo, occhi rossi nel lampo). **Regola dei fili (2026-11-09)**: due fili per marionetta,
già nel renderer (storia P11); nella stanza di Donna Luciana le Mani scese mantengono i fili verso le altre marionette.

**Engine**: Web (browser): Canvas 2D, ES modules | **Risk**: MEDIUM

---

## Acceptance Criteria

- [x] GIVEN `boss.json` e `nemici.json › boss`, WHEN si leggono, THEN cinque boss del pool + Donna Luciana con `pattern`, `idStoria`,
      `hpBaseTeatro`, e per ognuno una scheda numerica ({base,min,max}) con i cooldown del Teatro (anche `_furia`), più `comuni`
      (telegrafo sul corpo, contatto, quote del balzo); nessun numero di gioco nel codice (`boss.test.mjs` «contenuti»)
- [x] GIVEN la run, WHEN si calcola, THEN `pianoNelCiclo`, `ciclo`, `moltCiclo = 1,45^(c−1)`, `moltVelocita` con tetto, vita del boss
      `round((hpBase + (pnc−1)×45) × moltCiclo)` per i piani 1-9; Donna Luciana ai piani 4 e 8 con più vita al ciclo 2; i tre boss dei piani
      1-3 sono diversi, l'estrazione è deterministica per seme e cambia con il seme; `forzaBoss` vince (`boss.test.mjs` «run»)
- [x] GIVEN ogni pattern, WHEN gira 15 s con Ferruccio lontano, THEN emersione → `anticipo` → `lampo` → `colpo` (fasi con i nomi dell'IA:
      il renderer mostra postura e occhi rossi), `segnoATerra()` sempre null, proiettili con `danno_boss`, raggio scalato
- [x] GIVEN il Re Gatto, WHEN attacca, THEN il primo attacco è il balzo (quota ≥ 90 % di `quota_salto`, `boss.atterraggio`, rosa di 14 colpi
      a velocità diverse dal generatore derivato), in volo oltre `quota_immune` i colpi non lo feriscono, il secondo è il ventaglio di 7
- [x] GIVEN il Capitano, WHEN carica, THEN il corpo percorre > 100 px su un solo asse e all'arresto lascia un anello di 8 con scossa
- [x] GIVEN la Regina, WHEN gira, THEN rimbalza anche in anticipo, evoca vespe (archetipo `vespa`) mai oltre `max_vespe` comuni vivi, anello per salva
- [x] GIVEN il Custode, WHEN gira, THEN non si muove, spirale per salva, una bomba (archetipo `bomba`) ogni 3 salve dentro il campo, max 2
- [x] GIVEN il Maestro, WHEN attacca fuori furia, THEN 2 × 3 colpi specchiati attorno alla mira (forbici)
- [x] GIVEN Donna Luciana, WHEN attacca, THEN i ventagli partono dalle due Mani (±`scarto_mano_x`), schianto delle Mani (`boss.mani_schianto`) con anello di 10 alle salve pari
- [x] GIVEN il corpo del boss a contatto con Ferruccio (non in volo, non in emersione), THEN lo colpisce (`pesante`, parabile); una parata lo
      stordisce per `t_stordito_boss` e poi è immune per `t_immunita_boss`; il pattern riprende
- [x] GIVEN vita < 50 %, THEN i cooldown passano alle varianti `_furia` (intervallo fra due colpi più corto; quello normale = t_cd + t_anticipo + t_lampo + t_recupero)
- [x] GIVEN la stanza boss in pagina con `?boss=<id>` per ognuno dei sei id, THEN nasce il boss giusto (archetipo base, pattern, nome, vita della
      formula), agisce (fasi, proiettili o moto; il Custode fermo; il Re Gatto salta; le Mani di Donna Luciana schiantano), la barra della vita
      è nell'HUD (pixel oro della cornice), screenshot `boss-<id>.png`; zero errori in console (`boss.wire.test.js`)
- [x] GIVEN il `re-gatto` ucciso, THEN `boss.sconfitto` {id 're-gatto', archetipo 'gatto', pattern}, `boss_battuti` ha `gatto-dei-quattro-canti`,
      il Medaglione di Rosa cade (regola del motore conservata: archetipo gatto e `tonino_ricordo` null) e si raccoglie, l'uscita si apre →
      `piano.completato` → velo di discesa → **sipario dell'atto II** in DOM con il ciclo in `pausa` (titolo e righe da `interfaccia.json ›
      sipario`, «Piano 2 · 7 stanze + segreta»), screenshot `sipario.png`; `chiudi()` → notte al piano 2 della stessa run, Medaglione addosso
- [x] GIVEN Donna Luciana forzata al piano 1 con `?sipario=0`, WHEN muore, THEN `boss.finale_sconfitto`, `profilo.vittorie` +1, `ciclo_max`,
      `boss_battuti` ha `donna-luciana`; la discesa porta subito al piano 2 senza sipario (il ciclo continua: dopo il 4° piano si va al 5°)
- [x] GIVEN il sipario, THEN il racconto segue il piano nel ciclo (atti I-IV), il «BIS» al piano 1 dei cicli ≥ 2 con `+{bonus}%` dal
      moltiplicatore vero, il titolo dell'atto IV dal ciclo 2; nessun segnaposto resta; si alza con conferma/scatto, click, `chiudi()`
- [x] GIVEN il motore, THEN nessun `Math.random`; nomi, titoli e testi da `boss.json`/`interfaccia.json`; `debug.js` intatto
- [ ] GIVEN un boss del pool nell'hub/partita reale a mano, WHEN si gioca, THEN il duello «si sente» giusto (ritmo, danno, leggibilità): da
      provare con l'autore (nessun playtest a mano in questa storia; i tempi sono quelli del Teatro con il telegrafo in più)

## Evidenza

- `node gioco/qa/boss.test.mjs` → 19/19 (run, contenuti, sei pattern, tratti propri, contatto/parata, furia, sipario, regole)
- `node gioco/qa/boss.wire.test.js` → 8/8; screenshot (deviceScaleFactor 1, guardati con Read): `production/qa/evidence/boss-re-gatto.png`
  (il Gatto atterrato accanto a Ferruccio, barra in alto, filo dalle Mani), `boss-capitano-guardia.png`, `boss-regina-vespa.png`,
  `boss-colosso-statua.png`, `boss-maestro-fucina.png`, `boss-donna-luciana.png` (le due Mani scese ai suoi lati, proiettili dei
  ventagli e dell'anello, barra «Piano 1/4 — Donna Luciana»), `sipario.png` (cartellone dell'atto II con quinte rosse e bottone)
- Suite completa verde (`bash gioco/qa/suite-completa.sh`): tutte le `*.test.mjs`, `parametri.test.js`, `pagina.test.js`, tutte le
  `*.wire.test.js`, `vetrina.test.js`, `pacchetto.test.js`, `stati64.js`, `seme.js 200`, `grep Math.random` vuoto
- Test adeguati (non disabilitati): `economia.test.mjs` 025.3 e `notte.test.mjs` S04 (la busta del profilo ha ora `vittorie` e
  `ciclo_max`), `condizioni.test.mjs` S026-18 (copia identica di storia.json con Donna Luciana fra i boss)

## Decisioni

- **Pattern sopra la fabbrica**: `creaNemico` accetta `pattern` (factory `(ctx) => pattern`), `bossId`, `genera`, `moltVelocita`; con un
  pattern il tick fa girare il pattern al posto dell'IA fuori da emersione e stordimento; `stato`/`lampoAcceso`/`inTelegrafo`/`direzione`/
  `quota` vengono dal pattern. Così parata, stordimento del boss, morte, bottino, dissoluzione e i fili restano quelli di tutti i nemici.
- **Vita del boss = formula del Teatro** (`scala_vita_teatro` 1): il danno di Ferruccio è quello di `ricalcolaStatisticheIsaac`, quindi le
  vite del Teatro sono già nella scala giusta; `nemici.boss_provvisorio` resta per la P01 ma non è più usato dalla composizione.
- **Telegrafo aggiunto**: il Teatro attacca senza preavviso; la regola dell'autore chiede un corpo leggibile, quindi ogni attacco ha
  `t_anticipo` (320 ms, postura) + `t_lampo` (160 ms, occhi rossi) in `boss.comuni`. Mai un segno a terra.
- **Contatto**: nel Teatro ogni nemico ferisce al contatto; nel motore resta «contatto passivo innocuo» per i comuni (GDD) ma il corpo
  del boss ferisce (Teatro ~4705, `contatto_pesante` 1, parabile: la parata ha un ruolo contro i boss).
- **Spezzafili d'Ottone**: il Teatro dichiara `scissor_blades` ma il `loop()` non ha un ramo per `maestro-fucina` (resterebbe immobile);
  pattern scritto dal nome (forbici: due ventagli specchiati; anello in furia). Da confermare con l'autore.
- **Rotazioni delle spirali**: nel Teatro `phaseTick × 0,25 rad` conta i frame (di fatto pseudo-casuale); qui `rotazione_gradi × salva`.
- **Sipario**: a ogni `piano.discesa` e al «BIS»; non al piano 1 di una run, dove l'hub (obbligatorio) e le scene automatiche
  dell'ingresso fanno da atto I. `?sipario=0` per la QA. La chiusura richiama il gancio in modo sincrono (i test guidano il ciclo a tick).
- **Donna Luciana in storia.json**: aggiunta fra i `boss` (copia identica in `trama/storia.json`, come richiede S026-18) perché
  `boss_battuti` ammette solo id della storia; `capitano-guardia` e `maestro-fucina` non hanno un boss corrispondente nella storia
  (`idStoria` null: non entrano in `boss_battuti`). Da confermare con l'autore.
- **Profilo**: `vittorie` e `ciclo_max` (normalizzati, `registraVittoria`); il risveglio continua la discesa anche oltre `PIANO_FINALE`.
- **Fili**: nessun cambiamento ai fili della P11 (già due per marionetta, 1 px, oro al 30 %); il corpo in volo del Re Gatto porta i
  fili con sé (`piedi − quota`).
