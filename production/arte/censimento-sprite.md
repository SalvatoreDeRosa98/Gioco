# Censimento degli sprite del Teatro (asset-audit, 2026-11-11)

Misure prese da `python3 tools/migliora-sprite-teatro.py --censimento` sugli ORIGINALI di
`gioco/assets/sprite_teatro/`. Budget di peso: l'art bible (§8) non ne fissa → peso `NOT ASSESSED — no size budget set`
(riporto solo i totali: originali 19 MB su disco, v2 11 MB).

## Chi usa cosa
- **Fogli animati** (23 + teste-mira): `gioco/teatro/t2-sprite.js` LAYOUT, li precarica tutti; personaggi e nemici da t2,
  boss da t2 `FOGLIO_BOSS` (re-gatto→gatto, capitano-guardia→capitano, colosso-statua→custode-marmo,
  maestro-fucina→spezzafili, donna-luciana, regina-vespa) e da `b6-boss.js` SCHEDE_B6 (accendilumi, cigno-latta,
  giostra-lucciole, tessitrice-pietra). `teste-mira` è caricato ma nessuno lo disegna.
- **`boss/`** (11): `10-sprite.js` SPRITE_BOSS_A, usati solo come ripiego in `b6-boss.js` se il foglio t2 manca.
- **`scena/`** (52): `b9-immagini.js` IMMAGINI_B9 (`usa: true/false`); arredi, non figure: non elaborati qui.
- **Orfani** (nessun riferimento nel gioco né in `tools/teatro-release.js`): i 21 ritagli alla radice
  `bomba_ferma_*`, `capitano_guardia_*`, `colosso_statua_*`, `donna_luciana_*`, `gatto_{fermo,accucciato,cammina,salto}`
  (`getGattoImage`/`disegnaGattoSprite` di 10-sprite.js non sono chiamate), `guardia_{carica,ferma}`,
  `maestro_fucina_*`, `maschera_{aperta,chiusa}`, `regina_vespa_*`, `vespa_cieca`. Sono quelli con le scritte
  rimaste («Vespa Cieca (Mob minion)», «Opened form», «POWDER LUMP»…): non arrivano a schermo, non elaborati.

## Misure per foglio usato
Altezza = px sorgente del contenuto (min–max fra le celle). Instabilità = nella peggiore riga «ferma»
(fermo, cammina, muove, vola…) scarto della quota dei piedi / scarto d'altezza. Semi = quota di pixel visibili con
alfa < 90% (aloni e frange). Sat/V = saturazione e valore medi dei pixel opachi. Scelta = variante accesa in
`SPRITE_V2` (tavole in `production/arte/prima-dopo-sprite/`).

