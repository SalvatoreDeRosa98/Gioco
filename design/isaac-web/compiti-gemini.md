# Compiti per Gemini — "Una Notte a Caserta" (roguelike)

Data: 5 novembre 2026. Riferimento: `concept.md` §4.4-4.5 (pipeline arte) e `oggetti.md` §3 (catalogo).

Strumento unico: Gemini (immagini con Nano Banana / Imagen, video con Veo, testo lungo). Un compito per chat, sempre con il model sheet allegato.

Regole valide per tutti i compiti:
- **Vista**: tre quarti dall'alto, camera inclinata ~60°, come The Binding of Isaac. Mai vista zenitale, mai vista laterale da platform.
- **Stile**: quello del model sheet `assets/art-source/personaggi/ferruccio-model-sheet-02.jpg`. Allegarlo SEMPRE come immagine 1. Pennellata pittorica, contorni a inchiostro morbidi, palette smorzata, luce calda / ombra fredda, fondo grigio medio piatto.
- **Formato di consegna**: PNG o JPG alla risoluzione massima, nessun testo, nessuna etichetta, margine largo. Salvare in `assets/art-source/<cartella>/` con il nome indicato.
- **Video**: solo per i cicli che la molla del rig non copre. Sfondo nero uniforme, camera fissa, personaggio solo, 3-4 secondi, loop. Si estraggono con `tools/art/video_cycle.py`.

Ordine di priorità: **G1 → G2 → G3 → G4 → G5 → G6 → G7 → G8 → G9 → G10**. G1 e G2 sbloccano il prototipo delle settimane 1-2; G8-G9 (revisione e testi) si possono fare in parallelo in una chat di solo testo.

---

## Immagini (Nano Banana / Imagen)

### G1 — Ferruccio dall'alto, 4 viste (PRIORITÀ 1)
Allegare: immagine 1 `ferruccio-model-sheet-02.jpg`; immagine 2 uno screenshot di Ferruccio in gioco (`E:/gioco/Test-Ferruccio/Ferruccio-Ripartenza.exe`, pausa, ritaglio del personaggio).
Salvare come `assets/art-source/personaggi/ferruccio-topdown-sheet.jpg`.

```text
Image 1 is the model sheet of Ferruccio, the hero of my game; image 2 is how he looks in the game. Make a new model sheet of the SAME character in EXACTLY the same style (same painterly brushwork, soft ink outlines, muted palette, warm-light/cool-shadow lighting, flat medium grey background), but seen from a video-game top-down three-quarter camera tilted about 60 degrees, like the camera of The Binding of Isaac: we see the top of the hat and shoulders more than in a side view, the feet are close together under the body. Four views side by side, same scale, feet on the same ground line: facing the camera, facing right (left profile), facing away from the camera, and three-quarter facing down-right. Neutral standing pose, arms slightly away from the body, the rapier held low along the right leg, so that head, torso, each arm, each leg and the rapier can be cut out separately. Keep the black mask with one glowing eye, the white smock, the red scarf, the tall cone hat. No text, no labels, no extra figures, no props on the ground, wide margin around the figures.
```

Controllo di qualità prima di salvare: le 4 figure alla stessa altezza; piedi vicini sotto il corpo; braccia staccate dal busto; stocco visibile e separabile; nessuna ombra dipinta a terra.

### G2 — Gatto nero dall'alto, 5 pose (PRIORITÀ 2)
Allegare immagine 1 model sheet Ferruccio, immagine 2 `assets/art-source/nemici/gatto/walk.jpg`.
Salvare `assets/art-source/nemici/gatto/gatto_topdown_sheet.jpg`.

```text
Image 1 is the model sheet of Ferruccio, the hero of my game, and sets the style; image 2 is the black cat enemy already approved. Keep the design of image 2 (young black cat, amber glowing eyes, slightly ragged fur) and repaint it in the style of image 1, seen from a video-game top-down three-quarter camera tilted about 60 degrees, like The Binding of Isaac. Five poses side by side on one flat medium grey background, same scale, about one third of Ferruccio's height: (1) standing facing right, (2) standing facing the camera, (3) standing facing away, (4) crouched low facing right, ready to pounce, ears back, (5) mid-leap facing right, body stretched, all four legs off the ground. Legs clearly separated from the body, tail away from the body in every pose, so that head, body, each leg and tail can be cut out separately. Strong readable silhouette, the eyes are the only bright detail. No text, no labels, no shadows painted on the ground.
```

