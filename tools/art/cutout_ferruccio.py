#!/usr/bin/env python3
"""Taglia il dipinto di Ferruccio in pezzi per il pupazzo a ritaglio (src/game/cutout_rig.gd).

Dal dipinto originale (assets/art/characters/ferruccio.png, tela 679x1024) ricava pezzi separati
con le parti nascoste ridipinte, così ogni pezzo può ruotare attorno alla sua articolazione senza
scoprire buchi:

  testa      cappello, testa, maschera; il collo sotto la sciarpa è completato in nero
  busto      tunica e cintura; ricostruita sotto la manica, la mano, la spada e la sciarpa
  nodo       nodo della sciarpa e code davanti
  sciarpa1-3 coda lunga della sciarpa, in tre segmenti a catena
  manica_su  manica dalla spalla al gomito
  manica_giu sbuffo dal gomito al polsino
  mano       guanto, impugnatura e spada; il polso continua sotto il polsino
  coscia     calzone a sbuffo, prolungato sotto la tunica
  stinco     calza
  piede      scarpa

Gamba e braccio lontani riusano i pezzi vicini, scuriti dal gioco (vedi far_tint in rig.json).

Uscita: assets/art/characters/ferruccio_cutout/*.png + rig.json (posizione di ogni pezzo nella tela,
perni delle ossa, genitori e ordine di disegno). Tutte le coordinate sono pixel della tela originale.

Uso: python tools/art/cutout_ferruccio.py [--preview CARTELLA]
Richiede numpy, Pillow, opencv-contrib-python-headless.
"""
import argparse
import json
import pathlib

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "src/assets/art/characters/ferruccio.png"
OUT = ROOT / "src/assets/art/characters/ferruccio_cutout"

# ---------------------------------------------------------------- Contorni (pixel della tela)
SLEEVE = [(305, 345), (318, 330), (345, 322), (372, 322), (392, 332), (401, 352), (403, 400), (401, 470),
          (406, 492), (413, 522), (416, 560), (411, 592), (399, 610), (372, 617), (340, 617), (316, 612),
          (303, 598), (299, 560), (299, 480), (300, 400)]
HAND = [(334, 612), (408, 612), (416, 650), (412, 702), (378, 708), (340, 700), (332, 660)]
GRIP = [(286, 612), (318, 615), (350, 640), (352, 668), (322, 660), (288, 642)]
GUARD = [(362, 672), (404, 624), (436, 630), (442, 650), (462, 694), (420, 712), (394, 740), (366, 730)]
BLADE_FROM, BLADE_TO, BLADE_W = (405, 688), (674, 876), 13
BELT = [(294, 503), (456, 503), (456, 531), (294, 529)]
BELT_COLOR = (30, 29, 32)
TUNIC = [(300, 314), (402, 314), (412, 338), (428, 372), (446, 410), (457, 440), (457, 480), (452, 530), (456, 580),
         (464, 640), (474, 700), (482, 768), (420, 776), (330, 772), (236, 764), (246, 700), (263, 640),
         (281, 560), (292, 500), (296, 420)]
NECK_FILL = [(338, 272), (406, 272), (402, 338), (342, 338)]
WRIST_FILL = [(356, 598), (390, 598), (392, 630), (358, 630)]
SOCK = [(311, 856), (358, 856), (358, 948), (351, 964), (317, 964), (309, 940)]
SHOE = [(298, 960), (310, 950), (335, 945), (358, 952), (380, 964), (405, 976), (428, 992), (432, 1008),
        (420, 1017), (298, 1017)]
BREECHES_BOX = (288, 760, 426, 872)  # x0, y0, x1, y1
HEAD_CUT_Y = 306
SCARF_SPLIT_X = (296, 214, 122)       # nodo | sciarpa1 | sciarpa2 | sciarpa3

# ---------------------------------------------------------------- Ossa: perno, genitore
BONES = {
    "root": ((365, 1012), None),
    "hips": ((358, 768), "root"),
    "torso": ((360, 742), "hips"),
    "neck": ((385, 306), "torso"),
    "shoulder": ((352, 352), "torso"),
    "elbow": ((353, 486), "shoulder"),
    "wrist": ((368, 628), "elbow"),
    "thigh": ((355, 778), "hips"),
    "knee": ((337, 862), "thigh"),
    "ankle": ((334, 955), "knee"),
    "scarf1": ((300, 338), "torso"),
    "scarf2": ((214, 476), "scarf1"),
    "scarf3": ((122, 566), "scarf2"),
}


# Braccio e gamba lontani: stesse ossa, perni spostati (il braccio lontano sta un po' più indietro,
# la gamba lontana un po' più avanti, come nel dipinto).
FAR_CHAINS = {"shoulder": (-12, 2), "elbow": (-12, 2), "wrist": (-12, 2),
              "thigh": (14, -4), "knee": (14, -4), "ankle": (14, -4)}


