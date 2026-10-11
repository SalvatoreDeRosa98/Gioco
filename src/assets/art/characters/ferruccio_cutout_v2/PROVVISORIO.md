# Ferruccio v2 (02 finale): cosa resta provvisorio

- Fotogramma 2 dell'attacco (dalla 07): la lama è ancora leggermente curva; solo il fotogramma 1 ha lo stocco ridisegnato (stocco_dritto.py).
- Scie e effetti dipinti (scia dell'attacco, strisce dello scatto, scintilla della parata, detriti del martello, fiamma della cura) fanno parte dei fotogrammi: prendono contorno e rim light come la figura.
- Scala: le pose dei fogli 15/16 sono normalizzate sull'altezza delle figure in piedi del foglio; da verificare a occhio che tutte le clip stiano a ~150 px a 1080p (zoom 1.6).
- Idle, crouch, skid, pogo, wall, death restano sul pupazzo a ritaglio (nessuna arte 02 dedicata).
- Lo stocco dell'idle (pezzo "mano" dallo 02) col contorno appare un po' segmentato.
- Hurt: rinculo 8 unità + 8° che si smorza in 0,25 s; il knockback resta quello del tuning.
- Tono: tono_02.py schiarisce avorio e sciarpa con curva di sola luminanza (CORREZIONI §6); le tinte sono quelle dello 02.
- Pavimento tema "oro" (stanza 6): terrain_tint da #e6d2b4 a #9c8e7a, p90 da rimisurare in gioco.

## Revisione CONTROLLO-SLICE3 (commit A)
- Contorno idle: risolto nel commit precedente (pezzi piatti nel CanvasGroup, niente z_index).
- Stanza 6 (tema oro): pavimento p90 misurato #8A6235 (obiettivo <= #9A7A4E).
- Atlante attacco +15% luminosità, corsa -15% saturazione (uniforma_atlanti.py); l'attacco ha qualche luce al limite (p90 ~#FFE7CB).
- Scala dei fogli 15/16 normalizzata su una figura in piedi di riferimento per foglio: altezze in atlante 450-560 px come corsa/attacco (stessa canvas_per_px). Le pose accucciate (parata, cura, rampino) restano più basse per disegno.
