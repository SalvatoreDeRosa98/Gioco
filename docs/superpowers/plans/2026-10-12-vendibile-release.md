# Ferruccio — Piano verso il rilascio indie vendibile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portare Ferruccio da `integrazione/slice-3` a un gioco completo, giocabile dall'inizio alla fine senza softlock, bilanciato, testato con giocatori esterni e pronto per la pubblicazione (Steam, Windows), non come beta.

**Architecture:** Nessuna nuova architettura. Si lavora sul progetto Godot 4.6 esistente (`src/`). Il piano è una sequenza di fasi con gate misurabili (§Gate di vendibilità). Ogni task chiude con una build che passa la suite di test.

**Tech Stack:** Godot 4.6 (GDScript), Git Bash per gli script in `tools/ci/`, Python 3.13 (`tools/`), GitHub Actions (`.github/workflows/beta-windows.yml`), skill del framework in `.claude/skills/`.

**Spec:** Nessuna spec approvata esiste. Il piano poggia su due fonti: lo stato misurato di §Stato misurato e le decisioni D1–D10 di §Decisioni da prendere. I task marcati **[BLOCCATO: Dx]** non partono finché non rispondi.

## Global Constraints

- Eseguibile Godot: `GODOT="/e/gioco/.tools/godot/Godot_v4.6-stable_win64_console.exe"` (Git Bash). Template Windows ufficiale: `E:/gioco/.tools/export-templates/templates/windows_release_x86_64.exe`.
- Ogni push o merge: `GODOT_BIN="$GODOT" bash tools/ci/smoke-test.sh` verde, cioè importazione, prova di avvio e tutti i `tests/**/*_test.gd` con exit 0.
- Git: mai `git add -A`. Aggiungere solo i file del task. Dopo ogni verifica, ripristinare il rumore generato (`src/.godot/global_script_class_cache.cfg`, `*.import` modificati da import Godot) come da `PASSAGGIO-CONSEGNE.md`.
- Commit in Conventional Commits, con il riferimento al task nel corpo (es. `Task 0.2`), come da `.claude/docs/coding-standards.md`.
- Encoding: Python sempre con `-X utf8`, `read_text`/`write_text` con `encoding='utf8'`.
- Push su origin e pubblicazione di release sono azioni esterne: si eseguono solo dopo conferma esplicita.
- Limiti proposti, da confermare con te (non sono ancora fissati): export Windows ≤ 150 MB (oggi 314–342 MB); HUD e cartelli dentro lo schermo a 1280×720, 1280×800 (Steam Deck), 1366×768, 1920×1080, 2560×1440.

## Review Focus

Cinque modi di rottura che un giocatore incontrerà e che nessun test attuale copre per intero. Ognuno ha il test nel task che possiede il codice.

- **RF1 — Salvataggio corrotto o troncato.** Uno slot con JSON rotto non deve far crashare il menu né nascondere gli slot validi. Ha già lasciato un `Parse JSON failed` nel log di `save_slots_test.gd` (exit 0, non indagato). Test: Task 4.1.
- **RF2 — Risoluzione o layout non previsti.** Su Steam Deck (1280×800) o su 1366×768 titolo, HUD e cartelli dei cancelli non devono uscire dallo schermo. Test: Task 4.2.
- **RF3 — Gamepad scollegato o cambio input a metà partita.** I suggerimenti devono passare a tastiera senza lasciare un tasto "premuto" nel gioco. Test: Task 4.3.
- **RF4 — Softlock di progressione.** Ogni sigillo deve essere ottenibile in un ordine che non richieda un oggetto non ancora raggiungibile (es. martello dopo la Galleria). Test: Task 2.2.
- **RF5 — Perdita di focus o pausa durante dialogo, dissolvenza o morte.** Al ritorno, stato coerente e nessun input bloccato. Test: Task 4.4.

## Stato misurato

Fatti verificati nel repo al 2026-10-12. Non sono stime.

| Area | Stato | Fonte |
|---|---|---|
| Aree base | 5 (piazza, strada, giardino, belvedere, oro) | `src/data/areas.json` |
| Stanze di espansione | 9 (+ 6 scene dipinte `r*.tscn`) | `src/data/expansion.json`, `src/rooms/` |
| NPC con dialogo | 17 | `src/data/dialogues.json` (`npcs`) |
| Missioni | 14 | `src/data/quests.json` |
| Testi nei JSON | ~750 stringhe (595 + 101 + 56 + 47) | `dialogues.json`, `expansion_dialogues.json`, `quests.json`, `introduction.json` |
| Tipi di nemico in tuning | 4: `gatto`, `vespa`, `statua`, `custode` | `src/data/tuning.json` |
| Test automatici | 44 file, tutti exit 0 su slice-3 | `tests/`, run 2026-10-12 |
| CI | `smoke-test.sh` esegue tutti i test prima della beta. Il workflow gira **solo** su `main` e `claude/optimistic-wozniak-9l570p`: slice-3 non è testata né buildata | `.github/workflows/beta-windows.yml` |
| Branch remoto | `integrazione/slice-3` non ha upstream: solo locale | `git status` |
| Asset | 243 MB, 452 file, 92 PNG oltre 1 MB; il più grande `custode_anim.png` 18,4 MB | `src/assets/` |
| Eseguibile | 314–342 MB | `Test-Ferruccio/` |
| Opzioni | schermo intero, risoluzione finestra, 4 volumi, reset. Nessuna opzione di accessibilità | `src/game/game_settings.gd`, `options_panel.gd` |
| Lingua | solo italiano | `src/data/*.json` |
| Arte | generata con Grok Imagine. Termini d'uso commerciali e dichiarazione AI dello store da verificare | `design/art-prompts.md`, `design/art-bible.md` §8–9 |
| Audio | sintetizzato, originale, con licenza documentata | `CREDITS.md` |
| Debito tecnico | 0 TODO/FIXME in `src/`; 7 script `patch_*.py`/`fix_*.py` nella radice del repo | `grep`, radice |
| Playtest | 0 sessioni documentate | `production/qa/playtests/` assente |
| Target di design | 0: nessun GDD, nessun `design/balance/`, nessun registro | `design/` |
| Gate formale | FAIL su release: molti artefatti CCGS richiesti sono assenti (49 step, `artifact-check.sh`) | §Mappa skill |

