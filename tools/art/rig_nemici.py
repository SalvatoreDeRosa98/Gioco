#!/usr/bin/env python3
"""Separa le parti mobili dei nemici dipinti: coda del gatto e ali della vespa.

Ogni pezzo resta sulla tela dell'immagine originale (src/assets/art/enemies/), così nel
motore basta ruotarlo o schiacciarlo attorno al suo perno (vedi src/game/enemy.gd, RIG_*).
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "src/assets/art/enemies"

# Poligoni in pixel delle immagini prodotte da import_art.py.
PARTS = {
    "gatto": {"coda": [(0, 230), (186, 230), (194, 300), (184, 420), (176, 604), (0, 604)]},
    "vespa": {"ali": [(0, 0), (250, 0), (345, 168), (352, 204), (334, 228), (304, 246), (200, 258), (110, 256), (0, 140)]},
}


def main() -> None:
    for name, parts in PARTS.items():
        img = Image.open(ART / f"{name}.png").convert("RGBA")
        px = np.asarray(img).copy()
        rest = px.copy()
        out_dir = ART / f"{name}_rig"
        out_dir.mkdir(parents=True, exist_ok=True)
        for part, poly in parts.items():
            m = Image.new("L", img.size, 0)
            ImageDraw.Draw(m).polygon(poly, fill=255)
            mask = np.asarray(m) > 0
            piece = px.copy()
            piece[~mask, 3] = 0
            rest[mask, 3] = 0
            Image.fromarray(piece, "RGBA").save(out_dir / f"{part}.png", optimize=True)
            print(f"  enemies/{name}_rig/{part}.png")
        Image.fromarray(rest, "RGBA").save(out_dir / "corpo.png", optimize=True)
        print(f"  enemies/{name}_rig/corpo.png")


if __name__ == "__main__":
    main()