### G3 — Pavimenti dei 3 piani (PRIORITÀ 3)
Tre immagini 1600×960, una per tema. Allegare immagine 1 `assets/art-source/riferimenti/stile_piazza.jpg` e immagine 2 il fondale del tema (`assets/art-source/aree/`, rispettivamente piazza, giardino, oro).
Salvare come `assets/art-source/aree/pavimento_piazza.jpg`, `pavimento_villa.jpg`, `pavimento_cortile.jpg`.

Prompt base (Piazza Dante):
```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood. World: a dreamlike alternate Caserta, 1845, Bourbon neoclassical architecture. Image 1 sets the palette and brushwork; image 2 is the facade of Piazza Dante at night in my game. Paint the FLOOR of an empty rectangular game room seen from a top-down three-quarter camera tilted about 60 degrees, like The Binding of Isaac, aspect ratio 5:3 (1600x960): grey basalt cobblestones of the square, slightly uneven, worn, with a faint hand-drawn irregularity (never a perfect grid), darker and cooler towards the bottom corners, two warm pools of gas-lamp light near the top-left and top-right. Along the top edge only, a low strip (about one sixth of the height) of the neoclassical facade from image 2 with two lit gas lamps and dark windows, seen from the same high camera. The other three edges end with a low dark stone kerb. No characters, no objects on the floor, no doors, no text, no watermark. Overall darker than a white character standing on it.
```
Varianti: sostituire la parte centrale con
- **Villa Comunale**: `gravel garden paths and dark grass of a moonlit public garden, cool green moonlight (#d8f2a0), a few fireflies as tiny warm dots, low box hedges only along the edges; the top strip is a balustrade with two white marble statues`.
- **Cortile d'Onore**: `large pale limestone slabs of a royal palace courtyard, polished, warm torchlight (#ffac4a) from the top corners, faint diagonal light rays from above, scattered embers; the top strip is the arcade of the Reggia di Caserta with two lit torches`.

### G4 — Ostacoli e porte per tema (dopo G3)
Per ogni tema 5 PNG con alfa, silhouette scura con un solo bordo di luce (art bible §1), stessa camera. Salvare in `assets/art-source/aree/ostacoli_<tema>/`.
- Piazza: panchina di ghisa, carretto coperto, fontanella, pila di casse, lampione spento.
- Villa: statua su piedistallo, siepe tonda, panchina di marmo, vaso di terracotta grande, fontana piccola.
- Cortile: cannone di parata, braciere acceso, colonna spezzata, cassapanca, armatura su piedistallo.
Più 2 porte laterali (sinistra/destra) per tema, chiuse e aperte, derivate dai cancelli esistenti.

```text
Image 1 sets the style. Paint ONE prop for a top-down three-quarter video game room (camera tilted about 60 degrees like The Binding of Isaac): [OGGETTO]. Dark silhouette, a single thin rim of warm light on the top-left edge, slight painterly texture, no cast shadow on the ground, isolated on a flat pure green background (#00ff00) for cutting out. Centered, wide margin, no text.
```

### G5 — I 5 nemici nuovi del piano 1-2
Una immagine ciascuno, vista tre quarti verso destra, grigio medio, stessa scala del gatto (indicare "about half of Ferruccio's height" tranne topaia e mascherone che sono statici e larghi). Salvare in `assets/art-source/nemici/<nome>/base.jpg`.
- **Sonnambulo**: cittadino casertano del 1845 in camicia da notte e berretto, occhi chiusi, braccia tese in avanti, candela spenta in mano. Rif. `assets/art-source/personaggi/cittadini.jpg`.
- **Pipistrello**: pipistrello piccolo, ali aperte, occhi ambra come il gatto. Tre esemplari in volo nella stessa immagine.
- **Topaia**: cumulo di stracci e paglia con un buco nero, due occhi rossi dentro, una coda che spunta. Statico, largo quanto Ferruccio.
- **Mascherone**: faccia di pietra di fontana barocca, bocca aperta che sputa acqua, muschio. Statico, visto quasi di fronte.
- **Lanterna vagante**: lanterna a gas senza padrone che fluttua, fiamma viola, una catena spezzata.

