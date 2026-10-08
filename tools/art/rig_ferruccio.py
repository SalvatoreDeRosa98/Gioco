#!/usr/bin/env python3
"""Scompone src/assets/art/characters/ferruccio.png in pezzi animabili dal motore.

Pezzi (stessa tela dell'originale, così restano allineati senza offset):
  corpo         tutto tranne gambe e spada, con il buco lasciato dalla mano richiuso
  spada         guanto, impugnatura e lama (ruota attorno al polso durante il fendente)
  gamba_avanti  gamba vicina (disegnata sopra)
  gamba_dietro  gamba lontana (disegnata sotto, leggermente più scura nel motore)

I punti di taglio sono in pixel dell'immagine 679x1024 prodotta da import_art.py.
Se l'immagine di Ferruccio cambia, vanno ricontrollati qui e in src/game/player.gd (RIG_*).
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "src/assets/art/characters/ferruccio.png"
OUT = ROOT / "src/assets/art/characters/ferruccio_rig"

HEM_Y = 772  # sotto l'orlo del camicione iniziano le gambe
# Confine tra le due gambe: piega dei calzoni, poi calza vicina, poi bordo della scarpa vicina.
_SPLIT = [(372, HEM_Y), (372, 868), (356, 880), (356, 955), (372, 958), (395, 966), (418, 976), (440, 992), (440, 1024)]
LEG_FRONT = [(280, HEM_Y)] + _SPLIT + [(280, 1024)]
LEG_BACK = _SPLIT + [(470, 1024), (470, HEM_Y)]
# Spada come insieme di forme: (punti, spessore). Spessore 0 = poligono pieno.
SWORD = [
    ([(338, 612), (400, 614), (400, 692), (350, 694), (336, 660)], 0),  # guanto
    ([(290, 612), (318, 612), (318, 640), (290, 640)], 0),  # pomolo
    ([(304, 628), (402, 668)], 20),  # impugnatura
    ([(438, 630), (378, 730)], 18),  # elsa
    ([(400, 672), (424, 674), (684, 874), (684, 884), (668, 884), (398, 694)], 0),  # lama
]
# Sopra il camicione bianco la spada si distingue per il colore scuro.
SWORD_MAX_LUMA = 172.0
# Il camicione finisce a destra di questa colonna e sotto HEM_Y: oltre, il buco resta trasparente.
TUNIC_RIGHT = 466


def poly_mask(size: tuple[int, int], pts: list[tuple[int, int]]) -> np.ndarray:
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).polygon(pts, fill=255)
    return np.asarray(m) > 0


def shapes_mask(size: tuple[int, int], shapes: list) -> np.ndarray:
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    for pts, width in shapes:
        if width:
            d.line(pts, fill=255, width=width)
        else:
            d.polygon(pts, fill=255)
    return np.asarray(m) > 0


def box_blur(a: np.ndarray, r: int) -> np.ndarray:
    """Media su un quadrato di lato 2r+1 (somme cumulative), applicata alle prime due dimensioni."""
    for axis in (0, 1):
        pad = [(0, 0)] * a.ndim
        pad[axis] = (r + 1, r)
        c = np.cumsum(np.pad(a, pad, mode="edge"), axis=axis)
        hi = np.take(c, np.arange(2 * r + 1, c.shape[axis]), axis=axis)
        lo = np.take(c, np.arange(0, c.shape[axis] - 2 * r - 1), axis=axis)
        a = (hi - lo) / (2 * r + 1)
    return a


def dilate(mask: np.ndarray, r: int) -> np.ndarray:
    m = Image.fromarray(mask.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(2 * r + 1))
    return np.asarray(m) > 0


def inpaint(rgba: np.ndarray, hole: np.ndarray, radius: int = 9) -> np.ndarray:
    """Richiude un buco con la media sfumata dei pixel intorno (convoluzione normalizzata)."""
    a = rgba[..., 3:4] / 255.0
    known = (~hole).astype(np.float32)[..., None]
    pm = np.concatenate([rgba[..., :3] * a, a * 255.0], axis=2) * known
    acc, weight = pm, known
    for _ in range(3):  # tre medie a box approssimano una gaussiana
        acc = box_blur(acc, radius)
        weight = box_blur(weight, radius)
    fill = acc / np.maximum(weight, 1e-4)
    out = np.where(hole[..., None], fill, np.concatenate([rgba[..., :3] * a, a * 255.0], axis=2))
    alpha = out[..., 3:4]
    rgb = np.where(alpha > 0, out[..., :3] / np.maximum(alpha / 255.0, 1e-6), 0)
    return np.concatenate([rgb, alpha], axis=2)


def save(arr: np.ndarray, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    Image.fromarray(arr.clip(0, 255).astype(np.uint8), "RGBA").save(OUT / f"{name}.png", optimize=True)
    print(f"  characters/ferruccio_rig/{name}.png")


def main() -> None:
    img = Image.open(SRC).convert("RGBA")
    px = np.asarray(img).astype(np.float32)
    luma = px[..., :3] @ np.array([0.299, 0.587, 0.114], np.float32)
    opaque = px[..., 3] > 8

    front = poly_mask(img.size, LEG_FRONT) & opaque
    back = poly_mask(img.size, LEG_BACK) & opaque
    # Fuori dal camicione ogni pixel opaco è spada; sopra il camicione solo quelli scuri.
    sword_area = shapes_mask(img.size, SWORD) & opaque
    over_tunic = sword_area & (luma >= SWORD_MAX_LUMA)
    sword = sword_area & ~over_tunic
    # Fuori dal camicione ogni pixel opaco nell'area è spada, anche i riflessi chiari.
    cols = np.arange(img.width)[None, :]
    rows = np.arange(img.height)[:, None]
    outside = (cols >= TUNIC_RIGHT) | (rows >= HEM_Y)
    sword |= sword_area & outside

    def part(mask: np.ndarray) -> np.ndarray:
        out = px.copy()
        out[~mask, 3] = 0
        return out

    body = px.copy()
    body[front | back, 3] = 0
    # Il buco sul camicione comprende un margine e l'ombra scura che la mano proiettava.
    hole = (dilate(sword, 5) | (dilate(sword, 14) & (luma < 150))) & ~outside & opaque
    body = inpaint(body, hole)
    body[sword & outside, 3] = 0
    save(body, "corpo")
    save(part(sword), "spada")
    save(part(front), "gamba_avanti")
    save(part(back), "gamba_dietro")


if __name__ == "__main__":
    main()
