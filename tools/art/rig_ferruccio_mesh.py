#!/usr/bin/env python3
"""Prepara Ferruccio per il rig a mesh deformabile (src/game/char_rig.gd + canvas_char_mesh.gdshader).

Un pupazzo di immagini rigide ruotate attorno a perni mostra i tagli. Qui l'immagine
diventa una griglia di triangoli piegata nel vertex shader secondo una mappa dei pesi, come le mesh
pesate di Spine/DragonBones: ogni vertice segue le "ossa" in proporzione al suo peso, e dove il peso
sfuma la pittura si piega invece di spezzarsi.

Uscite in src/assets/art/characters/ferruccio_rig/ (stessa tela 679x1024 dell'originale):
  figura.png      corpo + gamba vicina, senza spada, mano e coda della sciarpa; il camicione dietro la
                  mano è ricostruito
  mano_spada.png  guanto, impugnatura e lama, ripuliti dal camicione; il polso continua sotto il polsino
                  così, quando la mano ruota, non si apre un vuoto tra guanto e manica
  pesi.png        mappa dei pesi: due riquadri affiancati (a 1/4 di risoluzione), alfa sempre 255
                  riquadro sinistro  R gamba vicina   G gamba lontana   B cappello
                  riquadro destro    R sciarpa        G manica          B orlo del camicione
                  (alfa piena: l'import di Godot non tocca i colori, nessun .import speciale serve)
  dietro.png      ciò che sta dietro il corpo: gamba lontana e coda lunga della sciarpa. Lo shader lo
                  disegna in uno strato a parte, sotto la figura: muovendosi scopre il vuoto, non stira.

Se cambiano l'immagine o i punti qui sotto, vanno ricontrollate le costanti in src/game/char_rig.gd
(perni) e i default dello shader.

Uso: python3 tools/art/rig_ferruccio_mesh.py [--debug CARTELLA]
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "src/assets/art/characters/ferruccio.png"
OUT = ROOT / "src/assets/art/characters/ferruccio_rig"
TILE_DIV = 4  # la mappa dei pesi è campionata solo ai vertici: 1/4 di risoluzione basta

# --- Gambe (tagli in pixel dell'immagine 679x1024 prodotta da import_art.py) --------------------
HEM_Y = 550  # sotto l'orlo del camicione iniziano le gambe
# Confine tra le due gambe: piega dei calzoni, poi calza vicina, poi bordo della scarpa vicina.
_SPLIT = [(372, HEM_Y), (372, 868), (356, 880), (356, 955), (372, 958), (395, 966), (418, 976), (440, 992), (440, 1024)]
LEG_FRONT = [(280, HEM_Y)] + _SPLIT + [(280, 1024)]
LEG_BACK = _SPLIT + [(470, 1024), (470, HEM_Y)]
# Il camicione finisce a destra di questa colonna (più in basso lo dice TUNIC_EDGE) e sotto HEM_Y.
TUNIC_RIGHT = 466

# --- Spada e mano ---------------------------------------------------------------------------------
# Sopra il camicione guanto e contorni del metallo sono più scuri del tessuto in ombra (luma ~80-135).
SWORD_DARK = 62.0
GLOVE = [(340, 618), (402, 615), (408, 660), (400, 702), (350, 702), (336, 668)]
POMMEL = ((300, 628), 14)
GRIP = ([(306, 628), (352, 652)], 24)
CROSSGUARD = ([(432, 636), (380, 724)], 18)
# Lama: rette dei due fili misurate sull'alfa fuori dal camicione (y = 0.789x + 340.7, y = 0.700x + 405.6).
BLADE = [(404, 658), (690, 884), (690, 892), (404, 691)]
# Bordo destro del camicione dove lo attraversa la lama (misurato a occhio sull'immagine): la striscia
# di tessuto oltre TUNIC_RIGHT va ricostruita, non tolta, altrimenti resta una tacca nella sagoma.
TUNIC_EDGE = ((472.0, 650.0), (483.0, 765.0))
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
# La coda dietro la schiena: a sinistra del bordo del corpo e sotto il nodo.
TAIL_MAX_X = 312
TAIL_MIN_Y = 330

# --- Manica ---------------------------------------------------------------------------------------
SLEEVE = [(298, 338), (392, 338), (408, 450), (414, 560), (402, 600), (398, 621), (332, 621),
          (300, 592), (288, 500), (290, 400)]
SLEEVE_RAMP = (350.0, 420.0)  # dalla spalla (fermo) al polsino (segue del tutto il braccio)

# --- Orlo -----------------------------------------------------------------------------------------
HEM_RAMP = (560.0, 765.0)

# --- Gambe ----------------------------------------------------------------------------------------
# Rampa dell'anca: sotto l'orlo il peso sale piano, così i calzoni si piegano invece di tagliarsi.
LEG_RAMP_FRONT = (HEM_Y + 4.0, HEM_Y + 58.0)
LEG_RAMP_BACK = (HEM_Y - 6.0, HEM_Y + 48.0)


def poly_mask(size: tuple[int, int], pts: list[tuple[int, int]]) -> np.ndarray:
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).polygon(pts, fill=255)
    return np.asarray(m) > 0


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
    """Guanto, pomolo, impugnatura, elsa e lama, senza le toppe di camicione intorno alla mano.
    Il metallo e il guanto hanno un contorno scuro tutto intorno: si prendono i pixel scuri, si
    chiudono i contorni e si riempie l'interno (i riflessi chiari restano dentro)."""
    luma = px[..., :3] @ np.array([0.299, 0.587, 0.114], np.float32)
    opaque = px[..., 3] > 8
    rows, cols = np.mgrid[0:size[1], 0:size[0]]
    outside = beyond_tunic(rows, cols)
    area = shape(size, poly=GLOVE) | shape(size, line=GRIP) | shape(size, disk=POMMEL)
    area |= shape(size, poly=BLADE) | shape(size, line=CROSSGUARD)
    brown = shape(size, line=GRIP) & (px[..., 0] - px[..., 2] > 10.0) & (luma < 120.0)
    # La lama è sottile e il poligono la segue da vicino: dentro, anche il filo chiaro è lama.
    blade = shape(size, poly=BLADE) & (luma < 168.0)
    core = opaque & area & ((luma < SWORD_DARK) | brown | blade | (outside & (luma < 150.0)) | (cols > 490))
    core = ndimage.binary_closing(core, iterations=3) & area & opaque
    core = ndimage.binary_fill_holes(core)
    # Il bordo sfumato del disegno: un pixel in più dove il colore è ancora scuro.
    m = core | (ndimage.binary_dilation(core) & area & opaque & (luma < 120.0))
    # Via le briciole staccate (pixel scuri isolati del tessuto).
    lab, n = ndimage.label(m)
    if n > 1:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        m = np.isin(lab, 1 + np.flatnonzero(sizes >= 60))
    return m


