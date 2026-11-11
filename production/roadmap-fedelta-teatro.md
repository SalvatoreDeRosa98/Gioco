# Roadmap «Fedeltà al Teatro»: il motore nuovo deve giocarsi come il Teatro delle Marionette

Scritta il 2026-11-09 per chi riprende il lavoro (anche un altro modello). Autosufficiente: leggere questo file,
poi `gioco/README.md` e `PASSAGGIO-CONSEGNE.md`. Branch di lavoro: `claude/brave-cannon-ed3d3d`.

## Il problema, in una frase

Il motore (`gioco/motore`) ha l'estetica e i sistemi del Teatro (`gioco/teatro_marionette.html`, prototipo
dell'autore, FONTE DELLE REGOLE, da non modificare), ma il suo nucleo di sensazioni è ancora quello del design
precedente (spada, parata, telegrafo in tre tempi, direttore dei gettoni, contatto innocuo, allarme di stanza).
L'autore lo ha detto chiaro: il Teatro gli sembra molto più vicino al gioco a stanze che vuole di quanto lo sia il gioco col nuovo motore. Questa
roadmap elenca, in ordine, i cambiamenti al nucleo. Ogni passo ha file, numeri da prendere dal Teatro (con il
numero di riga), test e criterio di accettazione misurabile. Nessun passo aggiunge sistemi nuovi.

## Regole fisse (non negoziabili)

- Nessun `Math.random` nel motore (rng seminato, `fondazione/rng.js`). Nessun numero di gioco nel codice: tutto
  in `gioco/contenuti/parametri/*.json` come `{base,min,max}`. Nessuna stringa di gioco nel codice
  (`gioco/contenuti/interfaccia.json`). Colori dai token CSS. Lo stato non disegna, la resa non muta
  (`gioco/qa/architettura.test.mjs` lo verifica).
- Mai cancellare o saltare test: i test che fissano valori li leggono dai JSON. Dopo ogni passo:
  `bash gioco/qa/suite-completa.sh` deve chiudere con `FINE fail=0`; poi `git checkout -- production/qa/evidence`
  (le suite riscrivono i PNG con byte diversi) e commit in Conventional Commits con riga `Story:`.
- Nessun segno a terra per gli attacchi nemici (telegrafo solo sul corpo). Due fili per marionetta, discreti.
  Niente touch. Il Teatro vince su ogni dubbio di regola; l'architettura del motore vince su dove metterla.
- Conversione delle unità del Teatro: arena 488×220 px (`ARENA` riga 2583) → campo 832×448 del motore:
  fattore **1,45** sulle distanze; velocità in px/frame a 60 fps → px/s: **×60×1,45 = ×87**; frame → ms: ×16,67.

## Come misurare «si gioca come il Teatro» (da fare PRIMA del passo 1 e dopo ogni passo)

Scrivere `gioco/qa/fedelta.test.mjs` (node:test, ciclo simulato a tick fissi, bot semplice che cammina verso il
nemico più vicino e spara con la freccia nella sua direzione) che misura, su 30 stanze seminate di piano 1:
tempo medio per pulire una stanza, maschere perse per stanza, numero medio di nemici vivi contemporaneamente,
colpi nemici all'ora, tempo medio fra due attacchi nemici qualsiasi. Gli obiettivi sono i valori del Teatro:
misurarli una volta con uno script Playwright usa-e-getta sul Teatro (stesso bot, stesse 30 stanze: aprire
`teatro_marionette.html`, scegliere Ferruccio con Spazio, leggere `statoRun`/`player` dalla pagina) e scriverli
in `gioco/contenuti/parametri/fedelta.json` come obiettivo ± tolleranza. Il test è ROSSO finché il motore non
rientra nelle tolleranze: è il metro di tutta la roadmap.

## I passi, in ordine

