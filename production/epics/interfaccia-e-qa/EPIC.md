# Epic: Interfaccia e QA

> **Layer**: Presentation
> **GDD**: design/ux/hud.md (da scrivere), design/gdd/systems-index.md righe 20, 22, 25
> **Architecture Module**: motore/ui, gioco/qa
> **Status**: Ready
> **Stories**: 4 storie (sotto)

## Overview

HUD a proscenio (maschere, scatto, monete, doni, nome della stanza), menu con tre slot e Continua, e il percorso Playwright che gioca con seme fisso, cattura le evidenze e forza i 64 stati narrativi.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001 | vedi `docs/architecture/adr-0001.md` | LOW |
| ADR-0003 | vedi `docs/architecture/adr-0003.md` | LOW |

## GDD Requirements

*(Il TR registry non è stato ancora generato da `/architecture-review`: i requisiti sono citati per sezione del GDD. NOT ASSESSED finché la review non assegna i TR-ID.)*

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| NOT ASSESSED | I requisiti sono le regole numerate e i criteri Given-When-Then dei GDD citati sopra | ADR-0001, ADR-0003 (Proposed) |

## Definition of Done

- Tutte le storie implementate, riviste e chiuse con `/story-done`
- Tutti i criteri di accettazione dei GDD citati verificati
- Le storie Logic e Integration hanno test in `gioco/qa/` che passano
- Le storie Visual/Feel e UI hanno screenshot conservati in `production/qa/evidence/`

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 031 | HUD a proscenio | UI | Done tramite P13 (l'HUD è quello del Teatro: scheda con nome/piano/maschere/statistiche/monete, barra del boss, dock degli slot; il nastro dello scatto e il nome del quartiere del GDD vecchio non ci sono: il Teatro non li ha) | ADR-0001 |
| P13 | HUD completo del Teatro in DOM (`interfaccia/hud.js`, `stile/hud.css`): scheda in alto a sinistra (nome e titolo del personaggio, piano e ciclo, tipo della stanza, mezze maschere PNG, DMG/TRS/SPD/RNG con icone, monete, scintille), barra della vita del boss in alto al centro (una sola), dock in basso al centro (attivo con tacche e tasto, cinque slot con le icone `oggetto-<id_teatro>`, patti); HUD vecchi rimossi; `prova.css` anche in `index.html` | UI | Done (`hud.test.mjs` 8/8, `hud.wire.test.js` 7/7 con `hud.png`, `hud-slot-pieno.png`, `hud-boss.png`, `hud-400.png`, `teatro-hud-riferimento.png`; suite completa verde) | ADR-0001, ADR-0002 |
| 032 | Menu, tre slot, Continua, opzioni minime | UI | Done tramite P03/P04/P05 (menu di selezione del Teatro con 5 slot e «Cancella» con conferma; «Continua» è il pannello della storia 030 nell'hub; le opzioni — volume, moto ridotto, rimappatura — restano fuori: vedi la nota nella 032) | ADR-0001 |
| 033 | Percorso Playwright: seme fisso, bot, evidenze, 64 stati | Logic | Ready | ADR-0001 |
| P04 | Menu di selezione del personaggio e dello slot, statistiche alla Isaac, sparo a 4 direzioni con le frecce, tabelle del Teatro in JSON (personaggi, oggetti attivi, patto, boss) — meta `gioco-avvio` = `debug=1` | UI + Logic | In Progress (menu, statistiche e frecce fatti e testati: `statistiche.test.mjs` 11/11, `combattimento.test.mjs` 38/38, `pagina.test.js` 5/5 con `menu-selezione.png`; mancano l'uso di Q, il Patto in gioco, i boss del pool come nemici veri e l'HUD pixel-art del Teatro — nome · piano, maschere, danno, slot degli oggetti —, che per l'autore è «l'hub di gioco» mancante: oggi in stanza c'è solo la riga diagnostica, vedi `combattimento-wire.png`) | ADR-0001, ADR-0002 |
| P05 | Verifica di pagina del menu e delle frecce (`menu.wire.test.js`: menu → Agnese con la tastiera → slot 2 → hub con due cuori → Esc → menu; freccia destra spara senza muovere) e `suite-completa.sh`; la 032 chiusa tramite P03/P04/P05 | UI + QA | Done | ADR-0001 |
| P10 | Audio dinamico minimale con Web Audio API (nessun file): `motore/audio/sintesi.js` (oscillatori e rumore seminato con inviluppi, convolver sintetico, AudioContext al primo gesto, master, muto) ed `eventi-audio.js` (toc dei passi via `attori/passi.js` → `attore.passo`, sibilo del fendente/affondo/sparo, tonfo di esplosioni e impatti dei boss, campana a `stanza.entrata`, colpo a segno/subito, moneta, porta chiusa, attivo); `audio.json` {base,min,max}; `M` e interruttore nel menu | Logic + UI | Done (`audio.test.mjs` 13/13 con AudioContext finto, `audio.wire.test.js` 2/2 con `menu-audio.png`; tutte le altre suite verdi) | ADR-0002, ADR-0003 |
| P03 | Riallineo delle suite al Teatro — i test leggono i valori dai JSON (prezzi, drop, vite, catalogo a 25, 21 modelli, 5/7/8/9 stanze, discesa tra i piani, meta `gioco-avvio` di index.html) | Logic | Done (13 suite node:test 241/241, `parametri.test.js` 4/4, 9 suite Playwright verdi, `stati64`, `seme 200`) | ADR-0002, ADR-0003 |
