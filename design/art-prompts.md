# Prompt d'arte — Ferruccio

I prompt usati per generare l'arte del gioco con **Grok Imagine** (69 richieste in 11 fasi), scritti a partire dalla bibbia narrativa (`design/narrative/ferruccio-bibbia.md`). Ogni prompt completo comincia con il blocco di stile comune, già incluso qui sotto.

## Come si usano

1. Allega le immagini indicate in **Allega**, nell'ordine scritto: la 1 è quasi sempre `stile.png`.
2. Incolla il prompt e scegli la variante migliore tra quelle proposte.
3. Salva l'immagine in `assets/art-source/` con il nome indicato in **Salva come** (stessa sottocartella degli altri file del suo tipo).
4. Aggiungi la voce in `tools/art/manifest.json` e lancia `python3 tools/art/import_art.py`: scontorna il verde e scrive il PNG pronto in `src/assets/art/`.
5. Se la nuova immagine sostituisce Ferruccio, il gatto o la vespa, rilancia anche `tools/art/rig_ferruccio.py` o `tools/art/rig_nemici.py` e ricontrolla i punti di taglio.

## Stato al 2026-10-08

| Fase | Stato |
|---|---|
| 0 · Stile | Fatta: `assets/art-source/riferimenti/stile_piazza.jpg` |
| 1 · Ferruccio | Fatto il personaggio pulito (volto nero, occhi luminosi). Le varianti di colore della sciarpa **non servono**: il motore ricolora la sciarpa con il colore di ogni giocatore. Il foglio dei pezzi (1.4) è stato scartato perché Grok ha disegnato uno scheletro: il motore taglia i pezzi dall'immagine intera. **Da rifare:** le pose chiave (1.5) con il nuovo Ferruccio come riferimento, perché il foglio attuale ha il viso a teschio. |
| 2 · Personaggi | Fatti tutti (guardie rifatte a figura intera). Non ancora usati in gioco: servono ai dialoghi della storia. |
| 3 · Nemici | Fatti gatto, vespa (rifatta su verde) e statua. In gioco. |
| 4 · Boss | Fatti tutti e cinque. In gioco solo il Custode; gli altri quattro aspettano i capitoli della storia. |
| 5 · Ambienti | Fatti lontano e medio delle cinque aree, primo piano di Corso, Villa e Belvedere. **Da rifare:** primo piano di Piazza Dante (5.3) e della Reggia (5.15), che erano senza verde; per ora usano il primo piano di foglie comune. |
| 6 · Oggetti | Fatti la statua del cavaliere, il terreno, la grata e i tre fogli di oggetti (18 icone). In gioco: moneta di luce, mozzarella e maschera. |
| 7–10 | Scene, finali, copertina, espansioni: da fare. |

## Blocco di stile comune

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.
```

## Fase 0 — Lo stile

Tre tavole d'atmosfera per decidere l'aspetto del gioco. Grok dà più varianti a ogni richiesta: scegli la migliore e salvala come stile.png.

### 0.1 · Tavola di stile · Piazza Dante

La scena d'apertura: piazza deserta, sorrisi dietro le finestre, i fili d'oro del Velo appena visibili.

- **Allega:** Niente
- **Salva come:** `stile_piazza.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Format: 16:9 wide painting, a style frame for the game.

Scene: Piazza Dante in Caserta at night under a perfectly still full moon. Three-storey neoclassical palazzi with arcades, cast-iron gas lamps, a pale stone statue on a tall pedestal at the center. The streets are empty, but behind every lit window the silhouettes of the inhabitants are smiling. Fine golden threads, almost invisible, stretch from the windows across the sky toward the distant Royal Palace. Small in the lower left, Ferruccio, a young blacksmith whose consciousness is trapped in a Pulcinella costume: a small, slender knight with slightly childlike proportions (large head, small body). Loose white Pulcinella smock reaching the knees, gathered by a thin black belt, white trousers, small black shoes. A black half-mask over the upper face with a long hooked nose; two softly glowing white eyes behind the mask. A tall white conical hat (coppolone), slightly bent backwards. A long red wool scarf knotted at the neck, its tail flowing behind him. A thin, simple sword hand-forged from blacksmith's tools: dark hammered iron, a plain crossguard, a leather-wrapped grip. He is mute; his emotion shows only through posture.
```

### 0.2 · Tavola di stile · Cortile d'Onore

L'atmosfera dello scontro finale: torce, gigli borbonici e il Custode in silhouette.

- **Allega:** Niente
- **Salva come:** `stile_reggia.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Format: 16:9 wide painting, a style frame for the game.

Scene: the Cortile d'Onore of the Royal Palace of Caserta at night. A monumental colonnade with fluted columns, deep red banners with golden lilies, burning torches, embers floating in warm light shafts. In the middle stands the towering silhouette of an armored guardian in ornate golden Bourbon armor with a red cape, a plumed helmet and a halberd, a golden lily glowing on his chest. On a balcony high above, a woman in a dark gown is lit by a single candle. Small in the foreground, seen from behind, Ferruccio, a young blacksmith whose consciousness is trapped in a Pulcinella costume: a small, slender knight with slightly childlike proportions (large head, small body). Loose white Pulcinella smock reaching the knees, gathered by a thin black belt, white trousers, small black shoes. A black half-mask over the upper face with a long hooked nose; two softly glowing white eyes behind the mask. A tall white conical hat (coppolone), slightly bent backwards. A long red wool scarf knotted at the neck, its tail flowing behind him. A thin, simple sword hand-forged from blacksmith's tools: dark hammered iron, a plain crossguard, a leather-wrapped grip. He is mute; his emotion shows only through posture.
```

### 0.3 · Tavola di stile · Villa Comunale

Il giardino al chiaro di luna, con le statue che piangono luce azzurra.

- **Allega:** Niente
- **Salva come:** `stile_villa.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Format: 16:9 wide painting, a style frame for the game.

Scene: the public garden of Caserta at night under pale green-tinted moonlight. Tall holm oaks and palms, low clipped hedges, a round stone fountain, classical marble statues on pedestals; some statues weep thin streams of glowing azure light from their eyes. Fireflies drift between the trees. Ferruccio, a young blacksmith whose consciousness is trapped in a Pulcinella costume: a small, slender knight with slightly childlike proportions (large head, small body). Loose white Pulcinella smock reaching the knees, gathered by a thin black belt, white trousers, small black shoes. A black half-mask over the upper face with a long hooked nose; two softly glowing white eyes behind the mask. A tall white conical hat (coppolone), slightly bent backwards. A long red wool scarf knotted at the neck, its tail flowing behind him. A thin, simple sword hand-forged from blacksmith's tools: dark hammered iron, a plain crossguard, a leather-wrapped grip. He is mute; his emotion shows only through posture. He stands on the edge of the fountain, looking up at a weeping statue.
```

## Fase 1 — Ferruccio

Il protagonista va approvato prima di tutto il resto: le scene e le varianti useranno la sua immagine come riferimento.

### 1.1 · Foglio di concept

Sei varianti affiancate dello stesso personaggio, per scegliere proporzioni e dettagli.

- **Allega:** Niente
- **Salva come:** `ferruccio_concept.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Format: 16:9 character concept sheet on a plain dark parchment background.

Six variations of the same character standing side by side, all in strict side view facing right, same pose, varying only: the height and bend of the hat, the shape of the mask's nose, the length of the smock, and the length of the scarf.