## Gate di vendibilità

Il gioco è vendibile quando tutti i criteri sono veri, misurati e registrati in `production/qa/`.

- **G1 Completamento.** Due finali raggiungibili da nuovo gioco, zero softlock nel test di raggiungibilità (Task 2.2).
- **G2 Durata.** Durata misurata da almeno 5 giocatori esterni, entro ±20% del target di D3.
- **G3 Playtest.** Almeno 8 giocatori esterni; almeno 6 completano; nessun bug P1 aperto (Task 6.2).
- **G4 Prestazioni.** 60 fps medi sul hardware minimo dichiarato; soak di 2 ore senza crash (Task 3.2, 3.3).
- **G5 Accessibilità.** Opzioni di Task 4.5 presenti e testate; rimappatura completa tastiera e gamepad.
- **G6 Salvataggi.** Slot corrotti gestiti senza perdita degli slot validi (Task 4.1).
- **G7 Legale e store.** D4 risolta; dichiarazione AI pronta; licenze di arte e font in `CREDITS.md`; EULA e informativa privacy; classificazione età.
- **G8 Build.** Export ≤ 150 MB (limite proposto); avviso SmartScreen gestito (D9).

## Decisioni da prendere

Solo tu puoi rispondere. Ogni decisione sblocca i task indicati.

- **D1 — Lingue al lancio.** IT, IT + EN, altro. Sblocca Fase 5.
- **D2 — Piattaforme.** Steam Windows; Steam Windows + Steam Deck; altro. Sblocca il limite di risoluzione in Task 4.2.
- **D3 — Durata target e prezzo.** Ore di gioco e fascia di prezzo. Sblocca Task 1.4 e il gate G2.
- **D4 — Arte generata con Grok.** Tenere con dichiarazione AI dopo verifica dei termini, oppure sostituire i pezzi più visibili (personaggio, boss) prima della vendita. Sblocca Task 7.1.
- **D5 — Rigore del processo.** `minimal` (consigliato per un team di una persona: brief e storie, niente 49 step CCGS) oppure `standard`. Sblocca Task 1.1.
- **D6 — Beta pubblica.** Ogni push su branch con `beta-windows.yml` crea una pre-release pubblica. Tenere, spegnere, o pubblicare solo su tag? Sblocca Task 0.1 e Task 7.5.
- **D7 — Copie duplicate del progetto.** `github-base`, `github-base-gameplay`, `github-base-levels`, `github-base-qa`, `github-base-ui`, `github-base-gameplay-origin`, `Gioco-claude-optimistic-wozniak-9l570p`, `Claude outputs`. Archiviare in una cartella fuori dal repo o tenere? Non cancello nulla senza OK.
- **D8 — Errore JSON di `save_slots_test`.** Chiuderlo in Task 4.1 (consigliato) o accettarlo come rumore. Lo hai escluso prima: non indago finché non lo decidi.
- **D9 — Firma del codice.** Senza firma, Windows mostra avviso SmartScreen all'avvio. Certificato a pagamento oppure avviso dichiarato nella pagina store.
- **D10 — Ferruccio su Steam Deck.** Se sì, 1280×800 entra in `RESOLUTIONS` e va testato (Task 4.2).

## Mappa skill → task

Skill del framework in `.claude/skills/`, usate dove servono. Le altre sono in §Skill non eseguite.

| Skill | Task | Quando |
|---|---|---|
| `project-stage-detect` / `artifact-check.sh` | Stato misurato | Ora, e a ogni gate |
| `gate-check` | Gate G1–G8 | Prima di ogni fase |
| `design-review` | 1.1, 1.3 | Dopo scrittura brief e scope |
| `scope-check` | 1.3 | Ogni volta che aggiungi contenuto |
| `content-audit` | 1.3, 2.1 | Planned vs built |
| `consistency-check` | 2.1 | Quando i target esistono |
| `balance-check` | 1.4, 2.x | Dopo D3, poi dopo ogni fase di contenuto |
| `ux-review` | 1.2, 4.5 | Dopo i requisiti di accessibilità |
| `asset-audit` | 3.1 | Prima di ogni build di rilascio |
| `perf-profile` | 3.2 | Su hardware minimo |
| `soak-test` | 3.3 | Prima di ogni release candidate |
| `playtest-report` | 6.1, 6.2 | Dopo ogni sessione esterna |
| `localize` | 5.1 | Solo se D1 include EN |
| `security-audit` | 4.1 | Quick: integrità salvataggi (nessun online) |
| `tech-debt` | 0.3 | Dopo la pulizia, poi mensile |
| `release-checklist` | 7.2 | Pre-release (pc) |
| `launch-checklist` | 7.2 | Dry-run prima del lancio |
| `changelog`, `patch-notes`, `day-one-patch` | 7.5, 8 | Lancio e post-lancio |

