# Story P10: Audio dinamico minimale con Web Audio API (nessun file audio)

> **Epic**: Interfaccia e QA
> **Status**: Done
> **Layer**: audio (`motore/audio/sintesi.js`, `motore/audio/eventi-audio.js`), attori (`attori/passi.js`, una riga in
> `attori/combattimento.js`), interfaccia (`interfaccia/audio.js`, `stile/audio.css`), composizione (`avvio.js`, blocco
> «squadra audio»), contenuti (`parametri/audio.json`, `input.json › muto`, `interfaccia.json › audio`)
> **Type**: Logic + UI
> **Estimate**: M
> **Manifest Version**: N/A
> **Last Updated**: 2026-11-09

## Context

**Requirement**: passo F3 del porting del Teatro: un audio sintetizzato al volo (oscillatori e rumore con inviluppi), senza
file, che reagisca agli eventi del gioco: il «toc» di legno dei passi delle marionette, il sibilo della lama, il tonfo
riverberato delle esplosioni e degli impatti dei boss, il rintocco di campana quando si entra in una stanza nuova; in più,
perché costano poco, colpo a segno, colpo subito, moneta, porta che si chiude e oggetto attivo usato. Mute con `M` e dal
menu. I browser creano l'`AudioContext` solo dopo un gesto dell'utente.
**Vincoli**: lo stato di gioco non sa nulla dell'audio (solo eventi sul bus); nessun numero nel codice (tutto in
`audio.json` come `{base,min,max}`); nessun `Math.random` (il rumore bianco e l'impulso del riverbero sono generati con il
generatore seminato di `fondazione/rng.js`); nei test unitari non esiste `AudioContext`: il modulo degrada in silenzio e
offre una fabbrica iniettabile.
**ADR**: ADR-0001 (interfaccia in DOM), ADR-0002 (parametri), ADR-0003 (rng seminato, `__gioco` solo in debug).

---

## Acceptance Criteria

- [x] GIVEN la pagina appena caricata, WHEN nessun gesto è ancora arrivato, THEN nessun `AudioContext` esiste; WHEN un tasto o
  un puntatore, THEN il contesto è creato e ripreso (`running` o `suspended`) senza eccezioni e gli ascoltatori dei gesti si
  tolgono da soli (`audio.wire.test.js` caso 1 con `AudioContext` monkey-patchato da `page.addInitScript`; `audio.test.mjs` A03)
- [x] GIVEN `attore.passo`, THEN un «toc» (triangolo `freq_hz → freq_fine_hz` + sbuffo di rumore passa-basso) di `passo` per
  Ferruccio e `passo_nemico` per gli altri; `attore.passo` è emesso da `attori/passi.js` ogni `audio.passi.lunghezza_px`
  percorsi (cadenza = velocità; niente da fermo, da morto o dopo un salto di posizione) (A05, A11; wire caso 2)
- [x] GIVEN `ferruccio.fendente` (nuovo evento, emesso da `combattimento.js` quando la lama parte), `ferruccio.affondo` o
  `ferruccio.sparo`, THEN il sibilo (rumore passa-banda `filtro_hz → filtro_fine_hz`, Q) (A06)
- [x] GIVEN `esplosione`, `bomba.esplosione` o un `nemico.colpo` di un attore `boss`, THEN il tonfo (rumore passa-basso in
  caduta + convolver con impulso sintetico lungo `riverbero_ms`, coda a `riverbero_volume`); un colpo comune no (A07)
- [x] GIVEN `stanza.entrata`, THEN la campana (tre seni: fondamentale, ×`parziale_2`, ×`parziale_3`, decadimento `durata_ms`) (A04)
- [x] GIVEN `ferruccio.colpo`, `ferruccio.danno`, `economia.monete` con delta > 0, `stanza.chiusa`, `attivo.usato`, THEN
  colpo a segno (quadra), colpo subito (dente di sega), moneta, porta chiusa, attivo; monete perse → niente (A06)
