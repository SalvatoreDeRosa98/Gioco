# Prototipo: tavola di qualità visiva del presepe d'ombre (style frame)

**Storia**: `production/epics/fondazione/story-000-tavola-di-qualita-visiva.md`
**Riferimenti**: `design/mockup/teatro-delle-ombre-dialogo.png` (qualità approvata, vista laterale),
`design/art/art-bible.md` §1-4 (regola sovrana, modello di luce, ritaglio in 3/4, palette e luminanze).

## Ipotesi

Se la stanza in vista 3/4 si costruisce con le stesse tecniche del mockup laterale (carta
retroilluminata con fibre e grana, gradienti caldi, aloni, fili d'oro, vignetta, sagome a curve
con bordo di carta) e non con poligoni piatti, allora l'autore la giudicherà «si può guardare»
e la tavola potrà diventare il riferimento vincolante delle storie 005, 006, 012, 013, 020.
Seconda ipotesi, tecnica: le stesse tecniche si possono rendere in Canvas 2D a 60 fps dentro
un budget di 6 ms, a patto di precalcolare ciò che non cambia.

## Come aprire

Aprire `prototypes/tavola-presepe/index.html` in un browser (file://, nessun server, nessuna
dipendenza). Un solo file, 1280×720 logici, scala con la finestra.

| URL | Cosa mostra |
|---|---|
| `index.html?variante=A` | calda e teatrale (default) |
| `index.html?variante=B` | più scura e contrastata |
| `index.html?variante=C` | più fondale e profondità (quinte aperte ai lati, parete di fondo più bassa) |
| `…&grigi=1` | filtro grayscale, per la leggibilità |
| `…&dpr=1` | forza la scala 1:1 (usato per gli screenshot) |
| `…&no=grana,aloni,ombre,scia,vign,hud,sb,blur` | spegne una tecnica per misurarne il costo |

In console: `__bench(60, true)` → media di 60 draw con flush (`getImageData` 1×1 che forza il
raster), `__bench(60, false)` → solo registrazione dei comandi; `__misure` → luminanze campionate.

## Stato

**In corso — in attesa del giudizio dell'autore.** Tre iterazioni confrontate con il mockup e
con lo screenshot del prototipo precedente (`prototypes/stanza-gatti-concept/evidenze/03-lampo-rosso.png`).
Evidenze: `production/qa/evidence/tavola-presepe-A.png`, `-B.png`, `-C.png`, `-A-grigi.png`
e `production/qa/evidence/tavola-presepe-evidence.md`.

Fuori scopo: animazione, input, regole. Codice usa-e-getta: il renderer (storia 005) lo
riscrive, portandosi dietro le tecniche qui sotto, non il codice.

## Contenuto del fotogramma

