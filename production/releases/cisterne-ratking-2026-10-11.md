# Cisterne e Ratking — 11 ottobre 2026

Build: `E:/gioco/Test-Ferruccio/Ferruccio-Cisterne-Ratking.exe` (aggiornato anche `Ferruccio-Affondo.exe`).
Scorciatoie nella stessa cartella: `Prova Cisterne.lnk`, `Prova Ratking.lnk`.

## Sintesi interventi completati

### 1. Boss Ratking & Progressione del Rampino
- Stanza 15: **Tana di Ratking** ("Il figlio delle Cisterne"), fondale dipinto dedicato `ratking_arena.png` e puppet `ratking.png` a 16 parti articolate.
- Ratking: boss con 32 HP, attacchi annunciati a terra (artigli ad arco, carica rapida, evocazione ratti). Sotto il 50% di vita il ritmo accelera ed evoca 5 ratti.
- Sconfiggendo Ratking si ottiene direttamente il **Rampino a catena** (`grapple`).
- Il rampino è rimosso dall'acquisto gratuito nella fucina (`reward_only: true`).
- Il varco sinistro delle Cisterne verso Piazza Dante si sblocca **solo** dopo aver sconfitto Ratking.

### 2. Risalite ad anelli & Belvedere di San Leucio
- Nuovi anelli di risalita collocati sul lato destro del Belvedere di San Leucio (vicino ad Agnese) oltre l'altezza del doppio salto, permettendo di risalire verso il Campanile con il rampino dopo il dialogo.
- Anelli verticali nelle Cisterne bilanciati per richiedere l'uso del rampino per risalire.

### 3. Nemici & Statua rivista
- **Lanterniere del Velo** (`lanterniere`): nuovo nemico terrestre dipinto e articolato con lanterna e attacchi annunciati (brace a distanza o colpo ravvicinato). Sostituisce lo Spirito del Calcare in tutta la mappa.
- Lo **Spirito del Calcare** resta confinato rigorosamente al solo **Campanile della Voce** (Stanza 12).
- **Statue**: ancorate solidamente ai basamenti/mensole (risolto il problema delle statue sospese in aria o cadenti). Mirano e caricano solo quando Ferruccio entra nel raggio d'azione visivo.
- **Taglio dei proiettili**: Ferruccio può colpire con la spada schegge di marmo, proiettili nemici e ratti, distruggendoli all'istante con scintille sonore (`colpo`); il colpo verso il basso in aria (pogo) garantisce inoltre il rimbalzo d'altezza.

### 4. Piattaforma del Setificio (Telaio)
- `moving_ledge.gd` configurato con `sync_to_physics = true` e livello di collisione `set_collision_layer_value(4, true)`, garantendo che la passerella mobile trasporti fisicamente Ferruccio senza farlo scivolare fino alla leva del telaio.

### 5. Registro Missioni & Mappa del Mondo
- Creato `src/data/quests.json` con le missioni principali della Reggia e dello stato di progressione.
- Nella schermata mappa, premendo `Tab` o `Y / △` (interagisci) si passa alla vista **Registro Missioni** con elenco sfogliabile pagina per pagina (`←` / `→` o D-Pad/stick).

### 6. Controlli & Menu Iniziale
- Navigazione menu con D-Pad, Leva sinistra e tasto `A / Croce` / `Start`, con focus garantito all'avvio. Supporto completo anche da tastiera (W/S, frecce, Enter, Spazio).
- Pulsanti di interazione parlata a schermo con layout pulito centrato per ciascun tasto.

## Verifica Test di Integrazione
Tutti i test headless eseguiti con successo (0 fallimenti):
- `ratking_test.gd`: 0 fallimenti
- `progression_routes_test.gd`: 0 fallimenti
- `metroidvania_test.gd`: 0 fallimenti
- `progression_shop_test.gd`: 0 fallimenti
- `expansion_test.gd`: 0 fallimenti
- `npc_cutout_test.gd`: 0 fallimenti
- `npc_puppet_animation_test.gd`: 0 fallimenti
- `npc_puppet_gameplay_test.gd`: 0 fallimenti
- `npc_facing_test.gd`: 0 fallimenti
- `npc_joint_registration_test.gd`: 0 fallimenti
- `combat_thrust_test.gd`: 0 fallimenti
- `cutout_animation_test.gd`: 0 fallimenti
- `boss_gate_test.gd`: 0 fallimenti
- `elite_spawn_test.gd`: 0 fallimenti
- `expansion_traversal_test.gd`: 0 fallimenti
- `exploration_save_test.gd`: 0 fallimenti
- `introduction_controls_test.gd`: 0 fallimenti
- `introduction_memory_test.gd`: 0 fallimenti