## Skill non eseguite

- `team-*` (team-qa, team-polish, team-release, ...): orchestrano sottoagenti. Non lanciati senza richiesta esplicita, e il lavoro è a una persona.
- `sprint-plan`, `sprint-status`, `create-epics`, `create-stories`: processo a sprint. Non applicato in `minimal` (D5).
- `prototype`, `vertical-slice`: la slice esiste già (slice-3).

## Fasi e task

### Fase 0 — Base pulita (non bloccata)

### Task 0.1: CI sul branch di lavoro

**Files:**
- Modify: `.github/workflows/beta-windows.yml` (blocco `on: push: branches:`, righe 14–16)

**Interfaces:**
- Consumes: `tools/ci/smoke-test.sh` (invariato)
- Produces: branch `integrazione/slice-3` costruito e testato ad ogni push

- [ ] **Step 1: Leggi il blocco trigger**

Run: `sed -n 12,18p .github/workflows/beta-windows.yml`
Expected: elenco `main` e `claude/optimistic-wozniak-9l570p` sotto `branches:`.

- [ ] **Step 2: Aggiungi il branch**

```yaml
    branches:
      - main
      - claude/optimistic-wozniak-9l570p
      - integrazione/slice-3
```

- [ ] **Step 3: Verifica la sintassi YAML**

Run: `/e/gioco/.tools/ferruccio3d-venv/Scripts/python.exe -X utf8 -c "import yaml; yaml.safe_load(open('.github/workflows/beta-windows.yml', encoding='utf8')); print('YAML ok')"`
Expected: `YAML ok`. Se `yaml` manca nel venv, installa `pyyaml` nel venv e ripeti.

- [ ] **Step 4: Commit (solo dopo OK su D6)**

```bash
git add .github/workflows/beta-windows.yml
git commit -m "ci: build e test anche su integrazione/slice-3" -m "Task 0.1"
```

**Nota D6:** ogni push su questo branch crea una pre-release pubblica. Con D6 "spegnere" o "solo tag", questo task cambia.

### Task 0.2: Commit della modifica ai cancelli

**Files:**
- Commit: `src/game/slice_props.gd` (già modificato, non committato)

**Interfaces:**
- Consumes: nessuno
- Produces: cancelli dipinti nello sfondo (z 3), tono spento

- [ ] **Step 1: Verifica che sia l'unico file del task**

Run: `git status --short src/game/slice_props.gd`
Expected: `M src/game/slice_props.gd` e nient'altro della modifica.

- [ ] **Step 2: Rilancia i test che toccano i cancelli**

Run: `cd src && for t in levels/level_view_test levels/level_slice_test levels/level_art_duplicates_test gameplay/hammer_gate_test gameplay/progression_routes_test gameplay/metroidvania_test gameplay/boss_gate_test; do "$GODOT" --headless --path . -s "$(realpath ../tests/integration/$t.gd)" > /dev/null 2>&1; echo "$t exit=$?"; done; cd ..`
Expected: tutti `exit=0`.

- [ ] **Step 3: Commit (solo dopo OK)**

```bash
git add src/game/slice_props.gd
git commit -m "fix(levels): cancelli dipinti nello sfondo (z 3) con tono spento" -m "Task 0.2"
```

### Task 0.3: Pulizia della radice del repo

**Files:**
- Move: `fix_boss_draw.py`, `fix_const.py`, `patch_boss2.py`, `patch_char_rig.py`, `patch_cheat.py`, `patch_dev.py`, `patch_player.py` → `tools/legacy/`

**Interfaces:**
- Consumes: nessuno
- Produces: radice del repo senza script di patch one-shot

- [ ] **Step 1: Verifica che nessuno li richiami**

Run: `grep -rn -E "fix_boss_draw|fix_const|patch_boss2|patch_char_rig|patch_cheat|patch_dev|patch_player" --include=*.yml --include=*.sh --include=*.md --include=*.gd --include=*.ps1 .`
Expected: nessun risultato, oppure solo questo file di piano.

- [ ] **Step 2: Sposta con git**

```bash
mkdir -p tools/legacy
git mv fix_boss_draw.py fix_const.py patch_boss2.py patch_char_rig.py patch_cheat.py patch_dev.py patch_player.py tools/legacy/
```

- [ ] **Step 3: Esegui `tech-debt` in modalità scan**

Run skill `tech-debt` con `scan`. Expected: registro aggiornato, 0 TODO/FIXME confermati.

- [ ] **Step 4: Commit (solo dopo OK)**

```bash
git commit -m "chore: sposta script di patch one-shot in tools/legacy" -m "Task 0.3"
```

## Fase 1 — Definizione [BLOCCATA: D1–D5]

### Task 1.1: Brief di gioco

**Files:**
- Create: `design/game-brief.md`

**Interfaces:**
- Consumes: risposte D1, D2, D3, D5
- Produces: `design/game-brief.md`, base per 1.2–1.4

