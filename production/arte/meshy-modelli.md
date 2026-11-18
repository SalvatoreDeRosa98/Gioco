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
| Ferruccio | `production/arte/meshy/ferruccio-disegno.png` (ritagliato da `assets/ferruccio.jpg`) | `01a1eef3-c58a-705f-aaa6-4fdb500fc4f5` | `01a1eef4-c89a-71c1-81a5-db052a085dc7` | `01a1eef6-42d1-770c-a8b6-30b0f8f645ba` | 30 + 5 + 5 = 40 | 2026-11-18 |
| Taddeo | `assets/taddeo.jpg` | `01a1eee3-0b27-7132-af51-035aa42b3928` | `01a1eee7-1895-7109-ad32-0fb67c6aa681` | `01a1eee9-0868-71f0-896d-fa70a34147da` | 30 + 5 + 5 = 40 | 2026-11-18 |

Per riscaricare un file: `meshy download --resource rigging --task-id <ID> --asset result.basic_animations.walking_glb_url
--output <file> --workspace meshy_output`.

## Ambientazione, gatto e vespa (2026-11-18)

Lotto di 21 modelli fermi (`production/arte/meshy/lotto-ambientazione.json`, lanciato con `tools/meshy-lotto.js`): i 16
oggetti di scena, il gatto in quattro pose e la vespa. 30 crediti l'uno, **630 crediti**; gli ID stanno nel registro
`production/arte/meshy/lavori.json` (un lavoro che ha già un ID non viene mai rimandato).

- **Oggetti di scena** → `node tools/meshy-oggetti.js <cartella di three>` scrive
  `gioco/assets/sprite_teatro_meshy/scena/ostacolo-<nome>.png` con la stessa tela e lo stesso ingombro del disegno
  dell'autore. Li accende `SCENA_M1` in `gioco/teatro/m1-meshy.js`; un file che manca torna al disegno dell'autore.
- **Gatto e vespa** → `node tools/meshy-animali.js <cartella di three>` compone
  `gioco/assets/sprite_teatro_meshy/gatto.png` e `vespa-cieca.png` nella griglia di `layout.json`. Li accende la voce
  `'meshy'` in `SPRITE_V2` (`gioco/teatro/10-sprite.js`): rimettere `'ombre'` / `'leggera'` per tornare ai fogli di prima.
- **Stile cupo**: colori smorzati, un velo scuro che cresce verso il basso, contorno a inchiostro (valori `STILE` nei due
  strumenti, `filtro` e `velo` nelle configurazioni di Ferruccio e Taddeo).

## Dove si usano (decisione dell'autore, 2026-11-18)

- **Teatro delle Marionette**: dopo la prova l'autore ha preferito lo stile 2D di prima. I disegni dei modelli restano nel
  repository ma sono **spenti** (`gioco/teatro/m1-meshy.js`: `attivo: false`; `10-sprite.js › SPRITE_V2`), e il file unico
  del Teatro non li incorpora.
- **Motore modulare** (`gioco/motore/`): qui si provano, come variante «meshy» di `gioco/contenuti/sprite.json`
  (`gioco/README.md` › «Varianti dei disegni»). I fogli nelle misure del motore stanno in `gioco/assets/sprite/meshy/` e si
  rifanno con `python3 tools/meshy-motore.py` (parte dai fogli del Teatro, non spende crediti): Ferruccio e Taddeo con le pose
  «colpito» e «morto» ricavate dal fotogramma da fermo, gatto, vespa, colonna, panca, braciere in 4 fotogrammi, botte, telaio,
  statua, aiuola (per le siepi) e carretto (per i banchi). `?disegni=autore` riporta i disegni dell'autore.

## Limiti noti

- Meshy dà lo scheletro solo alle figure umane: gatto e vespa sono modelli in posa fissa. I loro fotogrammi sono le
  quattro pose del gatto (e l'unica della vespa) spostate, ruotate o schiacciate: niente passo vero delle zampe, niente
  battito d'ali.
- Il modello della vespa è uscito insieme a un secondo oggetto estraneo: il foglio usa solo la vespa.
- Il braciere spento è il modello acceso senza la parte alta (il fuoco).

- Lo scheletro dà solo camminata e corsa: da fermo si usa la posa del modello (braccia un po' aperte). Un'animazione
  da fermo, un colpo o una caduta sono lavori a parte su Meshy (`meshy animation-catalog list`, `meshy animate create`).
- Il martello del disegno di Taddeo non è entrato nel modello. Ferruccio invece tiene sempre il suo spadino (è nel modello).
- Sulla figura resa dal modello non si vedono i cambi d'aspetto dati dagli oggetti (fiamme, occhi, anelli) che la figura
  dipinta di Ferruccio mostrava: la spada di Gaetano in mano sì.
- La figura si vede da una sola parte (di tre quarti verso destra) e si specchia per andare a sinistra.