Character: Ferruccio, a young blacksmith whose consciousness is trapped in a Pulcinella costume: a small, slender knight with slightly childlike proportions (large head, small body). Loose white Pulcinella smock reaching the knees, gathered by a thin black belt, white trousers, small black shoes. A black half-mask over the upper face with a long hooked nose; two softly glowing white eyes behind the mask. A tall white conical hat (coppolone), slightly bent backwards. A long red wool scarf knotted at the neck, its tail flowing behind him. A thin, simple sword hand-forged from blacksmith's tools: dark hammered iron, a plain crossguard, a leather-wrapped grip. He is mute; his emotion shows only through posture.
```

### 1.2 · Ferruccio pulito per il gioco

La versione definitiva su sfondo verde, da scontornare e animare.

- **Allega:** 1) stile.png  2) la variante scelta dal concept
- **Salva come:** `ferruccio.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. Reference image 2 is the CHARACTER design to keep exactly: same proportions, same details, same colors.

Repaint this character as a clean, finished game sprite: Ferruccio, a young blacksmith whose consciousness is trapped in a Pulcinella costume: a small, slender knight with slightly childlike proportions (large head, small body). Loose white Pulcinella smock reaching the knees, gathered by a thin black belt, white trousers, small black shoes. A black half-mask over the upper face with a long hooked nose; two softly glowing white eyes behind the mask. A tall white conical hat (coppolone), slightly bent backwards. A long red wool scarf knotted at the neck, its tail flowing behind him. A thin, simple sword hand-forged from blacksmith's tools: dark hammered iron, a plain crossguard, a leather-wrapped grip. He is mute; his emotion shows only through posture.

Single subject, full body, strict side view facing right, centered with a generous margin. No floor and no cast shadow. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette. Soft, even lighting so the subject can be cut out cleanly.
```

### 1.3a · Variante co-op · sciarpa ciano (verità)

Apri ferruccio.png in modifica, seleziona solo la sciarpa con lo strumento di selezione, poi incolla il prompt.

- **Allega:** ferruccio.png
- **Salva come:** `ferruccio_ciano.png`

```text
Keep this exact character, pose, proportions, lighting and background identical. Change only the color of the scarf to a cool cyan (#3fc1d9), with the same folds and shading. Nothing else may change.
```

### 1.3b · Variante co-op · sciarpa oro (onore)

Apri ferruccio.png in modifica, seleziona solo la sciarpa con lo strumento di selezione, poi incolla il prompt.

- **Allega:** ferruccio.png
- **Salva come:** `ferruccio_oro.png`

```text
Keep this exact character, pose, proportions, lighting and background identical. Change only the color of the scarf to a warm gold (#f2c046), with the same folds and shading. Nothing else may change.
```

### 1.3c · Variante co-op · sciarpa viola (dolore)

Apri ferruccio.png in modifica, seleziona solo la sciarpa con lo strumento di selezione, poi incolla il prompt.

- **Allega:** ferruccio.png
- **Salva come:** `ferruccio_viola.png`

```text
Keep this exact character, pose, proportions, lighting and background identical. Change only the color of the scarf to a deep violet (#a77bff), with the same folds and shading. Nothing else may change.
```

### 1.4 · Pezzi per l'animazione

Ferruccio scomposto in parti separate: le animo io in Godot con uno scheletro 2D.

- **Allega:** 1) stile.png  2) ferruccio.png
- **Salva come:** `ferruccio_pezzi.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. Reference image 2 is the CHARACTER to keep exactly.

Break this exact character into separate body parts for 2D skeletal animation, laid out apart from each other with wide empty space between them: 1) head with mask and hat, 2) smock and torso, 3) front arm with hand, 4) back arm with hand, 5) front leg with shoe, 6) back leg with shoe, 7) scarf, 8) sword. Each part is complete: paint in the areas that are normally hidden by overlaps (for example, the top of each limb continues a little under the torso). Same style, same proportions, side view.

Background: flat, uniform pure chroma green (#00FF00), no shadows.
```

### 1.5 · Pose chiave

Riferimento per le animazioni: fermo, corsa, salto, caduta, scatto, fendente.

- **Allega:** 1) stile.png  2) ferruccio.png
- **Salva come:** `ferruccio_pose.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. Reference image 2 is the CHARACTER to keep exactly.

Format: 16:9 wide sheet. Six poses of this exact character in a row, all in side view facing right, evenly spaced: 1) idle, 2) running mid-stride, 3) jumping upward, 4) falling, 5) dashing forward with the scarf stretched behind, 6) a sword slash with a bright white crescent trail. Same proportions and details in every pose.

