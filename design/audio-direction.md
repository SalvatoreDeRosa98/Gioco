# Audio Direction: Ferruccio — La Menzogna dei Borbone

Bozza 1 · 8 ottobre 2026 · tutto l'audio è **sintetizzato da noi** con script Python riproducibili
(`tools/audio/`): niente campioni di terzi, niente licenze da gestire.
Riferimento di qualità: Hollow Knight / Silksong (Christopher Larkin). Storia: `design/narrative/ferruccio-bibbia.md`.
Luci e colori delle aree: `design/art-bible.md` §2 (la musica segue la stessa tabella delle emozioni).

## 1. Identità sonora

**Una fiaba notturna da camera: pochi strumenti, molto spazio, tanta memoria.**
Archi in sordina, pianoforte di feltro, arpa, celesta e carillon; il mandolino napoletano
arriva sempre *da lontano*, come un ricordo della città prima del Velo. Ottoni gravi e
percussioni compaiono solo davanti al Custode. Riverbero lungo e scuro, nessun suono acuto
e duro, nessuna distorsione.

## 2. Linguaggio armonico

- Tonalità comune: **re minore**. Colore locale: **sesta napoletana** (Mi♭ maggiore, spesso
  in primo rivolto Eb/G) che scivola sul La7 e torna al Re (`Eb>A7` nelle partiture);
  inflessioni **frigie** (Mi♭ sopra il Re) negli ostinati inquieti.
- Il Belvedere (alba) passa in Fa maggiore e chiude il culmine con una cadenza piccarda in
  **Re maggiore**: l'unico momento di luce piena della colonna sonora.
- Regola di voicing: le note tenute insieme non stanno mai a distanza di seconda o nona
  minore (`tools/audio/harmony_check.py` lo verifica); le settime maggiori sì.

## 3. Leitmotiv di Ferruccio

3/4, re minore. Testa di 4 battute + coda di 4.

| | b.1 | b.2 | b.3 | b.4 |
|---|---|---|---|---|
| **Testa** | La Re Fa | Mi♭. Re Si♭ | La Sol Do♯ | Re |
| accordi | Dm | N6 (Eb/G) | A7 | Dm |
| **Coda** | Re Do-Si♭ La | Sol. La Si♭ | Sol Fa Mi | Re |
| accordi | B♭maj7 | Gm | Eb > A7 | Dm |

Variazioni: pianoforte e poi mandolino lontano (Piazza), violoncelli e violini in
sarabanda con coro (Menu), frammenti alla viola sopra i pizzicati (Strada), celesta e
carillon (Giardino), archi larghi e versione in Fa maggiore (Belvedere), testa in emiola
agli ottoni gravi sopra una tarantella cupa in 6/8 (Oro).

## 4. Brani (in loop perfetto)

| Tema | File | Durata | Peso | Carattere | Tempo |
|---|---|---|---|---|---|
| menu | `music/menu.ogg` | 111 s | 1,6 MB | Reggia: sarabanda solenne e triste, coro, campane lontane | 3/4, 52 |
| piazza | `music/piazza.ogg` | 122 s | 1,8 MB | notte, tema al pianoforte, mandolino lontano | 3/4, 60 |
| strada | `music/strada.ogg` | 122 s | 1,9 MB | pioggia e inquietudine, ostinato di pizzicati frigio | 4/4, 80 |
| giardino | `music/giardino.ogg` | 120 s | 1,4 MB | mistero, celesta/arpa, carillon | 3/4, 72 |
| belvedere | `music/belvedere.ogg` | 125 s | 1,9 MB | alba nella nebbia, archi ampi, fili di seta d'arpa | 3/4, 46 |
| oro | `music/oro.ogg` | 118 s | 1,5 MB | il Custode: tarantella cupa, ottoni gravi, gran cassa, tammorra | 6/8, ♩.=100 |

OGG Vorbis q5, stereo, 44,1 kHz. Loudness: −16/−17 LUFS (−14 il boss), true peak < −1 dBTP.
Il boss ha una pausa centrale (coro di Gregorio) e una salita: regge un combattimento lungo.

## 5. Ambienti (in loop)

