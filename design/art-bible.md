# Art Bible: Caserta — Il Custode della Reggia

Bozza 1 · ottobre 2026 · obiettivo: qualità visiva da indie di alto livello (arte dipinta a mano,
luci morbide, profondità a strati), con un'identità propria e non una copia di altri giochi.

## 1. Visual Identity Statement

**Una fiaba notturna dipinta a mano, ambientata in una Caserta reale ma sognata.**
Architetture borboniche riconoscibili (Reggia, piazze, portici, giardini, San Leucio),
ridisegnate con contorni d'inchiostro morbidi, masse scure e poche luci calde che guidano
lo sguardo. Il protagonista è un piccolo cavaliere-Pulcinella: bianco, leggibile, sempre il
punto più chiaro della scena.

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
- Colori di squadra (sciarpa): rosso `#e8483f`, ciano `#3fc1d9`, oro `#f2c046`, viola `#a77bff`.

## 5. Character Design Direction

| Personaggio | Descrizione per la generazione |
|-------------|--------------------------------|
| Cavaliere-Pulcinella | piccolo, camicione bianco largo, maschera nera con naso adunco, coppolone bianco alto e un po' piegato, sciarpa rossa lunga, piccola spada; occhi luminosi nella maschera |
| Gatto randagio | gatto d'ombra nero-violaceo, schiena inarcata, coda lunga, occhi viola luminosi |
| Vespa | vespa dorata grande come un gatto, ali traslucide, addome luminoso |
| Statua di marmo | statua classica dei giardini della Reggia, crepe che si illuminano di azzurro |
| Il Custode della Reggia | guardiano corazzato d'oro alto il triplo del protagonista, mantello rosso borbonico, elmo con pennacchio, alabarda, giglio luminoso sul petto |

Ogni personaggio nasce da **un'unica immagine approvata** (vista laterale, sfondo neutro). Le
animazioni si ottengono scomponendola in parti (testa, busto, braccia, gambe, mantello) e
animandole in Godot con uno scheletro 2D: è più coerente che generare ogni fotogramma.

## 6. Environment Design Language

Ogni area è composta da strati PNG separati, montati dal motore in parallasse
(`src/game/backdrop.gd`):

| Strato | Velocità | Contenuto | Dimensione consigliata |
|--------|----------|-----------|------------------------|
| Cielo | fisso | gradiente, luna, nuvole (shader) | generato dal motore |
| Lontano | 0.18 | skyline, colline, facciata della Reggia | 2560 × 1080 |
| Medio | 0.5 | palazzi, portici, alberi, colonne | 3200 × 1080 |
| Gioco | 1.0 | piattaforme e oggetti (texture dipinte) | elementi singoli |
| Primo piano | 1.3 | silhouette quasi nere (foglie, ringhiere, catene) | 3840 × 1080 |

Gli strati non di fondo si generano su **sfondo verde croma piatto (#00ff00)** e vengono
scontornati dallo script (`tools/art/gemini_image.py --key-green`).

## 7. UI/HUD Visual Direction

- Font: Cinzel (titoli, capitale romana come le iscrizioni della Reggia) e Cormorant Garamond
  (testi). Entrambi OFL, in `src/assets/fonts/`.
- Vita: maschere di Pulcinella. Valuta: centesimi. Ornamenti: linee sottili ocra con rombo
  centrale. Nessun riquadro pesante: l'HUD galleggia sulla scena.

## 8. Asset Standards

- Formato: PNG 8 bit con trasparenza; niente testo dentro le immagini.
- Cartelle: `src/assets/art/<area>/<strato>.png`, `src/assets/art/characters/<nome>.png`.
- Ogni asset generato ha accanto un file `.json` con prompt, modello e data (tracciabilità).
- Le foto sorgente vanno in `src/assets/photos/` con licenza e autore in `SOURCES.md`.

## 9. Reference Direction

- Riferimenti di **qualità** (non da copiare): giochi 2D dipinti a mano con luci morbide e
  profondità a strati.
- Riferimenti di **contenuto**: foto reali di Caserta (Reggia, Piazza Dante, Corso Trieste,
  Villa Comunale, Belvedere di San Leucio).
- Nei prompt non si citano titoli di altri giochi o nomi di studi: si descrive lo stile
  (vedi `STYLE` in `tools/art/plan.json`). Verificare i termini d'uso commerciale del
  generatore e le regole sulla dichiarazione di contenuti AI dello store prima della pubblicazione.
