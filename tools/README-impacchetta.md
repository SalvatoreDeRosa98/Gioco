# tools/impacchetta.js — un solo file HTML autosufficiente

Prende la pagina del gioco (`gioco/index.html`) e produce **un unico file HTML** che funziona anche
aperto da `file://` e dentro un iframe con una CSP che ammette solo script e stili inline e `data:`
per le immagini: niente `<script type="module" src>`, niente import map, niente `fetch` di rete.
Node ≥ 18, nessuna dipendenza, nessun `eval`/`new Function`.

## Uso

```sh
# dalla radice del repository
node tools/impacchetta.js                                   # gioco/index.html → production/build/ferruccio-prova.html
node tools/impacchetta.js --entrata gioco/prova.html --uscita production/build/prova.html
node tools/impacchetta.js --frammento --uscita production/build/ferruccio.frammento.html
node tools/impacchetta.js --dettagli                        # elenca moduli, fogli di stile e contenuti inclusi
node tools/impacchetta.js --aiuto
```

| Opzione | Effetto |
|---|---|
| `--entrata <file>` | pagina d'ingresso (default `gioco/index.html`); la cartella che la contiene è la radice dei percorsi |
| `--uscita <file>` | file prodotto (default `production/build/ferruccio-prova.html`; la cartella è creata; scrittura atomica) |
| `--frammento` | omette doctype/html/head/body: `<title>`, i `<meta name=…>`, gli `<style>` e lo `<script>` vanno in testa al contenuto del body. Per un hosting che avvolge da solo la pagina in uno scheletro |
| `--dettagli` | stampa l'elenco dei moduli (con `(import.meta)` se lo usano), dei fogli di stile e dei JSON |

Il file prodotto si apre con gli stessi parametri dell'URL della pagina originale, anche da disco:
`file:///…/ferruccio-prova.html?debug=1&wire=1&hub=1&seme=1845`.

Verifica: `node gioco/qa/pacchetto.test.js` (Playwright; esegue il tool, apre il pacchetto via http e
via `file://`, prova il frammento dentro uno scheletro con CSP `default-src 'none'; script-src
'unsafe-inline'; style-src 'unsafe-inline'; img-src data:`, confronta il determinismo con la pagina
originale e salva `production/qa/evidence/pacchetto-file.png`).

## Cosa fa

