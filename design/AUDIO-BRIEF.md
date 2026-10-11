# Ferruccio: audio brief (SFX, musiche e brief per il compositore)

Progetto: *Ferruccio*, metroidvania 2D in Godot 4.6, ambientato in una Caserta borbonica velata e fiabesca (Reggia, San Leucio, vicoli, cisterne). Protagonista: Ferruccio, piccolo Pulcinella bianco con sciarpa. Autore: Salvatore De Rosa.
Codice audio: autoload `Audio` (`src/autoload/audio.gd`), configurazione in `src/data/audio.json` (aree → musica + ambiente; sfx → varianti, dB, pitch casuale, loop). File in `src/assets/audio/{music,ambience,sfx}`.

Legenda stato: **E** = esiste già (placeholder generato da `tools/audio/`, da sostituire con audio definitivo), **N** = nuovo, da produrre.

---

## 1. Musiche

### 1.1 Aree (loop, cambio in crossfade di 1,5 s)
| ID / file | Area / stanze | Stato | Mood | Durata loop |
|---|---|---|---|---|
| `music/menu.ogg` | Menu principale, titoli | E | Carillon malinconico, invito, "c'era una volta" | 1:30–2:00 |
| `music/piazza.ogg` | Piazza Dante (hub), Vicoli del Mercato | E | Calore di quartiere, mandolino, curiosità | 2:00–2:30 |
| `music/strada.ogg` | Corso Trieste, Portici della Caserma | E | Pioggia, passi furtivi, pizzicati, minore | 2:00 |
| `music/giardino.ogg` | Villa Comunale | E | Notturno, arpa e flauto, sospeso | 2:00–2:30 |
| `music/belvedere.ogg` | Belvedere e Tessiture di San Leucio | E | Vento, seta, meccanica di telai (ostinato) | 2:00–2:30 |
| `music/oro.ogg` | Cortile d'Onore, Reggia | E | Solenne, barocco, minaccioso | 2:00 |
| `music/cisterne_reali.ogg` | Cisterne Reali | N (segnaposto `TODO_cisterne_reali.ogg`) | Acqua, eco, basso profondo, gocce; meraviglia sotterranea | 2:00–3:00 |
| `music/cisterne_sepolte.ogg` | Cisterne Sepolte | N (segnaposto `TODO_cisterne_sepolte.ogg`) | Variante più cupa e lenta delle Cisterne Reali, stesso tema in minore | 2:00–3:00 |
| `music/archivi.ogg` | Archivi della Reggia | N | Polvere, carta, clavicembalo lento, mistero | 2:00 |
| `music/campanile.ogg` | Campanile delle Voci | N | Campane, coro sussurrato, verticalità crescente | 2:00 |
| `music/orologi.ogg` | Galleria degli Orologi | N | Ticchettii in poliritmia, celesta, tensione | 2:00 |
| `music/fucina.ogg` | La fucina del ricordo (Gaetano) | N | Rifugio, calore, incudine lontana, tema del padre | 1:30–2:00 |
| `music/epilogo.ogg` | Caserta dopo il Velo | N | Alba, risoluzione del tema principale in maggiore | 2:00 (loop) |

### 1.2 Boss e mini-boss (loop con intro separata, 2 fasi)
| ID | Boss | Stato | Note |
|---|---|---|---|
| `music/boss_cavaliere_intro.ogg` + `_loop` + `_fase2` | Cavaliere Borbonico (Cortile, boss finale) | N | Marcia barocca, ottoni e timpani; fase 2 ("spezza il sigillo") +10 BPM, coro, ritmo spezzato |
| `music/boss_ratking_*` | Ratking, il Figlio delle Cisterne | N | Grottesco, tarantella distorta, percussioni metalliche, acqua |
| `music/boss_madre_marmo_*` | La Madre di Marmo (Tessiture) | N | Lirico e tragico, archi, voce femminile senza parole |
| `music/miniboss.ogg` | Capitano Ruggiero, Cavaliere di Pietra, Spettro del Calcare | N | Un tema "duello" condiviso, 1:00 di loop |
| `music/vittoria_sting.ogg` | Boss sconfitto | N | Stinger 4–6 s, non in loop |

