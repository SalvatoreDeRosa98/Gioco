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
| `30-mappa.js` | `generaMappaPiano`, porte, `popolaStanza`, `avviaPiano`, `entraInStanza`, muri segreti |
| `40-combattimento.js` | attacchi, proiettili, meccaniche D, feel (scossa, hit-stop, spinte), danni, pulizia stanza, `passoLogico` (IA, collisioni) |
| `50-oggetti.js` | oggetti attivi, pool della run, estrazioni, oggetti conosciuti, diario |
| `60-resa.js` | risoluzione, pannello sviluppatore, stanza, menu selezione, `disegnaFrame`, HUD, sipario, menu pausa |
| `70-input.js` | tastiera, mouse, bottoni della pagina |
| `80-ciclo.js` | loop a passo fisso, esposizione `window.__teatroInterno` / `window.__teatro.interni`, avvio (`requestAnimationFrame(loop)`) |
| `t3-economia-salvataggi.js`, `t4-hub-storia.js` | economia/salvataggi e hub/storia; leggono lo stato via `window.__teatroInterno` |
| `a1-bombe-chiavi.js` | (miglioramento 1) bombe [E se non c'è niente da usare vicino], chiavi, forzieri, porte chiuse a lucchetto su tesoro/Fucina dal piano 2; tabella `BOMBE_CHIAVI_A1`; avvolge generaMappaPiano/avviaPiano/entraInStanza/verificaStanzaPulita/interagisciStanza/passoLogico/disegnaStanzaPixelArt; espone `aggiungiBombe`, `aggiungiChiavi`, `generaForziere`, `interazioniVicineA1`. QA: `tools/qa-teatro-bombe.js` |
| `a8-musica.js` | musica procedurale (miglioramento 8): tabella `MUSICA` (temi per hub, piani 1-4, boss, quiete, morte; strumenti; volumi), sequencer 6/8 a lookahead sull'AudioContext di AudioSys (`AudioSys.ctx`), rispetta il muto; sonda `interni.Musica.stato`. QA: `tools/qa-teatro-musica.js` |
| `a2-consumabili.js` | (miglioramento 2) consumabili sconosciuti: ampolle (colore → effetto rimescolato per run) e carte napoletane, slot HUD [F], drop alla pulizia, slot «consumabile» della Fucina, pagina del Diario (C). Avvolge funzioni globali; agganci: `scalaA2` in 10-sprite.js/60-resa.js e raggio del colpo in 40-combattimento.js. Caricato dopo `t4-hub-storia.js`. QA: `tools/qa-teatro-consumabili.js` |
| `a3-stanze-speciali.js` | miglioramento 3: stanze Sfida, Sacrificio, dei Rovi (maledetta), Bisca (lotto e Cartomante); tabella `STANZE_SPECIALI_A3`; avvolge `generaMappaPiano`, `entraInStanza`, `verificaStanzaPulita`, `interagisciStanza`, `passoLogico`, `disegnaStanzaPixelArt`, `disegnaHUDPixelArt` (nessuna modifica ai file di base). QA: `tools/qa-teatro-stanze-speciali.js` |
| `a6-progressione.js` | miglioramento 6: sblocchi di personaggi e oggetti (tabella SBLOCCHI_A6), segni di completamento per boss, notifica «SBLOCCATO», migrazione degli slot; avvolge funzioni di base, nessun gancio; QA `tools/qa-teatro-progressione.js`, interni `sbloccaTutto()`/`azzeraSblocchi()` |
| `a7-registro-bilancio.js` | miglioramento 7: registro di fine run (pergamena dopo la sequenza di morte e alla vittoria su Donna Luciana; un tasto la chiude), «Registro delle notti» nel menu ESC [L] con statistiche ed esportazione JSON [X]; ultime 50 run per slot in localStorage `ferruccio.teatro.registro.<slot>`; tabelle `CONFIG_A7`/`TESTI_A7`; avvolge funzioni di base, nessun gancio; interni `registroRun()`, `esportaRegistro()`, `runInCorsoA7()`. QA `tools/qa-teatro-registro.js`. Bilancio: `tools/sim-bilancio-teatro.js` (simulazione col codice del gioco), risultati in `production/bilancio-teatro.md` |
| `b4-trasformazioni.js` | (squadra b4) temi degli oggetti (`temiDi(item)`: prima `item.temi`, poi la tabella `TEMI_OGGETTI_B4` con tutti gli oggetti dei tre cataloghi), otto TRASFORMAZIONI (3 oggetti diversi dello stesso tema: una volta per tema, resta per la run; annuncio con cartiglio, suono, lampo; costume disegnato sopra/attorno al burattino; numeri in `TRASFORMAZIONI_B4`) e 18 SINERGIE a coppie (`SINERGIE_B4`); fila dei temi sotto la minimappa, pagine del Diario col tasto T. Avvolge `ricalcolaStatistiche`, `danneggiaNemico`, `eseguiAttacco4Direzioni`, `rimbalzaD`, `subisciColpoGiocatore`, `verificaStanzaPulita`, `passoLogico`, `disegnaFerruccioPittorico`, `disegnaHUDPixelArt`, `tastoDiarioD`, `clickDiarioD`, `disegnaDiarioD` (nessuna modifica ai file di base). Caricato dopo `a7-registro-bilancio.js`. Interni: `temiDi`, `statoTrasformazioni()`, `daiOggettoQA(id)`, `azzeraTrasformazioniQA()`. QA: `tools/qa-teatro-trasformazioni.js` |
| `t2-sprite.js`, `sim-economia.js` | non collegati / strumenti |

## Regole per aggiungere codice

- Le `function` sono hoisted solo dentro lo stesso file. Il codice di primo livello (inizializzatori di `const`, chiamate, `Object.assign`) può usare solo ciò che sta in file caricati prima o prima nello stesso file. Le chiamate di avvio vanno in `80-ciclo.js`.
- Le `const`/`let` usate solo a runtime (dentro funzioni) possono stare in qualunque file.
- Non dichiarare al primo livello nomi di proprietà globali del browser (`name`, `status`, `top`, `parent`, `length`, `origin`, `event`, `close`, `open`, `stop`, `print`, `scroll`...).
- Nuovo file: aggiungere il `<script src="teatro/NN-nome.js">` nell'HTML nella posizione giusta. `tools/teatro-release.js` incorpora tutti gli `<script src="teatro/*.js">` in `production/release/teatro.html`.
- Per la QA, i nuovi interni vanno esposti in `80-ciclo.js` con `Object.assign(window.__teatro.interni, {...})`.
- Dopo ogni modifica: `node tools/qa-teatro-{generatore,avvio,morte,c,d}.js` sia su `gioco/teatro_marionette.html` sia su `production/release/teatro.html`.