- [ ] **Step 1: Scrivi le sezioni obbligatorie**

Sezioni, in quest'ordine: Pilastri (3), Pubblico, Esperienza in una frase, Durata target (D3), Piattaforme (D2), Lingue (D1), Prezzo (D3), Scope 1.0 (rimando a 1.3), Rischi noti (copia §Review Focus).

- [ ] **Step 2: Esegui `design-review` sul file**

Run skill `design-review` con `design/game-brief.md`. Expected: nessuna sezione mancante.

- [ ] **Step 3: Commit (solo dopo OK)**

```bash
git add design/game-brief.md
git commit -m "docs(design): brief di gioco per il rilascio" -m "Task 1.1"
```

### Task 1.2: Requisiti di accessibilità

**Files:**
- Create: `design/accessibility-requirements.md` (percorso fisso del framework: non spostarlo in `design/ux/`)

**Interfaces:**
- Consumes: `design/game-brief.md`
- Produces: requisiti R-A1…R-A6 consumati da Task 4.5

- [ ] **Step 1: Scrivi i requisiti**

- R-A1 Sottotitoli attivabili per dialoghi e voci (bus `Voice` in `game_settings.gd`).
- R-A2 Scala del testo: tre livelli, applicata a HUD, dialoghi, cartelli, mappa.
- R-A3 Riduzione di scosse (`shake` dei nemici) e lampi (boss).
- R-A4 Rimappatura completa tastiera e gamepad, con ripristino predefiniti.
- R-A5 Nessuno stato comunicato solo col colore: nemici e cancelli hanno anche forma o icona.
- R-A6 Velocità dei testi di dialogo regolabile.

- [ ] **Step 2: Esegui `ux-review`**

Run skill `ux-review` con `design/accessibility-requirements.md`. Expected: ogni requisito ha una verifica prevista.

- [ ] **Step 3: Commit (solo dopo OK)**

```bash
git add design/accessibility-requirements.md
git commit -m "docs(design): requisiti di accessibilità" -m "Task 1.2"
```

### Task 1.3: Scope 1.0

**Files:**
- Create: `design/scope-1.0.md`

**Interfaces:**
- Consumes: §Stato misurato, `design/game-brief.md`
- Produces: elenco chiuso di aree, NPC, nemici, missioni e finali che entrano nel 1.0

- [ ] **Step 1: Esegui `content-audit` (planned vs built)**

Run skill `content-audit`. Expected: confronto tra `design/narrative/ferruccio-bibbia.md` (5 capitoli, 9 archi, 2 finali) e ciò che è in gioco.

- [ ] **Step 2: Elenca il 1.0**

Per ogni categoria, sì/no e motivo: aree, NPC, nemici, missioni, finali, Ratking, fucina.

- [ ] **Step 3: Esegui `scope-check`**

Run skill `scope-check` su `design/scope-1.0.md`. Expected: contenuti fuori scope marcati come DLC o rimossi.

- [ ] **Step 4: Commit (solo dopo OK)**

```bash
git add design/scope-1.0.md
git commit -m "docs(design): scope del rilascio 1.0" -m "Task 1.3"
```

### Task 1.4: Target di bilanciamento

**Files:**
- Create: `design/balance/targets.md`

**Interfaces:**
- Consumes: D3 (durata e prezzo), `src/data/tuning.json`
- Produces: target numerici per `balance-check`

- [ ] **Step 1: Scrivi la tabella dei target**

Righe obbligatorie, ognuna con un numero in minuti o in monete: tempo per area (5 base + 9 espansione), tempo di ogni fase del Cavaliere, tempo di Ratking, monete totali nel 1.0, prezzo medio negozio. I valori derivano da D3 e vanno ripresi da `tuning.json` come punto di partenza.

- [ ] **Step 2: Esegui `balance-check`**

Run skill `balance-check` con `src/data/tuning.json`. Expected: ogni valore ha un target, oppure è marcato `NOT ASSESSED — NO DATA` con il nome del target mancante.

- [ ] **Step 3: Commit (solo dopo OK)**

```bash
git add design/balance/targets.md
git commit -m "docs(balance): target di durata ed economia" -m "Task 1.4"
```

## Fase 2 — Contenuto e progressione

### Task 2.1: Verifica del roster nemici

**Files:**
- Read: `src/data/tuning.json`, `src/game/enemy.gd`, `src/game/elite.gd`, `PASSAGGIO-CONSEGNE.md` (radice di `E:\gioco`)

**Interfaces:**
- Consumes: nessuno
- Produces: elenco reale dei nemici, in `design/scope-1.0.md` (sezione nemici)

- [ ] **Step 1: Cerca gli archetipi citati nel handoff**

Run: `grep -rn -E "guardia|cavaliere|spettro" src/data/tuning.json src/game/*.gd | head -30`
Expected: se compaiono, documenta dove. Se no, il handoff è vecchio e va corretto.

- [ ] **Step 2: Esegui `consistency-check`**

Run skill `consistency-check`. Expected: nessun conflitto tra handoff, scope e codice.

- [ ] **Step 3: Aggiorna lo scope**

Scrivi in `design/scope-1.0.md` il roster reale. Commit con `Task 2.1`.

### Task 2.2: Test di raggiungibilità dei sigilli (RF4)

**Files:**
- Create: `tests/integration/gameplay/softlock_reachability_test.gd`
- Read: `tests/integration/gameplay/progression_routes_test.gd` (per riusare come costruire il grafo)

