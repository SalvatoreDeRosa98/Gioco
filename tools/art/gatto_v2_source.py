#!/usr/bin/env python3
"""Sorgente del gatto v2 per il rig a pezzi: ritaglia il profilo dal model sheet, toglie il grigio
(stesso scontorno dei fogli, gatto_cut.cut) e scrive src/assets/art/enemies/gatto_v2.png (tela 920x720).
Poi: python -X utf8 tools/art/rig_nemici.py --only gatto_v2 --preview E:/gioco/.tools/rig-preview
"""
import sys
from pathlib import Path
from PIL import Image
sys.path.insert(0, str(Path(__file__).resolve().parent))
import gatto_cut

ROOT = Path(__file__).resolve().parents[2]
SHEET = ROOT / "assets/art-source/nemici/gatto/model-sheet.jpg"
OUT = ROOT / "src/assets/art/enemies/gatto_v2.png"
BOX = (0, 230, 920, 950)

tmp = OUT.with_suffix(".crop.jpg")
Image.open(SHEET).convert("RGB").crop(BOX).save(tmp, quality=97)
im, lum, labels, figs, bg = gatto_cut.figures(tmp, False)
tmp.unlink()
f = max(figs, key=lambda f: f["area"])
piece = gatto_cut.cut(im, lum, labels, f, bg)
canvas = Image.new("RGBA", im.size)
canvas.alpha_composite(piece, (f["sl"][1].start, f["sl"][0].start))
canvas.save(OUT)
print("ok", OUT, canvas.size, "figura", f["sl"])