| Area | File | Contenuto |
|---|---|---|
| piazza | `ambience/citta.ogg` (45 s) | città quasi muta: vento lieve, carrozza lontana, un grillo, rintocco, assiolo |
| strada | `ambience/pioggia.ogg` (48 s) | pioggia sul basolato, bolle nelle pozzanghere, grondaia, tuono lontanissimo |
| giardino | `ambience/notte.ogg` (40 s) | grilli, fontana lontana, l'assiolo ("chiù"), foglie |
| belvedere | `ambience/vento.ogg` (50 s) | raffiche nella nebbia, fischi lievi, uccelli dell'alba lontani |
| oro | `ambience/torce.ogg` (40 s) | due torce che crepitano, grande sala, un'eco metallica |

OGG q4, −21/−26 LUFS (stanno sotto la musica).

## 6. Effetti (`src/assets/audio/sfx/`, WAV)

| Nome API | Varianti | Dove si usa |
|---|---|---|
| `passo` | 3 | passi di Ferruccio (scarpe morbide su pietra) |
| `salto`, `doppio_salto`, `atterraggio`, `scatto` | 1 | movimento; il doppio salto ha un luccichio "di filo" |
| `fendente` | 3 | colpo di spada a vuoto |
| `colpo` | 1 | colpo a segno |
| `nemico_ucciso` | 1 | impatto + anima che sale e si dissolve |
| `ferito` | 1 | Ferruccio colpito |
| `moneta`, `mozzarella` | 1 | raccolta centesimi / cura (arpeggio caldo in Re maggiore) |
| `portale` | 1 | apertura del passaggio |
| `gatto_soffio`, `gatto_miao` | 1 | gatto |
| `vespa_ronzio` | loop 1 s | ronzio continuo (`Audio.set_loop_sfx`) |
| `statua_carica`, `statua_sparo` | 1 | statua |
| `custode_passo`, `custode_urto`, `custode_raffica` | 1 | il Custode |
| `menu_click`, `dialogo`, `scelta` | 1/2/1 | interfaccia e testo |

Volumi già bilanciati in loudness nei file (tabella `SFX` in `tools/audio/sfx.py`);
ritocchi fini in `src/data/audio.json` (`db`, `pitch`).

## 7. Integrazione (autoload `Audio`, `src/autoload/audio.gd`)

`Audio.play_area(theme)` · `Audio.sfx(id, volume_db := 0.0)` · `Audio.set_loop_sfx(id, playing, volume_db := 0.0)` ·
`Audio.stop_music(fade := 1.0)` · `Audio.stop_ambience(fade)` · `Audio.stop_loops()` · `Audio.set_bus_volume(bus, db)`.
Bus `Music`, `Ambience`, `SFX` creati da codice; due player musica con dissolvenza
incrociata a potenza costante (1,5 s), un player ambiente, pool di 12 player per gli effetti
con pitch variato. Mappa nomi → file → volumi in `src/data/audio.json`.

## 8. Rigenerare

```
pip install -r tools/audio/requirements.txt        # + ffmpeg con libvorbis
python3 tools/audio/build_all.py --godot $HOME/Godot_v4.6-stable_linux.x86_64
python3 tools/audio/harmony_check.py               # scontri di semitono nelle partiture
python3 tools/audio/analyze.py --png /tmp/spettri src/assets/audio/music/*.ogg
```

Seed fissi: gli stessi script producono gli stessi file. Per cambiare un brano si modifica
la sua funzione `song_*` in `music.py` (note, accordi, livelli degli stem).

## 9. Limiti noti

- Timbri sintetici: archi e ottoni sono ensemble additivi/a tabella, credibili sotto molto
  riverbero ma non come una registrazione. Il pianoforte di feltro, l'arpa, la celesta e il
  mandolino (Karplus-Strong) sono i timbri più convincenti.
- La verifica è stata oggettiva (picchi, LUFS, giunzione, spettro, armonia), non un ascolto
  umano: serve un passaggio d'orecchio sui livelli relativi musica/ambiente/effetti in gioco.
- Gli effetti non sono posizionali (AudioStreamPlayer, non 2D): il panning di nemici fuori
  schermo non c'è.