- [x] GIVEN lo stesso suono due volte entro `gap_min_ms`, THEN il secondo non parte; suoni diversi non si bloccano (A08)
- [x] GIVEN `M` (azione `muto` di `input.json`, in ogni stato) o il click sull'interruttore del menu, THEN master a 0, nessun
  nodo nuovo, testo «Audio: spento (M)»; di nuovo → `master.volume` e «Audio: acceso (M)» (A09, A12; wire caso 1 con
  screenshot `menu-audio.png`); fuori dal menu l'interruttore è nascosto (wire caso 2)
- [x] GIVEN Node senza `AudioContext`, THEN `sveglia()` e `suona()` ritornano false, tutti gli eventi passano senza errori (A02)
- [x] Regole del codice: nessun `Math.random` in `gioco/motore`, JSDoc sugli export, `audio.json` valido come file di
  statistiche, nessun modulo di stato importa l'audio (A01, A13)

---

## Evidenza

- `node gioco/qa/audio.test.mjs` 13/13; `node gioco/qa/audio.wire.test.js` 2/2 (contesto `running` nel Chromium headless:
  i nodi per evento sono contati davvero: campana 3 oscillatori, toc sorgente + filtro + oscillatore, tonfo convolver).
- Screenshot (deviceScaleFactor 1): `production/qa/evidence/menu-audio.png` — il menu con l'interruttore «Audio: spento (M)»
  in basso a destra (bordo tratteggiato d'oro in muto).
- Tutte le altre suite verdi (vedi il README) e `grep -rn "Math.random" gioco/motore` vuoto.

## Decisioni

- **Solo eventi**: `eventi-audio.js` ascolta il bus e chiama `sintesi.suona(nome)`; nessun modulo di stato importa l'audio.
  Per il passo non esisteva un evento: `attori/passi.js` lo deriva dalla distanza percorsa (osserva le posizioni, non muta
  nulla), così la cadenza segue la velocità effettiva (scatto compreso) senza toccare `ferruccio.js` e `nemico.js` delle
  altre squadre. L'unica riga aggiunta fuori perimetro è `ferruccio.fendente` in `combattimento.js` (solo con la spada:
  senza spada parte già `ferruccio.sparo`).
- **Forme d'onda nel codice, numeri nel JSON**: `audio.json` è un file di statistiche (`FILE_STATISTICHE`), quindi ogni
  foglia è `{base,min,max}`; le forme d'onda (triangolo, seno, quadra, dente di sega) e la struttura dei grafi stanno nelle
  ricette di `sintesi.js`. `passi.lunghezza_px` vive in `audio.json` perché serve solo alla cadenza dei toc.
- **Contesto al primo gesto**: `collega({finestra})` registra `keydown/pointerdown/mousedown/touchstart` in fase di cattura
  e li rimuove appena il contesto gira; `suona` su un contesto sospeso non crea nodi (eviterebbe una raffica alla ripresa)
  ma riprova `resume()`. In muto non nasce nessun nodo (non solo master a 0).
- **Eventi futuri già mappati**: `esplosione`/`bomba.esplosione` (bomba ferma, squadra nemici) e `attivo.usato` (Q, squadra
  oggetti) hanno già il loro suono: quando quelle squadre li emetteranno, suoneranno senza altre modifiche.
- **Interruttore nel menu**: `interfaccia/audio.js` è un bottone DOM indipendente dal menu (`menu.js` non è stato toccato),
  visibile con il ciclo in `menu`; `M` vale in ogni stato tramite l'azione `muto` di `input.json`.

## Da fare

Volume regolabile (oggi solo `master.volume` dal JSON e il muto); musica/ambiente del palco; suoni per archetipo di nemico
(oggi un solo `passo_nemico`); porte che si aprono (oggi la campana segna l'ingresso nella stanza).