### 1. Il contatto ferisce (il cambiamento più grande)
- Teatro: `subisciColpoGiocatore` (~3804) e il ciclo in `loop()` (~4248): ogni nemico che tocca il giocatore
  toglie mezza maschera, con invulnerabilità dopo il colpo.
- Motore: oggi `combattimento.js` ~774 «contatto passivo: i corpi si separano senza danno» e
  `ferruccio.separaDa`. Aggiungere in `nemici.json › globali` `contatto_danno` {0,5 maschere → nel motore 1
  maschera intera finché la vita è a interi} e `contatto_attivo` 1; nel tick del combattimento, se un nemico vivo
  (non in emersione, non stordito) interseca il corpo e Ferruccio non è invulnerabile → `subisciDanno` con
  rimbalzo. I pericoli ambientali restano come sono.
- Test: `combattimento.test.mjs` (contatto → danno una volta per finestra di invulnerabilità; nessun danno da
  stordito/emersione/morto); aggiornare `nemici.test.mjs` (bot QA: riportare le maschere perse misurate).
- GDD: `design/gdd/controllo-ferruccio.md` regola 6 e `combattimento.md` §2.2 vanno aggiornati con la nota
  «superata dal Teatro, 2026-11-09».

### 2. Via il direttore dei gettoni e le durate minime del telegrafo per i nemici del Teatro
- Teatro: ogni nemico attacca per conto suo con il suo cooldown (`popolaStanza` ~3229 e `loop()`):
  vespa cieca vola addosso, gatto balza, maschera spara a ventaglio, guardia doppietta, statua croci, bomba
  esplode. Nessun turno.
- Motore: `nemici.json › direttore` (`gettoni`, `attaccanti_max` 2, `gap_impatti_min`), `t_allarme` 4000,
  `t_lamp_min_parabile` 280 / `t_lamp_min_imparabile` 350 (R2/R4), `attori/ia/direttore.js`. Mettere
  `senza_gettone: 1` su tutti gli archetipi del Teatro e `attaccanti_max` al numero dei nemici in stanza; portare
  `t_lamp_min_*` a 0 e ricopiare i cicli del Teatro in ms: gatto, vespa, maschera, guardia, statua, bomba (il
  numero di frame di ciascuno è in `loop()` e nei commenti sui nemici che saltano ~851-914 e ~2604-2609: leggere
  e trascrivere, NON stimare). La parata resta possibile ma non vincola più i tempi.
- Test: `nemici.test.mjs` (cadenze = JSON; tre nemici attaccano nello stesso secondo), `fedelta.test.mjs`.

### 3. Ritmo delle stanze del Teatro
- Teatro: entri, i nemici ci sono già, le porte si chiudono subito, si riaprono alla morte dell'ultimo.
- Motore: `nemici.json › t_allarme` 4000 → 0 (o il valore del Teatro se c'è un'attesa), `stanze.json`:
  ondate = 1 (tutti insieme), `t_ritardo_apertura` al valore del Teatro, emersione dei nemici ≤ 300 ms, niente
  intervallo fra ondate. Camera: transizione 250 ms va bene (nel Teatro scorre), ma niente pausa logica.
