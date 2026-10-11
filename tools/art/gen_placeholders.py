"""Genera suoni e icone SEGNAPOSTO di Ferruccio (da sostituire con asset definitivi).
Uso: python3 gen_placeholders.py <cartella src del progetto>
Suoni -> src/assets/audio/sfx/TODO_*.wav (44.1 kHz, 16 bit, mono)
Icone -> src/assets/art/ui/segnaposto/*.png (mappa 48x48, abilita 96x96) + manifest.json
"""
import json, math, os, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SR = 44100
root = sys.argv[1] if len(sys.argv) > 1 else "."

def env(n, a=0.004, d=0.6):
    t = np.arange(n) / SR
    att = np.clip(t / a, 0, 1)
    return att * np.exp(-t / d)

def save(name, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.7  # picco circa -3 dBFS
    fade = min(len(x), int(0.02 * SR))
    x[-fade:] *= np.linspace(1, 0, fade)
    p = os.path.join(root, "assets/audio/sfx", name)
    with wave.open(p, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    print("wav", p)

rng = np.random.default_rng(7)
# Incudine: colpo di martello metallico con parziali inarmoniche e coda calda.
n = int(1.6 * SR); t = np.arange(n) / SR
x = sum(a * np.sin(2 * np.pi * f * t) * env(n, 0.002, d) for f, a, d in [(440, 1, .9), (1187, .6, .5), (1720, .45, .35), (2630, .3, .22), (3810, .2, .12)])
x += 0.5 * rng.standard_normal(n) * env(n, 0.001, 0.01)
x += 0.25 * np.sin(2 * np.pi * 220 * t) * env(n, 0.05, 1.2)  # alone grave del "ricordo custodito"
save("TODO_incudine_salva.wav", x)
# Preavviso Cavaliere: glissando ottone-ish in salita + rullo.
n = int(0.55 * SR); t = np.arange(n) / SR
f = 180 + 420 * (t / t[-1]) ** 1.6
ph = 2 * np.pi * np.cumsum(f) / SR
x = (np.sign(np.sin(ph)) * 0.35 + np.sin(ph) + 0.5 * np.sin(2 * ph)) * np.clip(t / 0.05, 0, 1) * (0.6 + 0.4 * (t / t[-1]))
x += 0.3 * rng.standard_normal(n) * (0.5 + 0.5 * np.sin(2 * np.pi * 28 * t)) * np.exp(-t / 0.4)
save("TODO_boss_preavviso.wav", x)
# Preavviso Ratking: tre squittii in salita.
parts = []
for i, base in enumerate([1400, 1650, 2000]):
    m = int(0.09 * SR); tt = np.arange(m) / SR
    ff = base + 900 * tt / tt[-1]
    parts.append(np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.sin(np.pi * tt / tt[-1]) * (0.7 + 0.3 * rng.standard_normal(m) * 0.3))
    parts.append(np.zeros(int(0.035 * SR)))
x = np.concatenate(parts)
x += 0.15 * rng.standard_normal(len(x)) * np.exp(-np.arange(len(x)) / SR / 0.3)
save("TODO_ratking_preavviso.wav", x)

# ---------------- Icone (stile carta borbonica: medaglione bronzo, filo ocra, glifo crema)
OCRA = (201, 154, 74); CREMA = (240, 226, 196); BRONZO = (92, 66, 38); SCURO = (34, 26, 20); CARTA = (214, 190, 146)
out = os.path.join(root, "assets/art/ui/segnaposto"); os.makedirs(out, exist_ok=True)

def medal(size, glyph, square=False):
    S = size * 4
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    m = S * 0.04
    shape = d.rounded_rectangle if square else d.ellipse
    kw = {"radius": S * 0.12} if square else {}
    shape([m, m + S * 0.02, S - m, S - m + S * 0.02], fill=(0, 0, 0, 110), **kw)  # ombra
    shape([m, m, S - m, S - m], fill=BRONZO + (255,), outline=OCRA + (255,), width=int(S * 0.045), **kw)
    i = S * 0.15
    shape([i, i, S - i, S - i], fill=SCURO + (255,), outline=CARTA + (160,), width=max(2, int(S * 0.012)), **kw)
    glyph(d, S)
    im = im.resize((size, size), Image.LANCZOS)
    return im

def w(S, k): return max(2, int(S * k))

def crepa(d, S):
    pts = [(S*.5,S*.22),(S*.44,S*.38),(S*.56,S*.5),(S*.45,S*.64),(S*.52,S*.8)]
    d.line(pts, fill=(255, 190, 90, 255), width=w(S,.07), joint="curve")
    d.line([(S*.56,S*.5),(S*.68,S*.56)], fill=(255,190,90,255), width=w(S,.04))
    d.line([(S*.44,S*.38),(S*.32,S*.34)], fill=(255,190,90,255), width=w(S,.04))
def anello(d, S):
    d.ellipse([S*.32,S*.26,S*.68,S*.62], outline=CREMA+(255,), width=w(S,.07))
    d.rectangle([S*.47,S*.62,S*.53,S*.78], fill=CREMA+(255,))
    d.rectangle([S*.38,S*.76,S*.62,S*.8], fill=OCRA+(255,))
def incudine(d, S):
    d.polygon([(S*.22,S*.38),(S*.78,S*.38),(S*.72,S*.48),(S*.6,S*.5),(S*.6,S*.62),(S*.7,S*.72),(S*.3,S*.72),(S*.4,S*.62),(S*.4,S*.5),(S*.3,S*.48)], fill=CREMA+(255,))
    d.polygon([(S*.22,S*.38),(S*.14,S*.36),(S*.3,S*.44)], fill=CREMA+(255,))
    d.ellipse([S*.46,S*.2,S*.54,S*.28], fill=(255,190,90,255))  # scintilla
def saracinesca(d, S):
    for k in range(5):
        x = S*(.3+.1*k); d.line([(x,S*.24),(x,S*.74)], fill=CREMA+(255,), width=w(S,.035))
        d.polygon([(x-S*.025,S*.74),(x+S*.025,S*.74),(x,S*.8)], fill=CREMA+(255,))
    for k in range(3):
        y = S*(.34+.14*k); d.line([(S*.26,y),(S*.74,y)], fill=OCRA+(255,), width=w(S,.03))
def guanti(d, S):
    d.rounded_rectangle([S*.34,S*.42,S*.66,S*.74], radius=S*.08, fill=CREMA+(255,))
    for k in range(4):
        x = S*(.35+.08*k); d.rounded_rectangle([x,S*.26+abs(1.5-k)*S*.03,x+S*.065,S*.5], radius=S*.03, fill=CREMA+(255,))
    d.rounded_rectangle([S*.22,S*.46,S*.36,S*.56], radius=S*.04, fill=CREMA+(255,))
    d.rectangle([S*.33,S*.7,S*.67,S*.78], fill=OCRA+(255,))
def rampino(d, S):
    for k in range(6):
        a = math.pi*(.95+.11*k); cx, cy = S*.5+S*.26*math.cos(a), S*.58+S*.2*math.sin(a)
        d.ellipse([cx-S*.04,cy-S*.03,cx+S*.04,cy+S*.03], outline=CARTA+(255,), width=w(S,.015))
    d.line([(S*.58,S*.7),(S*.58,S*.3)], fill=CREMA+(255,), width=w(S,.05))
    d.arc([S*.44,S*.18,S*.72,S*.46], 180, 360, fill=CREMA+(255,), width=w(S,.05))
    d.polygon([(S*.44,S*.32),(S*.4,S*.26),(S*.48,S*.3)], fill=CREMA+(255,))
    d.polygon([(S*.72,S*.32),(S*.76,S*.26),(S*.68,S*.3)], fill=CREMA+(255,))
def martello(d, S):
    d.polygon([(S*.36,S*.76),(S*.42,S*.8),(S*.62,S*.44),(S*.56,S*.4)], fill=OCRA+(255,))
    d.polygon([(S*.42,S*.32),(S*.62,S*.2),(S*.76,S*.42),(S*.56,S*.54)], fill=CREMA+(255,))

items = {}  # tutte le icone sono ora definitive (tools/art/gen_icons.py): qui non se ne rigenera nessuna
# Le icone abilita_* sono definitive (tools/art/gen_icons.py): qui non si rigenerano.
_mp = os.path.join(out, "manifest.json")
manifest = json.load(open(_mp, encoding="utf-8")) if os.path.exists(_mp) else {"_doc": "", "placeholder": True, "icons": {}}
for name, (size, g, sq) in items.items():
    medal(size, g, sq).save(os.path.join(out, name + ".png"))
    manifest["icons"][name] = {"size": [size, size], "placeholder": True}
json.dump(manifest, open(os.path.join(out, "manifest.json"), "w"), indent=2, ensure_ascii=False)
print("icone", out)
