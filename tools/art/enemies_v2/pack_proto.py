## Impacchetta i ritagli prototipo di Ratking e Lanterniere (artproc/out/*_proto.png + json) in
## atlanti con 4 px di margine trasparente per fotogramma, e toglie l'alone grigio di bordo
## (pixel semitrasparenti o di contorno poco saturi e di valore medio, residuo dello sfondo).
## Uso: python pack_proto.py SRC_DIR DST_DIR
import sys, os, json, numpy as np
from PIL import Image
from scipy import ndimage as nd
SRC, DST = sys.argv[1], sys.argv[2]
M = 4
def clean(fr):
    a = np.asarray(fr).astype(float); rgb, al = a[..., :3], a[..., 3]
    mx, mn = rgb.max(-1), rgb.min(-1); sat = (mx - mn) / (mx + 1)
    # ombre a terra e scie grigie dello sfondo: grigio neutro di valore medio, ovunque
    shadow = (sat < 0.11) & (mx > 85) & (mx < 205)
    shadow = nd.binary_opening(shadow, iterations=1) | (shadow & (al < 255))
    al[shadow] = 0
    for _ in range(3):
        edge = (al > 0) & ~nd.binary_erosion(al > 0, iterations=1)
        gray = (sat < 0.16) & (mx > 70) & (mx < 200)
        kill = edge & (gray | (al < 200))
        al[kill] = 0
    lab, n = nd.label(al > 40)
    if n > 1:
        sizes = nd.sum(np.ones_like(al), lab, range(1, n + 1))
        for i, s in enumerate(sizes, 1):
            if s < 60: al[lab == i] = 0
    return Image.fromarray(np.dstack([rgb, al]).astype(np.uint8), 'RGBA')
os.makedirs(DST, exist_ok=True)
for name in ('ratking', 'lanterniere'):
    meta = json.load(open(os.path.join(SRC, name + '_proto.json')))
    src = Image.open(os.path.join(SRC, name + '_proto.png')).convert('RGBA')
    frames = {k: clean(src.crop((x, y, x + w, y + h))) for k, (x, y, w, h) in meta['frames'].items()}
    H = max(f.height for f in frames.values()) + 2 * M
    W = sum(f.width + 2 * M for f in frames.values())
    sheet = Image.new('RGBA', (W, H), (0, 0, 0, 0)); x = 0; out = {}
    for k, f in frames.items():
        sheet.alpha_composite(f, (x + M, H - M - f.height))
        # rettangolo con margine; i piedi stanno sul bordo basso del fotogramma (meno il margine)
        out[k] = [x, H - 2 * M - f.height, f.width + 2 * M, f.height + 2 * M]
        x += f.width + 2 * M
    ref = meta['frames']['idle'][3]
    sheet.save(os.path.join(DST, name + '.png'))
    json.dump({"_doc": "Prototipo a fotogrammi interi (tools/art/enemies_v2/pack_proto.py). height_px = altezza a schermo della posa idle a 1080p; margin = pixel trasparenti attorno a ogni fotogramma; faces = verso in cui guarda il disegno (1 destra, -1 sinistra).",
               "height_px": meta['height_px'], "idle_px": ref, "margin": M, "faces": meta['faces'], "frames": out},
              open(os.path.join(DST, name + '.json'), 'w'), indent=1)
    print(name, sheet.size)