Background: flat, uniform pure chroma green (#00FF00), no shadows.
```

## Fase 2 — Personaggi

Gli otto personaggi della bibbia. Bianca e Gaetano compaiono solo come ricordi, quindi sono dipinti come luce.

### 2.1 · Agnese

La tessitrice di San Leucio, ironica e calda. Sotto il Velo sorride in modo assente.

- **Allega:** stile.png
- **Salva come:** `agnese.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Character: Agnese, a young silk weaver from San Leucio in 1845. Practical working dress in muted indigo with a cream apron, sleeves rolled up, dark hair tied back under a simple headscarf with a few loose strands. Lively, ironic, warm eyes, but her smile is calm and slightly absent, as if she has forgotten something important. She holds a half-finished red wool scarf on wooden needles; fine golden silk threads catch on her fingers.

Single subject, full body, strict side view facing right, centered with a generous margin. No floor and no cast shadow. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette. Soft, even lighting so the subject can be cut out cleanly.
```

### 2.2 · Taddeo

L'amico d'infanzia diventato guardia, che ha tradito Ferruccio per salvare la sorella.

- **Allega:** stile.png
- **Salva come:** `taddeo.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Character: Taddeo, a young royal guard of Caserta in 1845, once the hero's childhood friend. Dark blue tailcoat with red facings, white crossed leather belts, a tall dark shako with a small golden lily badge, a musket slung on his back. Lean and tense, guilt in his posture: hunched shoulders, eyes looking down. A small wooden toy sword is tucked in his belt as a keepsake.

Single subject, full body, strict side view facing right, centered with a generous margin. No floor and no cast shadow. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette. Soft, even lighting so the subject can be cut out cleanly.
```

### 2.3 · Tonino

Il venditore di mozzarella di Piazza Dante: ironico, gentile, confuso. Apparecchia sempre per due.

- **Allega:** stile.png
- **Salva come:** `tonino.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Character: Tonino, a middle-aged mozzarella seller in Piazza Dante. Round, kind face, thick moustache, flat cap, rolled sleeves, a white apron. Gentle, ironic and a little confused, with an absent-minded smile. He stands beside his small wooden market stall: ceramic basins of fresh buffalo mozzarella, a lantern, and two plates carefully set for two people.

Single subject, full body, strict side view facing right, centered with a generous margin. No floor and no cast shadow. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette. Soft, even lighting so the subject can be cut out cleanly.
```

### 2.4 · Donna Violante Valente

La benefattrice che governa il Velo. Materna e triste, mai una cattiva da cartone animato.

- **Allega:** stile.png
- **Salva come:** `violante.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Character: Donna Violante Valente, a noble benefactress of Caserta in 1845. A tall, graceful woman in her forties in an elegant mourning gown of deep midnight-blue silk with a high lace collar, a golden lily brooch, hair in an 1840s chignon under a black lace veil. Her face is serene, motherly and deeply sad, never a caricatured villain. In one hand she holds a small white handkerchief embroidered with a golden lily; from the fingers of her other hand dozens of fine, shimmering golden threads extend like a puppeteer's strings and leave the frame.

Single subject, full body, strict side view facing right, centered with a generous margin. No floor and no cast shadow. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette. Soft, even lighting so the subject can be cut out cleanly.
```

### 2.5 · Gregorio Valente senza armatura

Il Custode quando l'armatura si spezza: un padre stanco, non un mostro.

- **Allega:** stile.png
- **Salva come:** `gregorio.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Character: Gregorio Valente, captain of the guards, as he appears when his enchanted armor breaks. A tired man in his fifties with a short grey beard and deep-set sorrowful eyes, sweat-matted grey hair, wearing the padded inner doublet of a heavy golden armor. The broken golden lily emblem on his chest still leaks cracks of azure light. He kneels on one knee, leaning on a halberd.

Single subject, full body, strict side view facing right, centered with a generous margin. No floor and no cast shadow. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette. Soft, even lighting so the subject can be cut out cleanly.
```

### 2.6 · Mariella

La sorella di Taddeo, sopravvissuta al crollo. Il Velo le ha tolto la paura, ma anche la curiosità: passa le giornate alla finestra, sorridendo.

- **Allega:** stile.png
- **Salva come:** `mariella.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Character: Mariella, a girl of about fourteen in 1845, survivor of a construction-site collapse. Naturally lively, curious features, but under the spell she wears a fixed, placid smile and unfocused eyes. Simple working-class dress in faded rose, a woollen shawl, two braids. She sits on a wooden chair by a lit window, hands folded in her lap, smiling at nothing.

Single subject, full body, strict side view facing right, centered with a generous margin. No floor and no cast shadow. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette. Soft, even lighting so the subject can be cut out cleanly.
```

### 2.7 · Bianca · ricordo

La figlia morta dei Valente. Solo un ricordo luminoso: non torna in vita.

- **Allega:** stile.png
- **Salva come:** `bianca_ricordo.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Character: Bianca Valente as a memory: a girl of about eleven in a white 1830s dress with a pale blue sash, laughing, caught mid-curtsy. Paint her as a translucent, softly glowing memory in cold azure light, her edges dissolving into drifting luminous particles.

Single subject, full body, strict side view facing right, centered with a generous margin. No floor and no cast shadow. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette. Soft, even lighting so the subject can be cut out cleanly.
```

### 2.8 · Gaetano · ricordo

Il padre di Ferruccio, nel momento in cui regge la trave per salvare gli altri.

- **Allega:** stile.png
- **Salva come:** `gaetano_ricordo.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Character: Gaetano, the hero's father, a blacksmith working at the palace construction site in 1839, seen as a memory. Broad shoulders, rolled sleeves, a scorched leather blacksmith's apron, soot and dust on his arms. He strains to hold up a falling wooden beam above his head with both arms, shouting for the others to get out. Paint him as a translucent, warm golden memory with edges dissolving into drifting particles.

Single subject, full body, strict side view facing right, centered with a generous margin. No floor and no cast shadow. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette. Soft, even lighting so the subject can be cut out cleanly.
```

### 2.10 · Guardie della Reggia

Servono nella città e nel finale della libertà, quando le guardie danno la caccia a Ferruccio.

- **Allega:** stile.png
- **Salva come:** `guardie.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Format: 16:9 wide sheet. Three different royal guards of Caserta in 1845, side by side and evenly spaced, all in strict side view facing right: a young recruit, a stout sergeant with a moustache, a tall veteran holding a halberd. Dark blue tailcoats with red facings, white crossed leather belts, tall shakos with a small golden lily badge. Neutral, slightly stiff postures.

Background: flat, uniform pure chroma green (#00FF00), no shadows.
```

### 2.11 · Cittadini di Caserta

Abitanti per popolare le piazze: sorridenti sotto il Velo, arrabbiati nel finale.

- **Allega:** stile.png
- **Salva come:** `cittadini.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Format: 16:9 wide sheet. Five ordinary citizens of Caserta in 1845, side by side and evenly spaced, all in strict side view facing right: a washerwoman with a basket, an old man with a cane, a shopkeeper in a waistcoat, a mother holding a small child's hand, a street boy in a flat cap. Humble, believable 1840s Campanian clothing in muted colors. Their faces wear the same calm, identical smile.

Background: flat, uniform pure chroma green (#00FF00), no shadows.
```

### 2.9 · Ritratto per i dialoghi (riutilizzabile)

Busto di tre quarti per le finestre di dialogo. Usalo per ogni personaggio, allegando la sua immagine.

- **Allega:** 1) stile.png  2) l'immagine del personaggio
- **Salva come:** `ritratto_<nome>.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. Reference image 2 is the CHARACTER to keep exactly: same face, costume, colors and details.

Paint a dialogue portrait of this character: head and shoulders, three-quarter view facing right, a subtle expression that fits their story, soft rim light from behind. Format: square 1:1.

Background: flat, uniform pure chroma green (#00FF00), no shadows.
```

## Fase 3 — Nemici

Le tre creature del Velo. Ognuna custodisce qualcosa che è stato tolto agli abitanti.

### 3.1 · Gatto d'ombra

Ricordi domestici abbandonati: dentro il corpo galleggiano frammenti di vita familiare.

- **Allega:** stile.png
- **Salva come:** `gatto.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Creature: a stray cat made of shadow and smoke, black with violet reflections, arched back, a long thin tail, pointed ears, two glowing violet eyes. Inside its translucent body float faint fragments of a family's memories, glowing softly: a tiny cradle, a ribbon, a teacup.

Single subject, full body, strict side view facing right, centered with a generous margin. No floor and no cast shadow. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette. Soft, even lighting so the subject can be cut out cleanly.
```

### 3.2 · Vespa dorata

Desideri e ambizioni rubati agli abitanti, trasportati verso la Reggia.

- **Allega:** stile.png
- **Salva come:** `vespa.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Creature: a golden wasp as big as a cat, with a gilded, armor-like carapace and black stripes, translucent pale-blue wings, glowing red eyes and a black stinger. Its abdomen glows like a lantern and carries a tangle of fine golden threads and a few stolen glowing coins.

Single subject, full body, strict side view facing right, centered with a generous margin. No floor and no cast shadow. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette. Soft, even lighting so the subject can be cut out cleanly.
```

### 3.3 · Statua animata

Memorie imprigionate nel marmo: crepe azzurre e lacrime di luce.

- **Allega:** stile.png
- **Salva come:** `statua.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Creature: a classical white marble statue from the gardens of the Royal Palace of Caserta, come to life. A draped figure on a small pedestal with one arm raised. Thin cracks across its body leak azure light, its eyes glow azure, and tears of light run down its face.

Single subject, full body, strict side view facing right, centered with a generous margin. No floor and no cast shadow. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette. Soft, even lighting so the subject can be cut out cleanly.
```

## Fase 4 — Boss

Un boss per capitolo. Se un risultato non convince, rigeneralo: ogni richiesta dà più varianti tra cui scegliere.

### 4.1 · Il Gatto dei Quattro Canti · Piazza Dante

Il nucleo delle memorie domestiche sottratte alle famiglie.

- **Allega:** stile.png
- **Salva come:** `boss_gatto_quattro_canti.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Boss: Il Gatto dei Quattro Canti, an enormous shadow cat the size of a carriage, with smoky fur, four long glowing violet tails and eyes like gas lamps. Inside its translucent body hover the stolen memories of whole families, softly glowing: family portraits, cradles, cooking pots, a wedding veil. Crouched, ready to pounce.

Single subject, full body, strict side view facing right, centered with a generous margin. No floor and no cast shadow. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette. Soft, even lighting so the subject can be cut out cleanly.
```

### 4.2 · La Regina dei Debiti · Corso Trieste

Ambizioni e promesse infrante, incarnate in una vespa enorme.

- **Allega:** stile.png
- **Salva come:** `boss_regina_debiti.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Boss: La Regina dei Debiti, an enormous luminous queen wasp. Her body is covered in overlapping scales shaped like gold coins, she wears a crown woven from golden thread, her translucent wings are veined with gold, and long sealed promissory notes and ribbons trail from her abdomen. Glowing amber eyes.

Single subject, full body, strict side view facing right, centered with a generous margin. No floor and no cast shadow. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette. Soft, even lighting so the subject can be cut out cleanly.
```

### 4.3 · La Madre di Marmo · Villa Comunale

Le memorie degli operai morti, imprigionate in una statua che difende i registri.

- **Allega:** stile.png
- **Salva come:** `boss_madre_marmo.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Boss: La Madre di Marmo, a towering marble statue of a mother in the pose of a protective classical sculpture. She clutches a stack of stone ledgers to her chest, her face weeps streams of azure light, and deep glowing cracks run through her body. Orbs of azure light orbit around her.

Single subject, full body, strict side view facing right, centered with a generous margin. No floor and no cast shadow. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette. Soft, even lighting so the subject can be cut out cleanly.
```

### 4.4 · La Tessitrice di Pietra · San Leucio

La guardiana dei telai: rivela che il Velo è fatto di seta.

- **Allega:** stile.png
- **Salva come:** `boss_tessitrice_pietra.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Boss: La Tessitrice di Pietra, a tall stone guardian wrapped in shimmering enchanted silk. Her arms are elongated like the arms of a loom, spools and shuttles orbit around her, and dozens of golden threads stream from her fingers toward the right edge of the frame. A golden lily glows on her brow.

Single subject, full body, strict side view facing right, centered with a generous margin. No floor and no cast shadow. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette. Soft, even lighting so the subject can be cut out cleanly.
```

### 4.5 · Il Custode della Reggia · Cortile d'Onore

Gregorio prigioniero della propria armatura: combatte contro la sua stessa volontà.

- **Allega:** stile.png
- **Salva come:** `boss_custode.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Boss: Il Custode della Reggia, a monumental guardian three times the height of a man: a man imprisoned in ornate golden Bourbon armor, with a deep red cape, a helmet with a tall red plume, a visor glowing orange and a massive halberd. A golden lily on the chest pulses with light. His posture shows a subtle tension, as if the armor moves against its wearer's will.

Single subject, full body, strict side view facing right, centered with a generous margin. No floor and no cast shadow. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette. Soft, even lighting so the subject can be cut out cleanly.
```

## Fase 5 — Ambienti

Ogni area ha tre strati per la parallasse (lontano, medio, primo piano), generati in 16:9 e poi allargati con il cambio di formato di Grok (vedi le frasi di correzione) e un materiale per le piattaforme. Se hai una foto vera del luogo, allegala come seconda immagine: Grok la userà come riferimento per le architetture.

### 5.1 · Piazza Dante · lontano

Tetti e campanili di notte, la Reggia all'orizzonte, i fili d'oro nel cielo.

- **Allega:** 1) stile.png  2) foto di Piazza Dante (facoltativa)
- **Salva come:** `piazza_lontano.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. If a reference image 2 is uploaded, use it only for the architecture.

Area: Piazza Dante, Caserta, 1845, at night under a still full moon. The rooftops of the city: bell towers, small domes, chimneys, a few warm lit windows, the distant silhouette of the Royal Palace on the horizon, and fine golden threads stretched across the sky toward it.

Format: 16:9 horizontal panorama (it will later be widened) for the FAR parallax layer of a side-scrolling game. Orthographic side view, low horizon, distant silhouettes only, low contrast, heavy atmospheric haze. Fill the sky above the silhouettes with flat uniform chroma green (#00FF00) so it can be replaced. No characters.
```

### 5.2 · Piazza Dante · medio

I palazzi neoclassici con i portici accesi e i sorrisi dietro le finestre.

- **Allega:** 1) stile.png  2) foto di Piazza Dante (facoltativa)
- **Salva come:** `piazza_medio.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. If a reference image 2 is uploaded, use it only for the architecture.

Area: Piazza Dante, Caserta, 1845, at night. A continuous row of three-storey neoclassical palazzi: ground-floor arcades lit warm orange, shuttered windows (a few lit, with smiling silhouettes behind the curtains), wrought-iron balconies, cast-iron gas lamps, and a pale stone statue on a tall pedestal at the center.

Format: 16:9 horizontal panorama (it will later be widened) for the MIDDLE parallax layer of a side-scrolling game. Orthographic side view; buildings and objects stand on the bottom edge of the image, medium detail and contrast. Everything above and between them is flat uniform chroma green (#00FF00). No characters, no ground plane in front.
```

### 5.3 · Piazza Dante · primo piano

Ringhiere e lampioni scurissimi vicino alla camera.

- **Allega:** stile.png
- **Salva come:** `piazza_primo_piano.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Area: Piazza Dante at night. Wrought-iron railings and the base of a gas lamp along the bottom edge; a laundry line hanging from the top edge.

Format: 16:9 horizontal panorama (it will later be widened) for the FOREGROUND parallax layer of a side-scrolling game. A few near-black silhouettes very close to the camera, only along the bottom edge and hanging from the top edge, with soft out-of-focus edges. Leave the central 60% of the height completely empty. Everything that is not a silhouette is flat uniform chroma green (#00FF00).
```

### 5.4 · Corso Trieste · lontano

Tetti velati dalla pioggia sotto nuvole viola.

- **Allega:** 1) stile.png  2) foto di Corso Trieste (facoltativa)
- **Salva come:** `corso_lontano.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. If a reference image 2 is uploaded, use it only for the architecture.

Area: Corso Trieste, Caserta, 1845, at dusk in the rain. Rain-veiled rooftops under heavy violet clouds, a few amber windows, chimneys and water tanks. It rains, but there are no clouds directly above the street.

Format: 16:9 horizontal panorama (it will later be widened) for the FAR parallax layer of a side-scrolling game. Orthographic side view, low horizon, distant silhouettes only, low contrast, heavy atmospheric haze. Fill the sky above the silhouettes with flat uniform chroma green (#00FF00) so it can be replaced. No characters.
```

### 5.5 · Corso Trieste · medio

Il porticato con le vetrine accese e nessun cliente.

- **Allega:** 1) stile.png  2) foto di Corso Trieste (facoltativa)
- **Salva come:** `corso_medio.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. If a reference image 2 is uploaded, use it only for the architecture.

Area: Corso Trieste, Caserta, 1845, at dusk in the rain. A long commercial arcade with stone columns and arches; shop windows glow amber with goods on display (fabrics, hats, pastries) but there are no customers; blank signboards; wet, reflective stone; balconies above.

Format: 16:9 horizontal panorama (it will later be widened) for the MIDDLE parallax layer of a side-scrolling game. Orthographic side view; buildings and objects stand on the bottom edge of the image, medium detail and contrast. Everything above and between them is flat uniform chroma green (#00FF00). No characters, no ground plane in front.
```

### 5.6 · Corso Trieste · primo piano

Tende gocciolanti, lanterne appese, casse e botti.

- **Allega:** stile.png
- **Salva come:** `corso_primo_piano.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Area: Corso Trieste at dusk in the rain. Shop awnings dripping water and strings of small lanterns hanging from the top edge; wooden crates, barrels and a puddle along the bottom edge.

Format: 16:9 horizontal panorama (it will later be widened) for the FOREGROUND parallax layer of a side-scrolling game. A few near-black silhouettes very close to the camera, only along the bottom edge and hanging from the top edge, with soft out-of-focus edges. Leave the central 60% of the height completely empty. Everything that is not a silhouette is flat uniform chroma green (#00FF00).
```

### 5.7 · Villa Comunale · lontano

Chiome di alberi e palme nella luce lunare verdastra.

- **Allega:** 1) stile.png  2) foto della Villa Comunale (facoltativa)
- **Salva come:** `villa_lontano.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. If a reference image 2 is uploaded, use it only for the place.

Area: the Villa Comunale of Caserta, 1845, at night. A dense canopy of large trees and palms under pale green-tinted moonlight, mist between the trunks, a few fireflies.

Format: 16:9 horizontal panorama (it will later be widened) for the FAR parallax layer of a side-scrolling game. Orthographic side view, low horizon, distant silhouettes only, low contrast, heavy atmospheric haze. Fill the sky above the silhouettes with flat uniform chroma green (#00FF00) so it can be replaced. No characters.
```

### 5.8 · Villa Comunale · medio

Il giardino con la fontana e le statue che piangono luce.

- **Allega:** 1) stile.png  2) foto della Villa Comunale (facoltativa)
- **Salva come:** `villa_medio.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. If a reference image 2 is uploaded, use it only for the place.

Area: the Villa Comunale of Caserta, 1845, at night. Tall holm oaks and palms, low clipped hedges, a round stone fountain, classical marble statues on pedestals (some weep thin streams of azure light), a few warm lamps and fireflies.

Format: 16:9 horizontal panorama (it will later be widened) for the MIDDLE parallax layer of a side-scrolling game. Orthographic side view; buildings and objects stand on the bottom edge of the image, medium detail and contrast. Everything above and between them is flat uniform chroma green (#00FF00). No characters, no ground plane in front.
```

### 5.9 · Villa Comunale · primo piano

Felci e agavi in basso, edera e rami dall'alto.

- **Allega:** stile.png
- **Salva come:** `villa_primo_piano.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Area: the Villa Comunale at night. Large dark fern leaves and agaves along the bottom edge; ivy and hanging branches from the top edge.

Format: 16:9 horizontal panorama (it will later be widened) for the FOREGROUND parallax layer of a side-scrolling game. A few near-black silhouettes very close to the camera, only along the bottom edge and hanging from the top edge, with soft out-of-focus edges. Leave the central 60% of the height completely empty. Everything that is not a silhouette is flat uniform chroma green (#00FF00).
```

### 5.10 · San Leucio · lontano

Colline all'alba nella nebbia e il Belvedere con i fili d'oro.

- **Allega:** 1) stile.png  2) foto del Belvedere di San Leucio (facoltativa)
- **Salva come:** `sanleucio_lontano.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. If a reference image 2 is uploaded, use it only for the architecture.

Area: the Belvedere of San Leucio, 1845, at dawn in the fog. Soft overlapping hills in rose and pale-blue mist; on the hill, the long Bourbon silk-factory building with rows of windows and a small clock tower; cypress trees. Thin golden threads rise from the building and drift toward the right horizon.

Format: 16:9 horizontal panorama (it will later be widened) for the FAR parallax layer of a side-scrolling game. Orthographic side view, low horizon, distant silhouettes only, low contrast, heavy atmospheric haze. Fill the sky above the silhouettes with flat uniform chroma green (#00FF00) so it can be replaced. No characters.
```

### 5.11 · San Leucio · medio

I laboratori della seta con i telai e gli stendardi stesi ad asciugare.

- **Allega:** 1) stile.png  2) foto di San Leucio (facoltativa)
- **Salva come:** `sanleucio_medio.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. If a reference image 2 is uploaded, use it only for the architecture.

Area: the silk workshops of San Leucio, 1845, at dawn in the fog. Long low buildings with large arched windows glowing faintly, wooden looms visible inside, banners of silk in red, gold and blue hanging out to dry, cypresses and stone walls.

Format: 16:9 horizontal panorama (it will later be widened) for the MIDDLE parallax layer of a side-scrolling game. Orthographic side view; buildings and objects stand on the bottom edge of the image, medium detail and contrast. Everything above and between them is flat uniform chroma green (#00FF00). No characters, no ground plane in front.
```

### 5.12 · San Leucio · primo piano

Erba alta e cardi, fili e uno stendardo che pende.

- **Allega:** stile.png
- **Salva come:** `sanleucio_primo_piano.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Area: San Leucio at dawn. Tall wild grass and thistles along the bottom edge; a few silk threads and a loose banner hanging from the top edge.

Format: 16:9 horizontal panorama (it will later be widened) for the FOREGROUND parallax layer of a side-scrolling game. A few near-black silhouettes very close to the camera, only along the bottom edge and hanging from the top edge, with soft out-of-focus edges. Leave the central 60% of the height completely empty. Everything that is not a silhouette is flat uniform chroma green (#00FF00).
```

### 5.13 · Cortile d'Onore · lontano

La facciata sterminata della Reggia, con un solo balcone acceso.

- **Allega:** 1) stile.png  2) foto della facciata della Reggia (facoltativa)
- **Salva come:** `reggia_lontano.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. If a reference image 2 is uploaded, use it only for the architecture.

Area: the Royal Palace of Caserta, 1845, at night. Its endless façade with four rows of arched windows, some lit gold; a central body with a pediment; a balustrade along the top; a single lit balcony in the middle where a female silhouette stands.

Format: 16:9 horizontal panorama (it will later be widened) for the FAR parallax layer of a side-scrolling game. Orthographic side view, low horizon, distant silhouettes only, low contrast, heavy atmospheric haze. Fill the sky above the silhouettes with flat uniform chroma green (#00FF00) so it can be replaced. No characters.
```

### 5.14 · Cortile d'Onore · medio

Il colonnato monumentale con nicchie, stendardi, torce e raggi di luce.

- **Allega:** 1) stile.png  2) foto del vestibolo o del cortile (facoltativa)
- **Salva come:** `reggia_medio.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. If a reference image 2 is uploaded, use it only for the architecture.

Area: the Cortile d'Onore of the Royal Palace of Caserta, 1845, at night. A monumental colonnade of fluted columns and arches, niches with classical statues, deep red banners with golden lilies, burning torches, embers in the air, warm light shafts falling from above.

Format: 16:9 horizontal panorama (it will later be widened) for the MIDDLE parallax layer of a side-scrolling game. Orthographic side view; buildings and objects stand on the bottom edge of the image, medium detail and contrast. Everything above and between them is flat uniform chroma green (#00FF00). No characters, no ground plane in front.
```

### 5.15 · Cortile d'Onore · primo piano

Fusti di colonne enormi e catene, quasi neri.

- **Allega:** stile.png
- **Salva come:** `reggia_primo_piano.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

Area: the Cortile d'Onore at night. Massive column shafts at the left and right edges and hanging chains from the top edge, near-black, with a few ember glints.

Format: 16:9 horizontal panorama (it will later be widened) for the FOREGROUND parallax layer of a side-scrolling game. A few near-black silhouettes very close to the camera, only along the bottom edge and hanging from the top edge, with soft out-of-focus edges. Leave the central 60% of the height completely empty. Everything that is not a silhouette is flat uniform chroma green (#00FF00).
```

### 5.18 · Statua del cavaliere inginocchiato

Il primo indizio sulla prigionia di Gregorio, nella Villa Comunale. L'iscrizione la aggiungo io nel gioco.

- **Allega:** stile.png
- **Salva come:** `statua_cavaliere.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

A weathered marble garden statue on a tall pedestal: an armored knight kneeling with bowed head before a large stone lily, his hands bound by thin, almost invisible golden threads that wrap around the lily's stem. The front of the pedestal has a smooth blank panel for an inscription (leave it completely empty). Moonlight, a few azure glints in the cracks.

Single subject, full body, strict side view facing right, centered with a generous margin. No floor and no cast shadow. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette. Soft, even lighting so the subject can be cut out cleanly.
```

### 5.16 · Materiale delle piattaforme

Striscia di pietra ripetibile. Generala una volta per area cambiando il materiale indicato in fondo.

- **Allega:** stile.png
- **Salva come:** `terreno_<area>.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

A seamless, horizontally tileable texture strip of a stone platform for a 2D side-scrolling game, seen from the side: weathered Bourbon-era stone blocks, a lighter worn top edge, a darker underside, small cracks. Format: 16:9. The stone band runs across the full width, edge to edge, and fills the middle third of the height; above and below it is flat uniform chroma green (#00FF00).

Material for this area: grey-blue limestone (Piazza Dante). [Other areas: wet dark stone (Corso Trieste), stone with moss (Villa Comunale), pale stone (San Leucio), marble with gold inlays (Reggia).]
```

### 5.17 · Grata d'uscita

Il sigillo che si apre quando la stanza è libera.

- **Allega:** stile.png
- **Salva come:** `grata.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

An ornate wrought-iron gate, closed, set inside a stone archway, seen from the front. At its center a golden lily seal glows faintly. Format: tall 9:16.

Background: flat, uniform pure chroma green (#00FF00), no shadows.
```

## Fase 6 — Oggetti e interfaccia

Icone e oggetti di storia. I titoli e le scritte del gioco li compongo io con i font, quindi niente testo nelle immagini.

### 6.1 · Oggetti di gioco

Centesimi, mozzarella, maschera, sciarpa, registro, fazzoletto di Bianca.

- **Allega:** stile.png
- **Salva come:** `oggetti_gioco.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

A sheet of six game item icons arranged in a 3x2 grid with wide spacing, each readable at small size: 1) a glowing coin made of light, a fragment of something someone forgot; 2) a fresh ball of buffalo mozzarella on a green leaf; 3) a white Pulcinella half-mask with a hooked nose (health icon); 4) a knotted red wool scarf; 5) an old leather-bound register with names crossed out (lines only, no readable writing); 6) a small white handkerchief embroidered with a golden lily.

Background: flat, uniform pure chroma green (#00FF00), no shadows.
```

### 6.2 · Oggetti della storia

Scatola musicale, disegno di Bianca, punzone di Gaetano, lettera, targa, spada di legno.

- **Allega:** stile.png
- **Salva come:** `oggetti_storia.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

A sheet of six story objects arranged in a 3x2 grid with wide spacing: 1) a small music box shaped like the Royal Palace; 2) a child's crayon drawing of an unfinished palace (no writing); 3) a blacksmith's iron punch stamped with the two letters "G" and "F" (the only letters allowed in the image); 4) a folded letter with a red wax seal; 5) a bronze commemorative plaque with a visibly scratched-out empty space where a name was removed (no readable text); 6) a child's wooden toy sword.

Background: flat, uniform pure chroma green (#00FF00), no shadows.
```

### 6.3 · Oggetti degli archi

Medaglione di Rosa, lettera di Agnese, fazzoletto con il giglio incompleto, lettera di Mariella, giglio d'oro spezzato, sciarpa consumata.

- **Allega:** stile.png
- **Salva come:** `oggetti_archi.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly.

A sheet of six story objects arranged in a 3x2 grid with wide spacing: 1) an old silver locket medallion, slightly open, with a tiny painted portrait of a smiling woman; 2) a love letter folded and tied with a thin red wool thread; 3) a small silk handkerchief with an unfinished embroidered lily, the needle still in it; 4) a child-sized folded letter, creased from being read many times; 5) a golden lily emblem cracked in two, leaking a faint azure light; 6) a long red wool scarf, worn and frayed at the ends. No readable writing anywhere.

Background: flat, uniform pure chroma green (#00FF00), no shadows.
```

## Fase 7 — Scene della storia

Illustrazioni per prologo, rivelazioni e finali. Allega sempre stile.png e le immagini dei personaggi che compaiono nella scena.

### 7.1 · Prologo · Il crollo del 1839

Gaetano regge la trave mentre gli altri fuggono. Nessuna immagine cruenta.

- **Allega:** 1) stile.png  2) gaetano_ricordo.png
- **Salva come:** `scena_1839.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. Format: cinematic 16:9 story illustration, painted like a key frame of an animated film. Keep every character exactly as in the uploaded reference images.

Scene: the palace construction site in 1839. A temporary wooden structure is collapsing in clouds of dust lit by warm sunset light. Workers flee toward the edges of the frame. At the center, Gaetano (the man in reference image 2, painted here as a real, solid person) holds up a falling beam with both arms, shouting. In the background, a younger guard captain in uniform runs toward a girl of about eleven in a white dress with a pale blue sash. Dramatic but never gory: no wounds, no bodies.
```

### 7.2 · La notte della festa, 1845

A mezzanotte suonano le campane e tutti i volti diventano lo stesso sorriso.

- **Allega:** stile.png
- **Salva come:** `scena_festa.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. Format: cinematic 16:9 story illustration, painted like a key frame of an animated film. Keep every character exactly as in the uploaded reference images.

Scene: midnight celebrations for the completion of the Royal Palace of Caserta in 1845. Fireworks bloom over the façade, a crowd fills the square, and at this exact instant every bell rings and every face turns into the same serene, identical smile. For a moment, fine golden threads become visible, linking the wrists of every person in the crowd to the palace.
```

### 7.3 · Il risveglio

Ferruccio si sveglia da solo in Piazza Dante, con la maschera e la sciarpa.

- **Allega:** 1) stile.png  2) ferruccio.png
- **Salva come:** `scena_risveglio.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. Format: cinematic 16:9 story illustration, painted like a key frame of an animated film. Keep every character exactly as in the uploaded reference images.

Scene: the hero from reference image 2 wakes alone on the cobblestones of Piazza Dante at night, propped on one arm, touching his mask with the other hand as if he does not recognise his own face. His red scarf is tangled around him, his sword lies nearby, the full moon hangs perfectly still above the empty square.
```

### 7.4 · Ferruccio e Agnese, prima del sortilegio

Il ricordo caldo: lui ha appena rotto un pezzo del telaio, lei ride e gli regala la sciarpa.

- **Allega:** 1) stile.png  2) agnese.png
- **Salva come:** `scena_agnese.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. Format: cinematic 16:9 story illustration, painted like a key frame of an animated film. Keep every character exactly as in the uploaded reference images.

Scene: a warm memory in a silk workshop of San Leucio on a sunny afternoon, golden light through arched windows, looms all around. Agnese (reference image 2, without the absent smile: here she is laughing, teasing) holds out a red wool scarf to Ferruccio, a young blacksmith with dark curly hair, a leather apron and soot on his hands, who is embarrassed and holds a broken piece of a loom. Warmer and more saturated than the rest of the game.
```

### 7.5 · Il tradimento

Taddeo consegna l'amico agli uomini di Violante.

- **Allega:** 1) stile.png  2) taddeo.png
- **Salva come:** `scena_tradimento.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. Format: cinematic 16:9 story illustration, painted like a key frame of an animated film. Keep every character exactly as in the uploaded reference images.

Scene: a dim workshop at night. Taddeo (reference image 2) stands aside with his head lowered while two guards in dark uniforms seize a young blacksmith with dark curly hair and a leather apron. In the background, behind a curtain of shimmering golden threads, the silhouette of an elegant woman in a dark gown watches. Cold blue light, one warm candle.
```

### 7.6 · Violante sul balcone

La rivelazione: i fili del Velo scendono dalle sue mani su tutta la città.

- **Allega:** 1) stile.png  2) violante.png  3) ferruccio.png
- **Salva come:** `scena_balcone.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. Format: cinematic 16:9 story illustration, painted like a key frame of an animated film. Keep every character exactly as in the uploaded reference images.

Scene: the Cortile d'Onore at night, torches going out one by one. Gregorio's empty red cape lies over his broken golden armor. On the central balcony of the palace stands Donna Violante (reference image 2), holding her daughter's embroidered handkerchief. Thousands of shimmering golden threads descend from her hands over the whole city, like the strings of marionettes tied to every citizen's wrist. Far below in the courtyard, small, Ferruccio (reference image 3) looks up, and beside him a tired grey-bearded man kneels among the pieces of his broken golden armor.
```

### 7.6b · Ricordo · Gregorio insegna l'inchino a Bianca

La memoria nel marmo della Villa Comunale: lei ride e sbaglia apposta.

- **Allega:** 1) stile.png  2) bianca_ricordo.png  3) gregorio.png
- **Salva come:** `scena_inchino.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. Format: cinematic 16:9 story illustration, painted like a key frame of an animated film. Keep every character exactly as in the uploaded reference images.

Scene: a memory preserved in marble, painted in cold azure light with edges dissolving into particles. In a sunny palace garden, a younger Gregorio (reference image 3, without beard, in a captain's uniform) bows gracefully to teach a curtsy to Bianca (reference image 2, about eleven), who laughs and does it wrong on purpose. He reaches for her hand, and the memory begins to fade from that hand outward.
```

### 7.6c · Ricordo · Il funerale di Bianca

Il momento in cui nasce l'ossessione di Violante: «Non voglio più vedere un bambino morire».

- **Allega:** 1) stile.png  2) violante.png  3) gregorio.png
- **Salva come:** `scena_funerale.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. Format: cinematic 16:9 story illustration, painted like a key frame of an animated film. Keep every character exactly as in the uploaded reference images.

Scene: 1839, a small church in grey morning light. A small closed white coffin covered in white flowers and a silk handkerchief embroidered with a golden lily. Violante (reference image 2, younger, in black) stands perfectly still before it, her face empty. Gregorio (reference image 3, younger, in uniform, no beard) reaches for her hand; she does not take it. Restrained and tender, no tears shown in close-up.
```

### 7.6d · Il mantello vuoto

L'ultima immagine dell'arco di Gregorio: la sua anima sale verso il balcone.

- **Allega:** 1) stile.png  2) gregorio.png
- **Salva come:** `scena_mantello.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. Format: cinematic 16:9 story illustration, painted like a key frame of an animated film. Keep every character exactly as in the uploaded reference images.

Scene: the Cortile d'Onore at night, the torches nearly out. On the marble floor lies a broken golden armor with a cracked lily, and over it an empty deep red cape. A small soul of azure light rises slowly from it toward a lit balcony high above, where a woman's silhouette waits. Silent, solemn, nobody else in the frame.
```

### 7.7 · Finale I · La libertà del colpevole

La città torna viva e a colori, e la folla si rivolta contro Ferruccio.

- **Allega:** 1) stile.png  2) ferruccio.png
- **Salva come:** `scena_finale_liberta.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. Format: cinematic 16:9 story illustration, painted like a key frame of an animated film. Keep every character exactly as in the uploaded reference images.

Scene: Caserta freed at last, the most luminous image of the whole game: the still moonlight gives way to a deep, saturated blue sky, green trees, flowers, warm contrasting light. People cry, embrace and laugh for real. But an angry crowd and royal guards turn against the small hero from reference image 2, who dashes across the courtyard of the palace, his red scarf flying, while a young weaver in an indigo dress reaches out to stop him. Nobody is under a spell: their anger is human. Bittersweet: beauty and hostility in the same frame.
```

### 7.8 · Finale II · Il regno dei sorrisi

La pace imposta: tutto ordinato, sbiadito, uguale per sempre.

- **Allega:** 1) stile.png  2) ferruccio.png  3) agnese.png
- **Salva come:** `scena_finale_concordia.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Reference image 1 is the STYLE reference: match its brushwork, ink outlines, palette and lighting exactly. Format: cinematic 16:9 story illustration, painted like a key frame of an animated film. Keep every character exactly as in the uploaded reference images.

Scene: the same city kept in eternal calm under an overcast grey sky. A desaturated palette of beige, grey-blue and fog, flat uniform light, everything slightly faded. Smiling citizens repeat the same gestures in Piazza Dante, children play without ever quarrelling. Tonino, a moustached mozzarella seller in a white apron and flat cap, sets two plates at his stall without knowing for whom. Under an arcade, Agnese (reference image 3) politely turns to Ferruccio (reference image 2) without recognising him, while he clutches his red scarf. High on the palace balcony, a small woman governs faint golden threads stretched over the square.
```

## Fase 8 — Varianti dei finali

L'epilogo giocabile riusa Piazza Dante. Applica le due modifiche a piazza_lontano.png e piazza_medio.png, una immagine alla volta.

### 8.1 · Piazza Dante · Libertà

Colori pieni dopo la morte di Violante. Apri l'immagine in modifica su Grok e incolla il prompt.

- **Allega:** piazza_lontano.png oppure piazza_medio.png
- **Salva come:** `<nome>_liberta.png`

```text
Edit this image only in color and light. Turn it into the first morning of a freed city: deep saturated blue light, vivid warm colors, crisp contrast, lit windows with real, varied silhouettes, and no golden threads anywhere. Keep every shape, the composition and the flat green areas exactly the same.
```

### 8.2 · Piazza Dante · Concordia

Toni spenti se Violante viene risparmiata. Apri l'immagine in modifica su Grok e incolla il prompt.

- **Allega:** piazza_lontano.png oppure piazza_medio.png
- **Salva come:** `<nome>_concordia.png`

```text
Edit this image only in color and light. Turn it into a city under an eternal artificial calm: desaturated beige, grey-blue and fog, flat uniform light, everything slightly faded, faint golden threads over everything. Keep every shape, the composition and the flat green areas exactly the same.
```

## Fase 9 — Copertina e menu

Immagini per lo store e per lo sfondo animato del menu. Il titolo lo aggiungo io con il font Cinzel.

### 9.1 · Copertina orizzontale

Ferruccio davanti al Custode, Violante e i fili sopra di loro. Spazio libero in alto per il titolo.

- **Allega:** ferruccio.png
- **Salva come:** `copertina_16x9.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Format: 16:9 key art for a video game, with a large empty dark area at the top for the title.

Scene: the small hero stands on the steps of the Cortile d'Onore of the Royal Palace of Caserta at night, seen from behind at three-quarters, facing a monumental guardian in ornate golden Bourbon armor with a red cape, a plumed helmet and a glowing golden lily on his chest. On the balcony above, a woman in a dark gown holds countless golden threads that descend over the city like marionette strings. Moon, torches, embers.

Hero: Ferruccio, a young blacksmith whose consciousness is trapped in a Pulcinella costume: a small, slender knight with slightly childlike proportions (large head, small body). Loose white Pulcinella smock reaching the knees, gathered by a thin black belt, white trousers, small black shoes. A black half-mask over the upper face with a long hooked nose; two softly glowing white eyes behind the mask. A tall white conical hat (coppolone), slightly bent backwards. A long red wool scarf knotted at the neck, its tail flowing behind him. A thin, simple sword hand-forged from blacksmith's tools: dark hammered iron, a plain crossguard, a leather-wrapped grip. He is mute; his emotion shows only through posture.
```

### 9.2 · Copertina verticale

Primo piano di Ferruccio, per le copertine verticali dello store.

- **Allega:** ferruccio.png
- **Salva come:** `copertina_2x3.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Format: vertical 2:3 key art for a video game, with empty space at the bottom for the title.

A close-up of the hero's masked face and hat in three-quarter view, his glowing eyes behind the black mask, the red scarf blowing across the frame. Behind him, out of focus, the lit façade of the Royal Palace of Caserta at night, and fine golden threads catching the light.

Hero: Ferruccio, a young blacksmith whose consciousness is trapped in a Pulcinella costume: a small, slender knight with slightly childlike proportions (large head, small body). Loose white Pulcinella smock reaching the knees, gathered by a thin black belt, white trousers, small black shoes. A black half-mask over the upper face with a long hooked nose; two softly glowing white eyes behind the mask. A tall white conical hat (coppolone), slightly bent backwards. A long red wool scarf knotted at the neck, its tail flowing behind him. A thin, simple sword hand-forged from blacksmith's tools: dark hammered iron, a plain crossguard, a leather-wrapped grip. He is mute; his emotion shows only through posture.
```

### 9.3 · Sfondo animato del menu (video, facoltativo)

Un loop di pochi secondi della Reggia di notte. Su Grok Imagine, partendo da reggia_lontano.png o dalla tavola 0.2.

- **Allega:** stile_reggia.png oppure reggia_lontano.png
- **Salva come:** `menu_loop.mp4`

```text
Animate this image as a slow, seamless cinematic loop of about 6 seconds: mist drifting slowly, embers floating upward, torch flames flickering, a lit balcony glowing softly, fine golden threads shimmering faintly. The camera pans very slowly to the right. No people moving, no sudden changes, the last frame must match the first.
```

## Fase 10 — Espansioni

Concept per i capitoli successivi alla campagna principale. Basta una tavola per luogo, su Grok, per decidere l'atmosfera.

### 10.1 · Casertavecchia · Le Campane del Perdono

Il borgo medievale e il Campanaro Senza Volto, che risveglia i rimorsi con i rintocchi.

- **Allega:** 1) stile.png  2) ferruccio.png
- **Salva come:** `concept_casertavecchia.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Format: 16:9 concept painting for a future chapter of the game.

Scene: the medieval hilltop village of Casertavecchia at night: narrow stone lanes, the Norman cathedral with its bell tower, mist pouring down the hill. Inside the belfry stands the boss, Il Campanaro Senza Volto: a towering figure of grey stone with a smooth, faceless head, ropes of old bells wrapped around his arms; each toll sends visible rings of pale light through the air, in which faint ghostly faces of unspoken regrets appear. Small at the bottom of the bell tower, the hero (reference image 2) looks up.

Hero: Ferruccio, a young blacksmith whose consciousness is trapped in a Pulcinella costume: a small, slender knight with slightly childlike proportions (large head, small body). Loose white Pulcinella smock reaching the knees, gathered by a thin black belt, white trousers, small black shoes. A black half-mask over the upper face with a long hooked nose; two softly glowing white eyes behind the mask. A tall white conical hat (coppolone), slightly bent backwards. A long red wool scarf knotted at the neck, its tail flowing behind him. A thin, simple sword hand-forged from blacksmith's tools: dark hammered iron, a plain crossguard, a leather-wrapped grip. He is mute; his emotion shows only through posture.
```

### 10.2 · Acquedotto Carolino · Le Acque della Memoria

Gli archi monumentali e il Guardiano delle Sorgenti, attraversato da acqua luminosa.

- **Allega:** 1) stile.png  2) ferruccio.png
- **Salva come:** `concept_acquedotto.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Format: 16:9 concept painting for a future chapter of the game.

Scene: the monumental Carolino Aqueduct at dusk: three tiers of colossal stone arches crossing a misty valley, and below them flooded underground conduits where stolen memories float in the water as small glowing scenes. The boss, Il Guardiano delle Sorgenti, is a gigantic figure of mossy stone through whose cracks luminous turquoise water flows like veins. Small on a ledge, the hero faces it.

Hero: Ferruccio, a young blacksmith whose consciousness is trapped in a Pulcinella costume: a small, slender knight with slightly childlike proportions (large head, small body). Loose white Pulcinella smock reaching the knees, gathered by a thin black belt, white trousers, small black shoes. A black half-mask over the upper face with a long hooked nose; two softly glowing white eyes behind the mask. A tall white conical hat (coppolone), slightly bent backwards. A long red wool scarf knotted at the neck, its tail flowing behind him. A thin, simple sword hand-forged from blacksmith's tools: dark hammered iron, a plain crossguard, a leather-wrapped grip. He is mute; his emotion shows only through posture.
```

### 10.3 · Santa Maria Capua Vetere · L'Arena dei Dimenticati

L'Anfiteatro Campano e il Giudice dell'Arena, custode di antichi giuramenti.

- **Allega:** 1) stile.png  2) ferruccio.png
- **Salva come:** `concept_arena.png`

```text
Hand-painted 2D video game art, digital painting with soft, slightly irregular ink outlines and visible but clean brushwork. Fairy-tale noir mood: melancholic, mysterious, elegant, never gory. Deep atmospheric perspective with drifting mist. Mostly dark, desaturated night blues and slate greys, lit by a few warm glowing sources (gas lamps, candles, torches) and occasional cold azure magical glow. Strong, readable silhouettes. World: a dreamlike alternate Caserta, Kingdom of the Two Sicilies, 1845, Bourbon neoclassical architecture. No text, no letters, no logos, no watermark.

Format: 16:9 concept painting for a future chapter of the game.

Scene: the ruined Roman Amphitheatre of Capua at night under a pale moon, broken arches and sand. Translucent memories of fighters from many eras stand silently in the stands: Roman gladiators, medieval soldiers, Bourbon guards. At the center rises the boss, Il Giudice dell'Arena: an ancient armored figure of bronze and stone holding a set of scales in one hand and a scroll of oaths in the other, golden threads older than the city running from the scroll into the ground. Small in the arena, the hero waits.

Hero: Ferruccio, a young blacksmith whose consciousness is trapped in a Pulcinella costume: a small, slender knight with slightly childlike proportions (large head, small body). Loose white Pulcinella smock reaching the knees, gathered by a thin black belt, white trousers, small black shoes. A black half-mask over the upper face with a long hooked nose; two softly glowing white eyes behind the mask. A tall white conical hat (coppolone), slightly bent backwards. A long red wool scarf knotted at the neck, its tail flowing behind him. A thin, simple sword hand-forged from blacksmith's tools: dark hammered iron, a plain crossguard, a leather-wrapped grip. He is mute; his emotion shows only through posture.
```

## Frasi di correzione

Da incollare su Grok in modalità modifica quando un'immagine esce sbagliata.

**Lo sfondo non è verde piatto**

```text
Replace the entire background with flat, uniform pure chroma green (#00FF00). Keep the subject exactly the same, with clean edges.
```

**Il personaggio guarda a sinistra o è di tre quarti**

```text
Same character, same details, but in strict side view facing right, full body, centered.
```

**È comparso del testo o una firma**

```text
Remove all text, letters, signatures and logos. Change nothing else.
```

**È diverso dal riferimento**

```text
Match reference image 2 exactly: same face, costume, proportions and colors. Only change what I asked.
```

**Silhouette poco leggibile**

```text
Strengthen the silhouette: darker ink outline around the subject, clearer separation between the shapes, keep the same design.
```

**Troppo luminoso o troppo saturo**

```text
Make it darker and less saturated, closer to the style of reference image 1, keeping only a few warm glowing light sources.
```

**Allargare uno strato di sfondo (dopo aver scelto un formato più largo con il cambio di formato)**

```text
Extend this panorama seamlessly to the sides, continuing the same scene, architecture, light and flat green areas. Do not repeat any element exactly and do not add characters.
```

**Cambiare solo una zona (dopo averla selezionata)**

```text
Change only the selected area as described here, keeping everything outside the selection exactly the same: 
```