- Test: `mondo.test.mjs` (stanza con nemici attivi entro 300 ms dall'entrata).

### 4. Densità e velocità prese dal Teatro numero per numero
- Teatro: `popolaStanza` (~3229-3424): quanti nemici per stanza e per piano, quali archetipi, hp, speed;
  `player.speed 2.0`, `tearsPerSec 2.73`, `cooldownMax 22`, `range 170` (~2620-2630); proiettili
  `sparaProiettiliDirezione` (~3546: velocità, raggio, gittata); `danneggiaNemico` (~3621: knockback).
- Motore: `generazione.json`/`stanze.json` (n_nemici per piano), `nemici.json › archetipi` (vita, velocità ×87,
  r), la voce del personaggio base in `personaggi.json` (già esiste: verificare che i valori effettivi coincidano con il Teatro dopo
  la conversione), `combattimento.json` (velocità e gittata dei proiettili, cadenza), `ferruccio.json › v_base`.
  Vespa cieca: contatto che ferisce (passo 1) e volo dritto, niente picchiata telegrafata (`nemici.json ›
  archetipi.vespa`, `attori/ia/base.js`).
- Test: `fedelta.test.mjs` rientra nelle tolleranze; `nemici.test.mjs` F1-F3 aggiornati ai valori nuovi.

### 5. Scala a schermo
- Teatro: canvas 640×360, sprite a scala 2 → un nemico occupa ~1/7 dell'altezza, il giocatore ~1/6.
- Motore: fogli 64×80 su 1280×720 → il giocatore è ~1/9. Introdurre `resa.json › scala_sprite` (1,5 di
  partenza; provare 1,5 e 2 con screenshot affiancati Teatro/motore) applicata in `resa/sprite.js` a personaggi,
  nemici, oggetti e proiettili; le hitbox NON cambiano (sono dati di gioco), si disegna solo più grande, ancorato
  ai piedi. Verificare che le porte e i piedistalli restino leggibili.
- Test: `resa.wire.test.js` (altezza in pixel dello sprite del giocatore = 80 × scala), screenshot
  `production/qa/evidence/scala-confronto.png` da guardare.

### 6. La spada e la parata diventano opzioni, non il centro
- Teatro: si spara con le frecce; la spada è un dono (`spada`), la parata non esiste.
- Motore: oggi J fa il fendente in tre colpi con combo e buffer, K para, lo scatto ha cariche. Tenere J e K ma
  senza che il bilanciamento dipenda da loro: niente «controcolpo» che moltiplica, parata senza stordimento lungo
  dei nemici del Teatro (o `t_stordito` = valore del Teatro se esiste), e lo sparo con le frecce deve essere la
  via principale anche con la spada equipaggiata (la spada aggiunge il fendente ravvicinato come nel Teatro
  `haSpada`: leggere ~3525 `eseguiAttacco4Direzioni`).
- Test: `combattimento.test.mjs` (con la spada equipaggiata la freccia spara E fende come nel Teatro).

### 7. Pannello dei tasti e pulizia dell'avvio
- Il pannello di `interfaccia/prova.js` non deve coprire il palco: mostrarlo nel menu (sotto le carte) e togliere
  dal renderer ogni testo introduttivo residuo. Tonino nell'hub con il PNG `hub-tonino` (oggi forma
  provvisoria). I dodici doni narrativi senza PNG: icona provvisoria dal manifesto, non testo.

### 8. Chiusura
- `fedelta.test.mjs` verde entro le tolleranze; `suite-completa.sh` verde; screenshot affiancati Teatro/motore
  della stessa situazione (stanza con 4 nemici, boss, bottega) in `production/qa/evidence/fedelta-*.png`;
  `node tools/impacchetta.js --entrata gioco/index.html --uscita production/release/ferruccio-prova.html` e
  commit del file; aggiornare `PASSAGGIO-CONSEGNE.md` e `production/epics/index.md` (storie P17-P24, una per
  passo). L'autore prova da solo: niente bot di playtest al posto suo.

## Stima

Passi 1-3: un blocco (mezza giornata di lavoro agentico). Passi 4-5: il più lungo, perché va misurato. Passi 6-8:
breve. Ordine obbligato: 1 → 2 → 3 → 4 (il metro di `fedelta.test.mjs` ha senso solo dopo) → 5 → 6 → 7 → 8.

## Domande che solo l'autore può chiudere (non bloccano: default indicato)

1. La parata resta nel gioco? Default: resta, ma non è richiesta per vincere.
2. Vita a mezze maschere vera nel corpo (danno 0,5)? Default: sì nel passo 1, è ciò che il Teatro fa.
3. L'hub e i dialoghi restano fra le notti? Default: sì (richiesta dell'autore), ma mai dentro il piano.
