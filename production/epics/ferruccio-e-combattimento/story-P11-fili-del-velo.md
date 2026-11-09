# Story P11: I due fili del Velo — uno dalla Mano sinistra, uno dalla destra, meno visibili

> **Epic**: Ferruccio e combattimento (resa delle marionette; integrazione del passo 1)
> **Status**: Done
> **Layer**: resa (`resa/fili.js` nuovo, `resa/renderer.js`), composizione (`avvio.js` passa `parametri` al renderer), contenuti (`resa.json › fili`)
> **Type**: Visual/Feel + Logic
> **Estimate**: S
> **Manifest Version**: N/A
> **Last Updated**: 2026-11-09

## Context

**Richiesta dell'autore (2026-11-09)**: «i fili dalle mani sono tutti fatti male: ci devono essere due fili sempre, 1 dalla mano
sinistra e 1 dalla destra, ma meno visibili a schermo». Prima il renderer tirava un filo solo (dalla Mano del lato in cui stava il
nemico, al massimo quattro per Mano, retta di 2 px all'85 %) più un moncone verticale di 1,5 px sopra ogni nemico.
**Regola**: ogni marionetta mossa dal Velo (nemici, boss dei piani, NPC dell'hub; mai Ferruccio e i giocabili, che hanno spezzato i
fili; Donna Luciana è la Marionettista) ha SEMPRE due fili, attaccati a due punti distinti del corpo (le spalle, a ~3/4 dell'altezza
dai piedi), 1 px, oro al 25-35 %, leggera curva verso il basso, senza alone e senza tratteggio. Nella stanza del boss finale le
Mani scese mantengono i due fili. **ADR-0002**: i numeri in `resa.json › fili` come {base,min,max}.

---

## Acceptance Criteria

- [x] **Given** una stanza con nemici vivi **When** il renderer disegna il frame **Then** ogni nemico ha esattamente due fili, uno
  dalla Mano sinistra e uno dalla Mano destra, alle due spalle (`fili.wire.test.js`: `fili = 2 × marionette` nel piano 1).
- [x] **Given** l'hub di Piazza Dante **When** Tonino è al banchetto **Then** pende da due fili (`fili.wire.test.js`, `fili-hub.png`).
- [x] **Given** Ferruccio o un personaggio giocabile **Then** nessun filo (il conteggio coincide con i soli bersagli vivi).
- [x] **Given** `resa.json › fili` **Then** spessore 1 px, alpha 0,30 (min 0,25, max 0,35), ancoraggio_y 0,75, curva_px 16, tutti
  {base,min,max} validi (`fili.test.mjs`, `parametri.test.js`).
- [x] **Given** `resa/fili.js` su un contesto finto **Then** due curve quadratiche con il controllo sotto la corda, `setLineDash([])`,
  `shadowBlur 0`, nessun `lineTo`/`arc` (nessun alone), save/restore appaiati (`fili.test.mjs` 4/4).
- [x] **Given** la stanza di Donna Luciana **Then** i due fili partono dalle Mani scese nel palco (`disegnaDonnaLucianaBoss` →
  `disegnaFiliMarionette`), senza conversione di coordinate. (Verificato per lettura del codice e con `boss.wire.test.js` verde;
  nessuno screenshot dedicato del piano 4.)
- [x] **Given** `?debug=1&wire=1&diagnostica=1` **Then** `debug.js` non cambia (nessuna grafica aggiunta).

## Evidenza

- `node gioco/qa/fili.test.mjs` → 4/4; `node gioco/qa/fili.wire.test.js` → 3/3.
- `production/qa/evidence/fili-marionette.png` (piano 1, Re-Gatto di prova: due fili sottili dalle due Mani alle spalle),
  `production/qa/evidence/fili-hub.png` (Tonino nell'hub). Screenshot guardati.
- Tutte le suite verdi dopo la fusione dei cinque rami (vedi EPIC).

## Decisioni

- I fili si disegnano nel palco (dentro la trasformazione della camera) subito dopo i corpi e prima di Ferruccio: le dita delle Mani
  del proscenio sono portate nel palco con l'inverso di `translate(scossa) + camera.applica` (scala e scorrimento), così la scossa e le
  transizioni di stanza non staccano i fili dai corpi.
- La marionetta i-esima pende dal dito `i % 4` di ciascuna Mano (nessun tetto al numero di fili: la regola è «sempre due»).
- Corpo di un bersaglio: piedi a `y + r`, altezza `2r`, spalle a `± r × scarto_x`; NPC dell'hub: dalla sagoma disegnata (piedi `y+6`,
  altezza 49, mezza larghezza 14). Quando arriveranno gli sprite veri delle marionette, il corpo va preso dal fotogramma del manifesto.
- Cucitura fra squadre fatta nello stesso passo: `nemico.esplosione` (Bomba Ferma) viene rilanciato come `bomba.esplosione` in
  `avvio.js`, così la scossa (feel) e il tonfo (audio) partono davvero.
