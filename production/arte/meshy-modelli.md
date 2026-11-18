# Modelli 3D fatti con Meshy

I personaggi giocabili del Teatro possono essere disegnati da un foglio reso da un modello 3D, al posto della figura
dipinta dal codice (`gioco/teatro/m1-meshy.js`, tabella `FIGURE_M1`). I modelli restano sul conto Meshy dell'autore: qui
ci sono gli ID per riscaricarli. I GLB sono pesanti e stanno in `meshy_output/`, che il repository ignora.

## Come si fa un personaggio

1. **Modello** dal disegno dell'autore: `meshy image-to-3d create --image-url <disegno> --model-type standard
   --should-texture true --enable-pbr false --texture-resolution 2k --pose-mode a-pose --remove-lighting false
   --target-formats glb` (30 crediti). Esce con oltre un milione di triangoli.
2. **Alleggerimento**: `meshy remesh create --input-task-id <modello> --topology triangle --target-polycount 60000`
   (5 crediti). Lo scheletro accetta al massimo 300 mila facce.
3. **Scheletro**: `meshy rigging create --input-task-id <remesh> --height-meters 1.2` (5 crediti). Porta con sé la
   camminata e la corsa: si scaricano `result.basic_animations.walking_glb_url`, `…running_glb_url` e
   `result.rigged_character_glb_url` come `cammina.glb`, `corre.glb`, `fermo.glb`.
4. **Foglio 2D**: `node tools/meshy-foglio.js production/arte/meshy/<nome>.json` scrive
   `gioco/assets/sprite_teatro/<nome>_meshy.png` e stampa dove cadono testa e piedi nella cella.
5. **Nel gioco**: una voce in `FIGURE_M1` (misure del foglio, altezza a schermo, strada per ciclo), copia del PNG in
   `assets/sprite_teatro/`, `node tools/teatro-release.js`.

In questo ambiente il programma di Meshy va lanciato con `NODE_USE_ENV_PROXY=1` davanti
(`NODE_USE_ENV_PROXY=1 npm exec --yes --package=meshy-cli@0.4.0 -- meshy …`).

## Modelli fatti

| Personaggio | Disegno | Modello (image-to-3d) | Alleggerito (remesh) | Scheletro (rigging) | Crediti | Data |
|---|---|---|---|---|---|---|
| Taddeo | `assets/taddeo.jpg` | `01a1eee3-0b27-7132-af51-035aa42b3928` | `01a1eee7-1895-7109-ad32-0fb67c6aa681` | `01a1eee9-0868-71f0-896d-fa70a34147da` | 30 + 5 + 5 = 40 | 2026-11-18 |

Per riscaricare un file: `meshy download --resource rigging --task-id <ID> --asset result.basic_animations.walking_glb_url
--output <file> --workspace meshy_output`.

## Limiti noti

- Lo scheletro dà solo camminata e corsa: da fermo si usa la posa del modello (braccia un po' aperte). Un'animazione
  da fermo, un colpo o una caduta sono lavori a parte su Meshy (`meshy animation-catalog list`, `meshy animate create`).
- Il martello del disegno di Taddeo non è entrato nel modello.
- La figura si vede da una sola parte (di tre quarti verso destra) e si specchia per andare a sinistra.