def poly_mask(shape, pts):
    m = Image.new("L", (shape[1], shape[0]), 0)
    ImageDraw.Draw(m).polygon(pts, fill=255)
    return np.array(m) > 0


def line_mask(shape, a, b, w):
    m = Image.new("L", (shape[1], shape[0]), 0)
    ImageDraw.Draw(m).line([a, b], fill=255, width=w)
    return np.array(m) > 0


def dilate(m, r):
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    return cv2.dilate(m.astype(np.uint8), k) > 0


def fill_holes(rgb, known, region, tex_rect=(268, 630, 328, 755)):
    """Ridipinge i pixel di region non in known.

    Il tono viene da un riempimento morbido (Telea) che pesca solo dalla stoffa chiara e pulita
    (contorni, mano e sciarpa esclusi); sopra si stende la trama vera della tunica, presa da
    tex_rect (x0, y0, x1, y1: una zona della gonna sempre libera), ripetuta a specchio."""
    holes = region & ~known
    if not holes.any():
        return rgb
    lum = rgb.mean(axis=2)
    sat = rgb.max(axis=2).astype(int) - rgb.min(axis=2).astype(int)
    clean = known & (lum > 105) & (sat < 40)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    clean = cv2.erode(clean.astype(np.uint8), k) > 0
    ys, xs = np.where(region)
    y0, y1, x0, x1 = max(ys.min() - 16, 0), ys.max() + 16, max(xs.min() - 16, 0), xs.max() + 16
    crop = rgb[y0:y1, x0:x1].copy()
    c = clean[y0:y1, x0:x1]
    base = crop.copy()
    base[~c] = np.median(crop[c], axis=0).astype(np.uint8)
    smooth = cv2.inpaint(base, (~c).astype(np.uint8) * 255, 15, cv2.INPAINT_TELEA)
    smooth = cv2.GaussianBlur(smooth, (0, 0), 3)
    tx0, ty0, tx1, ty1 = tex_rect
    tile = rgb[ty0:ty1, tx0:tx1].astype(np.float32)
    detail = np.clip(tile - cv2.GaussianBlur(tile, (0, 0), 5), -14.0, 10.0) * 0.7
    # Tessere sfalsate (niente specchi: le pieghe non devono sembrare macchie simmetriche).
    th, tw = detail.shape[:2]
    big = np.zeros((crop.shape[0], crop.shape[1], 3), np.float32)
    weight = np.zeros((crop.shape[0], crop.shape[1], 1), np.float32)
    win = np.outer(np.hanning(th), np.hanning(tw))[..., None].astype(np.float32) + 1e-3
    rng = np.random.default_rng(7)
    for ty in range(-th // 2, crop.shape[0], th // 2):
        for tx in range(-tw // 2, crop.shape[1], tw // 2):
            ox = int(rng.integers(-tw // 4, tw // 4))
            ya, xa = ty, tx + ox
            ys0, xs0 = max(ya, 0), max(xa, 0)
            ys1, xs1 = min(ya + th, crop.shape[0]), min(xa + tw, crop.shape[1])
            if ys1 <= ys0 or xs1 <= xs0:
                continue
            big[ys0:ys1, xs0:xs1] += (detail * win)[ys0 - ya:ys1 - ya, xs0 - xa:xs1 - xa]
            weight[ys0:ys1, xs0:xs1] += win[ys0 - ya:ys1 - ya, xs0 - xa:xs1 - xa]
    big /= weight
    filled = np.clip(smooth.astype(np.float32) + big * 0.9, 0, 255).astype(np.uint8)
    h = holes[y0:y1, x0:x1]
    # Bordo sfumato tra pittura originale e ricostruita.
    soft = cv2.GaussianBlur(h.astype(np.float32), (0, 0), 2.0)
    soft = np.maximum(soft, h.astype(np.float32))[..., None]
    crop = (crop.astype(np.float32) * (1 - soft) + filled.astype(np.float32) * soft).astype(np.uint8)
    out = rgb.copy()
    reg = region[y0:y1, x0:x1]
    out[y0:y1, x0:x1][reg] = crop[reg]
    return out


def save_piece(name, rgba, mask, pad=4):
    ys, xs = np.where(mask)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, rgba.shape[0])
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, rgba.shape[1])
    piece = rgba[y0:y1, x0:x1].copy()
    soft = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), 0.8)[y0:y1, x0:x1]
    piece[..., 3] = (np.minimum(piece[..., 3].astype(np.float32) / 255.0, np.clip(soft * 1.6, 0, 1)) * 255).astype(np.uint8)
    Image.fromarray(piece, "RGBA").save(OUT / f"{name}.png", optimize=True)
    return [int(x0), int(y0)]


