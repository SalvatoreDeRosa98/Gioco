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

def medallion(beads=48):
    base = radial((214, 168, 92), (92, 56, 24)) + noise(1.5, 14)[..., None]
    img = Image.fromarray(base.clip(0, 255).astype("uint8"), "RGB").convert("RGBA")
    out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    # ombra portata
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0)); ImageDraw.Draw(sh).ellipse([C - 178 + 8, C - 178 + 12, C + 178 + 8, C + 178 + 12], fill=(30, 15, 5, 150))
    out = Image.alpha_composite(out, sh.filter(ImageFilter.GaussianBlur(8)))
    rim = Image.new("RGBA", (S, S)); rim.paste(img, (0, 0), disc_mask(178)); out = Image.alpha_composite(out, rim)
    d = ImageDraw.Draw(out)
    # perlinatura sul bordo
    for i in range(beads):
        a = i / beads * math.tau; x, y = C + 160 * math.cos(a), C + 160 * math.sin(a)
        lit = 0.5 + 0.5 * math.cos(a - math.radians(225))
        col = tuple(int(v) for v in np.array((120, 78, 34)) * (1 - lit) + np.array((250, 214, 140)) * lit)
        r_ = 7 if beads >= 40 else 11; d.ellipse([x - r_, y - r_, x + r_, y + r_], fill=col + (255,), outline=(70, 40, 15, 255), width=2)
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
    """Rampino: uncino a tre punte (centrale dritta, laterali ricurve) con catena all'occhiello."""
    m = Image.new("L", (S, S), 0); d = ImageDraw.Draw(m)
    cx, top, base = 200, 150, 268
    d.rounded_rectangle([cx - 10, top, cx + 10, base], 6, fill=255)  # fusto
    d.ellipse([cx - 20, top - 34, cx + 20, top + 6], fill=255); d.ellipse([cx - 9, top - 23, cx + 9, top - 5], fill=0)  # occhiello
    d.ellipse([cx - 16, base - 14, cx + 16, base + 14], fill=255)  # nodo alla base
    # terza punta, di scorcio verso chi guarda: corta, sale davanti al fusto (niente punta in giu' da ancora)
    tri = [(cx + 4 * math.sin(u) * 6, base + 10 + 26 * math.sin(u) - 70 * (1 - math.cos(u))) for u in np.linspace(0, 1.6, 12)]
    d.line(tri, fill=255, width=13, joint="curve")
    tx, ty = tri[-1]; d.polygon([(tx - 7, ty + 6), (tx + 9, ty + 6), (tx + 3, ty - 22)], fill=255)
    for sx in (-1, 1):  # due punte laterali che escono dalla base e si piegano in su
        pts = [(cx + sx * (12 + 62 * math.sin(u)), base + 4 + 40 * math.sin(u) - 92 * (1 - math.cos(u)) * 0.55) for u in np.linspace(0, 1.75, 16)]
        d.line(pts, fill=255, width=15, joint="curve")
        tx, ty = pts[-1]; d.polygon([(tx - 8, ty + 8), (tx + 8, ty + 8), (tx + sx * 6, ty - 26)], fill=255)
    ch = Image.new("L", (S, S), 0); dc = ImageDraw.Draw(ch)
    for i in range(6):  # catena che scende a sinistra dall'occhiello, maglie alternate
        x, y = cx - 22 - i * 17, top - 22 + i * 15
        if i % 2: dc.ellipse([x - 7, y - 12, x + 7, y + 12], outline=255, width=5)
        else: dc.ellipse([x - 12, y - 7, x + 12, y + 7], outline=255, width=5)
    return gilded(ch, (206, 204, 198), (86, 84, 80)) + gilded(m, (196, 192, 184), (72, 68, 62))

def crack():
    """Muro incrinato: conci di pietra con fenditura dorata."""
    stones = Image.new("L", (S, S), 0); d = ImageDraw.Draw(stones)
    for row in range(4):
        y = 104 + row * 46; off = 0 if row % 2 == 0 else 34
        for col in range(-1, 4):
            x = 104 + off + col * 68
            x0_, x1_ = max(x, 96), min(x + 62, 288)
            if x1_ > x0_: d.rectangle([x0_, y, x1_, y + 40], fill=255)
    stones = ImageChops.multiply(stones, disc_mask(120))
    cr = Image.new("L", (S, S), 0); dc = ImageDraw.Draw(cr)
    pts = [(196, 92), (186, 140), (206, 176), (184, 214), (200, 252), (190, 296)]
    dc.line(pts, fill=255, width=14, joint="curve"); dc.line([(206, 176), (240, 196), (262, 190)], fill=255, width=9); dc.line([(184, 214), (150, 232)], fill=255, width=8)
    st = gilded(stones, (150, 132, 108), (70, 58, 44))
    dark = Image.new("RGBA", (S, S), (20, 10, 4, 0)); dark.putalpha(cr)
    glow = Image.new("RGBA", (S, S), (250, 200, 110, 0)); glow.putalpha(cr.filter(ImageFilter.GaussianBlur(5)).point(lambda v: v * 0.8))
    return st + [glow, dark]

