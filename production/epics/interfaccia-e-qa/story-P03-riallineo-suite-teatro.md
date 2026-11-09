# Story P03: Riallineo delle suite al Teatro (passo 0 del porting)

> **Epic**: Interfaccia e QA
> **Status**: Done
> **Layer**: QA (gioco/qa) + due ritocchi al motore (economia, risveglio)
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (nessun control manifest)
> **Last Updated**: 2026-11-09

## Context

**Fonte delle regole**: `gioco/teatro_marionette.html` (prototipo dell'autore, tabelle righe ~2349-2535) e i commit
`55125c2`, `dd916ac` che hanno portato nel motore prezzi e drop Isaac (`economia.json`), catalogo a 25 doni
(`doni.json`), piani 5/7/8/9 stanze (`generazione.json`, 21 modelli), vita del gatto 8 e boss provvisorio 140
(`nemici.json`), motivo di fine piano `discesa` (`storia/risveglio.js`, `PIANO_FINALE` 4) e la meta
`<meta name="gioco-avvio" content="debug=1&wire=1&piano=1">` in `index.html` e `prova.html`.
**Requirement**: dopo quei commit 37 casi unitari in 7 file e 9 suite Playwright (16 casi) erano rossi perché
fissavano i valori del GDD vecchio. Nessuna funzionalità nuova: i test devono leggere i valori dai JSON o accettare
il comportamento nuovo, senza cancellare casi né abbassare la copertura.
**ADR Governing Implementation**: ADR-0002 (parametri `{base,min,max}`, clamp del valore effettivo), ADR-0003 (rng seminato).
**Regola nuova dell'autore (2026-11-08)**: niente segni a terra che anticipano gli attacchi dei nemici. Non toccata da
questa storia (nessuna modifica a renderer, HUD o debug.js): va applicata nei passi successivi del porting.

---

## Acceptance Criteria

- [x] GIVEN le 13 suite `node:test` in `gioco/qa/*.test.mjs` e `parametri.test.js`, WHEN girano, THEN sono tutte verdi (241/241 + 4/4) e nessun caso è stato cancellato o saltato: i 37 casi rossi sono stati riscritti leggendo i valori da `economia.json`, `nemici.json`, `doni.json`, `ferruccio.json`, `combattimento.json`, `sinergie.json`, `generazione.json`, `indice.json` e `piazza-dante-riserva.json`, oppure con la regola nuova del Teatro scritta nel nome del caso (prezzi 3/5/10/15/20 costanti sui piani; 25 doni, 20 d'oro tutti MVP + Medaglione; 21 modelli 10/2/1/1/4/1/1/1; piani 5/7/8/9; `L_min ≤ n_min − 3`; discesa fra i piani)
- [x] GIVEN le 9 suite Playwright (`pagina`, `combattimento.wire`, `mondo.wire`, `hub.wire`, `notte.wire`, `prova.wire`, `boss.wire`, `vetrina`, `pacchetto`) più le 3 già verdi (`cartiglio.wire`, `doni.wire`, `ricordi.wire`), WHEN girano, THEN sono verdi: le pagine che partono dalla meta `gioco-avvio` sono attese in `notte` nella stanza `ingresso` (pacchetto, prova, pagina); l'hub e la scena di prova dei fantocci passano `piano=0` per annullare il default della meta; `prova.wire` prova anche la pagina SENZA meta servendola con `page.route` (pannello null, stato `menu`), così il ramo resta coperto
- [x] GIVEN `parametri.test.js`, WHEN valida il catalogo a 25 doni, THEN nessun buco: i 5 doni nuovi (Maschera di Broccato, Stocco d'Argento, Cuore di Legno Antico, Anello del Marionettista, Bilancino Spezzato, Tizzone della Fucina) usano gli effetti `cura`, `onda`, `scintilla` già in `oggetti/effetti.js` e statistiche già nel registro (`danno_riflesso`, `molt_f3`, `molt_affondo`, `t_startup_f`)
- [x] GIVEN `nemici.test.mjs` 020 c3, WHEN il bot gioca 30 stanze da 2 gatti con vita 8, THEN la media misurata è 7,11 s: il tetto della finestra del GDD (7 s, misurato con vita 6) scala con `nemici.json › archetipi.gatto.vita` (7 × 8/6 = 9,33 s), il minimo resta 3 s, le singole ≤ 2× il tetto
- [x] GIVEN `mondo.test.mjs`, WHEN legge `generazione.json` (p1: `n_min` 5, `L_min` 2), THEN l'invariante del validatore è `L_min ≤ n_min − 3` (già nel codice dell'autore, `modelli.js`); la descrizione del JSON ora lo documenta; `validaParametriGenerazione` non segnala errori e segnala `L_min` 5
- [x] GIVEN `pacchetto.test.js` e `prova.wire.test.js`, WHEN aprono le pagine con la meta, THEN attendono stato `notte` e stanza `ingresso` (non più `hub`)
- [x] GIVEN il piano 1 completato (`boss-provvisorio.test.mjs` (e), `boss.wire.test.js`), WHEN finisce il velo `discesa`, THEN `piano.discesa` {daPiano 1, aPiano 2}, nessun `risveglio.fine`, notte invariata, `piano_max` 2, flag, scintille, doni e **Medaglione** restano addosso, e la notte dell'economia NON si chiude (nessun `economia.fine_notte`: residuo e consumabili si tengono fra i piani)
- [x] GIVEN `grep -rn "Math.random" gioco/motore`, THEN vuoto; `node gioco/qa/stati64.js` nessun buco e 0 conflitti; `node gioco/qa/seme.js 200` 0 violatori

---

## Evidenza

Suite (prima → dopo):

| Suite | Prima | Dopo |
|---|---|---|
| `boss-provvisorio.test.mjs` | 3/5 | 5/5 |
| `combattimento.test.mjs` | 32/32 | 32/32 |
| `condizioni.test.mjs` | 37/37 | 37/37 |
| `doni.integrazione.test.mjs` | 6/9 | 9/9 |
| `doni.test.mjs` | 14/27 | 27/27 |
| `economia.test.mjs` | 5/13 | 13/13 |
| `fondazione.test.mjs` | 28/28 | 28/28 |
| `incontri.test.mjs` | 23/23 | 23/23 |
| `mondo.test.mjs` | 14/21 | 21/21 |
| `nemici.test.mjs` | 22/24 | 24/24 |
| `notte.test.mjs` | 9/9 | 9/9 |
| `prova.test.mjs` | 3/3 | 3/3 |
| `ricordi.test.mjs` | 9/9 | 9/9 |
| `parametri.test.js` | 2/4 | 4/4 |
| `pagina.test.js` | 3/5 | 5/5 |
| `boss.wire.test.js` | 0/1 | 1/1 |
| `cartiglio.wire.test.js` | 2/2 | 2/2 |
| `combattimento.wire.test.js` | 0/2 | 2/2 |
| `doni.wire.test.js` | 1/1 | 1/1 |
| `hub.wire.test.js` | 0/1 | 1/1 |
| `mondo.wire.test.js` | 0/2 | 2/2 |
| `notte.wire.test.js` | 0/1 | 1/1 |
| `prova.wire.test.js` | 0/2 | 2/2 |
| `ricordi.wire.test.js` | 2/2 | 2/2 |
| `vetrina.test.js` | 0/1 | 1/1 |
| `pacchetto.test.js` | 2/6 | 6/6 |
| `stati64.js` / `seme.js 200` | ok | ok (0 violatori) |

Screenshot rigenerati dalle suite in `production/qa/evidence/` (deviceScaleFactor 1): `boss-provvisorio.png`,
`vetrina-stanze-grigi.png`, `vetrina-stanze.png`, `prova-pagina.png`, `mondo-wire.png`, `mondo-pianta.png`,
`pacchetto-file.png`, `hub-wire.png`, `notte-*.png`, `combattimento-wire.png`, `fondazione-pagina.png`.

---

## Decisioni

- **I test leggono i JSON, non ricopiano i numeri**: `doni.test.mjs` ha helper `sommaSu`/`prodottoSu`/`clampa` e
  `probabilitaAttese` (W_r(p)/ΣW × peso/Σpeso), `economia.test.mjs` ricalcola E_stanza, T(3), monete_boss e la
  tolleranza binomiale del drop dai valori di `economia.json`; `nemici.test.mjs` applica F1 alle vite base del file.
  Dove un numero è una regola del Teatro (prezzi 3/5/10/15/20, 5/7/8/9 stanze, 25 doni, 21 modelli) resta scritto nel
  nome del caso e in una costante commentata.
- **Meta `gioco-avvio` di `index.html`**: la pagina parte nel piano 1. I test che vogliono il `menu`, l'hub o la scena di
  prova dei fantocci passano `wire=0`/`debug=0`/`piano=0` (l'URL vince sulla meta, `fondazione/avvio-url.js`);
  documentato nel README. `prova.wire` copre il ramo «senza meta» servendo `index.html` con la meta tolta al volo.
- **Fine della notte dell'economia** (unica modifica al motore, piccola): `piano.completato` non chiude più la notte
  (`economia.js`); `fineNotte()` la chiama il risveglio prima di `nuovaNotte()` solo quando la run finisce davvero
  (`risveglio.js`). Senza questo il Teatro perdeva il Medaglione e i consumabili a ogni discesa (`economia.fine_notte` →
  `ricordi.perso`), contro la regola «il Medaglione non va perso, va integrato». Alla morte `fineNotte()` è idempotente
  (già chiusa da `ferruccio.morto`).
- **Vetrina**: le sagome cave (telaio: cornice piena con il centro vuoto; colonna crepata: crepa chiara nel centro) sono
  campionate sul corpo della sagoma (`luminanza(id, c, r, fx, fy)` in `qa/vetrina-stanze.html`); il disegno non cambia.
- **Durata delle stanze del bot** (020 c3): il tetto scala con la vita del gatto letta da `nemici.json`; il GDD
  dei nemici non è stato riscritto (fuori scopo di questa storia).
- **Cartiglio dei doni**: il Teatro descrive gli oggetti fino a ~75 caratteri; il limite del test «una riga» passa da 60
  a 80 (il cartiglio DOM va a capo). I nomi restano ≤ 28.
- **Budget dei ganci** (doni 16): con `max_slot_doni` 5 del Teatro il budget si prova con il suo minimo (3), così
  budget + 2 doni stanno negli slot; il caso resta identico nella sostanza.

## Segnalazioni per i passi successivi (non toccate qui)

- `risveglio.js`: `PIANO_FINALE = 4` e `Math.min(900, t_velo)` sono numeri di gioco nel codice; `modificatori.js`
  `Math.min(5, limite('max_slot_doni'))`; `banchetto.js` `rng() < 0.65` (secondo dono della Fucina); `avvio.js`
  `POOL_BOSS_PIANI`/`BOSS_FINALE_DONNA_LUCIANA` hardcoded: vanno in `contenuti/parametri/*.json` quando si porta il Teatro.
- `completaPiano` usa sempre il motivo `discesa` (anche al piano 4): il ciclo infinito del Teatro non è ancora nel
  motore (al piano 4 `risveglia()` fa il risveglio pieno, cioè una run nuova dal piano 1), e il testo
  `fine_piano.velo` («Donna Luciana è sconfitta!») non viene mai mostrato perché la fase resta `discesa`.
- Il residuo di scintille (`economia.fineNotte`) ora si paga alla fine della run: con un piano in più per notte
  `stanze_per_scintilla` andrà rivisto con l'economia del Teatro.
