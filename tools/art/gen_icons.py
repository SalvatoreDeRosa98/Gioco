#!/usr/bin/env python3
"""Icone abilita' 96x96 in stile carta borbonica: medaglione di bronzo patinato con perlinatura,
oggetto inciso e dorato (luce da sinistra in alto). Disegnate a 4x e ridotte (Lanczos). CC0, progetto Ferruccio.
Uso: python3 gen_icons.py OUTDIR"""
import sys, os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops

S = 384; C = S / 2
rng = np.random.default_rng(1734)
OUT = sys.argv[1] if len(sys.argv) > 1 else "icons"

def radial(c0, c1, cx=0.38, cy=0.32, r=0.75):
    y, x = np.mgrid[0:S, 0:S] / S
    d = np.clip(np.hypot(x - cx, y - cy) / r, 0, 1)[..., None]
    return (np.array(c0) * (1 - d) + np.array(c1) * d)

def noise(sigma=2.0, amt=18):
    n = Image.fromarray((rng.normal(128, 40, (S, S))).clip(0, 255).astype("uint8")).filter(ImageFilter.GaussianBlur(sigma))
    return (np.asarray(n, float) - 128) / 128 * amt

def disc_mask(r):
    m = Image.new("L", (S, S), 0); ImageDraw.Draw(m).ellipse([C - r, C - r, C + r, C + r], fill=255); return m

def medallion():
    base = radial((214, 168, 92), (92, 56, 24)) + noise(1.5, 14)[..., None]
    img = Image.fromarray(base.clip(0, 255).astype("uint8"), "RGB").convert("RGBA")
    out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    # ombra portata
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0)); ImageDraw.Draw(sh).ellipse([C - 178 + 8, C - 178 + 12, C + 178 + 8, C + 178 + 12], fill=(30, 15, 5, 150))
    out = Image.alpha_composite(out, sh.filter(ImageFilter.GaussianBlur(8)))
    rim = Image.new("RGBA", (S, S)); rim.paste(img, (0, 0), disc_mask(178)); out = Image.alpha_composite(out, rim)
    d = ImageDraw.Draw(out)
    # perlinatura sul bordo
    for i in range(48):
        a = i / 48 * math.tau; x, y = C + 160 * math.cos(a), C + 160 * math.sin(a)
        lit = 0.5 + 0.5 * math.cos(a - math.radians(225))
        col = tuple(int(v) for v in np.array((120, 78, 34)) * (1 - lit) + np.array((250, 214, 140)) * lit)
        d.ellipse([x - 7, y - 7, x + 7, y + 7], fill=col + (255,), outline=(70, 40, 15, 255), width=2)
    d.ellipse([C - 147, C - 147, C + 147, C + 147], outline=(62, 36, 14, 255), width=6)
    d.ellipse([C - 141, C - 141, C + 141, C + 141], outline=(236, 196, 120, 255), width=3)
    # campo centrale patinato scuro (bronzo brunito con verderame)
    field = radial((88, 70, 48), (30, 22, 16), 0.42, 0.36, 0.55) + noise(3, 10)[..., None]
    verd = (noise(6, 1)[..., None] > 0.35) * np.array([-10, 14, 8])
    f = Image.fromarray((field + verd).clip(0, 255).astype("uint8"), "RGB").convert("RGBA")
    fl = Image.new("RGBA", (S, S)); fl.paste(f, (0, 0), disc_mask(136)); out = Image.alpha_composite(out, fl)
    d = ImageDraw.Draw(out)
    d.ellipse([C - 124, C - 124, C + 124, C + 124], outline=(176, 132, 70, 200), width=2)
    for i in range(36):  # puntinatura incisa
        a = i / 36 * math.tau; x, y = C + 130 * math.cos(a), C + 130 * math.sin(a)
        d.ellipse([x - 2.5, y - 2.5, x + 2.5, y + 2.5], fill=(200, 160, 90, 220))
    return out

def gilded(shape_mask, base=(226, 182, 96), dark=(120, 76, 30)):
    """Riempie una maschera con oro sbalzato: gradiente diagonale, rilievo dal bordo, contorno a inchiostro."""
    m = shape_mask.filter(ImageFilter.GaussianBlur(1))
    y, x = np.mgrid[0:S, 0:S] / S
    g = np.clip((x * 0.6 + y * 0.8 - 0.25), 0, 1)[..., None]
    col = np.array(base) * (1 - g) + np.array(dark) * g
    # rilievo: luce dove la maschera sfumata cresce verso alto-sinistra
    blur = np.asarray(shape_mask.filter(ImageFilter.GaussianBlur(6)), float) / 255
    emb = np.roll(blur, (4, 4), (0, 1)) - np.roll(blur, (-4, -4), (0, 1))
    col = col + emb[..., None] * np.array([-90, -80, -50]) * -1 + noise(1, 8)[..., None]
    img = Image.fromarray(col.clip(0, 255).astype("uint8"), "RGB").convert("RGBA"); img.putalpha(m)
    edge = ImageChops.subtract(shape_mask.filter(ImageFilter.MaxFilter(7)), shape_mask)
    ink = Image.new("RGBA", (S, S), (38, 20, 8, 0)); ink.putalpha(edge)
    shadow = Image.new("RGBA", (S, S), (10, 5, 0, 0)); shadow.putalpha(ImageChops.offset(shape_mask, 6, 8).filter(ImageFilter.GaussianBlur(5)).point(lambda v: v * 0.7))
    return [shadow, ink, img]