Stanza 13×7 celle da 64 px (area 832×448 centrata, x 224–1056, y 136–584) in vista 3/4.
Pavimento di carta retroilluminata; mura d'inchiostro con spessore di carta chiara; oltre la
parete di fondo il fondale di Piazza Dante (palazzi con portici, finestre accese con busti
sorridenti, fili d'oro verso la Reggia sfocata, luna crema, nebbia); due lanterne appese con
alone e pozza; quattro porte ad arco, la nord aperta con soglia d'oro e un lampione in sagoma
oltre; Ferruccio (crema, contorno 2 px, coppolone piegato, becco, camicione con pieghe,
cintura, sciarpa a tre segmenti con frange, lama con elsa, ellisse d'appoggio, due ombre
portate); gatto accucciato con occhi rossi, anello del lampo e corridoio tratteggiato; gatto
appena colpito in bianco pieno, schiacciato nella direzione del colpo, con schizzi, macchie,
frammenti di carta e scia bianca del fendente; tre monete con ombra; pulviscolo; vignetta;
HUD a proscenio (5 maschere, nastro rosso, moneta col giglio «12», rombo «3»; «PIAZZA DANTE ·
stanza 3» in maiuscoletto spaziato); cornice di boccascena.

## Tecniche usate (da riportare nel renderer)

| Tecnica | Come è fatta qui | Quando si calcola |
|---|---|---|
| **Carta del pavimento** | gradiente radiale (centro caldo → bordo bruno) × luce di chiave alto-sinistra; poi `ImageData` moltiplicata per rumore a valore a 3 ottave (chiazze), rumore anisotropo 70×2 px (fibre) e grana bianca ±5%; sopra, 2400 fili disegnati (chiari `#f2c278` e scuri `#5a2a0e`, alpha .04–.12), ciottoli in griglia sfalsata (ellissi 3/4, alpha .05–.09, bordo chiaro sopra e scuro sotto), occlusione ai quattro bordi | **precalcolata**, una volta per stanza (seme) |
| **Fondale** | cielo a gradiente + fibre; alone caldo dietro la Reggia; luna con alone e crateri; strato lontano (colline, Reggia con finestre) rasterizzato e ridisegnato con `ctx.filter = blur(2.6–3.2px)`; strato medio (pini a ombrello, case basse) con blur .8–1.1; palazzi con cornicione, marcapiano, portici (uno acceso), finestre ad arco con gradiente e busto in sagoma col sorriso; fili d'oro in 4 passate (alone 6 px, alone scuro 3.2 px, filo 1 px, tratteggio 2/18) + scintille; nebbia bassa (ellissi blur 9 px + gradiente) | **precalcolato**, una volta per quartiere |
| **Sfondo del teatro** | gradiente scuro + `shadowBlur 60` attorno alla scatola (la luce dietro la carta trapela) + quinte | **precalcolato** |
| **Vignetta** | gradiente radiale con foro interno (`vignIn`) disegnato in un canvas | **precalcolata**, 1 `drawImage` per frame |
| **Grana per frame** | tile 256² di rumore grigio, `createPattern`, composito `soft-light` a tutto schermo, alpha .22–.33 | per frame (costosa in CPU, vedi sotto) |
| **Mura** | faccia nord con gradiente inchiostro→bruno (fascia meno scura in basso, bibbia §3), archi ciechi appena più chiari, bordo alto come **linea storta** (jitter a seme ±1.1 px ogni 48 px) con banda bruna 5 px e filo di luce 1.3 px; pareti laterali e davanti = bordo alto della carta con filo di luce interno; battiscopa | per frame (cambia solo con le porte: candidata alla cache) |
| **Porte** | portale d'inchiostro con `ritaglio()` (bordo di carta), apertura con gradiente di luce e lampione in sagoma, soglia d'oro con `shadowBlur 14`, pozza di luce ellittica sul pavimento; porte chiuse = pannello d'inchiostro con cornice bruna e bordo chiaro | per frame |
| **Lanterne** | corpo in ritagli, vetro con gradiente oro, fiamma crema con `shadowBlur 8`; **alone** = gradiente radiale r 120 in composito `screen`; **pozza** = gradiente radiale schiacciato (190×112) in `source-over` | per frame (respiro ±6% nel gioco) |
| **Sagome** | `Path2D` da comandi M/L/Q/C con **jitter a seme** (±0.6–1.1 px per vertice); `ritaglio()` riempie d'inchiostro e poi traccia, dentro al clip della forma e traslata di (1,1), una linea `#f2c278` al 32% → spessore di carta sul lato in controluce; i pezzi di Ferruccio usano `pezzoChiaro()` = contorno d'inchiostro 3.6 px sotto + riempimento crema con gradiente | per frame |
| **Ellisse d'appoggio** | gradiente radiale inchiostro al 45% schiacciato + filo di luce sul bordo basso (la basetta del presepe) | per frame |
| **Ombre portate** | la sagoma in solo inchiostro si rasterizza **una volta** in uno sprite 320² e si sfoca (`blur 2.2–3.2px`) in cache per posa; per frame un solo `drawImage` con matrice `[1,0,cx,dy]` (luna: `cx=-.55, dy=-.38` → cade in basso a destra; seconda ombra dalla lanterna più vicina al 50–55%) | sprite precalcolato, proiezione per frame |
| **Lampo** | occhi rossi come buchi nella sagoma + bagliore rosso in `screen` + nucleo crema; anello rosso r 21 con `shadowBlur 6` e anello crema r 24.5 | per frame |
| **Corridoio del balzo** | rettangolo tratteggiato 9/7 ruotato nello spazio del pavimento e schiacciato a .6, con frecce e bersaglio | per frame |
| **Colpo** | gatto in `#fff8e8` con trasformazione `[1.2,0,.3,.78]`; bagliore `screen`; schizzi = 16 gocce a lacrima orientate + 3 macchie a 10 raggi casuali + 9 frammenti di carta chiara con ombra; scia = velo radiale tenue + 14 archi a spessore e alpha crescenti + filo bianco | per frame |
| **HUD** | cartigli inchiostro 86% con bordo oro 60% + bruno, rombi oro agli angoli, `shadowBlur 10`; maschera a goccia col becco; nastro rosso a spirale; moneta col giglio; rombo a 4 punte; maiuscoletto manuale (minuscole → maiuscole al 78%) con `ctx.letterSpacing` | per frame (statico: candidato alla cache) |

Tutti i colori vengono dalla palette dell'art bible §4; le uniche cose colorate sono le luci
(oro, rosso del lampo e della sciarpa, crema di Ferruccio e della luna).

## Misure di luminanza (pixel, WCAG relativa; screenshot a dpr 1)

| Variante | Centro pavimento (640,360) | media 5×5 | Pozza (400,300) | Angolo BD (1030,560) | Angolo AS (250,160) | Parete nord (640,110) | Camicia Ferruccio | Dorso gatto | Pozza:angolo | Inchiostro:pavimento | Crema:pavimento |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A | **0,212** | 0,188 | 0,302 | 0,057 | 0,079 | 0,293 | 0,78 | 0,006 | 3,3:1 | 5,0:1 | 3,2:1 |
| B | **0,163** | 0,132 | 0,337 | 0,028 | 0,032 | 0,286 | 0,78 | 0,007 | 5,0:1 | 4,1:1 | 3,9:1 |
| C | **0,192** | 0,168 | 0,275 | 0,049 | 0,067 | 0,293 | 0,78 | 0,005 | 3,3:1 | 4,6:1 | 3,4:1 |

Il pixel centrale sta nella fascia 0,12–0,30 in tutte e tre; A e C nell'obiettivo 0,16–0,22
di Piazza Dante. **Fuori norma dichiarato**: gli angoli del pavimento scendono sotto 0,12 (la
bibbia dice «mai sotto L 0,12» e contrasto pozza:angolo medio 1,3–1,7:1). È una scelta della
tavola per avere il «riflettore»; se l'autore preferisce la norma, basta `bordoFloor` e
`vignIn` per variante. B la viola di più, per definizione.

## Tempi di disegno

Misurati con Playwright/Chromium headless, che rasterizza il canvas **in software** (nessuna
GPU): sono un tetto pessimistico. `noflush` misura solo la registrazione dei comandi; `flush`
include il raster forzato (il numero onesto). Media di 60 draw, dpr 1, rumore ±1,5 ms.

| Variante | per frame, comandi (noflush) | per frame, con raster (flush) | precalcolo: carta | fondale | sfondo | grana | vignetta |
|---|---|---|---|---|---|---|---|
| A | 1–2 ms | **14,0 ms** | 61–86 ms | 15–21 ms | 2 ms | 3–6 ms | 2 ms |
| B | 1–2 ms | **13,3 ms** | 61 ms | 15 ms | 2 ms | 3 ms | 2 ms |
| C | 1–2 ms | **15,6 ms** | 68 ms | 18 ms | 2 ms | 3 ms | 2 ms |

Costo per tecnica (variante A, flush, spegnendo una tecnica alla volta con `?no=`):

| Tecnica | ms (software) | Nota |
|---|---|---|
| base: 3 `drawImage` grandi + mura + attori + scia | ≈ 6,4 | tutto il resto spento |
| grana `soft-light` a tutto schermo | ≈ 3 | il composito a pieno schermo è la voce più cara in CPU |
| ombre portate (5 sprite) | ≈ 1,2 | |
| aloni `screen`, vignetta (immagine), HUD, `shadowBlur` | ≈ 0–1 ciascuno | sotto il rumore |
| **`ctx.filter = blur()` per frame** | **≈ 50 ms per gruppo di forme** (390 ms/frame nella prima versione) | eliminato: le ombre si sfocano una volta in sprite |

**Lezione principale per il renderer**: mai `ctx.filter` o sfocature per frame. Si sfoca una
volta in sprite/strati (ombre per posa, fondale, carta, vignetta) e per frame restano solo
`drawImage`, gradienti locali e path. Il budget di 6 ms **non è dimostrato qui**: in raster
software la sola base è 6,4 ms. Ipotesi per starci (da verificare nella storia 005 su un
browser con GPU): (1) cuocere la grana negli strati statici invece del `soft-light` per frame
(−3 ms); (2) tenere pavimento + mura + porte + pozze in uno strato «stanza» ridisegnato solo
quando le luci cambiano (−3/4 ms); (3) HUD in cache, ridisegnato ai cambi di valore. Restano
attori, ombre, aloni ≈ 2–3 ms in CPU, molto meno con accelerazione. A dpr 2 il raster
quadruplica: lo strato «stanza» va reso alla risoluzione del dispositivo una volta sola.

## Cosa non convince ancora (onesto)

1. **Il fondale in A e B è una fessura di 70 px**: palazzi, busti e fili si vedono ma sono
   piccoli; solo C li fa respirare. Se l'autore sceglie A o B, va deciso se abbassare la
   parete di fondo o accettare che il fondale sia un accenno.
2. **I gatti sono ancora meno ricchi di Ferruccio**: il colpito, bianco e schiacciato, si legge
   come flash ma la testa è piccola; l'accucciato ha l'anello del lampo che copre la testa.
   Le sagome definitive sono la storia 013 e meritano lo stesso tempo speso su Ferruccio.
3. **Il teatro fuori dalla scatola è vuoto**: bruno scuro, trapelo di luce e cornice. Non è
   brutto, ma non ha la ricchezza del resto; può essere intenzionale (il buio della sala) o
   chiedere quinte di carta.

## Verifica

Script Playwright (fuori dal repo, nello scratchpad di sessione) che apre `file://`, attende
`window.__pronto`, salva lo screenshot 1280×720, legge `__misure` e chiama `__bench` due volte.
Nessun errore di console nelle tre varianti.
