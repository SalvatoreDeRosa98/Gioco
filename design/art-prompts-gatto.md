# Prompt Grok — animazioni del gatto nero

Design di riferimento: il foglio con fronte, profilo e retro (gatto nero, occhi ambra, coda lunga).
Ogni animazione è un foglio di fotogrammi: il gioco riproduce i fotogrammi in sequenza a fps fisso.

## Come si usano

1. **Allega sempre** l'immagine 1 = il foglio di design del gatto.
2. Per le animazioni successive alla prima, allega anche **il primo fotogramma già approvato** come immagine 2: tiene la figura identica da un foglio all'altro.
3. Incolla il prompt, scegli la variante con le pose più pulite e il gatto uguale al design.
4. Salva con il nome indicato in **Salva come**, cartella `assets/art-source/nemici/gatto/`.

## Blocco comune (incluso in ogni prompt)

```
Reference image 1 is the CHARACTER design to keep exactly: same black cat, same proportions, same build, same fur rendering, same amber-yellow eyes, same ears and tail. Render it exactly as in reference image 1. Mirror the side view so the cat faces RIGHT.

Sprite sheet for a 2D game: frames of the same cat, laid out left to right in ONE row, each frame in an identical square cell of equal size. Strict side view facing right. The same camera distance, the same scale and the same feet baseline in every frame; the cat is centered in its cell with a small margin. The cat must look identical in every frame except for the pose.

No shadow, no floor, no ground line, no text, no letters, no logos, no watermark. Background: flat, uniform pure chroma green (#00FF00) with no gradient, no texture and no vignette, so the frames can be cut out cleanly.
```

---

## 1. rest_siede — riposo seduto (4 fotogrammi, loop)

Salva come: `gatto/rest_siede.jpg`

```
[blocco comune]

Action, 4 frames in a loop: the cat sits on its haunches, front legs straight, tail curled around the front paws. Head still, ears relaxed. Across the frames: a slow breath (chest rises and falls slightly) and a small tail-tip twitch.
```

## 2. rest_guarda — si guarda intorno (4 fotogrammi, loop)

Salva come: `gatto/rest_guarda.jpg`

```
[blocco comune]

Action, 4 frames in a loop: the cat sits, head turns slowly from facing forward toward the left, then back, then toward the right, ears rotating with the head. Body stays still, tail lies calm on the ground.
```

## 3. walk — camminata (8 fotogrammi, loop)

Salva come: `gatto/walk.jpg`

```
[blocco comune]

Action, 8 frames forming one full walk cycle: a calm, smooth walk with a diagonal gait (front-left paired with back-right). Legs clearly separated, body rising and falling slightly, head level, tail held up and relaxed.
```

## 4. chase — corsa d'inseguimento (6 fotogrammi, loop)

Salva come: `gatto/chase.jpg`

```
[blocco comune]

Action, 6 frames forming one full run cycle: fast, long strides, body stretched forward and low, head forward, ears back, tail horizontal behind. Legs fully extended at the top of each stride.
```

## 5. notice — si accorge del giocatore (3 fotogrammi, una volta)

Salva come: `gatto/notice.jpg`

```
[blocco comune]

Action, 3 frames, played once: from calm to alert. Frame 1 relaxed; frame 2 the head snaps up and ears stand up; frame 3 the back arches slightly and the tail puffs up, eyes wide.
```

## 6. turn — si gira (3 fotogrammi, una volta)

Salva come: `gatto/turn.jpg`

```
[blocco comune]

Action, 3 frames, played once: the cat turns around from facing right to facing left, shown in side view. Frame 1 facing right; frame 2 the body turns so the head is toward the viewer in three-quarter view; frame 3 facing left, mirrored side view.
```

## 7. crouch — si accuccia prima del salto (3 fotogrammi, una volta)

Salva come: `gatto/crouch.jpg`

```
[blocco comune]

Action, 3 frames, played once: from standing to fully crouched. Frame 1 standing; frame 2 hindquarters lowered, front legs bent; frame 3 fully crouched, shoulders low, body coiled, tail low and still, ears back.
```

## 8. windup — preavviso dell'attacco (3 fotogrammi, una volta)

Salva come: `gatto/windup.jpg`

```
[blocco comune]

Action, 3 frames, played once: the cat draws back to prepare a claw strike. Body coils back, one front paw raised high with claws extended, head lowered, tail stiff upward.
```

## 9. jump — salto (4 fotogrammi, una volta)

Salva come: `gatto/jump.jpg`

```
[blocco comune]

Action, 4 frames, played once: a leap. Frame 1 pushing off the ground, legs fully extended behind; frame 2 rising, body stretched; frame 3 at the top of the arc, legs tucked; frame 4 beginning to extend the front legs forward. Tail up for balance.
```

## 10. land — atterraggio (3 fotogrammi, una volta)

Salva come: `gatto/land.jpg`

```
[blocco comune]

Action, 3 frames, played once: landing after a jump. Frame 1 the paws touch the ground, legs bent under the body; frame 2 the body compressed at its lowest point; frame 3 recovering, legs straightening, back slightly rounded.
```

## 11. pounce — balzo d'attacco (4 fotogrammi, una volta)

Salva come: `gatto/pounce.jpg`

```
[blocco comune]

Action, 4 frames, played once: a lunge attack. Frame 1 launching forward; frame 2 fully stretched in mid-air, front paws reaching forward with claws out, mouth open; frame 3 the strike, front paws extended; frame 4 landing forward, body compressing.
```

## 12. hurt — colpito (4 fotogrammi, una volta)

Salva come: `gatto/hurt.jpg`

```
[blocco comune]

Action, 4 frames, played once: the cat is hit and recoils. Frame 1 the impact, head snapping back; frame 2 body arched backward, ears flat, eyes narrowed; frame 3 starting to recover; frame 4 back to a steady stance.
```

## 13. retreat — ritirata (6 fotogrammi, loop)

Salva come: `gatto/retreat.jpg`

```
[blocco comune]

Action, 6 frames forming one full cycle: the cat backs away, walking backward with the body low, head turned forward watching the threat, ears forward, tail lowered.
```

---

## Note

- **Fps nel gioco** (da decidere quando integriamo): 12 per riposo, camminata e ritirata; 24 per corsa, preavviso, salto, atterraggio, balzo, colpito, notice, crouch.
- **Morte**: non è tra gli stati attuali del gatto nel codice. La aggiungo solo se la vuoi.
- **Stile**: il foglio di design è fotorealistico, il resto del gioco è dipinto. Se vuoi la resa dipinta del gioco, sostituisci il primo paragrafo del blocco comune con lo stile di `design/art-prompts.md`.