def ring():
    """Anello del rampino: grosso anello di ferro con staffa a muro."""
    r = Image.new("L", (S, S), 0); d = ImageDraw.Draw(r)
    d.ellipse([122, 132, 262, 272], fill=255); d.ellipse([150, 160, 234, 244], fill=0)
    st = Image.new("L", (S, S), 0); ds = ImageDraw.Draw(st)
    ds.rounded_rectangle([168, 92, 216, 140], 8, fill=255); ds.ellipse([184, 104, 200, 120], fill=0)
    return gilded(st, (170, 160, 146), (70, 64, 56)) + gilded(r)

def anvil():
    """Incudine (punto di salvataggio)."""
    m = Image.new("L", (S, S), 0); d = ImageDraw.Draw(m)
    d.polygon([(96, 150), (150, 150), (160, 140), (286, 140), (286, 186), (250, 196), (232, 214), (152, 214), (138, 196), (112, 178)], fill=255)  # tavola con corno
    d.polygon([(166, 214), (222, 214), (230, 256), (158, 256)], fill=255)  # collo
    d.rounded_rectangle([128, 256, 262, 286], 6, fill=255)  # base
    layers = gilded(m, (190, 184, 174), (64, 60, 54))
    sp = Image.new("RGBA", (S, S), (0, 0, 0, 0)); dsp = ImageDraw.Draw(sp)
    for a, l in ((-1.2, 40), (-0.7, 54), (-0.25, 44)):  # scintille
        x0, y0 = 232, 128; dsp.line([x0, y0, x0 + l * math.cos(a), y0 + l * math.sin(a)], fill=(255, 214, 120, 230), width=5)
    return layers + [sp]

def portcullis():
    """Saracinesca: grata di ferro con punte, dentro un arco di pietra."""
    arch = Image.new("L", (S, S), 0); d = ImageDraw.Draw(arch)
    d.rectangle([108, 160, 276, 292], fill=255); d.ellipse([108, 76, 276, 244], fill=255)
    inner = Image.new("L", (S, S), 0); di = ImageDraw.Draw(inner)
    di.rectangle([128, 170, 256, 292], fill=255); di.ellipse([128, 96, 256, 224], fill=255)
    stone = ImageChops.subtract(arch, inner)
    g = Image.new("L", (S, S), 0); dg = ImageDraw.Draw(g)
    for x in range(140, 256, 26):
        dg.rectangle([x, 112, x + 9, 276], fill=255); dg.polygon([(x - 3, 276), (x + 12, 276), (x + 4, 298)], fill=255)
    for y in (150, 200, 250): dg.rectangle([132, y, 252, y + 9], fill=255)
    g = ImageChops.multiply(g, inner.filter(ImageFilter.MaxFilter(5)))
    hole = Image.new("RGBA", (S, S), (12, 8, 6, 0)); hole.putalpha(inner.point(lambda v: v * 0.75))
    return [hole] + gilded(stone, (160, 142, 118), (74, 60, 46)) + gilded(g, (176, 170, 160), (60, 56, 50))

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

def save(name, layers, size=96):
    img = compose(medallion(48 if size >= 96 else 28), layers).resize((size, size), Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True); img.save(os.path.join(OUT, name + ".png"))

save("abilita_guanti", glove())
save("abilita_rampino", hook())
save("abilita_martello", hammer())
save("mappa_crepa", crack(), 48)
save("mappa_anello", ring(), 48)
save("mappa_incudine", anvil(), 48)
save("mappa_saracinesca", portcullis(), 48)
ALL = ["abilita_guanti", "abilita_rampino", "abilita_martello", "mappa_crepa", "mappa_anello", "mappa_incudine", "mappa_saracinesca"]
sheet = Image.new("RGB", (7 * 170 + 20, 260), (222, 200, 160))
for i, n in enumerate(ALL):
    ic = Image.open(os.path.join(OUT, n + ".png")); big = ic.resize((150, 150), Image.LANCZOS)
    sheet.paste(big, (20 + i * 170, 10), big); sheet.paste(ic, (20 + i * 170 + 75 - ic.width // 2, 170), ic)
sheet.save(os.path.join(OUT, "_sheet.png"))
