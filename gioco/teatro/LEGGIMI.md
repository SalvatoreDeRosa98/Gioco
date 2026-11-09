# Teatro delle Marionette: mappa dei file

`gioco/teatro_marionette.html` carica script **classici** (niente moduli ES, niente build: si apre con doppio click da `file://`).
Le dichiarazioni di primo livello (`const`/`let`/`function`) stanno nello scope globale lessicale condiviso fra gli script.

## Ordine di caricamento

| File | Contenuto |
|---|---|
| `00-config.js` | costanti, contesto canvas, FEEL, palette, tabelle: stanze, personaggi, patto, cataloghi oggetti (B, D), economia, boss (BOSS_A), STANZE_C, NOTTI_C |
| `10-sprite.js` | testo auto-fit, cache sprite, disegno pittorico di Ferruccio/nemici/boss, tabelle SPRITE_* (incluse le aggiunte dei nuovi oggetti) |
| `15-audio.js` | AudioSys (Web Audio procedurale) |
| `20-stato.js` | seme/rng, notti, `statoRun`, `player`, statistiche, scelta personaggio, nuova run, banner |
| `30-mappa.js` | `generaMappaPiano`, porte, `popolaStanzaIsaac`, `avviaPiano`, `entraInStanza`, muri segreti |
| `40-combattimento.js` | attacchi, proiettili, meccaniche D, feel (scossa, hit-stop, spinte), danni, pulizia stanza, `passoLogico` (IA, collisioni) |
| `50-oggetti.js` | oggetti attivi, pool della run, estrazioni, oggetti conosciuti, diario |
| `60-resa.js` | risoluzione, pannello sviluppatore, stanza, menu selezione, `disegnaFrame`, HUD, sipario, menu pausa |
| `70-input.js` | tastiera, mouse, bottoni della pagina |
| `80-ciclo.js` | loop a passo fisso, esposizione `window.__teatroInterno` / `window.__teatro.interni`, avvio (`requestAnimationFrame(loop)`) |
| `t3-economia-salvataggi.js`, `t4-hub-storia.js` | economia/salvataggi e hub/storia; leggono lo stato via `window.__teatroInterno` |
| `a1-bombe-chiavi.js` | (miglioramento 1) bombe [E se non c'è niente da usare vicino], chiavi, forzieri, porte chiuse a lucchetto su tesoro/Fucina dal piano 2; tabella `BOMBE_CHIAVI_A1`; avvolge generaMappaPiano/avviaPiano/entraInStanza/verificaStanzaPulita/interagisciStanza/passoLogico/disegnaStanzaPixelArt; espone `aggiungiBombe`, `aggiungiChiavi`, `generaForziere`, `interazioniVicineA1`. QA: `tools/qa-teatro-bombe.js` |
| `a8-musica.js` | musica procedurale (miglioramento 8): tabella `MUSICA` (temi per hub, piani 1-4, boss, quiete, morte; strumenti; volumi), sequencer 6/8 a lookahead sull'AudioContext di AudioSys (`AudioSys.ctx`), rispetta il muto; sonda `interni.Musica.stato`. QA: `tools/qa-teatro-musica.js` |
| `a2-consumabili.js` | (miglioramento 2) consumabili sconosciuti: ampolle (colore → effetto rimescolato per run) e carte napoletane, slot HUD [F], drop alla pulizia, slot «consumabile» della Fucina, pagina del Diario (C). Avvolge funzioni globali; agganci: `scalaA2` in 10-sprite.js/60-resa.js e raggio del colpo in 40-combattimento.js. Caricato dopo `t4-hub-storia.js`. QA: `tools/qa-teatro-consumabili.js` |
| `t2-sprite.js`, `sim-economia.js` | non collegati / strumenti |

## Regole per aggiungere codice

- Le `function` sono hoisted solo dentro lo stesso file. Il codice di primo livello (inizializzatori di `const`, chiamate, `Object.assign`) può usare solo ciò che sta in file caricati prima o prima nello stesso file. Le chiamate di avvio vanno in `80-ciclo.js`.
- Le `const`/`let` usate solo a runtime (dentro funzioni) possono stare in qualunque file.
- Non dichiarare al primo livello nomi di proprietà globali del browser (`name`, `status`, `top`, `parent`, `length`, `origin`, `event`, `close`, `open`, `stop`, `print`, `scroll`...).
- Nuovo file: aggiungere il `<script src="teatro/NN-nome.js">` nell'HTML nella posizione giusta. `tools/teatro-release.js` incorpora tutti gli `<script src="teatro/*.js">` in `production/release/teatro.html`.
- Per la QA, i nuovi interni vanno esposti in `80-ciclo.js` con `Object.assign(window.__teatro.interni, {...})`.
- Dopo ogni modifica: `node tools/qa-teatro-{generatore,avvio,morte,c,d}.js` sia su `gioco/teatro_marionette.html` sia su `production/release/teatro.html`.