**Interfaces:**
- Consumes: `src/data/expansion.json` (`cracks`, `rooms`, `landmarks`), `tests/integration/gameplay/progression_routes_test.gd`
- Produces: asserzione per ogni sigillo: sorgente raggiungibile senza oggetti non ancora ottenibili

I sigilli da coprire sono: `market_seal`, `barracks_seal`, `sluice`, `loom`, `bells`, `hammer_plan`, `clock_memory`, `archive_1`, `archive_2`, `archive_3`.

- [ ] **Step 1: Scrivi il test che fallisce**

Copia lo scheletro di `tests/unit/options/save_slots_test.gd` (funzione `check(cond, msg)`, `quit(failures)`). Per ogni sigillo, costruisci il grafo come in `progression_routes_test.gd` e asserisci `reachable(sigillo) == true` partendo da nuovo gioco con soli oggetti già ottenibili.

- [ ] **Step 2: Esegui e verifica il fallimento**

Run: `"$GODOT" --headless --path src -s "$(realpath tests/integration/gameplay/softlock_reachability_test.gd)"`
Expected: FAIL se esiste un sigillo irraggiungibile. Se passa subito, il test non copre nulla: rivedilo prima di continuare.

- [ ] **Step 3: Correggi il percorso o la sorgente**

Se fallisce, correggi l'ordine dei requisiti in `expansion.json` (non il test). Documenta la correzione nel commit.

- [ ] **Step 4: Esegui e verifica il passaggio**

Run: come Step 2. Expected: `0 failure(s)`.

- [ ] **Step 5: Commit (solo dopo OK)**

```bash
git add tests/integration/gameplay/softlock_reachability_test.gd src/data/expansion.json
git commit -m "test(progression): raggiungibilità di tutti i sigilli" -m "Task 2.2"
```

## Fase 3 — Prestazioni e dimensione

### Task 3.1: Budget degli asset

**Files:**
- Modify: `src/assets/art/bosses/custode_anim.png` (18,4 MB) e i PNG oltre 1 MB che lo `asset-audit` segnala

**Interfaces:**
- Consumes: `tools/art/import_art.py`, `tools/art/manifest.json`
- Produces: export ≤ 150 MB (G8)

- [ ] **Step 1: Elenca i PNG oltre 1 MB**

Run: `find src/assets -name '*.png' -size +1M -printf '%s %p\n' | sort -rn`
Expected: lista di 92 file.

- [ ] **Step 2: Esegui `asset-audit`**

Run skill `asset-audit`. Expected: dimensione massima mostrata a schermo per ogni asset, e asset orfani.

- [ ] **Step 3: Ridimensiona il primo asset**

Riduci `custode_anim.png` alla dimensione massima mostrata a schermo, con margine ×2. Reimporta con `Godot --headless --path src --editor --import`.

- [ ] **Step 4: Verifica visiva**

Run: `"$GODOT" --headless --path src` con lo script `shoot_slice_art.gd` (senza `--headless`, serve il render). Confronta con `scratchpad/gate-before` e `gate-after`. Expected: nessuna differenza visibile.

- [ ] **Step 5: Commit (solo dopo OK)**

```bash
git add src/assets/art/bosses/custode_anim.png
git commit -m "perf(assets): riduce custode_anim alla dimensione mostrata" -m "Task 3.1"
```

### Task 3.2: Profilo prestazioni

**Files:**
- Create: `production/qa/perf-2026-10-12.md`

**Interfaces:**
- Consumes: hardware minimo dichiarato (da D2)
- Produces: FPS medi e frame time per area

- [ ] **Step 1: Esegui `perf-profile`**

Run skill `perf-profile` su tutte le aree. Expected: budget 16,6 ms per frame a 60 fps, valori misurati per area.

- [ ] **Step 2: Misura su hardware minimo**

Lancia l'eseguibile su hardware minimo dichiarato. Leggi `Performance.get_monitor(Performance.TIME_FPS)` dal pannello Monitor di Godot in build debug, oppure annota gli FPS a vista in 5 minuti per area.

- [ ] **Step 3: Commit del report (solo dopo OK)**

```bash
git add production/qa/perf-2026-10-12.md
git commit -m "docs(qa): profilo prestazioni su hardware minimo" -m "Task 3.2"
```

### Task 3.3: Soak di 2 ore

**Files:** nessuno

**Interfaces:**
- Consumes: `tools/ci/smoke-test.sh` (variabile `SMOKE_SECONDS`)
- Produces: log di 2 ore senza crash

- [ ] **Step 1: Esegui `soak-test`**

Run skill `soak-test`. Expected: piano di esecuzione e criteri di passaggio.

- [ ] **Step 2: Lancia la demo per 2 ore**

Run: `GODOT_BIN="$GODOT" SMOKE_SECONDS=7200 bash tools/ci/smoke-test.sh`
Expected: exit 0 e nessun `SCRIPT ERROR` nel log di avvio.

## Fase 4 — Robustezza e accessibilità

### Task 4.1: Salvataggi robusti (RF1, G6, D8)

**Files:**
- Modify: `src/game/save_slots.gd` (funzioni `info` e `latest`)
- Test: `tests/unit/options/save_slots_test.gd`

