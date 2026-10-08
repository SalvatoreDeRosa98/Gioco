#!/usr/bin/env python3
"""Separa le parti mobili dei nemici dipinti.

Gatto: coda, testa e le quattro zampe (dal gomito/ginocchio in giù).
Vespa: ali e addome (col pungiglione).

Ogni pezzo resta sulla tela dell'immagine originale (src/assets/art/enemies/), così nel
motore basta ruotarlo o schiacciarlo attorno al suo perno (vedi src/game/enemy.gd).

Le cuciture sono morbide: il pezzo sfuma verso la cucitura e il corpo tiene una fascia di
pixel sotto di essa. A riposo pezzo + corpo ridanno l'immagine originale; quando
il pezzo ruota di poco la fascia copre il vuoto, senza tagli netti nella pelliccia.

uso: python3 tools/art/rig_nemici.py [--preview CARTELLA]
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "src/assets/art/enemies"

# Poligoni in pixel delle immagini prodotte da import_art.py. "seam" è la cucitura: il tratto del
# bordo che attraversa la figura (collo, anca, vita...). Solo lì il pezzo sfuma per "soft" pixel e
# il corpo tiene una fascia sotto di lui; gli altri bordi passano nel vuoto e restano netti.
# I perni corrispondenti sono in enemy.gd.
PARTS = {
    "gatto": {
        "coda": {"poly": [(0, 230), (186, 230), (194, 300), (184, 420), (176, 604), (0, 604)],
                 "seam": [(186, 230), (194, 300), (184, 420)], "soft": 5},
        # Zampe posteriori: si separano sotto l'anca (y ~425).
        "zampa_post_a": {"poly": [(186, 425), (262, 425), (264, 470), (268, 604), (186, 604)],
                         "seam": [(186, 425), (262, 425)], "soft": 6},
        "zampa_post_b": {"poly": [(264, 425), (350, 415), (360, 470), (392, 540), (392, 604), (268, 604), (264, 470)],
                         "seam": [(264, 425), (350, 415)], "soft": 6},
        # Zampe anteriori: si separano sotto il petto (y ~455); il confine segue lo spazio tra le zampe.
        "zampa_ant_a": {"poly": [(470, 455), (552, 455), (552, 520), (560, 553), (574, 562), (588, 572), (592, 604), (470, 604)],
                        "seam": [(470, 455), (552, 455)], "soft": 6},
        "zampa_ant_b": {"poly": [(552, 455), (640, 455), (640, 604), (592, 604), (588, 572), (574, 562), (560, 553), (552, 520)],
                        "seam": [(552, 455), (640, 455)], "soft": 6},
        # Testa: la cucitura attraversa il collo dalla nuca alla gola.
        "testa": {"poly": [(578, 0), (768, 0), (768, 262), (700, 240), (668, 228), (652, 214), (612, 175), (585, 140), (572, 110)],
                  "seam": [(668, 228), (652, 214), (612, 175), (585, 140), (572, 110)], "soft": 9},
    },
    "vespa": {
        "ali": {"poly": [(0, 0), (250, 0), (345, 168), (352, 204), (334, 228), (304, 246), (200, 258), (110, 256), (0, 140)]},
        # Addome col pungiglione: la cucitura è la vita; il bordo destro segue la zampa che gli passa davanti.
        "addome": {"poly": [(300, 260), (230, 259), (150, 270), (90, 330), (55, 480), (75, 640), (170, 725), (280, 772),
                            (345, 772), (348, 610), (328, 540), (319, 500), (311, 440), (304, 390), (294, 345),
                            (288, 318), (298, 300)],
                   "seam": [(300, 260), (298, 300), (288, 318), (294, 345)], "soft": 6},
    },
}


def _seam_distance(size: tuple, seam: list) -> np.ndarray:
    """Distanza in pixel di ogni punto della tela dalla spezzata della cucitura."""
    ys, xs = np.mgrid[0:size[1], 0:size[0]].astype(np.float32)
    best = np.full(xs.shape, np.inf, np.float32)
    for (ax, ay), (bx, by) in zip(seam, seam[1:]):
        dx, dy = bx - ax, by - ay
        t = np.clip(((xs - ax) * dx + (ys - ay) * dy) / max(dx * dx + dy * dy, 1e-6), 0.0, 1.0)
        best = np.minimum(best, np.hypot(xs - (ax + t * dx), ys - (ay + t * dy)))
    return best


def _smooth(x: np.ndarray) -> np.ndarray:
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3.0 - 2.0 * x)


def _split(name: str, parts: dict, preview: Path | None) -> None:
    img = Image.open(ART / f"{name}.png").convert("RGBA")
    px = np.asarray(img).astype(np.float32)
    keep = np.ones(img.size[::-1], np.float32)   # fattore alfa del corpo
    out_dir = ART / f"{name}_rig"
    out_dir.mkdir(parents=True, exist_ok=True)
    overlay = None
    if preview:
        overlay = Image.new("RGBA", img.size, (235, 235, 220, 255))
        overlay.alpha_composite(img)
    for part, spec in parts.items():
        poly = spec["poly"]
        soft = int(spec.get("soft", 0))
        hard = Image.new("L", img.size, 0)
        ImageDraw.Draw(hard).polygon(poly, fill=255)
        hard_a = np.asarray(hard, np.float32) / 255.0
        seam = spec.get("seam", [])
        if soft > 0 and len(seam) >= 2:
            # Lungo la cucitura il pezzo sale da 0 a 1 in 2*soft pixel; il corpo resta pieno fino a
            # 2*soft e sparisce entro 3*soft: a riposo la somma ridà l'immagine originale.
            dist = _seam_distance(img.size, seam)
            piece_f = hard_a * _smooth(dist / (2.0 * soft))
            body_cut = hard_a * _smooth((dist - 2.0 * soft) / soft)
        else:
            piece_f = hard_a
            body_cut = hard_a
        piece = px.copy()
        piece[..., 3] *= piece_f
        keep *= 1.0 - body_cut
        Image.fromarray(piece.round().clip(0, 255).astype(np.uint8), "RGBA").save(out_dir / f"{part}.png", optimize=True)
        print(f"  enemies/{name}_rig/{part}.png")
        if overlay is not None:
            ImageDraw.Draw(overlay).polygon(poly, outline=(255, 0, 80, 255), width=2)
    rest = px.copy()
    rest[..., 3] *= keep
    Image.fromarray(rest.round().clip(0, 255).astype(np.uint8), "RGBA").save(out_dir / "corpo.png", optimize=True)
    print(f"  enemies/{name}_rig/corpo.png")
    if overlay is not None:
        overlay.save(preview / f"{name}_poligoni.png")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--preview", type=Path, help="cartella dove salvare i poligoni disegnati sulle immagini")
    args = ap.parse_args()
    if args.preview:
        args.preview.mkdir(parents=True, exist_ok=True)
    for name, parts in PARTS.items():
        _split(name, parts, args.preview)


if __name__ == "__main__":
    main()
