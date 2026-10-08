#!/usr/bin/env python3
"""Prepara Ferruccio per il rig a mesh deformabile (src/game/char_rig.gd + canvas_char_mesh.gdshader).

Il vecchio pupazzo (rig_ferruccio.py) ruota quattro immagini rigide: si vedono i tagli. Qui l'immagine
diventa una griglia di triangoli piegata nel vertex shader secondo una mappa dei pesi, come le mesh
pesate di Spine/DragonBones: ogni vertice segue le "ossa" in proporzione al suo peso, e dove il peso
sfuma la pittura si piega invece di spezzarsi.

Uscite in src/assets/art/characters/ferruccio_rig/ (stessa tela 679x1024 dell'originale):
  figura.png      corpo + gamba vicina, senza spada né mano; il camicione dietro la mano è ricostruito
  mano_spada.png  guanto, impugnatura e lama, ripuliti dal camicione; il polso continua sotto il polsino
                  così, quando la mano ruota, non si apre un vuoto tra guanto e manica
  pesi.png        mappa dei pesi: due riquadri affiancati (a 1/4 di risoluzione), alfa sempre 255
                  riquadro sinistro  R gamba vicina   G gamba lontana   B cappello
                  riquadro destro    R sciarpa        G manica          B orlo del camicione
                  (alfa piena: l'import di Godot non tocca i colori, nessun .import speciale serve)
La gamba lontana resta gamba_dietro.png di rig_ferruccio.py: lo shader la disegna in uno strato a parte.

Se cambiano l'immagine o i punti qui sotto, vanno ricontrollate le costanti in src/game/char_rig.gd
(perni) e i default dello shader.

Uso: python3 tools/art/rig_ferruccio_mesh.py [--debug CARTELLA]
"""

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent))
import rig_ferruccio as rf  # noqa: E402  (stessi tagli delle gambe e stessa tela)

OUT = rf.OUT
TILE_DIV = 4  # la mappa dei pesi è campionata solo ai vertici: 1/4 di risoluzione basta

# --- Spada e mano ---------------------------------------------------------------------------------
# Sopra il camicione la spada è più scura del tessuto in ombra (luma ~95-135): sotto questa soglia
# un pixel delle forme qui sotto è spada; sopra, solo se sta in lama o elsa (sottili e precise).
SWORD_DARK = 86.0
GLOVE = [(334, 610), (402, 610), (408, 660), (400, 702), (350, 702), (332, 668)]
POMMEL = ((300, 628), 14)
GRIP = ([(308, 630), (350, 652)], 18)
CROSSGUARD = ([(432, 636), (380, 724)], 18)
BLADE = [(398, 668), (426, 672), (684, 874), (684, 886), (666, 886), (396, 698)]
# Polsino della manica: la mano continua sotto di esso fino a WRIST_TOP (resta coperta).
CUFF = (333, 594, 397, 619)
WRIST_TOP = 600

# --- Cappello -------------------------------------------------------------------------------------
# Bordo inferiore della fascia (sotto c'è la maschera): due punti della retta.
HAT_BAND_LOW = ((300.0, 238.0), (455.0, 118.0))
# Bordo superiore della fascia: da qui il cono comincia a piegarsi.
HAT_BAND_TOP = ((285.0, 200.0), (430.0, 88.0))
HAT_FOLD_X = (245.0, 150.0)  # la punta floscia va dalla piega (x=245) alla punta (x=150)

# --- Sciarpa --------------------------------------------------------------------------------------
SCARF_KNOT = (345.0, 318.0)
SCARF_RANGE_BACK = (70.0, 430.0)   # coda lunga dietro: peso 0 al nodo, 1 alle frange
SCARF_RANGE_FRONT = (50.0, 190.0)  # coda corta davanti
SCARF_FRONT_X = 375.0

# --- Manica ---------------------------------------------------------------------------------------
SLEEVE = [(298, 338), (392, 338), (408, 450), (414, 560), (402, 600), (398, 621), (332, 621),
          (300, 592), (288, 500), (290, 400)]
SLEEVE_RAMP = (390.0, 575.0)  # dalla spalla (fermo) al polsino (segue del tutto il braccio)

# --- Orlo -----------------------------------------------------------------------------------------
HEM_RAMP = (560.0, 765.0)

# --- Gambe ----------------------------------------------------------------------------------------
# Rampa dell'anca: sotto l'orlo il peso sale piano, così i calzoni si piegano invece di tagliarsi.
LEG_RAMP_FRONT = (rf.HEM_Y + 4.0, rf.HEM_Y + 58.0)
LEG_RAMP_BACK = (rf.HEM_Y - 6.0, rf.HEM_Y + 48.0)