**Interfaces:**
- Consumes: `SaveSlots.path(slot)`, `SaveSlots.info(slot) -> Dictionary` con chiave `valid`, `SaveSlots.latest() -> int`
- Produces: slot corrotto con `info(slot).valid == false`, senza errore di parse nel log; `latest()` ignora gli slot non validi

**[BLOCCATO: D8]** — il task chiude anche l'errore `Parse JSON failed`. Parti solo dopo OK.

- [ ] **Step 1: Leggi le funzioni attuali**

Run: `grep -n "func " src/game/save_slots.gd`

- [ ] **Step 2: Aggiungi il caso corrotto al test (fallisce)**

Scrivi `{"version": 1, "checkpoint":` (troncato) nello slot 2 con `FileAccess.open(SaveSlots.path(2), FileAccess.WRITE)`. Asserisci `not SaveSlots.info(2).valid` e `SaveSlots.latest() != 2`.

- [ ] **Step 3: Esegui e verifica il fallimento**

Run: `"$GODOT" --headless --path src -s "$(realpath tests/unit/options/save_slots_test.gd)"`
Expected: FAIL sulle nuove asserzioni.

- [ ] **Step 4: Implementa il parsing controllato**

In `info`, usa `JSON.new()` e controlla il codice di ritorno di `parse(text)`, poi verifica che il risultato sia un `Dictionary`. Se non lo è, restituisci `{"valid": false}`. In `latest`, salta gli slot con `valid == false`.

- [ ] **Step 5: Esegui e verifica il passaggio**

Run: come Step 3. Expected: `0 failure(s)`, e nel log nessun `Parse JSON failed`.

- [ ] **Step 6: Commit (solo dopo OK)**

```bash
git add src/game/save_slots.gd tests/unit/options/save_slots_test.gd
git commit -m "fix(save): slot corrotti non valido, ignorati da latest" -m "Task 4.1"
```

### Task 4.2: Layout su tutte le risoluzioni (RF2, D2, D10)

**Files:**
- Modify: `src/game/game_settings.gd` (costante `RESOLUTIONS`, riga 9)
- Test: `tests/unit/ui/layout_text_test.gd`

**Interfaces:**
- Consumes: `SliceProps.hud_rects(vp)`, `SliceProps.fit_label(vp, r)`
- Produces: test che asserisce HUD e cartelli dentro il viewport a ogni risoluzione supportata

- [ ] **Step 1: Estendi il test (fallisce per 1280×800)**

Itera su `[Vector2(1280,720), Vector2(1280,800), Vector2(1366,768), Vector2(1920,1080), Vector2(2560,1440)]`. Per ognuno, `hud_rects` e i riquadri di `fit_label` devono stare in `Rect2(Vector2.ZERO, vp)`.

- [ ] **Step 2: Esegui e verifica il fallimento**

Run: `"$GODOT" --headless --path src -s "$(realpath tests/unit/ui/layout_text_test.gd)"`
Expected: FAIL a 1280×800 e 1366×768 se il layout non è adattivo.

- [ ] **Step 3: Aggiungi 1280×800 se D10 è sì**

In `game_settings.gd`, aggiungi `Vector2i(1280, 800)` a `RESOLUTIONS`.

- [ ] **Step 4: Correggi il layout dove fallisce**

Usa `fit_label` e `hud_rects` già esistenti. Non introdurre nuovi calcoli di layout separati.

- [ ] **Step 5: Esegui e verifica il passaggio**

Run: come Step 2. Expected: `0 failure(s)`.

- [ ] **Step 6: Commit (solo dopo OK)**

```bash
git add src/game/game_settings.gd tests/unit/ui/layout_text_test.gd
git commit -m "fix(ui): layout dentro lo schermo a tutte le risoluzioni supportate" -m "Task 4.2"
```

### Task 4.3: Gamepad scollegato e cambio input (RF3)

**Files:**
- Modify: `src/game/controls.gd`, `src/game/input_remap.gd`
- Test: `tests/unit/options/input_remap_test.gd`

**Interfaces:**
- Consumes: `Controls.label("interact")`, `InputRemap`
- Produces: suggerimenti in base all'ultimo dispositivo usato; rilascio di tutte le azioni alla disconnessione

- [ ] **Step 1: Scrivi il test del rilascio alla disconnessione (fallisce)**

Simula la pressione di un'azione gamepad, poi `Input.parse_input_event` con evento di disconnessione (o chiama il gestore). Asserisci che nessuna azione risulti `is_action_pressed` dopo.

- [ ] **Step 2: Esegui e verifica il fallimento**

Run: `"$GODOT" --headless --path src -s "$(realpath tests/unit/options/input_remap_test.gd)"`

- [ ] **Step 3: Implementa il rilascio e il cambio di suggerimento**

Gestisci `Input.joy_connection_changed`: alla disconnessione rilascia le azioni e passa ai suggerimenti tastiera.

- [ ] **Step 4: Esegui e verifica il passaggio**

Run: come Step 2. Expected: `0 failure(s)`.

- [ ] **Step 5: Commit (solo dopo OK)**

```bash
git add src/game/controls.gd src/game/input_remap.gd tests/unit/options/input_remap_test.gd
git commit -m "fix(input): gamepad scollegato rilascia le azioni e passa ai suggerimenti tastiera" -m "Task 4.3"
```

### Task 4.4: Focus e pausa durante dialogo o morte (RF5)