def beyond_tunic(rows: np.ndarray, cols: np.ndarray) -> np.ndarray:
    """Fuori dal camicione: sotto l'orlo o oltre il suo bordo destro (dove la lama esce)."""
    edge = TUNIC_EDGE[0][0] + (rows - TUNIC_EDGE[0][1]) * (TUNIC_EDGE[1][0] - TUNIC_EDGE[0][0]) / (TUNIC_EDGE[1][1] - TUNIC_EDGE[0][1])
    return (cols >= np.maximum(edge, TUNIC_RIGHT)) | (rows >= HEM_Y)


def fill_columns(rgba: np.ndarray, hole: np.ndarray, no_top: np.ndarray) -> np.ndarray:
    """Richiude il camicione dietro la mano colonna per colonna: le pieghe sono verticali, quindi
    sfumare tra il tessuto sopra e quello sotto il buco ne continua il disegno. Il tono viene dalle
    parti chiare vicine (non dall'ombra che la mano proiettava), la trama dalle stesse colonne poco
    più sotto. Dove sopra c'è il polsino (no_top) si usa il tessuto sotto, scurito: l'ombra della manica."""
    h = rgba.shape[0]
    known = (rgba[..., 3] > 200) & ~hole
    base = rgba.copy()
    for x in np.flatnonzero(hole.any(axis=0)):
        ys = np.flatnonzero(hole[:, x])
        breaks = np.flatnonzero(np.diff(ys) > 1)
        starts = np.concatenate([[ys[0]], ys[breaks + 1]])
        ends = np.concatenate([ys[breaks], [ys[-1]]])
        for y0, y1 in zip(starts, ends):
            a_rows = np.arange(max(0, y0 - 16), max(0, y0 - 2))
            b_rows = np.arange(min(h, y1 + 3), min(h, y1 + 28))
            a_rows = a_rows[known[a_rows, x]]
            b_rows = b_rows[known[b_rows, x]]
            c_top = np.percentile(rgba[a_rows, x], 65, axis=0) if len(a_rows) > 3 and not no_top[max(0, y0 - 3), x] else None
            c_bot = np.percentile(rgba[b_rows, x], 65, axis=0) if len(b_rows) > 3 else None
            if c_top is None and c_bot is None:
                continue
            if c_top is None:
                c_top = c_bot * np.array([0.84, 0.84, 0.86, 1.0])
            if c_bot is None:
                c_bot = c_top
            t = np.linspace(0.0, 1.0, y1 - y0 + 1)[:, None]
            base[y0:y1 + 1, x] = c_top * (1.0 - t) + c_bot * t
    # Il tono si rilassa in 2D (media dei quattro vicini, bordi fermi): niente righe tra colonne
    # e nessuno scalino col tessuto ai lati. Il polsino non fa da bordo (è bianco e ha il contorno).
    dom = hole | no_top
    ys, xs = np.nonzero(dom)
    y0, y1, x0, x1 = max(ys.min() - 2, 1), min(ys.max() + 3, h - 1), max(xs.min() - 2, 1), xs.max() + 3
    sub = base[y0 - 1:y1 + 1, x0 - 1:x1 + 1].copy()
    m = dom[y0 - 1:y1 + 1, x0 - 1:x1 + 1]
    for _ in range(700):
        avg = 0.25 * (np.roll(sub, 1, 0) + np.roll(sub, -1, 0) + np.roll(sub, 1, 1) + np.roll(sub, -1, 1))
        sub[m] = avg[m]
    base[y0 - 1:y1 + 1, x0 - 1:x1 + 1] = sub
    # Ombra morbida sotto il polsino.
    rows = np.arange(h)[:, None]
    under = np.zeros(hole.shape, bool)
    under[:, no_top.any(axis=0)] = True
    ao = 1.0 - 0.16 * np.exp(-np.clip(rows - 618, 0, None) / 16.0) * under
    # Trama: il dettaglio fine (rispetto a una media dei soli pixel noti) delle stesse colonne,
    # qualche decina di righe più sotto (o sopra), dove le pieghe verticali continuano.
    k = known.astype(np.float32)
    lo = np.stack([ndimage.gaussian_filter(rgba[..., c] * k, 3.0) for c in range(3)], -1)
    lo /= np.maximum(ndimage.gaussian_filter(k, 3.0), 1e-3)[..., None]
    detail = np.where(known[..., None], rgba[..., :3] - lo, 0.0)
    tex = np.zeros_like(detail)
    have = np.zeros(hole.shape, bool)
    for shift in (40, 75, 110, -45):
        ok = np.roll(known, -shift, axis=0) & ~have
        tex[ok] = np.roll(detail, -shift, axis=0)[ok]
        have |= ok
    out = rgba.copy()
    out[hole, :3] = base[hole, :3] * ao[hole][:, None] + 0.75 * tex[hole]
    out[hole, 3] = 255.0
    return out


