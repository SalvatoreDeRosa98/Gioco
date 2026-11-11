# Roadmap «Novità nel Teatro»: portare nel Teatro delle Marionette ciò che il motore ha in più

Scritta il 2026-11-09. Richiesta dell'autore: il Teatro (`gioco/teatro_marionette.html`, un solo file) è la versione
che funziona e si gioca come deve; deve ricevere tutte le novità costruite nel motore (`gioco/motore`). È la
direzione inversa di `production/roadmap-fedelta-teatro.md`. Le regole del Teatro non cambiano: si AGGIUNGE.

## Regole

- Si modifica SOLO `gioco/teatro_marionette.html`. A fine di ogni passo la copia alla radice
  `teatro_marionette.html` si riallinea con `cp` (devono restare identiche).
- Niente build per giocare: il file si apre con doppio click. Le immagini si caricano con percorsi relativi
  `assets/sprite/<nome>.png` (la cartella `gioco/assets/sprite/` sta accanto al file; anche la radice ha la sua copia
  in `assets/sprite/`). Il file da inviare agli amici, con le immagini incorporate, lo produce
  `tools/teatro-release.js` (passo T2) in `production/release/teatro.html`.
- Determinismo dove già c'è; nessuna regola di gioco del Teatro va alterata se non dove il passo lo dice.
- Ogni passo: verifica con Playwright (Chromium preinstallato, mai `playwright install`) aprendo il file da `file://`
  e da http, zero errori di console, screenshot guardati in `production/qa/evidence/teatro-*.png`; commit
  Conventional Commits con `Story: T<n>`.
- Nessun segno a terra degli attacchi nemici; due fili per marionetta (uno per Mano), discreti; niente touch.

## Passi

- **T1 — Fondamenta e feel.** Passo fisso a 60 Hz con accumulatore e tetto di tick per frame (oggi `loop()` avanza
  di un tick per `requestAnimationFrame`: a 120 Hz il gioco va al doppio). I-frames ≥ 1000 ms con lampeggio
  ad alpha 0,4 e rimbalzo all'indietro; hit-stop 40 ms sul colpo (60 uccisione) che ferma la logica e non la resa;
  knockback inversamente proporzionale alla massa (vespa vola via, guardia 2 px, statua e boss fermi); scossa
  contestuale (1-2 px colpo, 5-6 bomba, 10-12 atterraggio del Re-Gatto e schianto delle Mani); macchie di china o
  schegge di legno che restano finché si resta nella stanza; togliere ogni segno tratteggiato a terra degli attacchi
  (`setLineDash`); due fili d'oro per marionetta, 1 px al 30%. Riferimento motore: `motore/resa/feel.js`,
  `motore/resa/fili.js` (o renderer), `contenuti/parametri/resa.json`.
- **T2 — Sprite dell'autore.** Caricare i 91 PNG secondo `gioco/contenuti/sprite.json` (copiarne `layout` in una
  tabella dentro il file) per personaggi (pose fermo/cammina/spara/colpito/morto, testa di mira), nemici, boss,
  Mani, oggetti, attivi, patto, raccoglibili, proiettili, scena (piedistallo, altare, crepa, braciere, colonne,
  panca, banco di Tonino, porte, botola, lanterna, pavimento e muro come tile), icone dell'HUD, carte del menu,
  sipari. Fallback agli sprite pixel-art già nel file se un PNG manca. Script `tools/teatro-release.js` che produce
  `production/release/teatro.html` con i PNG incorporati come data: URI.
- **T3 — Audio, economia, patto, salvataggi.** Audio Web Audio sintetizzato (passo di legno, sibilo dello stocco,
  tonfo riverberato, campana d'ingresso stanza, colpo, moneta; M per il muto; riferimento `motore/audio/`).
  Economia dell'autore: 5-8 monete al piano 1 in media (verificare con una simulazione), cuore 3, oggetto base 5,
  forte 7, consumabile 2. Patto potente: raggio cremisi continuo e lacrime spettrali che passano i muri, conferma
  «−1 maschera massima per sempre». Cinque slot di SALVATAGGIO in localStorage (personaggio, piano raggiunto,
  monete di luce/scintille, flag della trama) scelti nel menu.
- **T4 — Hub, storia, morte e risveglio.** Hub di Piazza Dante fra una run e l'altra (Tonino al banchetto, bottega
  di Gaetano, finestra di Mariella, Taddeo e Agnese secondo i flag, ingresso al piano), dialoghi in un cartiglio con
  le scene di `trama/storia.json` pertinenti (incorporate nel file), Medaglione di Rosa che cade dal Gatto e scelta
  restituito/negato con flag salvato nello slot, sequenza di morte e risveglio (lanterne che si spengono) che
  riporta all'hub. Riferimento motore: `motore/mondo/hub.js`, `motore/storia/`, `motore/oggetti/ricordi.js`,
  `motore/storia/risveglio.js`, `contenuti/ancoraggi.json`.
