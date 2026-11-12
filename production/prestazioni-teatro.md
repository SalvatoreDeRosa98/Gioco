# Prestazioni del Teatro: profilo e correzioni (e4, skill perf-profile)

Data: 2026-11-12. Strumento: `tools/profilo-teatro.js`, dati grezzi in `production/polish/profilo-teatro-2026-11-12.json`.
Va letto con queste avvertenze:

- **Un telefono vero non c'era.** «Telefono» qui vuol dire Chromium senza finestra, CPU rallentata 4× o 6× via CDP,
  finestra 416×657 o 657×416 a densità 3, tocco attivo (buffer interno 1280×720, tetto di c2). Il disegno della tela
  in Chromium senza finestra passa dal **software** (Skia sulla CPU). Su un telefono vero buona parte del disegno va
  alla GPU: i valori assoluti qui sono **pessimisti**, servono i rapporti.
- La macchina era carica (più squadre in parallelo), quindi ogni numero è la mediana di 3 ripetizioni da 20 fotogrammi
  ed è affidabile più o meno al **±30%**. Il costo di uno strato sotto 1–2 ms non si distingue dal rumore (per questo
  alcuni valori sono negativi).
- «Disegno» comprende `iniziaFrame` + `disegnaFrame` + `t4Gancio` e la rasterizzazione forzata a fine fotogramma
  (`getImageData` di 1 pixel, dato che il gioco gira servito in http). «Logica» è un `passoLogico`.

## Bilanci (budget)

`project.yaml` non ha la sezione `performance`: **nessun bilancio è stato fissato** e quindi nessuno è stato
«rispettato». Bilancio che propongo (lo decide il direttore tecnico, non io):

| Metrica | Proposta | Misurato oggi | Stato |
|---|---|---|---|
| Fotogramma su PC (60 Hz) | 16,6 ms | 3–18 ms in gioco, 27 ms nel menu | da decidere: nel bilancio tranne il menu |
| Fotogramma sul telefono | 33 ms (30 fps fermi; 60 dove si può) | 13–83 ms a CPU ×4 (simulata) | NON VALUTATO su un telefono vero |
| Passo logico | 2 ms su PC, 4 ms sul telefono | 0,05–0,1 ms su PC, 0,2–1,4 ms a CPU ×4/×6 | ampiamente dentro |
| Memoria delle tele fuori schermo | 40 MB | ~28 MB vivi (vedi sotto) | dentro |
| Release | — | 5,55 MB (3,25 MB compressa) | nessun bilancio |

## Scena × strato (dopo le correzioni)

Costo del disegno in ms per fotogramma; strato = disegno con tutto acceso − disegno con quello strato spento.

**Telefono verticale, CPU ×4** (vert4)

| Scena | Logica | Disegno (p95) | ombre | grana | vignetta | pubblico | lampi |
|---|---|---|---|---|---|---|---|
| Hub | 0,23 | 13,4 (21) | 0,7 | 0,8 | 0,2 | 1,1 | ~0 |
| Stanza, 6 nemici + 40 colpi | 0,54 | 53,6 (68) | 5,5 | ~0 | 5,2 | 7,4 | 6,9 |
| Idem, nemici colpiti | 0,63 | 54,6 (69) | 6,8 | 3,1 | ~0 | 4,7 | 0,6 |
| Boss piano 1 (Re Gatto) | 0,39 | 42,4 (64) | 4,0 | 0,7 | ~0 | 2,8 | ~0 |
| Donna Luciana | 0,51 | 83,2 (106) | 5,2 | 3,6 | 10,5 | 7,8 | ~0 |
| Buca dell'Orchestra | 0,34 | 42,0 (54) | rumore | rumore | rumore | rumore | rumore |
| Cambio di scena a metà | 0,43 | 49,4 (64) | 2,8 | ~0 | 0,2 | 3,5 | 2,1 |
| Grande Burattinaio | 0,43 | 17,7 (22) | ~0 | 2,9 | 1,4 | ~0 | 3,3 |
| Menu di selezione | 0,20 | 128,8 (154) | ~0 | 11,9 | 24,5 | 0,9 | 4,6 |
| Registro di Scena | 0,19 | 46,7 (63) | 1,0 | 5,5 | 0,6 | ~0 | ~0 |

**PC, CPU ×1**: hub 3,4 · stanza 12,3 · colpiti 12,6 · boss 1 8,6 · Luciana 17,6 · Buca 11,0 · cambio 10,9 ·
Burattinaio 3,6 · menu 26,9 · Registro 9,8 ms. Gli strati valgono 0,5–2,6 ms ciascuno.

**Telefono orizzontale, CPU ×6** (solo totale): hub 20,9 · stanza 89,5 · boss 1 69,4 · Luciana 148,8 · Buca 58,2 ·
cambio 68,4 · Burattinaio 26,0 · menu 160,2 · Registro 71,9 ms. Passo logico sempre ≤ 1,4 ms (p95 ≤ 5,3).

## I 10 costi maggiori (telefono verticale ×4, prima delle correzioni dove indicato)

1. **Menu di selezione, sagome bloccate con `ctx.filter = 'brightness(0)'`** (a6-progressione.js): 1604 ms → **corretto**.
2. **Contorno di Donna Luciana, 4 `drop-shadow` per fotogramma** (d7-rifiniture.js): 712 ms → **corretto**.
3. Registro di Scena: le comparse non ancora viste sono disegnate con `brightness(0)` (d3-registro-scena.js
   `figuraComparsaD3` / `figuraPrimoAttoreD3` / trionfi): 38 ms di tempo proprio dentro `disegnaNemicoPittorico`. Resta.
