#!/usr/bin/env python3
"""Immagini di partenza per i video Gemini/Grok: un solo personaggio, scontornato dal verde (o gia' con
alfa), centrato su nero con ampio margine, 1024x1024. Stesso formato di ferruccio.png, che ha dato la
corsa buona.

Uso: python -X utf8 tools/art/partenza_video.py --out E:/gioco/.tools/partenze-video
Le sorgenti sono elencate in SOURCES: (nome, file, indice della figura da sinistra o None se e' una sola).
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
SOURCES = [
    ("ferruccio", "src/assets/art/characters/ferruccio.png", None),
    ("vespa", "assets/art-source/nemici/vespa.jpg", None),
    ("statua", "assets/art-source/nemici/statua.jpg", None),
    ("guardia_giovane", "assets/art-source/personaggi/guardie.jpg", 0),
    ("guardia_baffi", "assets/art-source/personaggi/guardie.jpg", 1),
    ("guardia_anziana", "assets/art-source/personaggi/guardie.jpg", 2),
    ("lanterniere", "src/assets/art/characters/enemies_v2/lanterniere.png", None),
    ("ratking", "src/assets/art/characters/enemies_v2/ratking.png", None),
    ("custode", "assets/art-source/boss/custode.jpg", None),
    ("gatto_quattro_canti", "assets/art-source/boss/gatto_quattro_canti.jpg", None),
]


def key_green(rgb: np.ndarray) -> np.ndarray:
    """Alfa 0..1 dal verde del fondo: verde dominante e saturo = sfondo."""
    r, g, b = [rgb[:, :, i].astype(np.float32) for i in range(3)]
    greenness = g - np.maximum(r, b)
    alpha = np.clip(1.0 - (greenness - 30.0) / 60.0, 0.0, 1.0)
    # Togli lo spill verde sul bordo: limita il verde al massimo degli altri canali.
    return alpha


def cutout(path: Path) -> Image.Image:
    im = Image.open(path)
    if im.mode == "RGBA" and np.asarray(im)[:, :, 3].min() == 0:
        return im
    rgb = np.asarray(im.convert("RGB"))
    alpha = key_green(rgb)
    out = rgb.astype(np.float32).copy()
    g_cap = np.maximum(out[:, :, 0], out[:, :, 2])
    out[:, :, 1] = np.minimum(out[:, :, 1], g_cap + 10.0)
    return Image.fromarray(np.dstack([out.astype(np.uint8), (alpha * 255).astype(np.uint8)]), "RGBA")


def figures(im: Image.Image):
    a = np.asarray(im)[:, :, 3] > 128
    a = ndimage.binary_closing(a, iterations=3)
    labels, n = ndimage.label(a)
    objs = []
    for i, sl in enumerate(ndimage.find_objects(labels), start=1):
        if sl is None:
            continue
        area = int((labels[sl] == i).sum())
        if area > 5000:
            objs.append((sl[1].start, sl))
    objs.sort()
    return [sl for _, sl in objs]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, default=ROOT.parent / ".tools/partenze-video")
    a = ap.parse_args()
    a.out.mkdir(parents=True, exist_ok=True)
    for name, rel, index in SOURCES:
        src = ROOT / rel
        if not src.exists():
            print("manca", rel)
            continue
        im = cutout(src)
        figs = figures(im)
        if not figs:
            print("nessuna figura in", rel)
            continue
        sl = figs[index] if index is not None else figs[0]
        if index is None and len(figs) > 1:
            # Una sola figura attesa: prendi l'unione di tutte le parti (coda, ali...).
            y0 = min(s[0].start for s in figs); y1 = max(s[0].stop for s in figs)
            x0 = min(s[1].start for s in figs); x1 = max(s[1].stop for s in figs)
        else:
            y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        piece = im.crop((x0 - 6, y0 - 6, x1 + 6, y1 + 6))
        side = int(max(piece.size) * 1.6)
        canvas = Image.new("RGBA", (side, side), (0, 0, 0, 255))
        canvas.alpha_composite(piece, (side // 2 - piece.width // 2, int(side * 0.58) - piece.height // 2))
        canvas = canvas.convert("RGB").resize((1024, 1024), Image.LANCZOS)
        canvas.save(a.out / f"partenza_{name}.png")
        print("ok", name, piece.size)


if __name__ == "__main__":
    main()
