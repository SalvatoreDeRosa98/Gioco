# Registro delle decisioni

Una voce per decisione. **Fonte** `autore` = detto o scritto dall'autore (nel Teatro, `gioco/teatro_marionette.html`, o in chat);
`agente` = presa in autonomia da un agente e da confermare. Le decisioni dell'autore non si discutono: si registrano e si applicano.

## Decisioni dell'autore (riavvio del design, 2026-11-08/09)

| Data | Fonte | Decisione | Dove è applicata |
|---|---|---|---|
| 2026-11-08 | autore | Il prototipo `gioco/teatro_marionette.html` (il Teatro) è la fonte delle regole e dei numeri; il motore `gioco/motore/` è la versione modulare di produzione e vince sull'architettura. Comando: «porta tutto sul nuovo motore, tutte le implementazioni». Il Teatro non si modifica. | `gioco/README.md › Due programmi`, `PASSAGGIO-CONSEGNE.md` |
| 2026-11-08 | autore | Donna Luciana (non Violante) è il boss finale, sul 4° piano di ogni ciclo; è la Marionettista e non pende dai fili. | `boss.json › finale`, `attori/boss/donna-luciana.js`, `storia.json` |
| 2026-11-08 | autore | Pixel-art dark-fairytale al posto del presepe d'ombre; 91 sprite sheets PNG consegnati in `gioco/assets/sprite/`. | `resa/renderer.js`, `resa/pixel-sprites.js`, `contenuti/sprite.json` |
| 2026-11-08 | autore | Sparo a 4 direzioni con le frecce; WASD muove; con la spada in mano la freccia dà il fendente nella sua direzione. | `input.json › spara_*`, `attori/combattimento.js` |
| 2026-11-08 | autore | Il giocatore non deve vedere dove arriverà il colpo: niente zone tratteggiate, corridoi del balzo, cunei, linee o cerchi a terra per nemici e boss, né nel renderer né nell'HUD. Il nemico si legge solo dal corpo (postura di anticipo, occhi o lampo rosso). Prevale sull'art bible §3 e sui GDD. I bracieri restano visibili senza anelli di anticipo. | `resa/renderer.js`, `attori/boss/*.js`; `segnoATerra()` resta solo dato per il fil di ferro diagnostico |
| 2026-11-08 | autore | Quattro piani per ciclo (5/7/8/9 stanze) in ciclo infinito; pool di 5 boss estratti senza ripetizione; dopo Donna Luciana il «BIS» (ciclo 2 con bonus). | `mondo/run.js`, `boss.json › pool`, `generazione.json` |
| 2026-11-08 | autore | Quattro personaggi selezionabili (Ferruccio, Agnese, Taddeo, Ombra) con statistiche alla Isaac, menu di selezione con 5 slot e cancellazione con conferma; il menu precede l'hub. | `personaggi.json`, `interfaccia/menu.js`, `attori/statistiche.js` |
| 2026-11-08 | autore | L'hub di Piazza Dante è obbligatorio e centrale («manca tutto l'hub di gioco, è una parte importante»): menu → hub → piano 1; mai saltato in `index.html`/`prova.html` (meta `gioco-avvio` solo `debug=1`); Esc dall'hub torna al menu; morte e discesa finale riportano all'hub. | `index.html`, `prova.html`, `mondo/hub.js`, `avvio.js` |
| 2026-11-08 | autore | Economia alla Isaac: 5-8 monete al piano 1, prezzi cuore 3 / base 5 / forte 7 / consumabile 2, drop del Teatro, oggetti gratis a stanza pulita (1/10 forte, 1/3 base). | `economia.json`, `oggetti/banchetto.js`, `oggetti/gratis.js` |
| 2026-11-08 | autore | Oggetti attivi con Q a ricarica per stanza; 5 slot di passivi con sostituzione; Patto d'Ombra (reliquie che costano una maschera massima); Fucina = banchetto di Tonino (stesse regole e prezzi, stesso personaggio); stanza segreta che si apre sparando alla crepa dorata. | `oggetti/attivi.js`, `oggetti/slot.js`, `oggetti/patto.js`, `mondo/segreta.js`, `oggetti-attivi.json`, `patto.json` |
| 2026-11-08 | autore | Nemici alla Isaac del Teatro: vespa cieca, gatto che balza, maschera d'osso corazzata che si apre per sparare, bomba ferma, guardia a doppiette, statua torretta a croci, predone dorato della segreta; proiettili nemici parabili. | `nemici.json`, `attori/nemico.js`, `attori/proiettili-nemici.js` |
| 2026-11-08 | autore | Game feel (richieste testuali): i-frames ≥ 1 s con lampeggio semitrasparente e rimbalzo, hit-stop, knockback ∝ 1/peso, scossa contestuale, macchie permanenti per stanza. | `resa.json`, `resa/feel.js`, `ciclo.congela`, `combattimento.json › feel` |
| 2026-11-08 | autore | Audio sintetizzato a eventi con Web Audio API, nessun file audio; muto con `M`. | `audio/sintesi.js`, `audio/eventi-audio.js`, `audio.json` |
| 2026-11-08 | autore | Nessun controllo touch: il gioco è da tastiera (e gamepad). | `interfaccia/prova.js`, storia P02 |
| 2026-11-09 | autore | «I fili dalle mani sono tutti fatti male»: ogni marionetta ha SEMPRE due fili, uno dalla Mano sinistra e uno dalla destra, meno visibili a schermo (1 px, oro al 30 %, alle spalle, leggera curva, niente alone né tratteggio); mai su Ferruccio e i giocabili. | `resa/fili.js`, `resa.json › fili`, storia P11 |
| 2026-11-09 | autore | Nessun playtest automatico: l'autore prova da solo. | `PASSAGGIO-CONSEGNE.md` |

