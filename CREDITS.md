# Crediti — Ferruccio

## Audio

Tutto l'audio del gioco è **originale**, sintetizzato con script Python riproducibili del
progetto: nessun campione o brano di terzi, nessuna licenza esterna da rispettare.
Ogni voce di `src/data/audio.json` riporta `author`, `source`, `url` e `license`.

| Asset | File | Generatore |
|---|---|---|
| Tema di Ratking (tarantella in Re minore, mandolino a tremolo, pizzicati, tamburello, ancia) | `music/boss_ratking.ogg` (loop) | `tools/audio/gen_audio.py` |
| Tema del Cavaliere Borbonico (marcia in Do minore, corni e trombe naturali, archi, timpani, tamburo) | `music/boss_cavaliere.ogg` (loop) | `tools/audio/gen_audio.py` |
| Cisterne Reali (archi, clarinetto, mandolino, gocce) | `music/cisterne_reali.ogg` (loop) | `tools/audio/gen_audio.py` |
| Cisterne Sepolte (variante più cupa e lenta) | `music/cisterne_sepolte.ogg` (loop) | `tools/audio/gen_audio.py` |
| Acqua delle Cisterne (ambiente) | `ambience/acqua_cisterne.ogg` (loop) | `tools/audio/gen_audio.py` |
| Cisterne Sepolte (ambiente) | `ambience/cisterne_sepolte.ogg` (loop) | `tools/audio/gen_audio.py` |
| Tana di Ratking (ambiente: acqua, squittii, zampettii) | `ambience/tana_ratking.ogg` (loop) | `tools/audio/gen_audio.py` |
| Passi su pietra (3 varianti) | `sfx/passo_pietra_1..3.ogg` | `tools/audio/gen_audio.py` |
| Colpo / nemico colpito | `sfx/colpo.ogg` | `tools/audio/gen_audio.py` |
| Parata (lama contro lama) | `sfx/parata.ogg` | `tools/audio/gen_audio.py` |
| Ratti di Ratking | `sfx/ratti.ogg` | `tools/audio/gen_audio.py` |
| Incudine (salvataggio) | `sfx/incudine_salva.ogg` | `tools/audio/gen_audio.py` |
| Preavviso del Cavaliere | `sfx/boss_preavviso.ogg` | `tools/audio/gen_audio.py` |
| Preavviso di Ratking | `sfx/ratking_preavviso.ogg` | `tools/audio/gen_audio.py` |
| Musiche e ambienti delle altre aree, altri effetti | `music/*.ogg`, `ambience/*.ogg`, `sfx/*.wav` | `tools/audio/build_all.py` |

Rigenerazione: `python3 tools/audio/gen_audio.py src/assets/audio` (richiede numpy e ffmpeg con libvorbis).
Livelli: musiche RMS -16..-20 dBFS, ambienti -24..-26, effetti -16..-24, picchi ≤ -2 dBFS.
Loop: musiche e ambienti sono resi in modo circolare (code e riverbero avvolti sull'inizio), quindi
il punto di loop non ha giunture.

Autore: progetto Ferruccio (Salvatore De Rosa). Licenza: originale del progetto, nessun diritto di terzi.

## Icone

Icone abilità 96x96 (`src/assets/art/ui/segnaposto/abilita_guanti.png`, `abilita_rampino.png`,
`abilita_martello.png`): originali, disegnate proceduralmente da `tools/art/gen_icons.py`
(medaglione di bronzo in stile carta borbonica). Le illustrazioni di Rampino e Martello usate in
carta e fucina restano quelle di `src/assets/art/ui/carta/`.

## Font

Cinzel e Cormorant Garamond: SIL Open Font License 1.1.