| file | dove | celle | altezza | instabilità piedi / altezza | semi | sat / V | scelta |
|---|---|---|---|---|---|---|---|
| ferruccio | t2 LAYOUT | 12 | 51–124 | 1 px / 3% (spara) | 26% | 0.38 / 0.60 | leggera |
| agnese | t2 LAYOUT | 12 | 89–126 | 1 px / 1% (cammina) | 23% | 0.42 / 0.39 | leggera |
| taddeo | t2 LAYOUT | 12 | 68–124 | 0 px / 2% (fermo) | 19% | 0.39 / 0.12 | leggera |
| ombra | t2 LAYOUT | 12 | 81–129 | 1 px / 7% (cammina) | 27% | 0.41 / 0.14 | leggera |
| teste-mira | t2 LAYOUT | 4 | 63–66 | 0 px / 0% | 21% | 0.15 / 0.47 | originale (non disegnato) |
| gatto | t2 LAYOUT | 15 | 79–126 | 1 px / 8% (muove) | 22% | 0.52 / 0.13 | leggera |
| vespa-cieca | t2 LAYOUT | 10 | 143–257 | 0 px / 13% (vola) | 2% | 0.44 / 0.48 | a ombre |
| maschera | t2 LAYOUT | 12 | 111–203 | 0 px / 0% | 1% | 0.35 / 0.49 | leggera |
| bomba-ferma | t2 LAYOUT | 11 | 78–269 | 0 px / 10% (miccia) | 2% | 0.52 / 0.32 | leggera |
| guardia | t2 LAYOUT | 13 | 81–236 | 0 px / 0% (muove) | 5% | 0.45 / 0.26 | leggera |
| statua | t2 LAYOUT | 12 | 94–232 | 0 px / 0% (spara) | 3% | 0.26 / 0.55 | leggera |
| predone | t2 LAYOUT | 13 | 80–219 | 0 px / 0% (muove) | 1% | 0.54 / 0.11 | leggera |
| regina-vespa | t2 LAYOUT | 11 | 227–284 | 0 px / 9% (vola) | 10% | 0.47 / 0.36 | a ombre — DUBBIO, spenta |
| capitano | t2 LAYOUT | 15 | 109–236 | 0 px / 2% (muove) | 2% | 0.35 / 0.15 | leggera |
| donna-luciana | t2 LAYOUT | 14 | 151–252 | 0 px / 0% (fermo) | 1% | 0.32 / 0.24 | leggera |
| custode-marmo | t2 LAYOUT | 12 | 112–232 | 0 px / 0% (spara) | 1% | 0.21 / 0.46 | leggera |
| spezzafili | t2 LAYOUT | 13 | 132–238 | 0 px / 1% (muove) | 2% | 0.49 / 0.33 | leggera |
| lucciola | t2 LAYOUT | 10 | 149–214 | 4 px / 33% (vola) | 9% | 0.47 / 0.40 | a ombre — DUBBIO, spenta |
| burattino | t2 LAYOUT | 13 | 96–259 | 0 px / 1% (muove) | 3% | 0.32 / 0.26 | a ombre |
| accendilumi | t2 LAYOUT | 17 | 247–256 | 0 px / 0% | 4% | 0.29 / 0.23 | leggera |
| cigno-latta | t2 LAYOUT | 18 | 256–256 | 0 px / 0% | 3% | 0.27 / 0.70 | leggera |
| giostra-lucciole | t2 LAYOUT | 14 | 245–256 | 0 px / 0% | 11% | 0.54 / 0.32 | leggera |
| tessitrice-pietra | t2 LAYOUT | 17 | 247–247 | 0 px / 0% | 15% | 0.11 / 0.57 | leggera |
| boss/gatto_fermo | 10-sprite SPRITE_BOSS_A (ripiego) | 1 | 420–420 | 0 px / 0% | 7% | 0.22 / 0.19 | leggera |
| boss/gatto_accucciato | 10-sprite SPRITE_BOSS_A (ripiego) | 1 | 189–189 | 0 px / 0% | 1% | 0.24 / 0.20 | leggera |
| boss/gatto_salto | 10-sprite SPRITE_BOSS_A (ripiego) | 1 | 264–264 | 0 px / 0% | 1% | 0.24 / 0.19 | leggera |
| boss/gatto_cammina | 10-sprite SPRITE_BOSS_A (ripiego) | 1 | 177–177 | 0 px / 0% | 1% | 0.23 / 0.19 | leggera |
| boss/capitano_guardia_fermo | 10-sprite SPRITE_BOSS_A (ripiego) | 1 | 420–420 | 0 px / 0% | 8% | 0.23 / 0.28 | leggera |
| boss/colosso_statua_fermo | 10-sprite SPRITE_BOSS_A (ripiego) | 1 | 420–420 | 0 px / 0% | 13% | 0.08 / 0.58 | leggera |
| boss/colosso_statua_aperto | 10-sprite SPRITE_BOSS_A (ripiego) | 1 | 420–420 | 0 px / 0% | 13% | 0.12 / 0.57 | leggera |
| boss/maestro_fucina_fermo | 10-sprite SPRITE_BOSS_A (ripiego) | 1 | 420–420 | 0 px / 0% | 7% | 0.57 / 0.40 | leggera |
| boss/maestro_fucina_attacco | 10-sprite SPRITE_BOSS_A (ripiego) | 1 | 420–420 | 0 px / 0% | 7% | 0.58 / 0.39 | leggera |
| boss/donna_luciana_ferma | 10-sprite SPRITE_BOSS_A (ripiego) | 1 | 420–420 | 0 px / 0% | 4% | 0.27 / 0.22 | leggera |
| boss/regina_vespa_ferma | 10-sprite SPRITE_BOSS_A (ripiego) | 1 | 420–420 | 0 px / 0% | 8% | 0.27 / 0.39 | leggera |

## Cosa dicono i numeri
- La quota dei piedi è quasi ferma ovunque (≤ 1 px; lucciola 4 px): il «tremolio» viene soprattutto dall'asse
  orizzontale (spostamenti fino a 3–7 px corretti, vedi note nelle tavole) e dal «respiro» d'altezza
  (ombra 7%, gatto 8%, bomba-ferma 10% nella miccia, vespa-cieca 13% e lucciola 33% nel volo: ali, voluto).
- Aloni: i quattro personaggi e il gatto hanno 19–27% di pixel semitrasparenti (frangia chiara a puntini dello
  scontorno): è il difetto più visibile e la pulizia lo toglie.
- Saturazione e valore molto diversi fra i fogli (V da 0,11 del predone a 0,70 del cigno-latta): l'unità si fa
  col contorno unico e con la gradazione, non portando tutti allo stesso valore (marmo e maschera devono
  restare chiari).
- Residui non tolti dall'elaborazione: capitano, riga «morte» — un listello grigio di una figura vicina attaccato
  al corpo (non separabile come componente), vedi `production/arte/richieste-sprite-v2.md`.
