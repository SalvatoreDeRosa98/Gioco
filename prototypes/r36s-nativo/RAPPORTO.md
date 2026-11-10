# Ferruccio sull'R36S: prova di fattibilità (2026-11-10)

**Dove siamo (secondo giro).** Sulla console vera il pacchetto v1 **parte** (node, la SDL2 di sistema e lo
schermo funzionano) ma va a **circa 5 fotogrammi al secondo** a occhio: quattro-cinque volte peggio della
mia stima centrale. La stima del §3 era sbagliata, e il §8 dice perché. C'è un pacchetto **v2** che lavora
solo nello strato del lanciatore: tre livelli di qualità, console alla massima potenza, velocità di gioco
giusta anche quando disegna poco, e una misura automatica da lanciare sulla console. **Non so se arriva a
15-20**: la mia attesa onesta è 9-14 al livello che resta leggibile e 11-20 a quello veloce (§8).

**In una riga (primo giro).** Il gioco vero gira fuori dal browser (Node + Skia + SDL) su un PC, senza toccare
`gioco/teatro/`; c'è un pacchetto autosufficiente da copiare in `ports/`.

Bersaglio preciso: R36S (clone) con **«ArkOS 2.0 (08232024)(AeUX)»**, EmulationStation 2.13, senza Wi-Fi;
scheda con `EASYROMS` (leggibile da Windows) e cartella `ports` vuota (niente PortMaster lì).

## 1. Cosa esiste già nel mondo

