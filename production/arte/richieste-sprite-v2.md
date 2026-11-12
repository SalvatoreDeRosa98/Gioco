# Sprite da rigenerare — quello che l'elaborazione non aggiusta

Documento per l'autore, 2026-11-11 (squadra e1-sprite). Le altre figure le ha già migliorate
`tools/migliora-sprite-teatro.py` (tavole in `production/arte/prima-dopo-sprite/`); queste no, perché il difetto
è nel disegno: pose che cambiano grandezza, pezzi di altre figure attaccati al corpo, stile lontano dalla Ferruccio.

**Dove metterle:** `gioco/assets/sprite_teatro/` col nome esatto, STESSA griglia del foglio attuale (celle e righe in
`gioco/assets/sprite_teatro/layout.json`), così il gioco le prende senza toccare il codice. Poi si rilancia
`python3 tools/migliora-sprite-teatro.py --solo <nome>` e si guarda la tavola.

Usa il prompt di contesto di `production/arte/richieste-gemini-palcoscenico.md` e, in coda a ogni richiesta, questa
**frase di stile** (allegando `gioco/assets/sprite_teatro/ferruccio.png`):

```
Stile identico al foglio di Ferruccio allegato: sagoma pulita con un contorno scuro netto e di spessore uniforme,
pochi colori piatti con ombre morbide, corpo in toni scuri e poco saturi (nero d'ombra, bruni, viola notte),
accenti piccoli e accesi solo su occhi, fiamme, oro e rosso. Nessun alone chiaro attorno alla figura, nessuna
scritta, nessun pezzo di altre figure. In ogni cella la figura intera è alla stessa altezza, con i piedi (o il
centro del corpo, se vola) alla stessa quota e sullo stesso asse: cambiano solo le parti che si muovono.
```

| # | File | Griglia (come ora) | Cosa non va / cosa chiedere |
|---|---|---|---|
| 1 | `lucciola.png` | celle 293×222: vola 4, carica 2, colpito 1, morte 3 | Nel volo l'altezza cambia del 33% da un fotogramma all'altro e il bagliore verde è un alone dipinto: 4 fotogrammi di volo della stessa grandezza (cambiano solo le ali), lanterna dell'addome come accento verde pulito, senza alone. In `SPRITE_V2` è spenta (dubbio). |
| 2 | `regina-vespa.png` | celle 328×292: vola 4, carica 2, evoca 2, colpito 1, morte 2 | Ali bianche pittoriche e corpo a righe molto più dettagliato degli altri boss; il volo si sposta di 31 px fra le celle: Regina vespa marionetta, corpo nero-bruno a righe oro spente, ali di velo scuro semitrasparente, corona e occhi rossi come accenti; volo fermo sull'asse. In `SPRITE_V2` è spenta (dubbio). |
| 3 | `capitano.png` | celle 372×244: fermo 2, muove 4, anticipo 2, carica 4, morte 3 | Nella riga «morte» un listello grigio di un'altra figura è attaccato al corpo (la pulizia non lo può separare): stessa riga senza il listello. |
| 4 | `vespa-cieca.png` | celle 297×265: vola 4, carica 2, colpito 1, morte 3 | Nel volo l'altezza cambia del 13%: 4 fotogrammi alla stessa grandezza, ali come velo scuro, occhi rossi. |
| 5 | `accendilumi.png` | celle 384×256: fermo 2, muove 4, anticipo 2, attacco 3, evoca 2, colpito 1, morte 3 | Disegno provvisorio a forme geometriche piatte, non dell'autore: l'Accendilumi di Corso Trieste, marionetta alta e magra col cilindro, mantello nero, sciarpa rossa e asta col lume acceso (fiamma come accento). |
| 6 | `cigno-latta.png` | celle 384×256: fermo 2, muove 4, anticipo 2, carica 2, apre 2, attacco 2, colpito 1, morte 3 | Provvisorio geometrico, bianco pieno (fuori dalla gamma scura): cigno di latta a carica su ruote, latta brunita con riflessi d'avorio, chiave a farfalla d'ottone. |
| 7 | `giostra-lucciole.png` | celle 384×256: fermo 2, anticipo 2, attacco 4, evoca 2, colpito 1, morte 3 | Provvisorio geometrico: giostra di legno intagliato con tettuccio a spicchi rosso scuro e oro, lucciole come puntini di luce. |
| 8 | `tessitrice-pietra.png` | celle 384×256: fermo 2, muove 4, anticipo 2, attacco 2, evoca 2, colpito 1, morte 4 | Provvisorio geometrico, pietra grigio chiaro piatta: tessitrice di pietra col telaio, pietra scura venata, fili d'oro come accento. |

Non serve rigenerare i 21 ritagli alla radice con le scritte rimaste («Vespa Cieca (Mob minion)», «Opened form»,
«POWDER LUMP»…): il gioco non li usa (vedi `production/arte/censimento-sprite.md`).