def smoothstep(e0: float, e1: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def line_side(p0: tuple[float, float], p1: tuple[float, float], xs: np.ndarray, ys: np.ndarray) -> np.ndarray:
    """Distanza con segno dalla retta p0-p1; positiva a sinistra del verso p0->p1 (in alto, sull'immagine)."""
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    n = np.hypot(dx, dy)
    return ((xs - p0[0]) * dy - (ys - p0[1]) * dx) / n


def shape(size: tuple[int, int], poly=None, line=None, disk=None) -> np.ndarray:
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    if poly:
        d.polygon(poly, fill=255)
    if line:
        d.line(line[0], fill=255, width=line[1])
        for x, y in line[0]:
            r = line[1] / 2
            d.ellipse((x - r, y - r, x + r, y + r), fill=255)
    if disk:
        (x, y), r = disk
        d.ellipse((x - r, y - r, x + r, y + r), fill=255)
    return np.asarray(m) > 0


def blur(a: np.ndarray, r: float) -> np.ndarray:
    return ndimage.gaussian_filter(a.astype(np.float32), r) if r > 0 else a.astype(np.float32)


def hsv(px: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    rgb = px[..., :3] / 255.0
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.zeros_like(mx)
    safe = np.where(d > 1e-6, d, 1.0)
    h = np.where(mx == r, ((g - b) / safe) % 6.0, h)
    h = np.where(mx == g, (b - r) / safe + 2.0, h)
    h = np.where(mx == b, (r - g) / safe + 4.0, h)
    h = np.where(d > 1e-6, h / 6.0, 0.0)
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0.0)
    return h, s, mx


def sword_mask(px: np.ndarray, size: tuple[int, int]) -> np.ndarray:
    """Guanto, pomolo, impugnatura, elsa e lama, senza le toppe di camicione intorno alla mano."""
    luma = px[..., :3] @ np.array([0.299, 0.587, 0.114], np.float32)
    opaque = px[..., 3] > 8
    rows, cols = np.mgrid[0:size[1], 0:size[0]]
    outside = (cols >= rf.TUNIC_RIGHT) | (rows >= rf.HEM_Y)
    soft = shape(size, poly=GLOVE) | shape(size, line=GRIP) | shape(size, disk=POMMEL)
    thin = shape(size, poly=BLADE) | shape(size, line=CROSSGUARD)
    m = (soft & (luma < SWORD_DARK)) | (thin & (luma < 200.0)) | ((soft | thin) & outside)
    m &= opaque
    # Chiude i riflessi chiari dentro pomolo, guanto e impugnatura, senza uscire dalle forme.
    m = ndimage.binary_closing(m, iterations=3) & (soft | thin) & opaque
    m = ndimage.binary_fill_holes(m)
    # Via le briciole staccate (pixel scuri isolati del tessuto).
    lab, n = ndimage.label(m)
    if n > 1:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        m = np.isin(lab, 1 + np.flatnonzero(sizes >= 60))
    return m


def fill_columns(rgba: np.ndarray, hole: np.ndarray, no_top: np.ndarray) -> np.ndarray:
    """Richiude il camicione dietro la mano colonna per colonna: le pieghe sono verticali, quindi
    sfumare tra il tessuto sopra e quello sotto il buco ne continua il disegno. Dove sopra c'è il
    polsino (no_top) si usa solo il tessuto sotto, scurito un poco: è l'ombra della manica."""
    out = rgba.copy()
    h = rgba.shape[0]
    for x in np.flatnonzero(hole.any(axis=0)):
        col = hole[:, x]
        ys = np.flatnonzero(col)
        # Spezza la colonna in tratti contigui.
        breaks = np.flatnonzero(np.diff(ys) > 1)
        starts = np.concatenate([[ys[0]], ys[breaks + 1]])
        ends = np.concatenate([ys[breaks], [ys[-1]]])
        for y0, y1 in zip(starts, ends):
            above = rgba[max(0, y0 - 5):max(0, y0 - 1), x]
            below = rgba[min(h, y1 + 2):min(h, y1 + 6), x]
            ok_a = len(above) > 0 and above[:, 3].min() > 200 and not no_top[max(0, y0 - 3), x]
            ok_b = len(below) > 0 and below[:, 3].min() > 200
            c_top = np.median(above, axis=0) if ok_a else None
            c_bot = np.median(below, axis=0) if ok_b else None
            if c_top is None and c_bot is None:
                continue
            if c_top is None:
                c_top = c_bot * np.array([0.86, 0.86, 0.88, 1.0])
            if c_bot is None:
                c_bot = c_top
            t = np.linspace(0.0, 1.0, y1 - y0 + 1)[:, None]
            out[y0:y1 + 1, x] = c_top * (1.0 - t) + c_bot * t
    # Una leggera media orizzontale toglie le righe dove le colonne vicine differiscono.
    sm = ndimage.uniform_filter1d(out, 5, axis=1)
    out[hole] = sm[hole]
    out[hole, 3] = 255.0
    return out


def tile(w: np.ndarray, size: tuple[int, int]) -> np.ndarray:
    """Riduce un peso a 1/TILE_DIV (media d'area) e azzera il bordo, così i due riquadri affiancati
    non si contaminano col filtro lineare."""
    img = Image.fromarray((np.clip(w, 0.0, 1.0) * 255.0).astype(np.uint8), "L")
    small = np.asarray(img.resize(size, Image.BOX)).astype(np.uint8).copy()
    small[:2, :] = 0
    small[-2:, :] = 0
    small[:, :2] = 0
    small[:, -2:] = 0
    return small


def save(arr: np.ndarray, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA").save(OUT / f"{name}.png", optimize=True)
    print(f"  characters/ferruccio_rig/{name}.png")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--debug", type=Path, help="salva qui le mappe dei pesi sovrapposte al personaggio")
    args = ap.parse_args()

    img = Image.open(rf.SRC).convert("RGBA")
    size = img.size
    px = np.asarray(img).astype(np.float32)
    opaque = px[..., 3] > 8
    rows, cols = np.mgrid[0:size[1], 0:size[0]].astype(np.float32)
    luma = px[..., :3] @ np.array([0.299, 0.587, 0.114], np.float32)

    front = rf.poly_mask(size, rf.LEG_FRONT) & opaque
    back = rf.poly_mask(size, rf.LEG_BACK) & opaque
    sword = sword_mask(px, size)
    outside = (cols >= rf.TUNIC_RIGHT) | (rows >= rf.HEM_Y)

    # ---- mano_spada: la mano e la lama, col polso allungato sotto il polsino.
    hand = px.copy()
    hand[~sword, 3] = 0.0
    glove_dark = sword & shape(size, poly=GLOVE) & (luma < 40.0)
    glove_rgb = np.median(px[glove_dark][:, :3], axis=0)
    cx0, cy0, cx1, cy1 = CUFF
    top_row = np.flatnonzero(sword[cy1 + 2, cx0:cx1 + 1])
    if len(top_row):
        wx0, wx1 = cx0 + top_row.min() + 2, cx0 + top_row.max() - 2
        wrist = (rows >= WRIST_TOP) & (rows <= cy1 + 3) & (cols >= wx0) & (cols <= wx1) & ~sword
        hand[wrist, :3] = glove_rgb
        hand[wrist, 3] = 255.0
    save(hand, "mano_spada")

    # ---- figura: corpo + gamba vicina, camicione ricostruito dietro la mano.
    body = px.copy()
    hole = ndimage.binary_dilation(sword, iterations=2) & ~outside & opaque & ~front & ~back
    cuff = (cols >= cx0) & (cols <= cx1) & (rows >= cy0) & (rows <= cy1 + 2)
    body = fill_columns(body, hole, cuff)
    body[back, 3] = 0.0
    body[sword & outside, 3] = 0.0
    save(body, "figura")

    # ---- pesi
    fig_opaque = body[..., 3] > 8
    tunic = fig_opaque & ~front & ~back  # tutto ciò che non è gamba
    tunic_soft = blur(tunic & (rows > rf.HEM_Y - 60), 4.0)

    w_front = smoothstep(*LEG_RAMP_FRONT, rows) * (rows > rf.HEM_Y - 20) * np.clip(1.0 - 1.6 * tunic_soft, 0, 1)
    w_back = smoothstep(*LEG_RAMP_BACK, rows) * (rows > rf.HEM_Y - 20) * np.clip(1.0 - 1.6 * tunic_soft, 0, 1)
    w_front = blur(w_front, 6.0)
    w_back = blur(w_back, 6.0)

    # Cappello: peso 0 sulla fascia, cresce lungo il cono e soprattutto verso la punta floscia.
    above_band = line_side(*HAT_BAND_LOW, cols, rows) > 0.0
    hat = fig_opaque & above_band & (luma > 70.0) & (rows < 250) & (cols < 470)
    d_band = line_side(*HAT_BAND_TOP, cols, rows)
    w_hat = 0.35 * smoothstep(0.0, 150.0, d_band) + 0.65 * smoothstep(HAT_FOLD_X[0], HAT_FOLD_X[1], cols)
    w_hat = w_hat * smoothstep(-6.0, 20.0, d_band)
    # Si allarga nel vuoto attorno (i vertici del contorno), mai sulla maschera.
    hat_zone = ndimage.binary_dilation(hat, iterations=30) & (above_band | ~fig_opaque) & (rows < 260)
    hat_zone &= ~(fig_opaque & ~hat)
    w_hat = blur(w_hat * hat_zone, 5.0)

    # Sciarpa: tinta rossa satura; peso radiale dal nodo, frange a 1.
    h, s, v = hsv(body)
    hue_d = np.minimum(h, 1.0 - h)
    scarf = fig_opaque & (hue_d < 0.09) & (s > 0.25) & (v > 0.08) & (rows < 770) & (rows > 240)
    scarf = ndimage.binary_opening(scarf, iterations=1)
    scarf = ndimage.binary_closing(scarf, iterations=4) & fig_opaque
    dist = np.hypot(cols - SCARF_KNOT[0], rows - SCARF_KNOT[1])
    front_side = smoothstep(SCARF_FRONT_X - 15.0, SCARF_FRONT_X + 15.0, cols)
    r0 = SCARF_RANGE_BACK[0] + (SCARF_RANGE_FRONT[0] - SCARF_RANGE_BACK[0]) * front_side
    r1 = SCARF_RANGE_BACK[1] + (SCARF_RANGE_FRONT[1] - SCARF_RANGE_BACK[1]) * front_side
    w_scarf_raw = np.clip((dist - r0) / (r1 - r0), 0.0, 1.0)
    w_scarf_raw = w_scarf_raw * w_scarf_raw * (3.0 - 2.0 * w_scarf_raw)
    other = fig_opaque & ~scarf
    scarf_zone = ndimage.binary_dilation(scarf, iterations=24) & ~ndimage.binary_dilation(other, iterations=2)
    scarf_zone |= scarf
    w_scarf = blur(w_scarf_raw * scarf_zone, 5.0) * np.clip(1.0 - 1.4 * blur(other, 3.0), 0.0, 1.0)

    # Manica: segue il braccio dal gomito in giù.
    sleeve = shape(size, poly=SLEEVE) & fig_opaque & ~scarf
    w_arm = smoothstep(*SLEEVE_RAMP, rows) * sleeve
    w_arm = blur(w_arm, 7.0)

    # Orlo: il camicione sotto la cintura, più libero verso il fondo; non manica, non sciarpa.
    skirt = tunic & ~scarf & ~ndimage.binary_dilation(sleeve, iterations=6)
    w_hem = smoothstep(*HEM_RAMP, rows) * skirt
    hem_zone = ndimage.binary_dilation(skirt, iterations=20) & (rows < rf.HEM_Y + 14) & ~front & ~back
    w_hem = np.maximum(w_hem, blur(w_hem, 8.0) * hem_zone * ~fig_opaque)
    w_hem = blur(w_hem, 4.0)

    tw, th = (size[0] + TILE_DIV - 1) // TILE_DIV, (size[1] + TILE_DIV - 1) // TILE_DIV
    left = np.stack([tile(w_front, (tw, th)), tile(w_back, (tw, th)), tile(w_hat, (tw, th))], -1)
    right = np.stack([tile(w_scarf, (tw, th)), tile(w_arm, (tw, th)), tile(w_hem, (tw, th))], -1)
    atlas = np.concatenate([left, right], axis=1)
    alpha = np.full(atlas.shape[:2] + (1,), 255, np.uint8)
    Image.fromarray(np.concatenate([atlas, alpha], -1), "RGBA").save(OUT / "pesi.png", optimize=True)
    print(f"  characters/ferruccio_rig/pesi.png ({atlas.shape[1]}x{atlas.shape[0]})")

    if args.debug:
        args.debug.mkdir(parents=True, exist_ok=True)
        base = Image.new("RGBA", size, (40, 40, 48, 255))
        base.alpha_composite(Image.fromarray(body.clip(0, 255).astype(np.uint8), "RGBA"))
        base = np.asarray(base.convert("RGB")).astype(np.float32) * 0.45
        for name, w, col in (("gambe", w_front, (255, 60, 60)), ("gamba_dietro", w_back, (60, 255, 60)),
                             ("cappello", w_hat, (80, 120, 255)), ("sciarpa", w_scarf, (255, 200, 40)),
                             ("manica", w_arm, (40, 255, 255)), ("orlo", w_hem, (255, 60, 255))):
            o = base + np.clip(w, 0, 1)[..., None] * np.array(col, np.float32) * 0.8
            Image.fromarray(o.clip(0, 255).astype(np.uint8)).save(args.debug / f"peso_{name}.png")
        crop = (260, 560, 480, 740)
        for name, arr in (("figura", body), ("mano", hand)):
            c = Image.new("RGBA", size, (255, 0, 255, 255))
            c.alpha_composite(Image.fromarray(arr.clip(0, 255).astype(np.uint8), "RGBA"))
            c.crop(crop).resize(((crop[2] - crop[0]) * 3, (crop[3] - crop[1]) * 3), Image.NEAREST).save(args.debug / f"zoom_{name}.png")


if __name__ == "__main__":
    main()