**Files:**
- Modify: `src/game/pause_menu.gd`, `src/game/dialogue_box.gd`, `src/game/world.gd`
- Create: `tests/integration/gameplay/focus_loss_test.gd`

**Interfaces:**
- Consumes: `NOTIFICATION_APPLICATION_FOCUS_OUT`, stato del dialogo
- Produces: al ritorno del focus, dialogo e input coerenti

- [ ] **Step 1: Scrivi il test (fallisce)**

Apri un dialogo, invia `NOTIFICATION_APPLICATION_FOCUS_OUT` e poi `NOTIFICATION_APPLICATION_FOCUS_IN`. Asserisci che il dialogo sia ancora attivo oppure chiuso in modo pulito, e che nessun input risulti bloccato.

- [ ] **Step 2: Esegui e verifica il fallimento**

Run: `"$GODOT" --headless --path src -s "$(realpath tests/integration/gameplay/focus_loss_test.gd)"`

- [ ] **Step 3: Implementa**

Gestisci la notifica in `world.gd` e lascia che `dialogue_box.gd` e `pause_menu.gd` riprendano lo stato.

- [ ] **Step 4: Esegui e verifica il passaggio**

Run: come Step 2. Expected: `0 failure(s)`.

- [ ] **Step 5: Commit (solo dopo OK)**

```bash
git add src/game/pause_menu.gd src/game/dialogue_box.gd src/game/world.gd tests/integration/gameplay/focus_loss_test.gd
git commit -m "fix(game): perdita di focus non blocca dialogo né input" -m "Task 4.4"
```

### Task 4.5: Opzioni di accessibilità (G5, R-A1…R-A6)

**Files:**
- Modify: `src/game/game_settings.gd`, `src/game/options_panel.gd`, `src/game/dialogue_box.gd`
- Test: `tests/unit/options/settings_test.gd`

**Interfaces:**
- Consumes: requisiti di `design/accessibility-requirements.md`
- Produces: chiavi `subtitles` (bool), `text_scale` (1.0 / 1.25 / 1.5), `reduce_motion` (bool), `dialogue_speed` (float)

- [ ] **Step 1: Scrivi il test dei default e del salvataggio (fallisce)**

Asserisci i default delle quattro chiavi e che un valore salvato sopravviva al riavvio (roundtrip in `settings.cfg`).

- [ ] **Step 2: Esegui e verifica il fallimento**

Run: `"$GODOT" --headless --path src -s "$(realpath tests/unit/options/settings_test.gd)"`

- [ ] **Step 3: Aggiungi le chiavi e le righe del pannello**

Aggiungi le chiavi in `game_settings.gd` e le righe in `options_panel.gd`. Applica `text_scale` e `subtitles` in `dialogue_box.gd`.

- [ ] **Step 4: Esegui e verifica il passaggio**

Run: come Step 2. Expected: `0 failure(s)`.

- [ ] **Step 5: Commit (solo dopo OK)**

```bash
git add src/game/game_settings.gd src/game/options_panel.gd src/game/dialogue_box.gd tests/unit/options/settings_test.gd
git commit -m "feat(options): sottotitoli, scala del testo, riduzione movimento, velocità dialoghi" -m "Task 4.5"
```

## Fase 5 — Localizzazione [BLOCCATA: D1]

### Task 5.1: Localizzazione in inglese (solo se D1 include EN)

**Files:**
- Create: `src/data/strings_en.csv` (o formato scelto da `localize`)

**Interfaces:**
- Consumes: ~750 stringhe nei JSON, letterali in `src/game/*.gd`
- Produces: tabella di traduzione e freeze delle stringhe

- [ ] **Step 1: Esegui `localize scan`**

Run skill `localize` con `scan`. Expected: elenco di stringhe hardcoded per file.

- [ ] **Step 2: Esegui `localize extract`**

Run skill `localize` con `extract`. Expected: tabella con chiave, IT, EN.

- [ ] **Step 3: Freeze e QA**

Run skill `localize` con `freeze`, poi `qa`. Expected: nessuna stringa italiana non tradotta in build EN.

### Task 5.2: Solo italiano (se D1 è solo IT)

**Files:**
- Modify: pagina store (Task 7.4)

- [ ] **Step 1: Dichiara "solo italiano" nella pagina store.** Nessun lavoro di codice.

## Fase 6 — Playtest esterni

### Task 6.1: Template di sessione

**Files:**
- Create: `production/qa/playtests/TEMPLATE.md`

**Interfaces:**
- Consumes: skill `playtest-report`
- Produces: modello compilato per ogni sessione

- [ ] **Step 1: Esegui `playtest-report new`**

Run skill `playtest-report` con `new`. Expected: template con sezioni: build (hash), giocatore anonimo, piattaforma, durata, punto di blocco, morti per area, tempi per area, bug con severità P1–P3, citazioni, domande (divertimento 1–5, chiarezza comandi 1–5, voglia di continuare 1–5).

- [ ] **Step 2: Commit (solo dopo OK)**

```bash
git add production/qa/playtests/TEMPLATE.md
git commit -m "docs(qa): template per le sessioni di playtest" -m "Task 6.1"
```

### Task 6.2: Tre round di playtest

**Files:**
- Create: `production/qa/playtests/round-1.md`, `round-2.md`, `round-3.md`

**Interfaces:**
- Consumes: template di Task 6.1, build da Task 7.3 (o build di slice con fasi 2–4 chiuse)
- Produces: G2 e G3 misurati