## Decisioni prese dagli agenti durante il porting (fonte: agente, da confermare con l'autore)

| Data | Fonte | Decisione | Dove |
|---|---|---|---|
| 2026-11-08 | agente | I dati del Teatro vanno trascritti in JSON `{base,min,max}` o tabelle (`FILE_TABELLE`), mai ricopiati come costanti; i test leggono i valori dai JSON invece di fissarli. | `contenuti/parametri/*.json`, storia P03 |
| 2026-11-08 | agente | Mezze maschere del Teatro (`hpHalf`): il corpo conta maschere intere, `maschere_max = ceil(hpHalf/2)`; l'HUD a mezzi cuori resta da fare. | `attori/statistiche.js`, storia P04 (interfaccia) |
| 2026-11-08 | agente | Un corpo, più schede: le statistiche del personaggio si applicano al corpo unico tramite i modificatori; nessun secondo attore. | `attori/statistiche.js` |
| 2026-11-08 | agente | Cambiare slot ricarica la pagina con `?slot=&personaggio=` perché profilo, stato narrativo e notte salvata sono legati allo slot alla composizione. | `interfaccia/menu.js`, `avvio.js` |
| 2026-11-08 | agente | Il Patto d'Ombra è un altare nella stanza del boss dopo `boss.sconfitto` (100 % senza danni, 60 % con danni), non una stanza dedicata. | `oggetti/patto.js`, storia P04 (doni) |
| 2026-11-08 | agente | Hit-stop in `ciclo.congela(ms)` non cumulativo (40/60/90 ms); spinta `clamp(spinta/peso, 20, 640)`, 0 da peso 3. | `resa/feel.js`, `combattimento.json › feel`, storia P08 |
| 2026-11-08 | agente | I proiettili nemici si spengono su muri e ostacoli e a fine gittata; parati diventano riflessi contro i nemici; il fendente attivo li cancella. | `attori/proiettili-nemici.js`, storia P05 (nemici) |
| 2026-11-09 | agente | `scala_vita_teatro = 1`: il danno di Ferruccio è già quello di `ricalcolaStatisticheIsaac`, quindi la vita dei boss del Teatro si usa tal quale (`vitaBoss = max(20, round((hpBase + (pnc−1)×45) × 1,45^(ciclo−1)))`). | `mondo/run.js`, storia P06 |
| 2026-11-09 | agente | Lo Spezzafili d'Ottone non ha un ramo nel `loop()` del Teatro: il pattern `scissor_blades` è scritto dal nome (forbici). | `attori/boss/`, storia P06 |
| 2026-11-09 | agente | Il sipario non si alza al piano 1 di una run: l'hub e le scene automatiche dell'ingresso fanno da atto I. | `interfaccia/sipario.js`, storia P06 |
| 2026-11-09 | agente | Il Medaglione di Rosa cade per l'archetipo `gatto` con `tonino_ricordo` null (regola del motore conservata); `boss_battuti` riceve l'`idStoria`. | `oggetti/ricordi.js`, `mondo/run.js` |
| 2026-11-09 | agente | «Lo stato non disegna, la resa non muta»: impatti e camera stanno nella resa; l'IA riceve un `contesto`; passo fisso e tetto di 5 tick verificati a 60/120/144 Hz. | `qa/architettura.test.mjs`, storia P12 |

## Decisioni precedenti (v3, 2026-11-07)

Registrate nel `PASSAGGIO-CONSEGNE.md` della v3 (storia di git, commit `48adbd4`) e nelle storie 001-030: motore web senza build al
posto di Godot; `modes.rigor: standard`; il contatto passivo non ferisce (superata: ora il corpo dei boss ferisce al contatto come nel
Teatro); danno decimale; camera a scala ridotta senza scorrimento; stanza-ricordo del piano 2 = `corso-trieste.finestra-mariella`.

## 2026-11-09 — Teatro: sprite dai fogli (T2) e hub/storia (T4) disattivati dall'autore

Fonte: autore, commit f1f42c2 e conferma in chat («scelta mia perché non mi piacevano i disegni»). Il Teatro carica
solo `teatro/t3-economia-salvataggi.js`; `t2-sprite.js` e `t4-hub-storia.js` restano in `gioco/teatro/` (adattati alla
risoluzione alta) ma non sono collegati. I personaggi usano gli sprite originali del Teatro.

## 2026-11-09 — Teatro: hub e storia (T4) riattivati su richiesta dell'autore

Fonte: autore in chat («sì riattivali quelli»). T4 (hub di Piazza Dante, dialoghi, Voce/Donna Luciana, Medaglione,
morte e risveglio) di nuovo collegato sulla versione f1f42c2 dell'autore: menu ESC dell'autore anche nell'hub, un solo
contatore delle notti (quello dell'autore). T2 (sprite dai fogli) resta scollegato.
