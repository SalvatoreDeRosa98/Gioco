# Story P13: HUD completo del Teatro in DOM (scheda, barra del boss, dock degli slot)

> **Epic**: Interfaccia e QA
> **Status**: Done
> **Layer**: interfaccia (`motore/interfaccia/hud.js`, `stile/hud.css`), composizione (`avvio.js`, blocco «squadra HUD»),
> contenuti (`interfaccia.json › hud`, `resa.json › hud`), resa (`renderer.js`: opzione `barraBossNelRenderer`),
> pagine (`index.html`, `prova.html`: `hud.css` e `prova.css`)
> **Type**: UI
> **Estimate**: M
> **Manifest Version**: N/A
> **Last Updated**: 2026-11-09
> **Chiude**: la storia 031 (HUD a proscenio) tramite questa

## Context

**Requirement**: passo H del porting del Teatro, richiesta esplicita e ripetuta dell'autore: «dove sta scritto Ferruccio, il piano,
la vita, il danno, gli slot occupati sotto dove stanno gli oggetti». L'integrazione precedente aveva lasciato a schermo
l'HUD economia (Monete/Scintille/Maschere in testo), la fila dei doni come testo, lo slot dell'attivo in un riquadro a
sinistra e la barra del boss nel renderer: tre moduli, nessuno con l'impaginazione del Teatro. La fonte è
`gioco/teatro_marionette.html › disegnaHUDPixelArt` (~5056-5290): scheda in alto a sinistra (nome · piano · ciclo, vita,
DMG/TRS, monete/SPD/slot), barra del boss in alto al centro con gli HP numerici, minimappa in alto a destra, dock in basso
al centro con lo slot [Q] dell'attivo (tacche di carica) e i cinque slot numerati.
**Vincoli**: DOM sopra il canvas (ADR-0001); immagini solo dal manifesto `contenuti/sprite.json` via `percorsoRisorsa`
(mai percorsi scritti nel codice), `image-rendering: pixelated`; testi in `interfaccia.json › hud` / `boss_hud`; cifre
decimali in `resa.json › hud`; misure e colori in `stile/hud.css` (token); il modulo legge e non muta; nessun doppione
dell'HUD vecchio; l'HUD si nasconde a dialogo aperto e nel menu; nessuna anticipazione a terra degli attacchi (regola
dell'autore 2026-11-08: qui non si tocca il renderer dei nemici).
**ADR**: ADR-0001 (interfaccia in DOM, risoluzione logica), ADR-0002 (parametri), ADR-0003 (`__gioco` solo in debug).

---

## Acceptance Criteria

- [x] GIVEN il piano con un personaggio scelto, WHEN si gioca, THEN in alto a sinistra la scheda con nome e titolo del personaggio
  (`statistiche.id` → `personaggi.json`), «Piano N» (· «Ciclo ∞C» dal ciclo 2, da `mondo/run.js`), il tipo della stanza in
  piccolo (`interfaccia.json › hud.stanze`), la vita a mezze maschere con i PNG `hud-cuore-pieno/mezzo/vuoto` (le massime
  vuote visibili), la riga DMG/TRS/SPD/RNG con le icone PNG e i valori reali di `statistiche.correnti()` (cifre da
  `resa.json › hud`), monete e scintille con le icone (`hud.test.mjs` H01-H02-H04; `hud.wire.test.js` caso 1, `hud.png`)
- [x] GIVEN un boss vivo nella stanza, THEN in alto al centro la barra della vita con la cornice `hud-barra-boss`, il titolo di
  `boss_hud` (piano, ciclo, nome) e gli HP numerici; una sola barra (il renderer riceve `barraBossNelRenderer: false`);
  sparisce da morto (H05; wire caso 3, `hud-boss.png`; `boss.wire.test.js` aggiornato: legge il DOM, non i pixel del canvas)
- [x] GIVEN il dock in basso al centro, THEN lo slot dell'attivo (`hud-slot-attivo`, icona `attivo-<id>`, tacche di carica da
  `oggetti/attivi.js`, la lettera del tasto come la «Q» del Teatro), i cinque slot (`hud-slot-vuoto` come cornice, numero,
  icona `oggetto-<id_teatro>` degli equipaggiati, slot vuoti visibili, nome nel `title` e nella didascalia al passaggio del
  puntatore; un ricordo senza PNG mostra la sagoma ed è `azzurro`), le reliquie del Patto (`patto-<id>`) accanto (H01-H02-H06;
  wire caso 2, `hud-slot-pieno.png`; `oggetti.wire.test.js` legge `__gioco.hud().attivo`)