def tile(w: np.ndarray, size: tuple[int, int]) -> np.ndarray:
    """Riduce un peso a 1/TILE_DIV (media d'area). Il bordo resta com'è (i piedi toccano il fondo
    della tela): è lo shader a non leggere oltre il centro dell'ultimo texel di ogni riquadro."""
    img = Image.fromarray((np.clip(w, 0.0, 1.0) * 255.0).astype(np.uint8), "L")
    return np.asarray(img.resize(size, Image.BOX)).astype(np.uint8)


def save(arr: np.ndarray, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA").save(OUT / f"{name}.png", optimize=True)
    print(f"  characters/ferruccio_rig/{name}.png")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--debug", type=Path, help="salva qui le mappe dei pesi sovrapposte al personaggio")
    args = ap.parse_args()

    img = Image.open(SRC).convert("RGBA")
    size = img.size
    px = np.asarray(img).astype(np.float32)
    opaque = px[..., 3] > 8
    rows, cols = np.mgrid[0:size[1], 0:size[0]].astype(np.float32)
    luma = px[..., :3] @ np.array([0.299, 0.587, 0.114], np.float32)

    front = poly_mask(size, LEG_FRONT) & opaque
    back = poly_mask(size, LEG_BACK) & opaque
    sword = sword_mask(px, size)
    outside = beyond_tunic(rows, cols)

    # ---- mano_spada: la mano e la lama, col polso allungato sotto il polsino.
    hand = px.copy()
    hand[~sword, 3] = 0.0
    glove_dark = sword & shape(size, poly=GLOVE) & (luma < 40.0)
    glove_rgb = np.median(px[glove_dark][:, :3], axis=0)
    cx0, cy0, cx1, cy1 = CUFF
    top_row = np.flatnonzero(sword[cy1 + 2, cx0:cx1 + 1])
    if len(top_row):
        # Tronco di cono: largo quanto il guanto in basso, si stringe verso l'alto (resta sotto il polsino).
        wx0, wx1 = cx0 + top_row.min() + 3, cx0 + top_row.max() - 3
        inset = np.clip(cy1 + 3 - rows, 0, None) * 0.45
        wrist = (rows >= WRIST_TOP) & (rows <= cy1 + 3) & (cols >= wx0 + inset) & (cols <= wx1 - inset) & ~sword
        hand[wrist, :3] = glove_rgb
        hand[wrist, 3] = 255.0
    save(hand, "mano_spada")

    # ---- figura: corpo + gamba vicina, camicione ricostruito dietro la mano.
    body = px.copy()
    # Margine di 4 px: via anche il contorno scuro sfumato della spada, che scurirebbe il riempimento.
    hole = ndimage.binary_dilation(sword, iterations=4) & ~outside & opaque & ~front & ~back
    cuff = (cols >= cx0) & (cols <= cx1) & (rows >= cy0) & (rows <= cy1 + 2)
    hole &= ~(cuff & (rows <= cy1 - 2))  # il polsino dipinto resta intero
    body = fill_columns(body, hole, cuff)
    body[back, 3] = 0.0
    body[sword & outside, 3] = 0.0

    # ---- pesi
    fig_opaque = body[..., 3] > 8
    tunic = fig_opaque & ~front & ~back  # tutto ciò che non è gamba
    tunic_soft = blur(tunic & (rows > HEM_Y - 60), 4.0)

    w_front = smoothstep(*LEG_RAMP_FRONT, rows) * (rows > HEM_Y - 20) * np.clip(1.0 - 1.6 * tunic_soft, 0, 1)
    w_back = smoothstep(*LEG_RAMP_BACK, rows) * (rows > HEM_Y - 20) * np.clip(1.0 - 1.6 * tunic_soft, 0, 1)
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
    # Le frange hanno fili scuri e poco saturi: la chiusura larga li riporta dentro la sciarpa,
    # altrimenti resterebbero fermi mentre il resto ondeggia (strappo).
    scarf = ndimage.binary_fill_holes(ndimage.binary_closing(scarf, iterations=8)) & fig_opaque
    dist = np.hypot(cols - SCARF_KNOT[0], rows - SCARF_KNOT[1])
    front_side = smoothstep(SCARF_FRONT_X - 15.0, SCARF_FRONT_X + 15.0, cols)
    r0 = SCARF_RANGE_BACK[0] + (SCARF_RANGE_FRONT[0] - SCARF_RANGE_BACK[0]) * front_side
    r1 = SCARF_RANGE_BACK[1] + (SCARF_RANGE_FRONT[1] - SCARF_RANGE_BACK[1]) * front_side
    w_scarf_raw = np.clip((dist - r0) / (r1 - r0), 0.0, 1.0)
    w_scarf_raw = w_scarf_raw * w_scarf_raw * (3.0 - 2.0 * w_scarf_raw)
    # Il resto della figura (camicione, testa, cappello), senza i fili sciolti delle frange.
    other = ndimage.binary_opening(fig_opaque & ~scarf, iterations=3)
    scarf_zone = ndimage.binary_dilation(scarf, iterations=24) & ~ndimage.binary_dilation(other, iterations=2)
    scarf_zone |= scarf
    w_scarf = blur(w_scarf_raw * scarf_zone, 5.0) * np.clip(1.0 - 1.4 * blur(other, 3.0), 0.0, 1.0)

    # La coda lunga della sciarpa passa dietro la schiena: va nello strato di dietro con la gamba
    # lontana, così sollevandosi scopre il vuoto invece di stirare il bordo del camicione.
    # Tutto ciò che in quella zona non è il corpo (anche i fili e il bordo sfumato delle frange).
    lab, n = ndimage.label(other)
    core = np.isin(lab, 1 + np.flatnonzero(ndimage.sum(other, lab, range(1, n + 1)) > 5000))
    tail = fig_opaque & (cols < TAIL_MAX_X) & (rows > TAIL_MIN_Y) & ~ndimage.binary_dilation(core, iterations=2)
    behind = np.zeros_like(px)
    behind[back] = px[back]
    behind[tail] = body[tail]
    save(behind, "dietro")
    figure = body.copy()
    figure[tail, 3] = 0.0
    save(figure, "figura")

    # Manica: segue il braccio dal gomito in giù.
    sleeve = shape(size, poly=SLEEVE) & fig_opaque & ~scarf
    w_arm = smoothstep(*SLEEVE_RAMP, rows) * sleeve
    w_arm = blur(w_arm, 7.0)

    # Orlo: il camicione sotto la cintura, più libero verso il fondo; non manica, non sciarpa.
    skirt = ndimage.binary_opening(tunic & ~scarf & ~ndimage.binary_dilation(sleeve, iterations=6), iterations=3)
    lab, n = ndimage.label(skirt)
    if n > 1:  # solo il camicione: il pezzo più grande sotto la cintura
        low = skirt & (rows > HEM_RAMP[0])
        skirt = np.isin(lab, 1 + np.flatnonzero(ndimage.sum(low, lab, range(1, n + 1)) > 2000))
    w_hem = smoothstep(*HEM_RAMP, rows) * skirt
    hem_zone = ndimage.binary_dilation(skirt, iterations=20) & (rows < HEM_Y + 14) & ~front & ~back
    hem_zone &= ~ndimage.binary_dilation(scarf, iterations=12)
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
