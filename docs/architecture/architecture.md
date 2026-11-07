# Architettura — Ferruccio: La Notte Immobile

> **Status**: Draft (tier `standard`: mappa dei livelli + ADR critici) · **Data**: 2026-11-07
> **Motore**: Web (browser): HTML5 Canvas 2D, JavaScript a moduli ES, nessun build.
> **Riferimento motore**: NOT SOURCEABLE — `docs/engine-reference/` non ha una voce Web. Le API usate
> (Canvas 2D, requestAnimationFrame, ES modules, localStorage, Gamepad API, Web Audio) sono stabili da
> anni e dentro i dati di addestramento: rischio di conoscenza BASSO. Ogni ADR lo dichiara.
> **Fonti di design**: `design/gdd/game-concept.md`, `design/gdd/systems-index.md`, i GDD in `design/gdd/`, `design/art/art-bible.md`.

## 1. Principi

1. **Dati, non codice.** Ogni numero di gioco vive in `gioco/contenuti/parametri/*.json`; ogni testo
   in `trama/storia.json` (copiato in `gioco/contenuti/storia.json` al build-less deploy) e in
   `gioco/contenuti/interfaccia.json`. Il motore non contiene stringhe di gioco né costanti di bilanciamento.
2. **Statistiche nominate e ganci.** Il combattimento espone statistiche con nome; i doni sono
   liste di modificatori su quei nomi e iscrizioni a ganci (GDD `combattimento.md` regola 9,
   `doni-modificatori.md`). Nessun `if (dono === 'x')` nel motore.
3. **Determinismo.** Ogni notte ha un seme; generazione, spawn e drop derivano da generatori
   seminati (mulberry32) separati per dominio, così un seme riproduce una notte intera e i test
   automatici sono stabili.
4. **Simulazione a passo fisso.** Logica a 60 Hz con passo fisso (16,667 ms) e accumulatore;
   rendering a frequenza del monitor con interpolazione. I tempi dei GDD (ms) si convertono in tick.
5. **Rendering come vincolo di produzione.** Tutto è vettoriale e procedurale (art bible §1):
   niente bitmap disegnate. Il renderer disegna ritagli (cutout) composti da pezzi, ellissi
   d'appoggio, ombre portate e luci su Canvas 2D.
6. **Verificabile senza umani.** Ogni sistema espone una superficie di test (`window.__gioco` in
   modalità debug) e il percorso Playwright `gioco/qa/` può forzare i 64 stati narrativi e
   riprodurre una notte da seme.

## 2. Mappa dei livelli

```
┌──────────────────────────── Presentation ────────────────────────────┐
│ hud · mappa del piano · menu/slot/opzioni · cartiglio e tableau       │
│ audio sintetico (Web Audio)                                           │
├──────────────────────────── Feature ─────────────────────────────────┤
│ combattimento · nemici (IA a stati) · boss · doni e modificatori      │
│ ricordi con scelta · incontri e dialoghi · economia · fucina          │
│ generazione dei piani · finali e mondo dopo                           │
├──────────────────────────── Core ────────────────────────────────────┤
│ controllo di Ferruccio · stanze e porte · fisica e collisioni         │
│ camera e transizioni · salvataggio e profilo · strumenti QA           │
├──────────────────────────── Foundation ──────────────────────────────┤
│ ciclo di gioco e stati · input · rendering a teatro delle ombre        │
│ stato narrativo (dati) · parametri (dati) · rng seminato · tempo      │
└──────────────────────────────────────────────────────────────────────┘
```

Regola di dipendenza: un modulo importa solo dal proprio livello o da quelli sotto. Le eccezioni
passano per **eventi** (bus `eventi.js`): un modulo Feature emette `nemico.morto`, la
Presentation ascolta; mai il contrario.

## 3. Moduli e cartelle

