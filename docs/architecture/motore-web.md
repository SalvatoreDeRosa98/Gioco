# Motore web del teatro delle ombre

Stato: Accettato · 2026-11-07 · Sostituisce l'architettura Godot v1 (vedi `docs/architecture/npc-painted-cutouts.md`, storico).

## Decisione

Il gioco è una pagina web statica: nessun framework, nessun passo di build, nessuna dipendenza esterna
oltre ai font Google (con fallback serif). Motivi: lo stile è nativo in SVG; ogni passo si verifica con
Playwright nella stessa sessione; l'autore gioca da un link senza installare nulla; l'impacchettamento
Windows (Tauri o Electron) è un passo finale, non un vincolo quotidiano.

## Struttura delle cartelle

```
gioco/
├── index.html              # pagina unica: cornice, scena SVG, cartiglio, HUD, menu
├── stile/                  # CSS: token, cornice, cartiglio, HUD, animazioni dei burattini
├── motore/                 # moduli ES (senza build): un file per responsabilità
│   ├── gioco.js            # avvio, ciclo, cambio capitolo
│   ├── stato.js            # i sei flag, inventario di indizi, salvataggio in localStorage
│   ├── scena.js            # monta un quadro: strati in parallasse, punti caldi, camera
│   ├── burattino.js        # personaggi a pezzi (SVG <g>), posa, cammino, respiro, sciarpa
│   ├── dialogo.js          # cartiglio, battute condizionate, scelte, didascalie
│   ├── duello.js           # minigioco del duello d'ombre
│   ├── ricordo.js          # tableau immobile con una voce
│   ├── input.js            # tastiera, mouse, touch, gamepad
│   └── audio.js            # WebAudio sintetico (più avanti)
├── contenuti/
│   ├── storia.json         # copia di design/narrative/storia.json (fonte di verità: design/)
│   ├── capitoli/*.json     # per capitolo: quadri, posizioni, punti caldi, ordine delle scene
│   └── scenografie/*.js    # costruttori SVG dei fondali e degli oggetti per luogo
└── qa/                     # script Playwright e screenshot di evidenza
```

## Dati, non codice

Tutto ciò che è narrativo o numerico sta in JSON: battute, condizioni, posizioni dei punti caldi, tempi
del duello, palette per capitolo. Il motore non contiene testo di gioco.

Le condizioni usano i sei flag della bibbia (§XIX) con i nomi italiani di `storia.json`:
`tonino_ricordo`, `taddeo`, `registro`, `agnese`, `gregorio`, `violante`, più i derivati
`lettera_agnese`, `lettera_mariella`, `prove`.

## Salvataggio

Automatico all'inizio di ogni scena: capitolo, scena, flag, indizi raccolti. In `localStorage` con
chiave versionata; tre slot. Le scelte non si perdono mai (bibbia §XIX).

## Verifica

`gioco/qa/percorri.js` percorre con Playwright tutte le combinazioni di scelte (64) e salva uno
screenshot per scena chiave in `gioco/qa/evidenze/`. Un percorso che non raggiunge l'epilogo è un errore.
