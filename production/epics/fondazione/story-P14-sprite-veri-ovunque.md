# Story P14: Sprite veri ovunque — i 91 PNG dell'autore nel renderer (nemici, boss, NPC dell'hub, oggetti, proiettili, scena, fondali)

> **Epic**: Fondazione (passo S del porting del Teatro, richiesta dell'autore: «porta tutto sul nuovo motore»)
> **Status**: Done
> **Layer**: resa (`resa/sprite.js` nuovo, `resa/renderer.js`), composizione (`avvio.js`, blocchi `squadra disegni`), contenuti (`sprite.json › fondali`, `resa.json › sprite`), stile (`menu.css`, `sipario.css`), QA (`sprite.test.mjs`, `resa.wire.test.js`, `pacchetto.test.js`)
> **Type**: Visual/Feel (+ Logic per il ritaglio dei fotogrammi)
> **Estimate**: M
> **Manifest Version**: `contenuti/sprite.json` (91 voci, `layout` misurato dall'autore)
> **Last Updated**: 2026-11-09
> **Chiude**: P07 (numero mai assegnato nell'indice delle epiche: la consegna degli sprite definitivi passa da qui)

## Context

L'autore ha consegnato **91 PNG** in `gioco/assets/sprite/` con il manifesto `contenuti/sprite.json` (dimensione del fotogramma, ancora,
`layout` colonne/righe e mappa posa → riga). Fino a questa storia li usavano solo il corpo giocabile (`foglioGiocatore`) e le carte del
menu: nemici, boss, NPC dell'hub, oggetti, proiettili e scena erano ancora gli sprite provvisori in griglia di pixel (`pixel-sprites.js`)
o forme Canvas. La storia li porta ovunque, tenendo lo sprite provvisorio **solo come ripiego** quando un PNG manca o non è ancora
arrivato.

**Verifica richiesta sull'hub**: lo screenshot `production/qa/evidence/resa-hub.png` mostra l'hub di Piazza Dante disegnato dal renderer
pixel-art (pavimento e muro a tile, Tonino con il foglio `hub-tonino`, la porta della bottega di Gaetano `hub-gaetano-porta`, le finestre
di Mariella `hub-mariella-finestra`, colonne e panca di scena, la soglia verso il piano come porta aperta di scena): non è il disegno
diagnostico né un canvas vuoto.

**Regola dell'autore 2026-11-08** rispettata: nessun segno a terra che anticipi un colpo; il lampo è già nel fotogramma d'attacco del
foglio, quindi con lo sprite vero spariscono anche gli occhi rossi disegnati sopra la sagoma (restano solo nel ripiego provvisorio).

## Cosa è stato fatto

- **`resa/sprite.js`** (`creaSprite({ manifesto, percorso, parametri, creaImmagine })`): cache per nome, `Image` con `src =
  percorsoRisorsa(file)` (nel pacchetto a file unico arriva il data: URI), stati `caricamento`/`caricato`/`errore`;
  `fotogramma(nome, posa, indice)` → `{img, sx, sy, sw, sh, pronta, ancora}` con posa di ripiego e indice bloccato ai fotogrammi davvero
  presenti sul foglio (`raccoglibile-cuore-pieno` dichiara `brillio×4` su 1 colonna → sempre la colonna 0); `conta`, `indice` (cadenze da
  `resa.json › sprite.ticks_*`: fermo 20, muove 8, attacco 6, morte 10 fermandosi sull'ultimo, oggetto 10, scena 12 tick per fotogramma);
  `disegna` con `imageSmoothingEnabled = false`, ancora ai piedi / al centro / all'angolo, `verso`, `alpha`, `scala`, `rotazione`;
  `disegnaPattern` per i tile; `precarica`; `stato()` per la QA. Tutte le funzioni di disegno tornano `false` se il foglio non è pronto.
- **`resa/renderer.js`** (blocco `squadra disegni`): mappa stato del motore → posa del manifesto. Nemici: archetipo → foglio (`vespa` →
  `vespa-cieca`, `bomba` → `bomba-ferma`, `dorato` → `mob-dorato`), `pattuglia/insegue` → `muove`, `anticipo/lampo` → `anticipo`,
  `colpo` → `attacco`, flash del colpo → `colpito`, `morto` → `morte` seguendo `dissoluzione`; maschera `chiusa / si-apre / aperta-spara`
  da stato e `aperta`; bomba `fermo / miccia / esplode` da stato ed `esplosa`; statua `fermo / trema / spara`; vespa `vola / carica`.
  Boss: `re-gatto` fermo/anticipo/balzo (in `quota`)/atterra, `capitano-guardia` carica, `regina-vespa` vola/evoca, `colosso-statua`
  trema/spara, `maestro-fucina` lancia, `donna-luciana` fermo/comanda con le Mani `mano-marionetta` (scende/schianta/risale per fase).
  Proiettili del giocatore `proiettile-<tipo>` (volo) e splash (`impatto` con il fotogramma di `resa/impatti.js`); proiettili nemici
  `proiettile-nemico`; raggio cremisi come tile `proiettile-raggio-cremisi` ripetuto lungo la linea. Scena: pavimento e muro come pattern,
  due lanterne animate, porte aperte/chiuse ruotate per lato, colonne e panche, crepa dorata sul muro giusto, bracieri (riposo/braci/acceso),
  botola chiusa/aperta, piedistalli con l'icona `oggetto-<teatro.id_teatro>`, altare del Patto con `patto-<id>`, banco di Tonino con Tonino
  nella Fucina, slot del banchetto con l'icona vera, monete animate e cuori a terra. Hub: `hub-tonino`, `hub-taddeo-npc`, `hub-agnese-npc`,
  `hub-gaetano-porta` (chiusa/aperta), `hub-mariella-finestra`, `hub-luna`. I **fili** si agganciano al fotogramma (altezza del foglio,
  spalle a `resa.fili.ancoraggio_y`). Le **dimensioni di collisione non cambiano**: il fotogramma è ancorato ai piedi (`b.y + r/2`).
- **Fondali DOM**: `sprite.json › fondali` (`menu` → `sipario-menu`, `atti[piano nel ciclo]` → `sipario-<quartiere>`); `avvio.js`
  imposta `--fondale-menu` e, a `piano.discesa`, `--fondale-sipario` su `#interfaccia`; `menu.css` e `sipario.css` li usano come
  `background-image` (URL assoluto: un `url()` relativo in una variabile CSS si risolverebbe rispetto al foglio di stile).
- `__gioco.sprite` (gestore) e `__gioco.resa.sprite()` (stato dei fogli) per la QA.

## Acceptance Criteria

- [x] **GIVEN** il manifesto, **THEN** ogni voce ha il PNG su disco e il foglio misura `colonne×larghezza` per `righe×altezza`; layout
      coerente; `fondali` cita voci esistenti; `resa.sprite.ticks_*` sono `{base,min,max}` (`sprite.test.mjs`).
- [x] **GIVEN** `fotogramma()`, **THEN** ritaglia per posa/indice con clamp (oltre, negativo, `da` sulla stessa riga, 1 colonna con 4
      fotogrammi dichiarati), posa di ripiego, voce sconosciuta → `null`; `indiceAnimazione` cicla o si ferma; `disegna` torna `false`
      finché il foglio non è pronto, poi disegna con smoothing spento, ancora ai piedi/centro/angolo, ribaltamento con `verso`;
      `disegnaPattern` ripete il tile; senza `creaImmagine` tutto ripiega (`sprite.test.mjs` 5/5).
- [x] **GIVEN** `?debug=1&piano=1&seme=1845&nemico=<archetipo>` per gatto/maschera/bomba/guardia/statua/predone/vespa, **THEN** tutti i 91
      fogli sono caricati senza errori e in una finestra attorno al nemico il canvas contiene ≥ 40 pixel con i colori esatti del PNG
      dell'archetipo (esclusi quelli dei tile): screenshot `resa-<archetipo>.png`; zero errori in console (`resa.wire.test.js`).
- [x] **GIVEN** l'hub (`__gioco.scegli('ferruccio')`), **THEN** `resa-hub.png` con i pixel di `hub-tonino` attorno a Tonino e di
      `hub-gaetano-porta` attorno alla porta.
- [x] **GIVEN** la stanza `tesoro`, **THEN** `resa-bottega.png` con i pixel di `scena-piedistallo` e, se il dono ha `id_teatro`, dell'icona.
- [x] **GIVEN** `?boss=re-gatto` nella stanza boss, **THEN** `resa-boss.png` con i pixel di `re-gatto` attorno al boss.
- [x] **GIVEN** il pacchetto a file unico aperto via `file://` con `&nemico=gatto`, **THEN** ≥ 91 PNG incorporati, nessun foglio in errore e
      i pixel del foglio `gatto.png` attorno al nemico (`pacchetto.test.js`).
- [x] Nessun `Math.random`, nessun numero di gioco nel codice (cadenze in `resa.json`), nessuna stringa di gioco nuova; `architettura.test.mjs`
      verde (la resa non importa lo stato, non chiama `tick(`); tutte le suite verdi (Evidence).

## Evidence

- `node gioco/qa/sprite.test.mjs` 5/5; `node gioco/qa/resa.wire.test.js` 10/10; `node gioco/qa/pacchetto.test.js` (caso nuovo verde);
  tutte le altre suite verdi (24 file `*.test.mjs`, `parametri.test.js`, `pagina.test.js`, tutti i `*.wire.test.js`, `vetrina.test.js`,
  `stati64.js`, `seme.js 200`); `grep -rn "Math.random" gioco/motore` vuoto.
- Screenshot (deviceScaleFactor 1, guardati): `production/qa/evidence/resa-gatto.png`, `resa-vespa.png`, `resa-maschera.png`,
  `resa-bomba.png`, `resa-guardia.png`, `resa-statua.png`, `resa-predone.png`, `resa-hub.png`, `resa-bottega.png`, `resa-boss.png`.

## Decisioni e note

- Il fotogramma si disegna a scala 1:1 (i PNG sono già alla risoluzione della scena 1280×720): il boss (160 px) e Donna Luciana
  (224 px) sono molto più grandi della loro hitbox, come in Isaac; la hitbox resta quella del motore.
- Le pose mancanti in un foglio (es. `mob-dorato` senza `fermo`) ripiegano sulla prima posa del layout; il `colpito` sostituisce il flash
  bianco degli sprite provvisori.
- I doni senza `teatro.id_teatro` (12 su 25, i doni narrativi) non hanno un PNG: sul piedistallo resta il disco d'oro provvisorio.
- La palette `P` del renderer resta nel codice (fuori ambito, già annotato in P12); i blocchi nuovi non aggiungono colori.
- `teste-mira` (testa girata nelle 4 direzioni) non è usato: il foglio del personaggio ha già la posa `spara`.