Prompt modello:
```text
Image 1 sets the style (painterly brushwork, soft ink outlines, muted palette, warm light / cool shadow). Paint ONE enemy for a top-down three-quarter video game (camera tilted about 60 degrees like The Binding of Isaac): [DESCRIZIONE]. Facing right, neutral idle pose, isolated on a flat medium grey background, strong readable silhouette, limbs separated from the body so they can be cut out, no shadow on the ground, no text, wide margin.
```

### G6 — Boss: Gatto dei Quattro Canti e Madre di Marmo
Un foglio per boss: 3 pose (fermo, attacco telegrafato, attacco), stessa scala, grigio medio. Il Gatto è il gatto nero ingrandito ×3 con quattro code di fumo; la Madre è una statua di marmo di madre col bambino che si anima, crepe dorate. Allegare immagine 1 model sheet, immagine 2 `assets/art-source/nemici/gatto/walk.jpg` (per il Gatto) o `assets/art-source/boss/` (riferimenti statue).
Salvare `assets/art-source/boss/gatto_quattro_canti_topdown.jpg`, `madre_marmo_topdown.jpg`.

### G7 — Pickup a terra (6 immagini piccole)
Maschera (cuore), mezza maschera, brace (moneta di carbone che brilla), centesimo borbonico, sigillo di ceralacca (chiave), favilla. Ognuno isolato, grigio medio, visto dall'alto a 60°, leggibile a 24 px: forme semplici, un solo punto di luce. Salvare `assets/art-source/oggetti/pickup_<nome>.jpg`.

### Rifare una sola vista
Se una vista di G1 o G2 è bocciata, non rigenerare il foglio: nuova chat, allegare il foglio approvato come immagine 1 e chiedere `same character and style as image 1, paint only the [back] view, same scale, flat medium grey background`.

## Video (Veo)

### G10 — Video Veo (solo dopo G1 e G2 approvati)
Allegare il foglio G1. Due video separati, sfondo nero, camera fissa dall'alto a 60°:
- Ferruccio cammina **verso la camera** sul posto, 4 passi, loop.
- Ferruccio cammina **di spalle**, 4 passi, loop.
Salvare in `assets/art-source/video/ferruccio_topdown_fronte.mp4` e `_retro.mp4`.
- Gatto (allegare il foglio G2), 3 s: si accuccia, balza verso destra, atterra. Un balzo solo. Salvare `assets/art-source/video/gatto_topdown_balzo.mp4`.

## Testo (chat separata, caricare i due .md)

### G8 — Revisione critica dei documenti (testo, niente immagini)
Caricare `design/isaac-web/concept.md` e `design/isaac-web/oggetti.md`. Chiedere:
```text
Sei un designer senior di roguelike (Isaac, Gungeon, Hades). Leggi i due documenti. Rispondi in italiano, in tabella, con riferimenti alle sezioni:
1) Le 10 build degeneri o oggetti rotti che il documento non vede (con i conti usando le formule di oggetti.md §2).
2) Le 10 cose che un giocatore di Isaac troverà noiose o troppo uguali a Isaac.
3) Le 5 regole della pool (§5) che produrranno run senza senso (es. piani senza danno).
4) Che cosa manca per i primi 10 minuti di gioco (onboarding) rispetto a Isaac e PokeIsaac.
Non riscrivere i documenti, non proporre sistemi nuovi: solo problemi e la correzione minima per ciascuno.
```
Salvare la risposta in `design/isaac-web/revisione-gemini.md`.

### G9 — Testi in gioco per i 154 oggetti
Caricare `oggetti.md`. Chiedere un JSON `{id: {nome, riga_pickup, descrizione_pannello}}` con: `riga_pickup` ≤ 28 caratteri (come "Danno su" di Isaac, in italiano, tono della bibbia), `descrizione_pannello` ≤ 110 caratteri che spiega l'effetto in parole da giocatore. Salvare `design/isaac-web/testi-oggetti.json`. Lo userò per `items.json`.

---

## Che cosa NON chiedere ai generatori
- Icone degli oggetti: le fa `tools/art/gen_icons.py` in stile medaglione (63 nuove, 11 fogli). Niente icone da Gemini.
- Fogli di pose per l'animazione: i cicli vengono dai video (regola del 15 ottobre).
- Vista zenitale o vista laterale: inutilizzabili.
- Sprite già "in gioco" con HUD, effetti, scritte.

## Quando consegni
Mettere i file nelle cartelle indicate e dirmi quali compiti sono fatti. Io taglio, monto il rig (`tools/art/sheet_puppet.py` e `cutout_v2.py`) e li porto nel prototipo.