- [x] GIVEN la minimappa a esplorazione del renderer in alto a destra, THEN resta quella, una sola (nessuna nel DOM)
- [x] GIVEN un cartiglio di dialogo aperto (o il sipario, o il menu), THEN l'HUD si nasconde; chiuso, ricompare (H03; wire casi 4 e 7)
- [x] GIVEN gli HUD precedenti (`.hud` dell'economia, `.hud-doni`, `.attivo-hud`), THEN non esistono più nel DOM né nei CSS;
  `interfaccia/banchetto.js` tiene solo la lista del banchetto, `interfaccia/doni.js` solo il cartiglio del dono,
  `interfaccia/oggetti.js` solo modale e pannello del Patto; i test che li leggevano (`doni.integrazione`, `ricordi`,
  `doni.wire`, `notte.wire`, `ricordi.wire`, `menu.wire`, `oggetti.wire`, `boss.wire`) ora leggono l'HUD del Teatro
- [x] GIVEN 400 px di larghezza, THEN nessuno scroll orizzontale e scheda e dock dentro il palco (misure in `--u` = 1/1280 della
  larghezza del contenitore; wire caso 5, `hud-400.png`)
- [x] GIVEN `index.html` e `prova.html` (meta `debug=1`, nessun `piano=1`), THEN il pannello delle istruzioni di prova è centrato con
  sfondo pieno (`prova.css` ora anche in `index.html`, dove prima compariva come testo nudo in alto) e sparisce al primo tasto
- [x] GIVEN il prototipo dell'autore aperto con Playwright (Spazio, sipario alzato, qualche passo), THEN `teatro-hud-riferimento.png`
  è conservato come riferimento: scheda in alto a sinistra, barra/etichetta del piano in alto al centro, mappa in alto a
  destra, dock [Q] + slot in basso al centro, sovrapponibile nella disposizione a `hud.png`

---

## Evidenza

- `node gioco/qa/hud.test.mjs` — 8/8 (DOM finto: elementi presenti e aggiornati da statistiche/attivo/slot/economia/maschere a
  metà/boss/patti, nascosto col dialogo e nel menu, testi dal JSON, manifesto completo, regole del codice)
- `node gioco/qa/hud.wire.test.js` — 7/7 (Playwright a deviceScaleFactor 1): `production/qa/evidence/hud.png`, `hud-slot-pieno.png`,
  `hud-boss.png`, `hud-400.png`, `teatro-hud-riferimento.png`
- `bash gioco/qa/suite-completa.sh` — tutte le suite verdi (node:test, Playwright, `parametri`, `vetrina`, `pacchetto`, `stati64`,
  `seme 200`, grep `Math.random` vuoto)

## Decisioni

- **Minimappa**: resta quella del renderer (pixel-art, con l'etichetta del piano), come concesso dall'autore; una sola.
- **Barra del boss**: spostata nel DOM (cornice PNG `hud-barra-boss`); il renderer tiene `disegnaBarraVitaBoss` dietro l'opzione
  `barraBossNelRenderer` (default `true` per compatibilità, `false` da `avvio.js`), così la squadra disegni non trova il blocco
  riscritto.
- **Mezze maschere**: il corpo del motore conta maschere intere (`maschereMax = ceil(maxHpHalf/2)`, decisione della storia P04);
  l'HUD disegna `pieno` per ogni maschera intera, `mezzo` se la parte frazionaria è ≥ 0,5 (pronto per quando il danno sarà a
  mezze maschere), `vuoto` fino al massimo. Il testo «2.0/2» accanto segue il Teatro (`hpHalf/2` con una cifra).
- **Statistiche**: SPD mostra `speed` del motore (il Teatro divide per 2 la sua scala); RNG è la gittata in px del motore. Le cifre
  sono in `resa.json › hud.decimali_*`.
- **Hub**: l'HUD resta visibile in Piazza Dante con «Piazza Dante · tra le notti» al posto del piano; il cartellino dell'hub
  (`.hub-cartellino`, run e suggerimento) resta.
- **Ricordi**: occupano gli slot come ogni dono di `modificatori.doniAttivi()` (non hanno un PNG `oggetto-*`: sagoma come testo,
  alone azzurro); se i doni superano i cinque slot (ricordo + cinque doni) la fila si allunga invece di nascondere.
- **Patti**: `patto_raggio_continuo` e `patto_spettrale` non hanno un PNG nel manifesto: compare la sigla; quando l'autore consegna
  `patto-raggio-continuo.png` / `patto-spettrale.png` basta la voce nel manifesto.
- **`__gioco.hud()`** sostituisce `interfacciaOggetti().attivo` per lo stato dell'attivo a schermo; `interfacciaOggetti()` tiene
  `sostituzione` e `patto`.