### 1.3 Stinger e cue narrativi (non in loop)
`sting_area_nuova` (2–3 s, titolo d'area), `sting_abilita` (abilità ottenuta: rampino, scatto, martello, 4–6 s), `sting_sigillo` (sigillo quartiere risvegliato), `sting_ricordo` (testimonianza/ricordo), `sting_morte` ("Ferruccio è caduto", 3 s), `finale_liberta` / `finale_alternativo` (titoli di coda, 1:30–2:00), `filastrocca_luciana` (filastrocca cantata da Donna Luciana prima del boss, voce sola, 20–30 s).

---

## 2. Ambienti (loop, bus Ambience)
| File | Stato | Uso |
|---|---|---|
| `ambience/citta.ogg` | E | Piazza: brusio lontano, carretti, campane |
| `ambience/pioggia.ogg` | E | Corso Trieste |
| `ambience/notte.ogg` | E | Villa: grilli, fontane |
| `ambience/vento.ogg` | E | Belvedere |
| `ambience/torce.ogg` | E | Cortile: crepitio torce |
| `ambience/acqua_cisterne.ogg` | N (segnaposto `TODO_acqua_cisterne.ogg`) | Cisterne Reali: gocce, riverbero, flusso sotterraneo |
| `ambience/cisterne_sepolte.ogg` | N (segnaposto `TODO_cisterne_sepolte.ogg`) | Acqua stagnante, crolli lontani, sussurri |
| `ambience/tana_ratking.ogg` | N (segnaposto `TODO_tana_ratking.ogg`) | Squittii in massa, rivoli, ossa che rotolano |
| `ambience/archivio.ogg` | N | Silenzio "pieno", fruscio carte, orologio lontano |
| `ambience/telai.ogg` | N | San Leucio: telai meccanici ritmici |
| `ambience/orologi.ogg` | N | Galleria: centinaia di ticchettii |
| `ambience/fucina.ogg` | N | Brace, mantice, martello lontano |
| `ambience/mercato.ogg` | N | Vicoli: voci in napoletano indistinte |

---

## 3. Effetti sonori

### 3.1 Ferruccio (giocatore)
| ID | Stato | Varianti | Note |
|---|---|---|---|
| `passo` | E | 3 → portare a 4 per superficie | N: set per pietra, legno, acqua, erba, metallo |
| `salto` / `doppio_salto` / `atterraggio` | E | 1 / 1 / 1 → 3 | atterraggio pesante dopo caduta lunga (N) |
| `scatto` | E | 1 | fruscio di sciarpa |
| `fendente` | E | 3 | + `fendente_affondo` (N), `fendente_pogo` (N) |
| `colpo` | E | 1 → 3 | impatto su carne / pietra / metallo |
| `ferito` | E | 1 → 2 | |
| `parata` / `parata_perfetta` | N | 2 / 1 | metallo cristallino, la perfetta con coda brillante |
| `rampino_lancio` / `rampino_aggancio` / `rampino_tirata` | N | 1 / 2 / 1 | catena, gancio |
| `martello_colpo` / `muro_crollo` | N | 2 / 1 | calcare che cede |
| `cura_braci` | N | 1 | caldo, fiato |
| `aggrappo_muro` / `salto_muro` | N | 2 / 2 | |
| `morte` | N | 1 | |

### 3.2 Nemici
| ID | Stato | Note |
|---|---|---|
| `gatto_soffio`, `gatto_miao`, `gatto_balzo` | E | |
| `vespa_picchiata`, `vespa_ronzio` (loop) | E | |
| `statua_carica`, `statua_sparo` | E | |
| `nemico_colpito`, `nemico_ucciso` | E | variante per materiale (N) |
| `ratti_sciame` (loop), `ratto_squittio` | N | |
| `lanterniere_fiamma` (loop), `lanterniere_attacco` | N | |
| `guardia_passo`, `guardia_affondo` | N | Guardia della Città |
| `elite_comparsa` | N | spawn elite |

### 3.3 Boss
| ID | Stato | Note |
|---|---|---|
| `custode_passo`, `custode_urto`, `custode_raffica` | E | Cavaliere Borbonico |
| `cavaliere_salto_mensola`, `cavaliere_sigillo_spezzato`, `cavaliere_grido`, `cavaliere_caduta` | N | |
| `ratking_ruggito`, `ratking_tuffo`, `ratking_morso`, `ratking_caduta` | N | |
| `madre_marmo_canto`, `madre_marmo_crepa`, `madre_marmo_telaio` | N | |
| `arena_cancello_chiusura` | N | cancelli dell'arena che scendono |

### 3.3b Segnaposto sintetizzati già nel gioco (da sostituire)
`incudine_salva` (`sfx/TODO_incudine_salva.wav`, suona al salvataggio all'incudine), `boss_preavviso` (`sfx/TODO_boss_preavviso.wav`, preavviso di ogni attacco del Cavaliere: fendente, balzo, raffica), `ratking_preavviso` (`sfx/TODO_ratking_preavviso.wav`, a ogni carica di Ratking). Sono generati da `tools/art/gen_placeholders.py` e segnati `"todo": true` in `audio.json`. Il preavviso deve leggersi in 0,3–0,6 s e restare distinguibile dall'attacco vero e proprio.

### 3.4 Mondo e interazioni
`moneta` (E), `mozzarella` (E), `portale` (E), N: `porta_apertura`, `chiusa_meccanismo`, `meccanismo_attivato`, `piattaforma_mobile` (loop), `salvataggio_statua`, `sigillo_risveglio`, `frammento_testimonianza`, `negozio_acquisto`, `incudine_ricordo`, `passaggio_aperto`, `segreto_trovato`.

### 3.5 UI
`menu_click` (E), `dialogo` (E, 2 varianti), `scelta` (E), N: `menu_sposta`, `menu_indietro`, `pausa_apri`/`pausa_chiudi`, `mappa_apri`/`mappa_chiudi`, `notifica` (avviso HUD in coda, discreto, ≤ 0,4 s), `titolo_area` (fruscio di carta), `vita_persa_ultima` (battito, loop corto con 1 sola maschera), `acquisto_negato`.

---

## 4. Brief per il compositore

**Segnaposto già cablati nel gioco (ottobre 2026).** In `src/data/audio.json` ci sono le aree `cisterne_reali`, `cisterne_sepolte` e `tana_ratking` con `"todo": true`, un campo `placeholder` e i percorsi `music/TODO_*.ogg` / `ambience/TODO_*.ogg`. La sezione `"rooms"` le collega per nome alle stanze Cisterne Reali, Cisterne Sepolte e Tana di Ratking. Finché i file mancano il gioco usa l'area `fallback` (giardino / belvedere). Per consegnare basta salvare i file definitivi con il nome finale, aggiornare il percorso e togliere `todo`. La Tana di Ratking usa per ora come musica d'area il loop del boss (`TODO_boss_ratking_loop.ogg`).

**Bus e volumi.** Il gioco ha 4 bus regolabili dal menu Opzioni: Musica (`Music`), Effetti (`SFX`), Voci (`Voice`, per bisbigli e versi dei dialoghi, quindi `dialogo_*.wav` e le future voci) e Ambiente (`Ambience`). Consegnare voci e versi separati dagli SFX.

**Il gioco in una frase.** Un piccolo Pulcinella attraversa una Caserta del Settecento coperta da un "Velo" che ruba i ricordi; deve ritrovare il proprio nome e affrontare il Cavaliere Borbonico nel Cortile d'Onore della Reggia.

**Mood generale.** Fiaba napoletana malinconica, non comica: meraviglia e nostalgia in esplorazione, tensione barocca nei combattimenti. Pulcinella non è maschera da farsa ma figura sola e tenera. Il Velo è un senso di memoria che sbiadisce: suoni che si allontanano, riverberi, piccole stonature da carillon.

**Riferimenti.** Hollow Knight (Christopher Larkin: temi d'area con strumentazione propria, leitmotiv), Ori (emozione orchestrale), Blasphemous (identità culturale forte nella strumentazione), Nino Rota (malinconia italiana, valzer), Roberto De Simone / *La Gatta Cenerentola* (canto popolare campano), musica barocca napoletana (Pergolesi, Scarlatti, Cimarosa), tarantella e villanella.

**Strumentazione.** Base cameristica più che sinfonica: mandolino, chitarra battente, colascione (o liuto), arpa, clavicembalo, archi da camera, flauto/ottavino, oboe, celesta e carillon (il "Velo"), tammorra, castagnette, campane. Per la Reggia e i boss: ottoni barocchi, timpani, organo, coro. Voce femminile senza parole per Donna Luciana e la Madre di Marmo. L'elettronica è ammessa solo come texture (riverberi, granulare) per il Velo.

**Leitmotiv.**
1. *Tema di Ferruccio*: semplice, fischiettabile, in modo minore; si risolve in maggiore solo nell'epilogo.
2. *Tema del Velo*: carillon che rallenta e stona leggermente.
3. *Tema della Reggia / Cavaliere*: marcia barocca.
4. *Tema del padre (Gaetano)*: caldo, per fucina e ricordi.
Ogni tema d'area cita almeno un leitmotiv.

**Struttura e loop.**
- Musiche d'area: loop senza cuciture (il punto di loop sta nel file, nessuna coda di riverbero tagliata). Il gioco fa crossfade di 1,5 s tra aree, quindi niente intro obbligatoria.
- Boss: file separati `_intro` (non in loop), `_loop` e `_fase2` (stesso BPM e tonalità compatibile, per passare a fine battuta).
- Preferibile la consegna a stem (percussioni / melodia / pad) per un futuro layering dinamico, per esempio togliere le percussioni quando non ci sono nemici.
- Stinger: 2–6 s, con coda naturale, senza loop.

**Specifiche tecniche.**
- Musica e ambienti: OGG Vorbis, 44,1 kHz (o 48 kHz), stereo, qualità q6–q8; master WAV 24 bit da archiviare.
- SFX: WAV 16 bit, 44,1 kHz, mono (stereo solo per ambienti ed esplosioni), senza silenzio in testa (attacco entro 5 ms), coda tagliata con fade.
- Loudness: musica intorno a −16 LUFS integrati, ambienti −24/−20 LUFS, true peak ≤ −1 dBTP. SFX normalizzati con picco a −3 dBFS e coerenti fra loro (passi più bassi di colpi e urti).
- Varianti: almeno 3 per suoni ripetuti (passi, fendenti, colpi); il motore sceglie a caso senza ripetere e aggiunge un pitch casuale di ±3–8%.
- Nomi file: `snake_case`, senza spazi né accenti, varianti `_1`, `_2`, … (come in `audio.json`). Consegna nelle cartelle `music/`, `ambience/`, `sfx/`.
- Bus nel gioco: Music, Ambience, SFX (volumi regolabili dal giocatore).

**Priorità di consegna.**
1. Tema di Ferruccio, menu, Piazza (hub), boss Cavaliere (3 file) e stinger abilità/morte.
2. Le altre aree esistenti (strada, giardino, belvedere, oro) da sostituire ai placeholder.
3. Aree nuove (cisterne, archivi, campanile, orologi, fucina, epilogo), Ratking e Madre di Marmo.
4. Set SFX nuovi (parata, rampino, martello, UI).

**Durata stimata.** Circa 35–45 minuti di musica, più circa 120 SFX/varianti e 11 ambienti.

## Stato (11 ottobre 2026)

Sostituiti tutti i segnaposto `todo` con versioni definitive sintetizzate da
`tools/audio/gen_audio.py` (originali, nessun campione di terzi; crediti in `CREDITS.md`):

- **Musiche (loop, .ogg):** tema di Ratking (`music/boss_ratking.ogg`, tarantella in Re minore
  armonica, 6/8, mandolino a tremolo, pizzicati, tamburello, controcanto d'ancia), tema del
  Cavaliere (`music/boss_cavaliere.ogg`, marcia in Do minore, corni/trombe naturali, archi in
  ostinato, timpani, tamburo militare; parte quando si chiude l'arena), Cisterne Reali e
  Cisterne Sepolte (archi tenuti, clarinetto, mandolino rado, gocce, riverbero di volta).
- **Ambienti (loop):** acqua delle Cisterne, Cisterne Sepolte, Tana di Ratking.
- **Effetti:** passi su pietra (3 varianti), colpo, parata (nuovo, suona sulla parata riuscita),
  ratti (nuovo, al richiamo dei ratti di Ratking), incudine, preavvisi di Cavaliere e Ratking.
- Livelli normalizzati (musica RMS -16..-20 dBFS, ambienti -24..-26, effetti -16..-24, picchi ≤ -2 dBFS).
- Restano da migliorare con un compositore/registrazioni vere: i timbri sono sintetici (additivi),
  credibili in gioco ma non paragonabili a strumenti registrati.