0. **Immagini → data: URI.** Tutti i file di `assets/sprite/` (PNG degli sprite consegnati dall'autore) vengono
   incorporati in `window.__risorse` (chiave = percorso relativo, valore = data: URI); il motore li risolve con
   `fondazione/risorse.js › percorsoRisorsa(percorso)`. Il pacchetto cresce di circa 1,3× il peso dei PNG.

1. **Moduli ES → registro.** Segue il grafo dei moduli dallo `<script type="module" src="motore/avvio.js">`
   e trasforma ogni modulo in una funzione `__moduli['/motore/x.js'] = function (__esporta, __richiedi) {…}`
   con memoizzazione (`__richiedi` restituisce l'oggetto delle esportazioni, anche parziale nei cicli).
   Le funzioni esportate sono assegnate **in testa** al corpo (sono hoistate, quindi anche gli importatori
   circolari le vedono); `const`/`let`/`class` e `export { … }` **in coda**. Ogni modulo trasformato passa
   `node --check` (strict mode, come i moduli) prima della composizione.
2. **CSS inline.** I `<link rel="stylesheet">` diventano `<style>` nell'ordine originale; gli `url()`
   relativi diventano `data:` URI (png, jpg, gif, webp, svg, woff, woff2, ttf, otf).
3. **Contenuti inline.** Tutti i `contenuti/**/*.json` (validati con `JSON.parse`) finiscono in una mappa
   `__contenuti['contenuti/parametri/ferruccio.json']`; un `fetch` installato nel prelude serve dalla mappa
   i percorsi relativi presenti (normalizza `./`, `/`, query string e hash, e la risoluzione rispetto a
   `document.baseURI`) con una `Response` vera (status 200, `json()`, `text()`); il resto va al `fetch`
   originale. `json()` restituisce ogni volta una copia fresca.
4. **Il resto della pagina è conservato** (`<div id="palco">`, canvas, `#interfaccia`, `<meta>`,
   `<title>`, eventuali blocchi di testo). Lo script è classico, in strict mode, e avvia il gioco subito o
   al `DOMContentLoaded` se il documento sta ancora caricando (necessario nel frammento, dove lo script
   precede il contenuto).

## Forme di sintassi supportate

Riconosciute solo a **inizio riga** (colonna 0) e fuori da commenti, stringhe e template:

| Forma | Trasformata in |
|---|---|
| `import { a, b as c } from './y.js'` | `const { a, b: c } = __richiedi('/…/y.js');` |
| `import * as ns from './y.js'` | `const ns = __richiedi('/…/y.js');` |
| `import def from './y.js'` / `import def, { a } from` / `import def, * as ns from` | `const def = __richiedi(…).default;` (+ le altre) |
| `import './y.js'` | `__richiedi('/…/y.js');` |
| `export function f` / `export async function f` / `export function* g` | `function f …` + `__esporta.f = f` in testa |
| `export class C` | `class C …` + `__esporta.C = C` in coda |
| `export const\|let\|var X = …` (anche più dichiaratori e pattern `{ a, b: [c, ...d] = [] }`) | dichiarazione senza `export` + `__esporta.X = X` in coda per ogni nome legato |
| `export { a, b as c }` | `__esporta.a = a; __esporta.c = b;` in coda |
| `export { a as b } from './z.js'` | `const __mN = __richiedi(…); __esporta.b = __mN.a;` |
| `export * from './z.js'` | copia di tutte le chiavi tranne `default` |
| `export * as ns from './z.js'` | `__esporta.ns = __richiedi(…)` |
| `export default function f` / `class C` | dichiarazione + `__esporta.default = f` |
| `export default <espressione>` | `__esporta.default = <espressione>` |
| `import.meta` | oggetto sintetico `{ url }` (URL del modulo rispetto a `document.baseURI`) |

Forme usate oggi in `gioco/motore` (tutte gestite): `import { … } from` (anche con `as`),
`export function`, `export async function`, `export const`, `export { X }`.

Il tool **fallisce con messaggio `file:riga`** se incontra: specificatori non relativi (bare specifier),
nomi di export fra virgolette (`export { x as "y-z" }`), `import()` dinamico nel codice (nei commenti
JSDoc è ignorato), top-level `await`, un identificatore riservato nel sorgente (`__esporta`, `__richiedi`,
`__meta`, `__moduli`, `__contenuti`, `__mN`), un modulo o un foglio di stile mancante, un JSON non
valido, un `<script src>` classico o un `<script type="module">` inline nella pagina, `@import` nei CSS,
fogli di stile remoti. Gli import circolari sono segnalati come avviso (`avviso: import circolare a → b → a`).

## Limiti noti

- **Non è un parser.** Lo scanner lessicale riconosce commenti, stringhe e template (anche annidati), ma
  **non i letterali regex**: una regex che contiene `'`, `"`, `` ` `` o `/*` può confondere la maschera.
  Le istruzioni `import`/`export` sono riconosciute solo in colonna 0. Il `node --check` finale intercetta
  quasi tutti gli errori che ne deriverebbero (un `import`/`export` lasciato intatto non è sintassi
  valida in una funzione), ma non un `export` a colonna 0 dentro un template multilinea.
- **Binding non vivi.** `const { a } = __richiedi(…)` è un'istantanea: un modulo che riassegna una `let`
  esportata dopo l'import non aggiorna gli importatori. Nei cicli, le costanti del modulo "in corso" sono
  `undefined` per chi lo importa prima che finisca (le funzioni invece ci sono).
- **Top-level `await`** non è supportato: il modulo diventa una funzione sincrona. Oggi nessun modulo lo usa.
- **I JSON sono incorporati tutti**, non solo quelli che la pagina carica: il pacchetto cresce con `contenuti/`.
  Il `fetch` intercetta solo i percorsi relativi presenti nella mappa; URL assoluti o fuori da `contenuti/`
  vanno al `fetch` originale (che da `file://` fallisce).
- **`localStorage`** (profilo, notte salvata) vive nell'origine del file: da `file://` tutti i pacchetti
  aperti da disco condividono la stessa origine; dentro un iframe di terze parti può essere bloccato dal browser.
- **Frammento**: se l'hosting inserisce il frammento con `innerHTML`, lo `<script>` non viene eseguito
  (regola HTML, non del tool); serve un'iniezione lato server o un `<iframe srcdoc>`.
- Il file prodotto va **rigenerato dal sorgente**, non modificato a mano (lo dice il commento in testa).
