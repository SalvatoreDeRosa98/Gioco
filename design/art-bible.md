# Art Bible: Ferruccio — La Menzogna dei Borbone

Bozza 2 · 8 ottobre 2026 · obiettivo: qualità visiva da indie di alto livello (arte dipinta a mano,
luci morbide, profondità a strati), con un'identità propria e non una copia di altri giochi.
Storia e personaggi: `design/narrative/ferruccio-bibbia.md`. Prompt di generazione: `design/art-prompts.md`.

## 1. Visual Identity Statement

**Una fiaba notturna dipinta a mano, ambientata in una Caserta reale ma sognata.**
Caserta, 1845. Architetture borboniche riconoscibili (Reggia, piazze, portici, giardini,
San Leucio), ridisegnate con contorni d'inchiostro morbidi, masse scure e poche luci calde
che guidano lo sguardo. Il protagonista è Ferruccio, fabbro imprigionato in un costume da
Pulcinella: bianco, leggibile, sempre il punto più chiaro della scena. I fili d'oro del Velo
della Concordia sono il motivo visivo ricorrente.

Regola d'oro: **silhouette prima dei dettagli**. Ogni personaggio e ogni piattaforma si deve
leggere anche in bianco e nero.

## 2. Mood & Atmosphere

| Area | Ora / meteo | Emozione | Luce dominante |
|------|-------------|----------|----------------|
| Piazza Dante | notte serena, luna | malinconia, inizio del viaggio | lampioni caldi su pietra blu |
| Corso Trieste | crepuscolo, pioggia | inquietudine urbana | vetrine arancioni, riflessi bagnati |
| Villa Comunale | notte, lucciole | mistero vegetale | luce lunare verde, lucciole |
| Belvedere di San Leucio | alba nebbiosa | quiete, nostalgia | sole basso rosato attraverso la nebbia |
| Cortile d'Onore (Reggia) | notte, braci | solennità, minaccia | torce dorate, raggi dall'alto |

## 3. Shape Language

- **Protagonista:** forme arrotondate e un solo elemento appuntito (il coppolone). Proporzioni
  "chibi": testa grande, corpo piccolo, mantello/camicione svasato.
- **Nemici comuni:** forme spezzate e asimmetriche, occhi luminosi come unico dettaglio chiaro.
- **Boss:** verticale, simmetrico, monumentale; ornamenti borbonici (gigli, aquile, pennacchi).
- **Architettura:** archi a tutto sesto, colonne, cornicioni; linee leggermente storte e
  "disegnate a mano", mai perfettamente geometriche.

## 4. Color System

- Valori: sfondo lontano molto scuro e poco saturo → piano medio scuro → piano di gioco più
  contrastato → primo piano quasi nero.
- Saturazione alta solo nelle luci (finestre, lampioni, torce, occhi, anime dei nemici).
- Palette per area: vedi `src/game/themes.gd` (fonte unica dei colori usati dal motore).
- Sciarpa di Ferruccio: rosso `#e8483f`. Il motore può ricolorarla
  (`shaders/canvas_char_mesh.gdshader`, per i nemici `canvas_char_sprite.gdshader`), quindi non
  servono immagini in più per le varianti.

## 5. Character Design Direction

Le descrizioni complete sono nei prompt (`design/art-prompts.md`, fasi 1–4). In gioco oggi:

| Personaggio | Immagine | Come si anima |
|-------------|----------|---------------|
| Ferruccio | `characters/ferruccio.png`: volto nero senza lineamenti, occhi luminosi, coppolone, sciarpa rossa, spada forgiata | mesh deformabile senza giunture (`game/char_rig.gd` + `shaders/canvas_char_mesh.gdshader`): l'immagine intera piegata secondo una mappa dei pesi, come le mesh pesate di Spine. Gambe con anca e ginocchio morbidi, busto che respira e si schiaccia, cappello a molla, sciarpa che ondeggia, orlo che si apre; la mano con la spada è l'unico pezzo rigido e ruota al polso sotto il polsino. Gamba lontana e coda della sciarpa stanno in uno strato dietro il corpo. Luce di taglio e tinta dell'area danno volume. Pezzi da `tools/art/rig_ferruccio_mesh.py`; pose in `player.gd` |
| Gatto d'ombra | `enemies/gatto.png` | coda separata (`tools/art/rig_nemici.py`), passo trotterellato |
| Vespa dorata | `enemies/vespa.png` | ali separate che battono, volo ondeggiante |
| Statua animata | `enemies/statua.png` | ferma; alone azzurro che la distingue dalle statue decorative, tremito prima del colpo |
| Il Custode | `bosses/custode.png` | passo pesante, accovacciata e balzo; il giglio sul petto si accende prima della raffica |