def bones_json():
    out = {k: {"pivot": list(p), "parent": par} for k, (p, par) in BONES.items()}
    for k, (dx, dy) in FAR_CHAINS.items():
        (px, py), par = BONES[k]
        out[k + "_f"] = {"pivot": [px + dx, py + dy], "parent": par + "_f" if par in FAR_CHAINS else par}
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", help="cartella dove salvare il pupazzo ricomposto e i pezzi separati")
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    src = np.array(Image.open(SRC).convert("RGBA"))
    rgb = src[..., :3].copy()
    alpha = src[..., 3] > 10
    H, W = alpha.shape
    yy, xx = np.mgrid[0:H, 0:W]
    r, g, b = [rgb[..., i].astype(int) for i in range(3)]
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    hue, sat_, val = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
    reddish = ((hue <= 14) | (hue >= 170)) & (sat_ > 60) & (val > 25)
    scarf = dilate(reddish & alpha, 1) & alpha & (yy < 770)
    sleeve = poly_mask(alpha.shape, SLEEVE) & alpha
    lum0 = rgb.mean(axis=2)
    sat0 = rgb.max(axis=2).astype(int) - rgb.min(axis=2).astype(int)
    grip_area = poly_mask(alpha.shape, HAND) | poly_mask(alpha.shape, GRIP)
    metal_area = poly_mask(alpha.shape, GUARD) | line_mask(alpha.shape, BLADE_FROM, BLADE_TO, BLADE_W + 8)
    # Guanto e impugnatura sono scuri o bruni; guardia e lama grigie: la stoffa intorno è chiara e neutra.
    sword = alpha & ((grip_area & ((lum0 < 100) | ((sat0 > 30) & (lum0 < 150))))
                     | (metal_area & ~grip_area & ~((lum0 > 150) & (sat0 < 24))))
    sword = cv2.morphologyEx(sword.astype(np.uint8), cv2.MORPH_OPEN, np.ones((2, 2), np.uint8)) > 0
    sword = cv2.morphologyEx(sword.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8)) > 0
    head = alpha & (yy < HEAD_CUT_Y) & ~scarf
    tunic_area = poly_mask(alpha.shape, TUNIC)
    legs = alpha & (yy >= 760) & ~sword & ~tunic_area

    pieces = {}
    rgba = src.copy()

    # Testa: completa il collo nero dove lo copre la sciarpa.
    hrgba = src.copy()
    neck = poly_mask(alpha.shape, NECK_FILL) & ~head
    hrgba[neck] = (18, 17, 21, 255)
    pieces["testa"] = (hrgba, head | neck)

    # Sciarpa: nodo davanti e coda in tre segmenti.
    knot = scarf & (xx >= SCARF_SPLIT_X[0])
    pieces["nodo"] = (src, knot)
    tail = (scarf | (alpha & ~tunic_area & ~head & (yy > 290) & (yy < 770))) & (xx < SCARF_SPLIT_X[0])
    pieces["sciarpa1"] = (src, tail & (xx >= SCARF_SPLIT_X[1]))
    pieces["sciarpa2"] = (src, tail & (xx < SCARF_SPLIT_X[1] + 6) & (xx >= SCARF_SPLIT_X[2]))
    pieces["sciarpa3"] = (src, tail & (xx < SCARF_SPLIT_X[2] + 6))

    # Busto: tunica visibile; il resto dell'area della tunica è ridipinto.
    excl = dilate(sleeve | head, 1) | dilate(scarf, 3) | dilate((grip_area | metal_area) & alpha & ~sleeve, 4)
    tunic_known = tunic_area & alpha & ~excl
    trgb = fill_holes(rgb, tunic_known, tunic_area)
    belt = poly_mask(alpha.shape, BELT) & tunic_area & ~tunic_known
    trgb[belt] = BELT_COLOR
    trgb[belt & (yy < BELT[0][1] + 3)] = (62, 60, 64)
    t = np.dstack([trgb, np.full((H, W), 255, np.uint8)])
    pieces["busto"] = (t, tunic_area)

    # Manica: le code della sciarpa davanti coprono il bordo anteriore.
    sleeve_area = poly_mask(alpha.shape, SLEEVE)
    srgb = fill_holes(rgb, sleeve & ~dilate(scarf | sword, 2), sleeve_area)
    s = np.dstack([srgb, np.full((H, W), 255, np.uint8)])
    elbow_y = BONES["elbow"][0][1]
    pieces["manica_su"] = (s, sleeve_area & (yy <= elbow_y + 10))
    pieces["manica_giu"] = (s, sleeve_area & (yy >= elbow_y - 14))

    # Mano e spada: il guanto prosegue sotto il polsino.
    mrgba = src.copy()
    wrist = poly_mask(alpha.shape, WRIST_FILL)
    mrgba[wrist & ~sword] = (16, 15, 18, 255)
    pieces["mano"] = (mrgba, sword | wrist)
    # Pugno della mano lontana: solo il guanto, senza spada.
    glove = poly_mask(alpha.shape, HAND) & alpha & (lum0 < 70) & (sat0 < 30)
    glove = cv2.morphologyEx(glove.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)) > 0
    pieces["pugno"] = (mrgba, glove | wrist)

    # Gamba vicina: calzone prolungato verso l'alto sotto la tunica, calza, scarpa.
    x0, y0, x1, y1 = BREECHES_BOX
    box = np.zeros_like(alpha)
    box[y0:y1, x0:x1] = True
    breeches = legs & box & ~poly_mask(alpha.shape, SOCK)
    crgba = src.copy()
    # Sopra il bordo della tunica il calzone prosegue: stoffa presa più in basso, capovolta.
    top_row = 776
    ext = np.zeros_like(alpha)
    for x in range(x0, x1):
        if breeches[top_row, x]:
            band = src[top_row:top_row + 56, x][::-1]
            crgba[top_row - 56:top_row, x] = band
            crgba[top_row - 56:top_row, x, 3] = 255
            ext[top_row - 56:top_row, x] = True
    pieces["coscia"] = (crgba, breeches | ext)
    pieces["stinco"] = (src, poly_mask(alpha.shape, SOCK) & alpha)
    pieces["piede"] = (src, poly_mask(alpha.shape, SHOE) & alpha)

    layout = {}
    for name, (img, mask) in pieces.items():
        layout[name] = save_piece(name, img, mask)

    # Ogni sprite: pezzo, osso, ordine (dal fondo); lontano = copia scurita dietro il busto.
    sprites = [
        ("sciarpa3", "scarf3", 0, False), ("sciarpa2", "scarf2", 1, False), ("sciarpa1", "scarf1", 2, False),
        ("manica_su", "shoulder", 3, True), ("pugno", "wrist", 4, True), ("manica_giu", "elbow", 4, True),
        ("coscia", "thigh", 5, True), ("stinco", "knee", 6, True), ("piede", "ankle", 7, True),
        ("stinco", "knee", 8, False), ("piede", "ankle", 9, False), ("coscia", "thigh", 10, False),
        ("busto", "torso", 11, False), ("testa", "neck", 12, False), ("nodo", "torso", 13, False),
        ("manica_su", "shoulder", 14, False), ("mano", "wrist", 15, False), ("manica_giu", "elbow", 16, False),
    ]
    rig = {
        "_doc": "Pupazzo a ritaglio di Ferruccio: generato da tools/art/cutout_ferruccio.py. Pixel della tela 679x1024.",
        "canvas": [W, H],
        "feet": list(BONES["root"][0]),
        "far_tint": [0.8, 0.8, 0.87],
        "bones": bones_json(),
        "pieces": {k: {"file": f"{k}.png", "pos": v} for k, v in layout.items()},
        "sprites": [{"piece": p, "bone": b + ("_f" if f else ""), "z": z, "far": f} for p, b, z, f in sprites],
    }
    (OUT / "rig.json").write_text(json.dumps(rig, indent=2, ensure_ascii=False) + "\n", encoding="utf8")

    if args.preview:
        prev = pathlib.Path(args.preview)
        prev.mkdir(parents=True, exist_ok=True)
        canvas = Image.new("RGBA", (W, H), (80, 90, 110, 255))
        for spr in sorted(rig["sprites"], key=lambda s: s["z"]):
            im = Image.open(OUT / rig["pieces"][spr["piece"]]["file"])
            if spr["far"]:
                a = np.array(im).astype(np.float32)
                a[..., :3] *= np.array(rig["far_tint"])
                im = Image.fromarray(a.astype(np.uint8), "RGBA")
            canvas.alpha_composite(im, tuple(rig["pieces"][spr["piece"]]["pos"]))
        canvas.save(prev / "ricomposto.png")
        sheet = Image.new("RGBA", (W * 2, H), (80, 90, 110, 255))
        x = 0
        for name in layout:
            im = Image.open(OUT / f"{name}.png")
            if x + im.width > sheet.width:
                break
            sheet.alpha_composite(im, (x, 0 if name not in ("coscia", "stinco", "piede") else 500))
            x += im.width + 6 if name not in ("coscia", "stinco") else 0
        sheet.save(prev / "pezzi.png")


if __name__ == "__main__":
    main()