| Domanda | Risposta | Fonte |
|---|---|---|
| Com'è fatto un port | Uno script `.sh` in `ports/` più una cartella; lo script di norma carica `control.txt` di PortMaster, mette `LD_LIBRARY_PATH` su `libs.aarch64`, lancia un binario `.aarch64`; `port.json` dichiara `arch` e, se serve, `min_glibc` | [portmaster.games/packaging](https://portmaster.games/packaging.html), [wiki PortMaster](https://jantrueno.github.io/PortMaster-Wiki/contribute/porting/packaging) |
| Runtime pronti | Godot (FRT, molte versioni), Love2D, Mono, GameMaker, Java, Westonpack (X11/Wayland/OpenGL); sono file `.squashfs` in `PortMaster/libs` | [runtime](https://jantrueno.github.io/PortMaster-Wiki/installation/runtimes), [porting](https://portmaster.games/porting.html), [Westonpack](https://github-wiki-see.page/m/binarycounter/Westonpack/wiki) |
| Giochi HTML5 / NW.js / Electron / RPG Maker MV su queste console | **Non ho trovato nessun precedente** né un runtime Chromium/NW.js/HTML5 per PortMaster. RPG Maker MV su Linux usa NW.js (Chromium), troppo pesante per 1 GB senza desktop | ricerche senza esito; [NW.js e RPG Maker](https://itch.io/blog/484532/how-to-update-nwjs-in-rpg-maker-mv-for-rpg-devs) |
| Base di ArkOS | Ubuntu 19.10, userspace a 64 e 32 bit → GLIBC 2.30. Conferma indiretta: un port fallisce su R36S con «GLIBC_2.33/2.34 not found»; la build per cloni «arkos4clone» distingue i binari «con glibc maggiore di 2.30» | [wiki ArkOS](https://github.com/christianhaitian/arkos/wiki), [thread R36S](https://redlib.ssps.io/r/R36S/comments/1l4o1ji/help_with_net_surf_port/mwandxc/?context=3), [arkos4clone](https://newreleases.io/project/github/lcdyk0517/arkos4clone/release/20260927) |
| La build AeUX | Immagine comunitaria di AeolusUX per K36 e cloni R36S, derivata da un'immagine R36 Max/Pro; l'autore stesso dice che non ha tutte le funzioni di ArkOS; PortMaster vi funziona male («gira solo render96ex»); chiavette Wi-Fi: solo MT7601/MT7601U | [thread di AeolusUX](https://cal1.lr.ggtyler.dev/r/R36S/comments/1hhn15r/arkos_for_k36_and_r36s_clones/m791i8s/?context=3) |
| Node su arm64 | I binari ufficiali chiedono kernel ≥ 4.18 e GLIBC ≥ 2.28 | [BUILDING.md di Node](https://github.com/nodejs/node/blob/v20.x/BUILDING.md); verificato con `readelf` sul binario scaricato |
| Web Audio nativo | `node-web-audio-api` (Rust) ha il binario linux-arm64-gnu; su ALSA avverte di possibili gracchi | [README](https://www.npmjs.com/package/node-web-audio-api) |
| Come EmulationStation lancia i `.sh` | Convenzione di EmulationStation: sistema «ports» con estensione `.sh` e comando `%ROM%` (lo script si esegue direttamente). I permessi su FAT/exFAT non esistono: li decidono le opzioni di montaggio (`umask`/`fmask`) | [RetroPie, sistemi di ES](https://retropie.org.uk/docs/Add-a-New-System-in-EmulationStation), [driver exFAT](https://docs.kernel.org/filesystems/exfat.html) |

**Non trovato con una fonte** (lo dico a memoria, va confermato dal log della console): il file
`es_systems.cfg` di ArkOS elenca `/roms/ports` con estensione `.sh` e lo lancia come utente `ark`;
`/roms` è montata con tutti i file eseguibili; SDL sceglie da sé il driver KMSDRM, senza variabili
d'ambiente. Non so che versione di SDL2 abbia questa build. `portmaster.games` e i repository di
PortMaster non erano raggiungibili da questa sessione: le informazioni vengono dai riassunti di ricerca.

## 2. Cosa ho costruito e verificato qui (x86-64, Node 22.23.4)

`lanciatore/`: uno strato che finge il browser (finestra, documento, immagini, `localStorage` su file,
gamepad «standard», eventi) e carica gli script del gioco nell'ordine dell'HTML in un solo contesto,
con `@napi-rs/canvas` (Skia su CPU) per il disegno e `@kmamal/sdl` (SDL2) per schermo e comandi.

- **Prova automatica** (`node lanciatore/prova.js`): menu → Spazio → hub → ingresso del piano 1 →
  stanza di combattimento, **6 tappe su 6, 0 errori**, sia con `gioco/teatro_marionette.html` (32 script)
  sia con la release a file unico. Fotogrammi salvati e guardati: `prove/01-menu.png`, `02-hub.png`,
  `03-piano1-stanza-iniziale.png`, `04-piano1-stanza-nemici.png`, `05-…-tutto-acceso.png`, `06-…-effetti-spenti.png`.
- **Ciclo in tempo reale** con SDL (driver video «dummy», qui non c'è schermo): finestra 640×480,
  palco 640×360 con 60 px di banda sopra e sotto, log con fotogrammi al secondo.
- **Tre cose trovate e sistemate nello strato, non nel gioco:**
  1. `ctx.filter = 'brightness(0)'` (i burattini chiusi del menu, in ombra) costava **121 ms a fotogramma**:
     ogni riempimento sotto filtro apre uno strato grande come la tela. Ora si dipinge col nero a pari
     trasparenza: **7,3 ms**, stessa immagine. Senza, il menu sulla console andrebbe a 1 fotogramma al secondo.
  2. Emoji e simboli (monete, bombe, chiavi, lucchetti, Ⓐ Ⓑ…): 57 su 97 erano quadratini; coi font Noto
     in coda a ogni `ctx.font` si vedono 97 su 97.
  3. La SDL2 che viaggia col modulo chiede **GLIBC 2.34**: su ArkOS (2.30) non si carica. Il pacchetto
     usa quindi la SDL2 della console; lo script sceglie da sé.

### Tempi misurati (release, 600 fotogrammi per riga, ms per fotogramma)

Il canvas disegna «in differita»: parte del lavoro avviene quando si leggono i pixel. Conta il **totale**.

| Scena | Passo | logica + disegno | resa + copia | **totale** |
|---|---|---|---|---|
| Menu | 30 fps | 3,8 | 3,5 | **7,3** |
| Hub | 30 fps | 0,9 | 1,6 | **2,5** |
| Stanza normale, tutto acceso | 60 fps | 4,0 | 3,3 | **7,3** |
| Stanza normale, effetti spenti | 60 fps | 2,0 | 3,1 | **5,1** |
| Stanza pesante (11-12 nemici, raffiche), tutto acceso | 30 fps | 4,3 | 3,5 | **7,8** |
| Stanza pesante, effetti spenti | 30 fps | 2,4 | 3,4 | **5,8** |

La logica è trascurabile (0,05-0,15 ms a passo): pesa il disegno. «Effetti spenti» = ombre, grana,
vignetta, pubblico. Memoria: **420-500 MB** di RSS (137 MB sono le 23 immagini decodificate, 7 MB le tele,
27 MB l'heap JavaScript). Dati grezzi: `prove/misura.json`.

## 3. Stima per l'R36S (Cortex-A35 a ~1,3-1,5 GHz) — SMENTITA DALLA CONSOLE, vedi §8

Questa macchina: Xeon Emerald Rapids a 2,1 GHz in macchina virtuale; nel test 7-Zip a un filo fa
**3265 MIPS** (misurato qui). Dati pubblici sull'A35: a pari frequenza vale l'80-100 % di un A53
([AnandTech](https://at-web1.www.anandtech.com/show/9769/arm-announces-cortex-a35)); PassMark dà all'RK3326
272 punti a un filo ([cpubenchmark](https://www.cpubenchmark.net/cpu.php?cpu=Rockchip+RK3326)); su Geekbench 5
gli RK3326 fanno 60-70 a un core ([esempio](https://browser.geekbench.com/v5/cpu/5785355)). Per 7-Zip sull'A35
non ho trovato una tabella citabile: a memoria un A53 fa 800-900 MIPS a core, quindi un A35 600-800.

Ne esce un fattore fra **5** (7-Zip) e **12** (Geekbench, che pesa memoria e SIMD), con **8** al centro.
È una forbice larga e resta una stima: un core in-order con poca cache, Skia con NEON al posto di AVX,
il JIT di V8 su arm64 possono spostarla in entrambe le direzioni.

| Scena (30 fps voluti) | ×5 | ×8 | ×12 |
|---|---|---|---|
| Hub | 30 fps | 30 fps | 30 fps |
| Stanza normale, effetti spenti | 30 fps | ~24 fps | ~16 fps |
| Stanza pesante, effetti spenti | 30 fps | ~22 fps | ~14 fps |
| Stanza pesante, tutto acceso | ~26 fps | ~16 fps | ~11 fps |

**Verdetto.** 30 fotogrammi al secondo stabili sono realistici solo nel caso migliore e solo con ombre,
grana, vignetta e pubblico spenti. Lo scenario centrale è 20-25 con gli effetti spenti: giocabile, perché
la logica va a passo fisso e il gioco non rallenta finché si resta sopra i 12 fotogrammi al secondo. Con
tutto acceso no. Memoria: sta in 1 GB ma non «larga» (420-500 MB più sistema ed EmulationStation).

## 4. Cosa NON ho potuto verificare

Tutto ciò che riguarda la console: che Node parta (GLIBC vera), che la SDL2 di sistema sia ≥ 2.26 (il
lanciatore usa `SDL_GetWindowSizeInPixels`) e apra lo schermo, i numeri dei tasti del joypad di questo
clone, i tempi veri, la memoria, il tempo di avvio, il sonoro. Qui non c'è aarch64 né un emulatore. Non ho
provato `skia-canvas` né il Web Audio nativo con un dispositivo audio. Il log del pacchetto è fatto per
rispondere a ognuna di queste domande al primo lancio.

## 5. Il pacchetto (v1; il v2 è al §8)

`./prepara-pacchetto.sh <cartella>` → `ferruccio-r36s.zip` (64 MB; 165 MB estratto, 168 file).
Contiene `Ferruccio.sh` e `ferruccio/` (gioco = release a file unico, node 22.23.4 arm64 da nodejs.org con
controllo SHA256, moduli nativi arm64, font, lanciatore, impostazioni leggere, `ISTRUZIONI.txt`).

- **Autosufficiente**: non legge nessun file di PortMaster. I tasti arrivano dal joystick «grezzo» via SDL,
  con la mappa per posizione in `impostazioni.json` (ordine del joypad RK3326: è un'ipotesi; il log scrive
  il numero di ogni tasto premuto). Uscita: Start+Select, oppure sei tasti insieme per due secondi.
- **Binari controllati** con `file`/`readelf` (tutti aarch64): node GLIBC ≤ 2.28; Skia ≤ 2.17; `sdl.node`
  ≤ 2.17 (GLIBCXX 3.4.26); Web Audio ≤ 2.18. La SDL2 in dotazione (≤ 2.34) è tenuta a parte e usata solo
  dove la GLIBC lo permette. Elenco in `ferruccio/verifica-binari.txt`.
- **Windows e scheda FAT/exFAT**: nessun collegamento simbolico; `Ferruccio.sh` e `lancio.conf` hanno fine
  riga LF (lo script di montaggio lo controlla, lo zip li conserva) e `lancio.conf` regge anche CRLF. I bit
  di esecuzione li dà il montaggio; in più node viene riprovato attraverso `ld-linux`. Lo script è stato
  eseguito qui su una copia: arriva in fondo e scrive il log anche quando node non può partire.
- **Partenza leggera**: 30 fps voluti, ombre/grana/vignetta/pubblico spenti, sonoro spento.

Istruzioni per l'autore, scritte per la sua scheda (`H:\ports\`): `modello-pacchetto/ISTRUZIONI.txt`.

## 6. Alternativa: streaming (Sunshine sul PC, Moonlight sulla console)

Darebbe il gioco pieno (effetti, sonoro, 60 fps) perché disegna il PC. Ma: la console non ha il Wi-Fi,
serve una chiavetta USB (su questa build risultano funzionare solo le MT7601U) e un adattatore OTG;
Moonlight su ArkOS si installa come port di PortMaster, che qui non c'è e va messo a mano senza rete; il PC
deve restare acceso e si gioca solo in casa. Su questa build per cloni non l'ho visto confermato da nessuno.
([guida Moonlight](https://retrogamecorps.com/2021/09/23/guide-moonlight-on-retro-handhelds/),
[esempio su R36S](https://shop.zimaspace.com/blogs/zima-campaign-hub/how-sjsltech-streams-pc-games-to-r36s-with-zimaboard-2),
[chiavette](https://handhelds.wiki/R36S_Compatibility_Lists))

## 7. Raccomandazione

**(a) Provare adesso il pacchetto nativo**, come prova e non come consegna: all'autore costa un quarto
d'ora e i due log dicono la verità su ogni incognita. Poi si decide sui numeri:

- **≥ 20 fps**: si resta su (a). Lavoro successivo, tutto nello strato: mappa dei tasti dal log, sonoro,
  e se serve altri tagli (20 fps voluti, buffer a mezza risoluzione, cercare i disegni più cari con `--profilo`).
- **non parte per la SDL2** o **< 15 fps**: (a) non regge su questa build. Restano (b) con una chiavetta
  MT7601U, oppure fermarsi.
- **(c) Riscrivere il disegno su un altro runtime** (Love2D o SDL2 con la GPU): sono 34.000 righe di
  JavaScript, in gran parte disegno a canvas; stimo due-quattro mesi a tempo pieno. Non lo consiglio:
  ha senso solo se la console diventa un bersaglio vero del gioco.

## 8. Secondo giro: la console vera e il pacchetto v2

### Cosa ha detto la console
L'autore ha copiato il v1 sulla R36S: «si è aperto, a 5 fps secondo me». I log non sono ancora arrivati,
quindi il numero è a occhio e non so in quale scena. Risolte le incognite del §4 su node, SDL2 e schermo.
Il fattore vero rispetto a questo PC è attorno a **×30-40**, non ×8.

**Perché la stima era sbagliata.** Ho ricavato il fattore da prove generiche (7-Zip, PassMark, Geekbench).
Ma il lavoro qui è disegno software: sul PC Skia usa istruzioni vettoriali larghe (AVX2/AVX-512) e cache
grandi; sull'A35 ha NEON, un core che esegue in ordine e una memoria lenta. Il disegno a pixel scala molto
peggio di una prova di compressione. In più a 5 disegni al secondo il gioco andava anche al rallentatore
(fa al massimo 5 passi di logica per fotogramma).

### Cosa ho misurato (sul PC, release, effetti del gioco spenti come sulla console)
Il canvas disegna in differita, quindi cronometrare i metodi inganna: ho misurato **per ablazione** (si salta
un tipo di disegno alla volta e si guarda di quanto scende il fotogramma) e contato i **pixel toccati**.

| Stanza pesante, 640×360 (5,6-6,0 ms) | chiamate | Mpx toccati | ms tolti |
|---|---|---|---|
| `drawImage` da tele (pavimento, strato di luce in «hard-light», sagome) | 121-128 | 0,51-0,52 | 2,1-2,2 |
| `stroke` (fili delle marionette, pioggia, contorni) | 73-75 | 0,84-1,12 (ingombro) | 1,0-1,1 |
| `fill` con sfumatura (ombre a terra, aloni) | 25 | 0,01 | ~1,0 |
| `fillRect` a tinta unita | 40 | 0,07 | 0,8 |
| `fill` a tinta unita | 46 | 0,01 | 0,65 |
| testo | 16 | — | 0,65 |
| `fillRect` con sfumatura (il velo della notte: una sfumatura radiale su tutto il palco) | 5 | 0,15 | 0,34 |
| niente disegno: logica, JavaScript, lettura dei pixel | | | 1,9-2,3 restano |

In una stanza si toccano **1,5 milioni di pixel a fotogramma** su 230.000 di schermo: sei-sette passate.
La logica non pesa (0,1 ms a passo). Due cose che credevo e che le misure hanno smentito: disegnare da una
tela **non** costa più che da un'immagine, e abbassare la qualità del filtro sugli sprite li **rallenta**
(a qualità alta Skia usa le copie ridotte, che sono già l'idea delle «immagini pre-ridotte»).
Dati: `prove/v2/ablazione.json`, `prove/v2/livelli.json`.

### Cosa c'è nel v2 (tutto nello strato, `gioco/teatro/` intatto)
1. **Risoluzione interna** (`scala`): il gioco ha già una scala del buffer separata dalla logica; si
   sostituisce `adattaRisoluzione` (che non scendeva sotto 1) e il gioco disegna a 480×270 o 320×180; lo
   ingrandisce SDL. Riduce in proporzione ogni disegno, la lettura dei pixel e la copia a schermo.
2. **Tagli di scena** con gli interruttori che il gioco ha già (`RIBALTA_B2.attivi`: luci, riflessi,
   particelle, crollo, scenografia) più velo, atmosfera e fili (funzioni di solo disegno sostituite).
3. **Ritmo fisso** a 20 disegni al secondo senza accumulo di ritardo, e **recupero della logica senza
   disegno**: se un fotogramma dura più di 80 ms la logica si rimette in pari; la velocità di gioco resta
   al 100 % anche a 6 disegni al secondo (provato sul PC con una zavorra di 150 ms: 6,3 fps, 100 %).
4. **`measureText` con memoria** (il gioco rimisura le stesse scritte a ogni fotogramma).
5. **Console alla massima potenza**: lo script porta su «performance» i regolatori di CPU, memoria (dmc) e
   GPU con `sudo`, se il sistema lo permette, e li rimette a posto all'uscita. Non so se su questa build
   riesce: il log lo dice. Se la console girava a frequenza bassa, da solo può valere molto.
6. **Log**: CPU, regolatore e frequenza, memoria libera, se la resa SDL è accelerata; ogni 5 secondi
   fotogrammi al secondo, velocità di gioco, ms di logica / disegno / resa dei pixel / schermo, scena.
7. **`FerruccioMisura.sh`**: il gioco si gioca da solo (menu, piazza, stanza, stanza piena) ai tre livelli e
   scrive in `misura.log` i tempi veri della console, più l'ablazione per tipo di disegno. Sul PC dura 7 s;
   sulla console qualche minuto.

### I tre livelli (PC, ms a fotogramma · Mpx toccati · disegni)

| Scena | bello 640×360 | medio 480×270 | veloce 320×180 |
|---|---|---|---|
| Menu | 6,3 · 0,95 · 443 | 5,1 · 0,53 · 443 | 4,5 · 0,24 · 443 |
| Hub | 2,4 · 0,54 · 168 | 1,7 · 0,30 · 168 | 1,4 · 0,13 · 168 |
| Stanza normale | 5,5 · 1,03 · 303 | 2,3 · 0,33 · 152 | 1,8 · 0,11 · 145 |
| Stanza pesante | 6,4 · 1,54 · 437 | 2,7 · 0,54 · 191 | 2,4 · 0,21 · 182 |

- **bello** = il v1. **medio**: senza luci della ribalta, riflessi e velo; le scritte si leggono, immagine
  un po' morbida (`prove/v2/livello-*-medio.png`). **veloce**: anche senza pioggia, schegge e crollo; le
  scritte piccole **non si leggono** (`prove/v2/livello-*-veloce.png`).
- Si parte da **medio**: è il più veloce che resta leggibile.
- Sul PC nelle stanze il medio costa il 42 % del bello e tocca un terzo dei pixel. Il menu invece cala poco
  (443 disegni, 109 scritte: lì pesa la CPU, non i pixel): **sulla console il menu resterà lento**.

### Quanto mi aspetto sulla console
Ho un solo dato vero (5 al secondo, a occhio) e non so quanto del tempo siano pixel e quanto siano
JavaScript e preparazione dei disegni. Nei due casi estremi:

| Se il tempo sulla console è… | medio | veloce |
|---|---|---|
| soprattutto pixel (70 %) | 11-14 fps | 17-20 fps |
| soprattutto JavaScript e preparazione (70 %) | 9-10 fps | 11-12 fps |

A parte, non contato sopra: i regolatori su «performance», se erano bassi. **Non posso promettere 15-20 al
livello leggibile.** Se la misura dirà che domina il JavaScript, il tetto di questo strato è vicino.

### Cosa non ho fatto, e cosa farei coi numeri della console
- **Memoria delle scritte e delle sfumature** (disegnarle una volta e riusarle): al livello medio valgono
  insieme circa il 25 % del fotogramma sul PC. Sono delicate (allineamenti, trasparenze): le farei solo se
  `misura.log` conferma che pesano.
- **Menu**: è quasi fermo, si potrebbe ridisegnare solo quando cambia. Non fatto.
- Scena a bassa risoluzione con scritte a risoluzione piena: richiede due tele e cambia l'ordine dei
  disegni; al momento non c'è.
- Non verificato sulla console: tutto il v2.

### Il pacchetto v2
`ferruccio-r36s-v2.zip` (64 MB): `Ferruccio.sh`, `FerruccioMisura.sh`, `ferruccio/`. Stessi binari del v1,
stessi controlli. Istruzioni brevi in `modello-pacchetto/ISTRUZIONI.txt`: cancellare la vecchia cartella,
copiare la nuova, giocare, lanciare la misura, mandare i file di `dati/`; i tre livelli e le voci di
`impostazioni.json` sono spiegati lì.

### Raccomandazione aggiornata
Far provare il v2 e soprattutto **far lanciare `FerruccioMisura`**: con `misura.log` il terzo giro è mirato.
Se al livello medio la console resta sotto i 10, questo approccio (canvas software su A35) non arriva a un
gioco fluido senza perdere le scritte, e le strade sono due: accettare 10-12 al secondo a velocità giusta,
oppure la riscrittura del disegno sulla GPU (§7c), che resta il lavoro di mesi già detto.