- [ ] **Step 1: Round 1 — 3 persone, osservate dal vivo.** Registra schermo e note. Compila un report per persona.

- [ ] **Step 2: Chiudi i P1 del round 1.** Ogni fix ha un test di regressione, come da `.claude/rules/test-standards.md`.

- [ ] **Step 3: Round 2 — 8 persone, anche senza osservazione.** Compila i report e chiudi i P1.

- [ ] **Step 4: Round 3 — 8 persone nuove.** Gate G3: almeno 6 completano, nessun P1 aperto. Se non passa, torna alla fase con il problema più frequente.

- [ ] **Step 5: Esegui `balance-check`** con i tempi reali. Aggiorna `design/balance/targets.md` se il gate G2 fallisce.

## Fase 7 — Release

### Task 7.1: Legale e store (G7, D4)

**Files:**
- Modify: `CREDITS.md` (aggiungere sezione Arte)
- Create: `design/legal/ai-disclosure.md`

**Interfaces:**
- Consumes: D4
- Produces: documento di provenienza dell'arte, dichiarazione AI, bozza EULA e informativa privacy

- [ ] **Step 1: Verifica i termini d'uso commerciali di Grok Imagine.** Azione tua: leggi i termini del servizio e annota la data di verifica. Non è una scelta che posso fare io.

- [ ] **Step 2: Scrivi la dichiarazione AI per lo store.** Segui le regole dello store scelto (per Steam: divulgazione dei contenuti generati con IA).

- [ ] **Step 3: Aggiorna `CREDITS.md`.** Sezione Arte: provenienza, generatore, data, eventuali pezzi sostituiti (D4).

- [ ] **Step 4: Scrivi EULA e informativa privacy.** Il gioco non raccoglie dati personali se non aggiungi telemetria: dichiaralo esplicitamente.

- [ ] **Step 5: Commit (solo dopo OK)**

```bash
git add CREDITS.md design/legal/ai-disclosure.md
git commit -m "docs(legal): provenienza dell'arte e dichiarazione AI" -m "Task 7.1"
```

### Task 7.2: Checklist di rilascio

**Files:**
- Create: `production/releases/release-1.0-checklist.md` (dal risultato di `release-checklist`)

- [ ] **Step 1: Esegui `release-checklist pc`** e `launch-checklist dry-run`.

- [ ] **Step 2: Chiudi gli elementi bloccanti** (G1–G8). Ogni elemento aperto ha un responsabile e una data.

### Task 7.3: Build di rilascio

**Files:**
- Read: `src/export_presets.cfg`, `tools/ci/package-windows.sh`

**Interfaces:**
- Consumes: template ufficiale Godot 4.6
- Produces: zip di rilascio, hash SHA256, eseguibile testato

- [ ] **Step 1: Esporta con `package-windows.sh`**

Il preset va sostituito temporaneamente con il template locale e ripristinato sempre con `try/finally`, come da `PASSAGGIO-CONSEGNE.md`.

- [ ] **Step 2: Verifica dimensione e avvio**

Expected: ≤ 150 MB (G8). Avvio reattivo dopo 15 s, nessun errore.

- [ ] **Step 3: Calcola SHA256 e annotalo nel report di release.**

### Task 7.4: Pagina store

**Files:**
- Create: `production/store/` (testi, screenshot da `production/qa/evidence/`, trailer di 60–90 s)

- [ ] **Step 1: Screenshot e capsule.** Azione tua o di un artista. Gli screenshot esistenti sono in `production/qa/evidence/`.
- [ ] **Step 2: Testo, prezzo (D3), classificazione età (IARC).**

### Task 7.5: Beta pubblica (D6)

**Files:**
- Modify: `.github/workflows/beta-windows.yml`

- [ ] **Step 1: Applica la scelta di D6.** Spegnere, limitare ai tag, o lasciare la beta com'è.

## Fase 8 — Dopo il lancio

- Skill `day-one-patch` per la patch del primo giorno, con lista di bug P1 da playtest.
- Skill `patch-notes` per ogni patch pubblica.
- Monitoraggio recensioni: nessun task di codice, solo risposte ai feedback che si ripetono.

## Self-review

- **Copertura della spec:** la spec è l'obiettivo "vendibile, giocabile, non beta". Coperti: completamento e softlock (2.2), salvataggi (4.1), layout (4.2), input (4.3), focus (4.4), accessibilità (4.5), prestazioni e dimensione (3.1–3.3), lingue (5.x), playtest (6.x), legale e store (7.x), beta pubblica (7.5).
- **Placeholder:** nessun `TBD`. Le decisioni sono D1–D10, non segnaposto, e ogni task che ne dipende è marcato **[BLOCCATO]**.
- **Coerenza dei nomi:** `SaveSlots.info`/`latest`/`path`, `SliceProps.hud_rects`/`fit_label`, `Controls.label`, `InputRemap`, `RESOLUTIONS`, chiavi di Task 4.5: stessi nomi in tutti i task.
- **Review Focus:** RF1→4.1, RF2→4.2, RF3→4.3, RF4→2.2, RF5→4.4. Ogni riga ha il suo test nel task che possiede il codice.
- **Correzione emersa durante la scrittura:** la CI esegue già tutti i test, ma solo sui branch elencati. Task 0.1 corregge questo.
