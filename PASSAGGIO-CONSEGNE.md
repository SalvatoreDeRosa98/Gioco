# Ferruccio — La Notte Immobile · passaggio di consegne (v5, bilanciamento Isaac, notti, fullscreen e menu ESC)

Aggiornato: 2026-11-09 · Branch: `claude/brave-cannon-ed3d3d` · Lavoro autonomo sul prototipo del Teatro (`teatro_marionette.html` e release `production/release/teatro.html`).

## Aggiornamento del 09/11/2026: Richieste Autore Soddisfatte

1. **Ripristino fedele degli sprite procedurali amati**:
   - Disattivati gli override da foglio sprite esterno (`t2Gancio`), tornando agli autentici sprite procedurali disegnati su canvas (il Gatto con accovacciamento e salto, la Vespa cieca con ali diafane, la Bomba ferma a miccia, la Statua di marmo, la Guardia borbonica, la Maschera d'osso, il Predone, e i 4 eroi).
   - Nessun proiettile o attacco è disegnato staticamente sul corpo dei personaggi o dei mob: ogni colpo (lacrime, spade, raggi, fiamme) è un'entità dinamica del sistema di combattimento.
2. **Conteggio delle notti persistente (`Notte 1, Notte 2, Notte 3...`)**:
   - Salvato in `localStorage` (`ferruccio_notte`).
   - Ad ogni morte o riavvio della run, il conteggio avanza e viene annunciato dal banner a schermo (`🌙 NOTTE X — Le maschere si sono spezzate... Risveglio!`), dal sipario narrativo dell'Atto I e nell'HUD in alto a sinistra.
3. **Rimozione Toolbar Sviluppatore & Schermo Intero**:
   - Rimossa completamente la barra superiore con i pulsanti di debug e teletrasporto.
   - Il palco si adatta a tutto schermo nel browser (`width: min(98vw, calc(98vh * 16 / 9))`), mantenendo le proporzioni 16:9 e la resa pixel-art nitida e pulita.
4. **Menù di Pausa e Impostazioni con `ESC`**:
   - Premendo `ESC` durante la partita si apre il menù di pausa a tema teatrale con:
     - `▶ RIPRENDI GIOCO [ESC / Click]`
     - `🔊 AUDIO: ON / MUTATO` (interattivo con un clic o tasto `M`)
     - `⛶ SCHERMO INTERO: ON / OFF` (attiva/disattiva fullscreen)
     - `🎲 RICOMINCIA NOTTE [R]` (fa partire una nuova notte)
     - `🎭 MENÙ PERSONAGGI` (torna alla selezione dei 4 protagonisti)
     - Promemoria comandi a piè di pagina.
5. **Bilanciamento Stanze e Regole Isaac**:
   - **Stanze normali**: NESSUN dono passivo gratis! La pulizia della stanza rilascia solo monete o mezze maschere e ricarica di +1 l'oggetto attivo `[Q]`.
   - **Densità e coerenza nemici**: Al Piano 1 compaiono solo 2 nemici per stanza (raramente 3 vespe). Ogni stanza segue un tema coerente (es. solo Gatti d'Ombra, solo Vespe cieche, solo Guardie, solo Maschere o Bozzi) evitando miscugli caotici. Probabilità campioni colorati abbassata al 5% al Piano 1.
   - **Stanza del Tesoro**: Esattamente 1 per piano, con 1 oggetto gratis sul piedistallo.
   - **Stanza Segreta**: Esattamente 1 per piano dietro la crepa dorata sul muro. Ha esattamente **1/3 di probabilità (33.3%)** di contenere un oggetto gratis sul piedistallo; se presente, c'è **1/5 di probabilità (20%)** che sia un oggetto di tier forte (`★`), altrimenti base. Se non c'è l'oggetto, contiene un ricco bottino sicuro di 3-5 monete d'oro e mezza maschera di cera, **senza mob aggressivi**.
   - **La Fucina (Shop)**: Esattamente 1 per piano per spendere le monete accumulate (mezze maschere, cuori, reliquie base e forti).
   - **Pulizia Visiva**: Ridotte macchie e schizzi a terra (max 16 per stanza a trasparenza lieve) e raggio/durata delle pozze di fuoco ridotti per garantire leggibilità tattica perfetta.

---

## Dove siamo: da due programmi a uno

Il 2026-11-08 l'autore ha consegnato un **prototipo completo del design nuovo, scritto da solo in un unico file**:
`gioco/teatro_marionette.html` (5423 righe; copia identica alla radice, `teatro_marionette.html`; **nessuna delle due si
tocca**). È un roguelike alla *The Binding of Isaac* in **pixel-art**, con menu di selezione di 4 personaggi, sparo a 4 direzioni
con le frecce, oggetti attivi con Q, 5 slot di passivi, Patto d'Ombra, Fucina, stanza segreta, nemici e boss alla Isaac, piani 1-4
in ciclo infinito, Donna Luciana boss finale, sipario narrativo, economia alla Isaac. Il suo comando: «porta tutto sul nuovo
motore, tutte le implementazioni».

Oggi i programmi sono **due**, con ruoli distinti e scritti in `gioco/README.md › Due programmi`:

- **il Teatro** (`gioco/teatro_marionette.html`) è il prototipo dell'autore e la **fonte delle regole e dei numeri**: nel dubbio
  su una regola vince lui;
- **il motore** (`gioco/motore/`, moduli ES, nessun build) è la **versione modulare di produzione**: nel dubbio su dove mettere
  una cosa vince la sua architettura (`docs/architecture/architecture.md`, ADR-0001..0006). Conserva ciò che il Teatro non ha:
  hub di Piazza Dante, dialoghi con cartiglio, stato narrativo e flag, Medaglione di Rosa, notte salvata, profilo.

Il porting è avvenuto in otto passi su rami di lavoro poi fusi (S1 personaggi e menu → F3 audio → F1 game feel → S3 nemici →
S2 oggetti → integrazione e fili → P4 boss → F4 audit), commit da `bb48f43` a `b810b5e`. Il flusso completo gira nel motore:
**menu (slot + personaggio) → hub di Piazza Dante → piano 1 → … → boss → sipario → piano successivo → Donna Luciana al 4° →
«BIS» e ciclo 2**, con morte e discesa finale che riportano all'hub. Stadio: **pre-produzione, logica del ciclo completo nel
motore con renderer pixel-art; grafica dei nemici/boss/oggetti ancora procedurale** (tier `standard`; `project.stage` dice ancora
`Concept` perché nessun `/gate-check` l'ha avanzato).

## Cosa è portato dal Teatro (e dove sta nel motore)

| Area del Teatro | Nel motore | Storia |
|---|---|---|
| Menu di selezione (4 personaggi, 5 slot, cancella con conferma) | `interfaccia/menu.js`, `stile/menu.css`, `personaggi.json`; meta `gioco-avvio` = `debug=1` sola, in `index.html` e `prova.html` | P03, P04, P05 (interfaccia) |
| Statistiche alla Isaac (`ricalcolaStatisticheIsaac`) | `attori/statistiche.js` applicate al corpo unico via modificatori | P04 (interfaccia) |
| Sparo a 4 direzioni con le frecce, proiettili senza spada | `attori/combattimento.js`, `input.json › spara_*` | P04 |
| Oggetti attivi con Q, ricarica per stanza | `oggetti/attivi.js`, `oggetti-attivi.json`, HUD DOM | P04 (doni) |
| 5 slot di passivi con sostituzione | `oggetti/slot.js` (modale DOM), `doni.json` a 25 voci | P04 (doni) |
| Patto d'Ombra (−1 maschera massima) | `oggetti/patto.js`, `patto.json`; **altare nella stanza del boss** dopo `boss.sconfitto`, 2 reliquie (Raggio Cremisi Continuo, Lacrime Spettrali) | P04, P09 |
| Fucina (negozio) | **è il banchetto di Tonino** (`oggetti/banchetto.js`): prezzi dell'autore cuore 3 / base 5 / forte 7 / consumabile 2 | P04, P09 |
| Stanza segreta e crepa dorata | `mondo/segreta.js`: finestra a stanza pulita, un colpo la apre, `monete_segreta` | P04 (doni) |
| Economia Isaac (5-8 monete al piano 1, drop, oggetti gratis) | `economia.json`, `oggetti/gratis.js` | P09 |
| Nemici alla Isaac (vespa, gatto, maschera d'osso, bomba, guardia a doppietta, statua a croci, predone dorato) | `nemici.json`, `attori/nemico.js`, `attori/ia/sparo.js`, `attori/proiettili-nemici.js` (parabili → riflessi) | P05 (nemici) |
| Pool di 5 boss + Donna Luciana, piani 5/7/8/9 in ciclo, formule di vita e velocità | `mondo/run.js`, `boss.json`, `attori/boss/<id>.js`, barra della vita in `renderer.js` | P06 |
| Sipario narrativo tra i piani (`getRaccontoAtto`) | `interfaccia/sipario.js`, testi in `interfaccia.json › sipario` | P06 |
| Renderer pixel-art (palco, Mani, hub, nemici, boss, HUD del boss) | `resa/renderer.js`, `resa/pixel-sprites.js` (portato dall'autore stesso); l'hub è disegnato dal renderer (`disegnaHubScena`, evidenza `fili-hub.png`) | — |
| Game feel (i-frames, hit-stop, knockback, scossa, macchie) | `resa/feel.js`, `ciclo.congela`, `resa.json`, `combattimento.json › feel` | P08 |
| Audio (il Teatro non ne ha: richiesta testuale) | `audio/sintesi.js`, `audio/eventi-audio.js`, `audio.json`; `M` muto | P10 |
| Fili delle marionette (richiesta 2026-11-09) | `resa/fili.js`: due fili per marionetta, uno per Mano, 1 px, oro al 30 % | P11 |
| Audit «lo stato non disegna, la resa non muta», passo fisso a 120 Hz | `qa/architettura.test.mjs`, `resa/impatti.js`, `resa/trasformazioni.js` | P12 |

Regole del codice rispettate nel porting: nessun `Math.random` (rng seminato), numeri in `contenuti/parametri/*.json` come
`{base,min,max}` o tabelle, stringhe in `interfaccia.json` e nei JSON dei contenuti, telegrafo **solo sul corpo**.

## Cosa manca o diverge dal Teatro (con onestà)

1. **Sprite PNG dei nemici, boss, oggetti, HUD e scena.** I 91 fogli definitivi stanno in `gioco/assets/sprite/` con il catalogo
   `contenuti/sprite.json`, ma oggi li usano solo il personaggio giocabile (foglio di gioco) e i ritratti del menu: nemici, boss,
   NPC e oggetti sono ancora disegnati proceduralmente da `pixel-sprites.js`. Serve un modulo `resa/sprite.js` che li carichi e li
   animi dal catalogo.
2. **HUD pixel-art del Teatro nel canvas** (nome · piano, maschere a mezzi cuori, danno, slot degli oggetti). Nel motore l'HUD è in
   DOM (economia, doni, attivo) più la barra del boss nel canvas; le **mezze maschere non si vedono** (il corpo conta maschere intere,
   `ceil(hpHalf/2)`). La storia P04 di `interfaccia-e-qa` resta **In Progress** per questo.
3. **Colori**: la palette `P` di `resa/renderer.js` è ancora in esadecimale nel codice invece che dai token di `stile/token.css`.
4. **Fallback numerici** residui in `attori/combattimento.js` da spostare nei JSON (segnalati dall'audit F4).
5. **Spezzafili d'Ottone**: nel `loop()` del Teatro non ha un ramo (resterebbe fermo); il pattern `scissor_blades` è scritto dal
   nome. La mappatura `idStoria` di `capitano-guardia` e `maestro-fucina` (senza boss corrispondente in `storia.json`) è da confermare.
6. **Sipario al piano 1 di una run**: non si alza (l'hub e le scene automatiche fanno da atto I). Decisione da confermare.
7. **Riserve della P04 (doni)**: niente stanza `patto` dedicata (è un altare nella stanza del boss); mob dorati solo come predone.
8. **Opzioni** (volume, moto ridotto, rimappatura) fuori dal menu; la 032 è chiusa tramite P03/P04/P05 con questa nota.
9. **Ritmo dei duelli con i boss**: i tempi sono quelli del Teatro più il telegrafo sul corpo; **nessun playtest a mano**: lo fa l'autore.
10. Le storie visive del presepe d'ombre (000, 005, 006, 013, tavola A/B/C) sono superate dalla direzione pixel-art e non vanno riprese così.

## Decisioni dell'autore registrate (2026-11-08/09)

Una voce per decisione, con fonte e luogo, in `production/session-logs/decision-log.md`. In sintesi:

- **Donna Luciana** al posto di Violante come boss finale, al 4° piano di ogni ciclo (chiude la domanda aperta della v3).
- **Pixel-art dark-fairytale** al posto del presepe d'ombre; 91 sprite sheets in `gioco/assets/sprite/`.
- **Sparo a 4 direzioni con le frecce**; WASD muove; la spada (Taddeo, o dopo il Medaglione) sostituisce il proiettile con il fendente.
- **Niente segni a terra degli attacchi**: nessuna zona tratteggiata, corridoio, cuneo o cerchio che anticipi un colpo; il nemico si
  legge dal corpo (postura, occhi o lampo rosso). Prevale sull'art bible §3 e sui GDD. I bracieri restano visibili senza anelli di anticipo.
- **4 piani (5/7/8/9 stanze) in ciclo infinito** con **pool di 5 boss** estratti senza ripetizione; dopo Donna Luciana il «BIS».
- **4 personaggi selezionabili** e 5 slot nel menu, che precede l'hub; l'**hub di Piazza Dante è obbligatorio e centrale**, mai saltato.
- **Economia alla Isaac**: 5-8 monete al piano 1, prezzi 3/5/7/2, drop del Teatro, oggetti gratis.
- **Oggetti attivi con Q** a ricarica per stanza, 5 slot con sostituzione, Patto d'Ombra, Fucina = banchetto di Tonino, segreta via crepa dorata.
- **Game feel**: i-frames ≥ 1 s con lampeggio e rimbalzo, hit-stop, knockback ∝ 1/peso, scossa contestuale, macchie per stanza.
- **Audio sintetizzato** a eventi con Web Audio, nessun file audio; `M` muto.
- **Due fili per marionetta**, uno dalla Mano sinistra e uno dalla destra, meno visibili (1 px, oro al 30 %); mai su Ferruccio e i giocabili.
- **Niente touch**: tastiera e gamepad.
- **Nessun playtest automatico**: l'autore prova da solo.

## Domande aperte per l'autore

1. **Mezze maschere nell'HUD**: le vuoi a mezzi cuori come nel Teatro (serve l'HUD pixel-art nel canvas) o bastano le maschere intere?
2. **Sipario al piano 1**: deve alzarsi anche alla prima discesa dall'hub, o l'hub fa da atto I?
3. **Spezzafili d'Ottone**: confermi il pattern a forbici scritto dal nome, visto che il Teatro non ne ha uno?
4. **Patto d'Ombra**: altare nella stanza del boss (come ora) o stanza dedicata?
5. **Scatto**: sempre disponibile dall'inizio o legato alla sciarpa di Agnese (decisione del 10/10)? I GDD assumono scatto base.
6. **Fucina del Ricordo** (bottega di Gaetano nell'hub): si apre la prima volta che si raggiunge il piano 2?
7. **Ordine della grafica**: prima gli sprite PNG dei nemici e dei boss, o prima l'HUD pixel-art?

## Prossimi passi consigliati

1. `resa/sprite.js`: caricare e animare i 91 PNG dal catalogo per nemici, boss, NPC, oggetti, HUD e scena (storia nuova, Visual).
2. HUD pixel-art del Teatro nel canvas con le mezze maschere; chiudere la P04 di `interfaccia-e-qa`.
3. Palette `P` → token CSS; fallback numerici → JSON (chiude le riserve dell'audit F4).
4. Playtest dell'autore sul ciclo completo e sui duelli; raccogliere le risposte alle domande aperte.
5. `/review-all-gdds` e `/balance-check` sui GDD, ormai in ritardo rispetto al Teatro (le regole nuove vivono nei JSON e nelle storie P).
6. `/gate-check` per avanzare `project.stage`.

## Come si verifica (tutte verdi al commit `b810b5e`)

- 23 suite unitarie `node gioco/qa/*.test.mjs` (node:test, senza browser) e `node gioco/qa/parametri.test.js`;
- 19 suite Playwright: `pagina.test.js`, 16 `*.wire.test.js`, `vetrina.test.js`, `pacchetto.test.js` (avviano da sole
  `python3 -m http.server` su una porta libera; Chromium preinstallato, mai `playwright install`);
- `node gioco/qa/stati64.js` (64/64) e `node gioco/qa/seme.js 200` (200 piani, 0 violatori);
- `grep -rn "Math.random" gioco/motore` vuoto;
- tutto insieme: `bash gioco/qa/suite-completa.sh`.
- Evidenze (55 screenshot a deviceScaleFactor 1) in `production/qa/evidence/`.

## Cosa esiste (in ordine di lettura)

1. `gioco/teatro_marionette.html` — il Teatro, prototipo dell'autore e fonte delle regole (tabelle ~2349-2535, stato e statistiche
   ~2601-2745, input ~2853, generazione ~3101-3424, attacco ~3525-3680, nemici in `loop()` ~4248-5052, HUD ~5056).
2. `gioco/README.md` — il motore: due programmi, avvio, parametri URL, `window.__gioco`, test, struttura, regole del codice.
3. `trama/` — bibbia, decisioni dell'autore, `storia.json` (Donna Luciana aggiunta fra i boss).
4. `design/gdd/game-concept.md` — con la «Revisione dell'autore (2026-11-08)» in testa; i GDD di sistema sono della v3 e vanno riletti.
5. `design/art/art-bible.md` — nota in testa sul cambio di direzione; le sezioni 1-4 descrivono il presepe d'ombre precedente.
6. `docs/architecture/architecture.md` + ADR-0001..0006 — l'architettura del motore (valida).
7. `production/epics/` — 7 epiche, storie 000-033 e P01-P12 (`index.md`).
8. `production/session-logs/decision-log.md` — registro delle decisioni.

## Note operative

- Sessione cloud: Playwright preinstallato; gli agenti lavorano a lotti piccoli con budget di chiamate.
- Commit in Conventional Commits in italiano con il footer `Co-Authored-By` / `Claude-Session`; nessun push dagli agenti.
- Il framework CCGS non conosce «Web»: le skill con passi specifici di motore dichiarano NOT SOURCEABLE.