def leather(shape_mask):
    layers = gilded(shape_mask, (176, 112, 62), (82, 44, 20))
    return layers

def compose(med, layers):
    for l in layers: med = Image.alpha_composite(med, l)
    return med

def glove():
    m = Image.new("L", (S, S), 0); d = ImageDraw.Draw(m)
    # dita (4) + pollice + palmo, guanto da muratore di cuoio
    for i, (x, top) in enumerate([(138, 108), (166, 96), (194, 98), (222, 112)]):
        d.rounded_rectangle([x, top, x + 26, 210], 13, fill=255)
    d.rounded_rectangle([132, 170, 252, 262], 30, fill=255)
    d.polygon([(132, 220), (98, 176), (106, 160), (150, 196)], fill=255)
    d.ellipse([92, 152, 122, 184], fill=255)
    cuff = Image.new("L", (S, S), 0); dc = ImageDraw.Draw(cuff); dc.rounded_rectangle([124, 252, 262, 298], 10, fill=255)
    layers = leather(m) + gilded(cuff)
    st = Image.new("RGBA", (S, S), (0, 0, 0, 0)); ds = ImageDraw.Draw(st)
    for x in range(132, 258, 12): ds.line([x, 262, x + 6, 262], fill=(250, 226, 160, 230), width=3); ds.line([x, 288, x + 6, 288], fill=(250, 226, 160, 230), width=3)
    for x in (165, 193, 221): ds.line([x, 128, x, 205], fill=(60, 30, 12, 160), width=3)  # cuciture fra le dita
    ds.arc([150, 196, 236, 250], 200, 340, fill=(60, 30, 12, 150), width=3)
    return layers + [st]

def hook():
    m = Image.new("L", (S, S), 0); d = ImageDraw.Draw(m)
    d.rounded_rectangle([182, 118, 202, 250], 8, fill=255)  # fusto
    d.ellipse([174, 92, 210, 128], fill=255); d.ellipse([184, 102, 200, 118], fill=0)  # occhiello
    for sx in (-1, 1):  # punte ricurve che salgono dal piede del fusto
        pts = [(192 + sx * 110 * math.sin(u) * 0.9, 282 - 70 * (1 - math.cos(u)) - 10 * math.sin(u)) for u in np.linspace(0, 1.45, 14)]
        d.line(pts, fill=255, width=17, joint="curve")
        tip = pts[-1]; d.polygon([(tip[0] - 9, tip[1] + 6), (tip[0] + 9, tip[1] + 6), (tip[0] + sx * 10, tip[1] - 26)], fill=255)
    d.polygon([(184, 248), (200, 248), (192, 300)], fill=255)
    d.ellipse([178, 268, 206, 296], fill=255)
    ch = Image.new("L", (S, S), 0); dc = ImageDraw.Draw(ch)
    for i in range(5):  # catena
        x, y = 168 - i * 14, 104 + i * 18
        dc.ellipse([x - 9, y - 13, x + 9, y + 13] if i % 2 else [x - 13, y - 9, x + 13, y + 9], outline=255, width=6)
    return gilded(ch, (200, 200, 196), (90, 88, 84)) + gilded(m)

def hammer():
    m = Image.new("L", (S, S), 0); d = ImageDraw.Draw(m)
    hd = Image.new("L", (S, S), 0); dh = ImageDraw.Draw(hd)
    dh.polygon([(112, 120), (262, 120), (282, 136), (282, 168), (262, 184), (112, 184), (102, 172), (102, 132)], fill=255)  # testa
    dh.polygon([(102, 132), (70, 140), (70, 164), (102, 172)], fill=255)
    hd = hd.rotate(-28, center=(C, C), resample=Image.BICUBIC)
    d.rounded_rectangle([178, 150, 206, 310], 10, fill=255)  # manico
    m = m.rotate(-28, center=(C, C), resample=Image.BICUBIC)
    handle = gilded(m, (168, 110, 60), (78, 44, 18))
    return handle + gilded(hd, (176, 168, 150), (64, 58, 50))

def save(name, layers):
    img = compose(medallion(), layers).resize((96, 96), Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True); img.save(os.path.join(OUT, name + ".png"))

save("abilita_guanti", glove())
save("abilita_rampino", hook())
save("abilita_martello", hammer())
# tavola di controllo ingrandita
sheet = Image.new("RGB", (3 * 220 + 40, 300), (222, 200, 160)); d = ImageDraw.Draw(sheet)
for i, n in enumerate(["abilita_guanti", "abilita_rampino", "abilita_martello"]):
    ic = Image.open(os.path.join(OUT, n + ".png")); sheet.paste(ic.resize((192, 192), Image.NEAREST), (20 + i * 220, 20), ic.resize((192, 192), Image.NEAREST))
    sheet.paste(ic, (68 + i * 220, 200), ic)
sheet.save(os.path.join(OUT, "_sheet.png"))