Gli altri personaggi (Agnese, Taddeo, Tonino, Violante, Gregorio, Mariella, Bianca, Gaetano,
guardie, cittadini) e i quattro boss intermedi sono pronti in `src/assets/art/` per i capitoli
della storia.

Ogni personaggio nasce da **un'unica immagine approvata** (vista laterale verso destra, sfondo
verde). Le animazioni si ottengono tagliandola in pezzi e muovendoli nel motore: è più
coerente che generare ogni fotogramma. Il prossimo passo di qualità è un foglio di pose
chiave di Ferruccio con il volto nuovo (prompt 1.5).

## 6. Environment Design Language

Ogni area è composta da strati dipinti montati dal motore in parallasse (`src/game/backdrop.gd`).
Posizione, scala, tinta, foschia e sfocatura di ogni strato sono dati in `src/data/areas.json`.

| Strato | Parallasse | Contenuto | Note |
|--------|-----------|-----------|------|
| Cielo | fisso | gradiente, luna, stelle, nuvole | shader `canvas_env_sky` |
| Lontano | 0.18 | skyline, colline, facciata della Reggia | foschia e sfocatura più forti |
| Medio | 0.5 | palazzi, portici, giardini, colonnati | scurito: non deve competere con il piano di gioco |
| Gioco | 1.0 | pavimento, blocchi, mensole (`props/terreno.png`), grate (`props/cancello.png`) | tinta per area (`terrain_tint`) |
| Primo piano | 1.3 | cornice in alto agganciata allo schermo + sagome in basso appena sopra il pavimento | quasi nero, sfocato; non deve coprire i personaggi |

Le immagini sono 1792×1008 e si ripetono a specchio in orizzontale. Gli strati non di fondo
si generano su **sfondo verde croma piatto (#00ff00)**.

## 7. UI/HUD Visual Direction

- Font: Cinzel (titoli, capitale romana come le iscrizioni della Reggia) e Cormorant Garamond
  (testi). Entrambi OFL, in `src/assets/fonts/`.
- Vita: maschere di Pulcinella (`items/maschera.png`). Valuta: monete di luce (`items/moneta.png`). Ornamenti: linee sottili ocra con rombo
  centrale. Nessun riquadro pesante: l'HUD galleggia sulla scena.

## 8. Asset Standards

- **Sorgenti:** i JPG originali di Grok stanno in `assets/art-source/` (fuori dal progetto Godot),
  divisi in `personaggi/`, `nemici/`, `boss/`, `aree/`, `oggetti/`, `riferimenti/`.
- **Conversione:** `python3 tools/art/import_art.py` scontorna il verde, toglie l'alone,
  ritaglia e scrive i PNG in `src/assets/art/` seguendo `tools/art/manifest.json`. I fogli di
  oggetti vengono separati in icone singole.
- **Pezzi animabili:** `tools/art/rig_ferruccio_mesh.py` (figura, strato di dietro, mano con spada e
  mappa dei pesi di Ferruccio; anteprima con `src/scripts/dev_rig_preview.gd`) e `tools/art/rig_nemici.py`.
- **Uscite:** `src/assets/art/characters/`, `enemies/`, `bosses/`, `areas/<area>/{far,mid,fg}.png`,
  `props/`, `items/`. PNG con trasparenza, niente testo dentro le immagini.
- **Import in Godot:** mipmap attive (impostazione predefinita del progetto); i nodi usano il
  filtro lineare con mipmap, perché le immagini sono mostrate molto ridotte.

## 9. Reference Direction

- Riferimenti di **qualità** (non da copiare): giochi 2D dipinti a mano con luci morbide e
  profondità a strati.
- Riferimenti di **contenuto**: foto reali di Caserta (Reggia, Piazza Dante, Corso Trieste,
  Villa Comunale, Belvedere di San Leucio).
- Nei prompt non si citano titoli di altri giochi o nomi di studi: si descrive lo stile
  (vedi `STYLE` in `tools/art/plan.json`). Verificare i termini d'uso commerciale del
  generatore e le regole sulla dichiarazione di contenuti AI dello store prima della pubblicazione.