4. Menu, ciò che resta: 129 ms (grana 12, vignetta 25, il resto sono i burattini pittorici ridisegnati a ogni
   fotogramma, `disegnaFerruccioPittorico` 3 ms di JS + rasterizzazione). Resta.
5. Disegno di base della stanza (`disegnaStanzaPixelArt`, 60-resa.js): 4–7 ms di JS proprio per fotogramma.
6. Pubblico (b1): 3–8 ms in combattimento (`disegnaTeatroB1` 2,1 ms di JS + composizione delle zone).
7. Ombre lunghe (b2): 3–7 ms in combattimento (sul telefono parte già spenta, c2).
8. Vignetta: fino a 10 ms nell'arena di Luciana, 5 ms in stanza (gradiente a tutta tela).
9. Lampi: fino a 7 ms in stanza piena di colpi.
10. Memoria allocata: 45–100 KB per fotogramma in combattimento (stringhe di colore, array temporanei, gradienti
    creati a ogni disegno: 60-resa.js ha 11 `create*Gradient`, 10-sprite.js 38). Nessuna tela creata per fotogramma.

## Corretto (un commit ciascuno, aspetto controllato su foto prima/dopo)

| Correzione | Scena | Prima → dopo, PC | Prima → dopo, telefono ×4 |
|---|---|---|---|
| Ritaglio stretto attorno a Donna Luciana prima del filtro del contorno (`LUCIANA_D7.contorno.ritaglio`) | Luciana | 241 → 43 ms (poi 17,6 nella tabella completa) | 712 → 131 ms (83 nella tabella completa) |
| Ritaglio sulla parte alta della scheda prima di `brightness(0)` | Menu | 685 → 83 ms (27 nella tabella completa) | 1604 → 124 ms (129) |

Perché: in Chrome `ctx.filter` lavora **su tutta la tela per ogni singola operazione** di disegno fatta mentre è
attivo. Prova a parte: 20 cerchi con 4 drop-shadow su tela 1280×720 = 2630 ms; con un ritaglio 200×200 = 62 ms; su
una tela piccola = 3,7 ms. Un ritaglio che contiene tutta la figura non cambia un pixel.
Foto: `production/qa/evidence/teatro-prestazioni-luciana-prima-dopo.png`, `…-menu-prima-dopo.png`.

**Qualità automatica** (`gioco/teatro/e4-prestazioni.js`): col tocco, se la media mobile supera 22 ms per 3 s spegne
per la sessione grana → ombre lunghe → pubblico → vignetta; sotto 17,5 ms per 8 s li riaccende (attesa doppia a ogni
ricaduta). Non salva, non tocca ciò che il giocatore ha cambiato a mano. Riga «Qualità automatica» nelle Opzioni.
QA: `tools/qa-teatro-prestazioni.js` (19/19).

## Cosa resta (non toccato: dubbi o rischio di cambiare l'aspetto)

- **Lampo dei nemici colpiti** (10-sprite.js `disegnaMobSprite`/`disegnaGattoSprite`, `brightness(3) contrast(1.5)`
  su tutta la tela): da solo costa ~18 ms per immagine filtrata (prova a parte), ma nella scena «colpiti» la differenza
  non è emersa sopra il rumore (i nemici di quella stanza forse non passano da lì). Correzione pronta e sicura (ritaglio
  sul rettangolo dell'immagine: il filtro è punto per punto), da confermare con una scena di soli nemici a immagine.
- **Registro di Scena** (d3): stessa causa dei punti 1–2; ritaglio attorno a ogni figura o sagome nere pre-disegnate
  una volta su una tela. Da fare con chi ha scritto d3 (servono le misure delle figure).
- **Platea di b9** (`drop-shadow` sulle teste): già dentro un `clip` della sua zona e composta nella tela della zona
  di b1, non per fotogramma su tutta la tela: costo non isolato.
- **Menu**: i burattini delle schede si potrebbero disegnare una volta su tele (cambiano solo con la selezione).
- **Gradienti e colori creati a ogni fotogramma** in 60-resa.js / 10-sprite.js / b1 / b8: allocazioni modeste
  (≤ 100 KB per fotogramma) ma continue; metterli in cache per scala.
- **Tele fuori schermo**: ~28 MB vivi alla fine del giro (60-resa 10,5 MB in 3 tele; b1 7,4 MB in 29; d4 3,5 MB in 1;
  b2 3,4 MB; d1 1,8 MB). `telaD4` tiene al massimo 7 tele grandi quanto il palco (fino a ~25 MB a scala 2): proporrei
  di liberarle quando si lascia il piano. Nessuna tela viene creata per fotogramma (0 in tutte le scene, 0,05/f una volta).
- **Non misurati**: d6-acquedotto e e6-assistenza (arrivati dopo, non sono in questo branch); la GPU di un telefono vero;
  il tempo di caricamento della pagina e delle immagini; l'audio.

## Come rifarlo

```
node tools/profilo-teatro.js gioco/teatro_marionette.html production/polish/profilo-<data>.json
PROFILO_VISTE=vert4 PROFILO_SCENE=luciana,menu PROFILO_STRATI=none node tools/profilo-teatro.js   # giro veloce
```
