# Ferruccio → "Una Notte a Caserta" — passaggio di consegne, 5 novembre 2026

Leggi questo file per intero, poi `design/isaac-web/concept.md` (§0, §2, §3, §4.3) e `design/isaac-web/oggetti.md` (§2 motore, §3 catalogo). Dopo, inizia dal compito in fondo senza chiedere conferme di routine.

## 1. Che cosa è successo

Ferruccio era un platform metroidvania 2D (Godot 4.6, GDScript, `src/`). Il 31 ottobre 2026 Salvatore ha deciso: **il gameplay metroidvania non serve più**. Il gioco diventa un **roguelike a stanze dall'alto alla The Binding of Isaac, nel browser**, modellato su https://pokeisaac.com (gratis, account, salvataggi cloud, gacha a valuta guadagnata, classifiche, coop).

- **Parte 1 (ora)**: il gioco. Tre piani casertani (Piazza Dante → Villa Comunale → Cortile d'Onore), boss Gatto dei Quattro Canti / Madre di Marmo / Il Custode, Ratking come boss segreto delle Cisterne, stanze 13×7, run 10-14 min, 3 personaggi (Ferruccio, Gaetano, Agnese).
- **Parte 2 (dopo)**: hub web, account Supabase, gacha, classifiche, coop. Non toccarla, ma i dati vanno scritti fin da subito nel formato di `concept.md` §3.7 (id stabili, seme a 8 caratteri, RNG per flusso, `runs_log.jsonl`, `meta.json`).

Decisione vincolante di Salvatore: **Ferruccio spara una scintilla alla volta come le lacrime di Isaac**, mira separata dal movimento, auto-fuoco. L'affondo dello stocco è il colpo forte a contatto, secondario. Serve **tutto il sistema di oggetti, statistiche e sinergie** di `oggetti.md`.

Il platform è congelato: non lavorarci, non proporre migliorie. Si riusano solo mondo, personaggi, rig dei pupazzi, audio, HUD, salvataggi, shader (lista esatta in `concept.md` §3.3).

## 2. Stato del repo e percorsi

- **Repo locale**: `E:/gioco/github-base-qa` (worktree git). Progetto Godot in `src/`. Altri worktree in `E:/gioco/github-base*`: ignorarli.
- **Ramo**: `ripartenza-gatto-nuovo`, 3 commit (ultimo `d8c1b9e`) + ~25 file non committati (rig gatto v2, pupazzo guardia, model sheet, documenti isaac-web, tool). **Mai pushato**: su GitHub (`https://github.com/SalvatoreDeRosa98/Gioco.git`) non c'è. Prima cosa da fare: commit di tutto il lavoro pendente, poi ramo nuovo `notte/prototipo` da lì, push di entrambi.
- **Godot**: `E:/gioco/.tools/godot/Godot_v4.6-stable_win64_console.exe` (renderer gl_compatibility). Leggere `src/CLAUDE.md` e `docs/engine-reference/godot/` prima di usare API 4.4+.
- **Template export**: Windows `E:/gioco/.tools/export-templates/templates/windows_release_x86_64.exe`; web `web_dlink_nothreads_release.zip` nella stessa cartella (export web già verificato: gira in browser, 277 MiB da dimagrire).
- **Test**: `tools/levels/run_tests.ps1 -Out <file>` (44 test headless del platform: devono restare verdi).
- **Exe di prova**: `E:/gioco/Test-Ferruccio/`. Mai sovrascrivere un exe esistente (Salvatore può averlo aperto): nome nuovo per ogni build, es. `Ferruccio-Notte-S1.exe`. Ultimo exe accettato del platform: `Ferruccio-Ripartenza.exe`.
- **Build web locale**: `E:/gioco/.claude/launch.json` ha la configurazione `web-ferruccio` (python http.server sulla porta 8077 su `E:/gioco/.tools/web-export/nothreads`). Esportare lì e aprire con il browser integrato.
- **Python**: usare `-X utf8` e `encoding='utf8'` sempre, altrimenti gli accenti si corrompono su Windows.
- **Arte sorgente**: `assets/art-source/` (model sheet in `personaggi/`, nemici in `nemici/`, aree in `aree/`). Gemini sta producendo i fogli dall'alto secondo `design/isaac-web/compiti-gemini.md`: quando arrivano, Salvatore li mette nelle cartelle indicate lì.
- **Documenti**: `design/isaac-web/concept.md` (v1.1), `design/isaac-web/oggetti.md` (154 oggetti, motore, sinergie, schema `items.json` in §6), `design/narrative/ferruccio-bibbia.md` (lore), `design/isaac-web/compiti-gemini.md`.

## 3. Regole di lavoro

0. **Divisione del lavoro** (5 novembre): questa sessione scrive SOLO codice in `src/run/` e `src/data/run/player.json`, sul ramo `notte/prototipo`. Un'altra sessione Claude (locale, con Godot) lavora sul ramo `notte/arte`: ritaglia l'arte di Gemini in `src/assets/art/run/`, genera le icone, scrive `src/data/run/items.json` e `pools.json`, e costruisce exe e build web. **Non toccare quelle cartelle e quei file**: per l'arte usare segnaposto (rettangoli, i pezzi esistenti di `ferruccio_cutout_v2/`) finché il merge non li porta. Se serve un dato che non c'è ancora, crearlo in `player.json` o in un file nuovo sotto `src/data/run/` con nome diverso da quelli elencati.

1. **Commit** liberi sul ramo `notte/prototipo`, Conventional Commits in italiano, riferimento al documento (`Rif: concept.md §4.3 S1-2`). **Push** alla fine di ogni milestone o quando Salvatore lo chiede. Mai forzare, mai toccare `main`.
2. Dopo ogni run headless di Godot ripristinare il rumore di import (`git checkout -- '*.import' src/.godot/global_script_class_cache.cfg` se modificati) prima di committare.
3. Valori di gioco in `src/data/` (JSON), mai costanti nel codice. Per il roguelike: `src/data/run/`.
4. Nessun `randf`/`randi`/`randomize` in `src/run/` fuori da `run_state.gd` (RNG per flusso dal seme).
5. Ogni cosa osservabile va vista davvero: esporta, lancia, screenshot in `production/qa/evidence/`. Un parse check non è un test.
6. Rispondere a Salvatore in italiano, breve. Lui è solo, senza artista né budget: le soluzioni devono funzionare con l'arte che c'è più quella che Gemini genera.
7. Non proporre di riscrivere in JS/canvas: scelta chiusa, Godot nello stesso progetto (`concept.md` §3.1-3.2).

## 4. Decisioni aperte e valore di default

Salvatore non ha ancora risposto a queste cinque. Usare il default, parametrizzato in JSON, e segnalare nel riepilogo che è un default.

| # | Decisione | Default da usare |
|---|---|---|
| 1 | Mantice del fabbro: 6 braci (oggetti.md) o 4 (`player.gd`) | 6 |
| 2 | MVP a 80 oggetti o taglio a ~65 | nessun impatto fino alla settimana 5: implementare il motore per tutti, caricare prima i 35 di S5-6 |
| 3 | Nome della stat di cadenza | "Fiato" (chiave interna `fire_rate`) |
| 4 | Mira: mouse 360° vs tastiera 8 direzioni | 360° su mouse e levetta, 8 su tastiera; misurare nel playtest S2 |
| 5 | Raggio del Velo: tick 0,6·Danno o 1,0 | 0,6 |

## 5. Architettura prevista (riassunto di concept.md §3.4)

```
src/run/
  Run.tscn / run.gd         radice: RunState, FloorGen, RoomHost, HUD, Minimap
  run_state.gd              autoload: seme, personaggio, piano, stat, inventario, RNG per flusso
  floor_gen.gd              albero BFS 9x7, stanze speciali, validazione
  room_loader.gd            legge data/run/rooms/<tema>/<id>.json
  room/Room.tscn            pavimento + fascia muro + 4 porte + ostacoli + spawner
  entities/                 top_player.gd, weapon.gd (5 forme), attack_tokens.gd, shadow2d.gd, wrapper nemici
  items/                    item_db.gd, stats.gd (resolve a fasi), pools.gd, trigger_bus.gd, special_cases.gd
  ui/                       character_select, run_summary, minimap, stat_panel, touch_controls
src/data/run/               items.json pools.json enemies.json bosses.json floors.json drops.json rooms/
```

`Stats.resolve()` è una funzione pura a fasi fisse (ADD → SET → CLAMP → ARMA → FLAT → MUL per gruppo → FLAT-POST → COUNT → FLAGS), formule in `oggetti.md` §2 (Danno 3,5·√(1,2U+1); delay 16−6·√(1,3T+1) tick, cap 5/s). Indipendente dall'ordine di raccolta: test di permutazione obbligatorio.

Nemici: la macchina a stati di `enemy.gd` / `elite.gd` / `duelist.gd` / `ratking.gd` resta (stati, tempi, telegrafi); cambia la geometria (`MOTION_MODE_FLOATING`, ombra ellittica, niente mensole). Tabella con costi in `concept.md` §2.5.

## 6. Compito da cui partire: milestone S1-2 "Una stanza" (concept.md §4.3)

Obiettivo: una stanza giocabile nel browser che risponda alla domanda "scintilla + affondo ti sembrano Ferruccio?".

Contenuto, in quest'ordine:
1. Commit del lavoro pendente su `ripartenza-gatto-nuovo`; ramo `notte/prototipo`; push.
2. `src/run/` con `Run.tscn`, `Room.tscn` 13×7 (960×576 di pavimento + fascia muro), 4 porte che si chiudono all'ingresso e si aprono all'ultimo nemico morto. Pavimento provvisorio: un rettangolo dipinto con `themes.gd` palette "piazza" finché Gemini non consegna G3.
3. `top_player.gd`: movimento 8 direzioni con `accel_ground`/`decel_ground` di `tuning.json`; mira separata (frecce / mouse / levetta destra); scintilla con auto-fuoco (2,73/s, Danno 3,5, Misura 6,5 = gittata, velocità da definire in `src/data/run/player.json`); affondo 3× Danno portata 65-110 px ogni 0,56 s; scatto e parata e i-frame copiati da `player.gd`. Ferruccio con i pezzi di `ferruccio_cutout_v2/` visti di fronte, schiacciamento verticale 8%, ombra a terra (`concept.md` §4.4). Flip orizzontale per destra/sinistra; retro solo quando arriva G1.
4. Nemici: vespa e statua 1:1 dal platform; gatto riscritto in 2D con nota / accucciata / balzo sulla tua posizione con ombra che si stringe / atterraggio scoperto (tempi di `tuning.json` `enemies.gatto`). Token d'attacco (`world.gd` `request_attack_token`) estratto in `attack_tokens.gd`.
5. HUD maschere riusando `hud.gd`; hitstop e scossa da `tuning.feel`.
6. Voce "Una Notte a Caserta" nel `title_screen.gd`; preset export "Web Notte" in `src/export_presets.cfg` con `exclude_filter` (§3.2); export web; verifica nel browser integrato: fps, console pulita, screenshot.
7. Exe Windows `E:/gioco/Test-Ferruccio/Ferruccio-Notte-S1.exe` per Salvatore.

Criterio di accettazione: build web della stanza **< 30 MiB** (pck) a 60 fps su Chrome; i 44 test del platform verdi; zero errori in console; Salvatore gioca 5 minuti.

Dopo S1-2 non proseguire con S3-4 senza il suo via: lui deve rispondere alla domanda sull'affondo (leva: 3× → 4× o portata, non cadenza).

## 7. Cose da non fare

- Non reimpostare il progetto da zero, non creare un secondo `project.godot`.
- Non chiedere icone o fogli di pose ai generatori: icone con `tools/art/gen_icons.py`, cicli dai video (`tools/art/video_cycle.py`).
- Non toccare `room.gd` `ROOMS`, `terrain.gd`, `traversal.gd`, `world.gd` del platform: si legge, si copia, non si modifica.
- Non sovrascrivere exe in `E:/gioco/Test-Ferruccio/`.
- Non implementare nulla della Parte 2 (rete, account, gacha).
