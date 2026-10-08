#!/usr/bin/env python3
"""Toglie lo sfondo verde (chroma key) dai disegni forniti su green screen.

Il verde in eccesso (G oltre il massimo tra R e B) diventa trasparenza; sui bordi il colore
viene "despillato" (G riportato al livello di R/B) così non restano aloni verdi.

Uso: python tools/art/chroma_key.py INGRESSO USCITA [--soglia 18] [--morbidezza 55]
"""
import argparse

import numpy as np
from PIL import Image


def key(img: Image.Image, soglia: float = 18.0, morbidezza: float = 55.0) -> Image.Image:
    a = np.array(img.convert("RGBA")).astype(np.float32)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    spill = g - np.maximum(r, b)
    keep = np.clip(1.0 - (spill - soglia) / morbidezza, 0.0, 1.0)
    a[..., 3] = al * keep
    a[..., 1] = np.minimum(g, np.maximum(r, b) + 6.0)
    a[a[..., 3] < 6, 3] = 0
    return Image.fromarray(a.astype(np.uint8), "RGBA")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--soglia", type=float, default=18.0)
    ap.add_argument("--morbidezza", type=float, default=55.0)
    o = ap.parse_args()
    key(Image.open(o.src), o.soglia, o.morbidezza).save(o.dst, optimize=True)