```
gioco/
├── index.html                      # pagina completa, canvas + DOM per HUD e cartiglio
├── stile/                          # token CSS dell'art bible, HUD, cartiglio, menu
├── motore/
│   ├── fondazione/  ciclo.js tempo.js input.js rng.js eventi.js parametri.js
│   ├── resa/        renderer.js cutout.js luci.js ombre.js camera.js effetti.js
│   ├── mondo/       stanza.js porte.js fisica.js generazione.js modelli-stanza.js
│   ├── attori/      ferruccio.js combattimento.js nemico.js ia/*.js boss/*.js
│   ├── oggetti/     doni.js modificatori.js ricordi.js economia.js fucina.js
│   ├── storia/      stato-narrativo.js condizioni.js incontri.js dialogo.js finali.js
│   ├── persistenza/ salvataggio.js profilo.js
│   └── ui/          hud.js mappa.js menu.js cartiglio.js tableau.js audio.js
├── contenuti/
│   ├── parametri/   ferruccio.json combattimento.json nemici.json boss.json doni.json
│   │                economia.json generazione.json stanze.json interfaccia.json palette.json
│   ├── modelli-stanza/<piano>/*.json      # stanze fatte a mano
│   ├── storia.json                        # copia di trama/storia.json + ancoraggi
│   └── interfaccia.json
└── qa/            percorri.js seme.js stati64.js evidenze/
```

## 4. Flussi di dati principali

- **Avvio di una notte**: `profilo` → `stato-narrativo` (flag) → `generazione(seme, piano, obbligatorie non viste)` → pianta del piano → `stanza` corrente montata → `renderer`.
- **Tick di combattimento**: `input` → `ferruccio` (stato) → `combattimento` (hitbox, danno con statistiche effettive da `modificatori`) → `nemico`/`boss` (vita, stordimento) → eventi (`colpo`, `parata`, `morto`) → `effetti` (hit-stop, scossa), `economia` (drop), `ricordi` (drop del boss), `hud`.
- **Dialogo**: `stanza` (porte aperte) + `incontri` (ancoraggio) → `stato-narrativo.disponibili()` → `cartiglio` → scelta → `stato-narrativo.decidi()` → `salvataggio`.
- **Morte**: `ferruccio` → evento `morte` → `ciclo` (stato hub) → `profilo` (scintille, flag, notte+1) → hub con `incontri`.

## 5. ADR critici (Foundation) e di livello Core

| ADR | Titolo | Layer | Stato |
|---|---|---|---|
| ADR-0001 | Gioco web senza build: Canvas 2D e moduli ES | Foundation | Proposed |
| ADR-0002 | Parametri in JSON e contratto statistiche nominate + ganci | Foundation | Proposed |
| ADR-0003 | Determinismo: seme della notte e generatori per dominio; passo fisso | Foundation | Proposed |
| ADR-0004 | Stato narrativo: lettura di storia.json, condizioni, persistenza | Foundation | Proposed |
| ADR-0005 | Renderer del presepe d'ombre: cutout a pezzi, ellissi, ombre, luci | Foundation | Proposed |
| ADR-0006 | Salvataggio: profilo versionato in localStorage, tre slot, ripresa della notte da seme | Core | Proposed |

Gli ADR passano ad `Accepted` solo con conferma esplicita dell'autore.

## 6. Prestazioni (budget)

| Voce | Budget | Misura |
|---|---|---|
| Logica per tick | ≤ 2 ms con 20 nemici | `performance.now()` attorno a `ciclo.tick` |
| Rendering per frame | ≤ 6 ms a 1280×720 su GPU integrata | `requestAnimationFrame` delta |
| Luci per stanza | ≤ 8 | parametro |
| Sagome a schermo | ≤ 40 | parametro |
| Memoria | ≤ 150 MB | DevTools |

## 7. Rischi tecnici e come si verificano

| Rischio | Verifica |
|---|---|
| Canvas con ombre portate e aloni lento | prototipo `prototypes/stanza-gatti-concept/` misura ms/frame |
| Generazione con stanze morte | `qa/seme.js` genera 200 piani e riporta i violatori dei vincoli |
| Esplosione combinatoria delle condizioni narrative | `qa/stati64.js` forza i 64 stati e verifica la raggiungibilità di ogni scena `epilogo` |
| Deriva tra ms dei GDD e tick | tutti i tempi in `parametri/*.json` sono in ms; `tempo.js` converte una volta sola |
