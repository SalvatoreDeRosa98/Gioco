#!/usr/bin/env python3
"""Converte le immagini dipinte (sfondo verde croma) in PNG trasparenti pronti per Godot.

Le sorgenti stanno in assets/art-source/ (JPG originali di Grok, fuori dal progetto Godot).
Le uscite vanno in src/assets/art/. Cosa fare di ogni file è scritto in tools/art/manifest.json.

Modalità:
  sprite  scontorna, ritaglia al contenuto e riduce a "max" pixel sul lato lungo
  layer   scontorna e tiene la tela intera (le coordinate dei livelli restano quelle sorgente)
  sheet   scontorna e separa un foglio di oggetti in file singoli, in ordine di lettura
  copy    copia senza modifiche (solo riferimenti)

Uso:
  python3 tools/art/import_art.py            # converte tutto
  python3 tools/art/import_art.py --only aree
"""

import argparse
import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets" / "art-source"
OUT = ROOT / "src" / "assets" / "art"

# Soglie del verde: quanto il verde supera il più forte tra rosso e blu.
KEY_SOLID = 18.0     # sotto: pixel pieno
KEY_RANGE = 50.0     # sopra KEY_SOLID + KEY_RANGE: trasparente
SPILL_FROM = 8.0     # da qui il verde in eccesso viene tolto (alone verde sui bordi)


def key_green(img: Image.Image, erode: int = 3) -> Image.Image:
    """Rende trasparente il verde croma, toglie l'alone verde e stringe il bordo di un pixel."""
    a = np.asarray(img.convert("RGB")).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    dom = g - np.maximum(r, b)
    alpha = np.clip(1.0 - (dom - KEY_SOLID) / KEY_RANGE, 0.0, 1.0)
    g2 = np.where(dom > SPILL_FROM, np.minimum(g, np.maximum(r, b)), g)
    rgba = np.dstack([r, g2, b, alpha * 255.0]).clip(0, 255).astype(np.uint8)
    out = Image.fromarray(rgba, "RGBA")
    if erode > 1:
        out.putalpha(out.getchannel("A").filter(ImageFilter.MinFilter(erode)))
    return out


def bbox(img: Image.Image, threshold: int = 24) -> tuple[int, int, int, int]:
    alpha = np.asarray(img.getchannel("A"))
    ys, xs = np.where(alpha > threshold)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def crop_to_content(img: Image.Image, pad: int) -> Image.Image:
    x0, y0, x1, y1 = bbox(img)
    return img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))


def fit(img: Image.Image, longest: int | None) -> Image.Image:
    if not longest or max(img.size) <= longest:
        return img
    k = longest / max(img.size)
    return img.resize((round(img.width * k), round(img.height * k)), Image.LANCZOS)


def runs(profile: np.ndarray, min_gap: int, min_len: int) -> list[tuple[int, int]]:
    """Intervalli in cui il profilo è non nullo, uniti se separati da meno di min_gap."""
    on = np.where(profile > 0)[0]
    if on.size == 0:
        return []
    out = [[on[0], on[0]]]
    for v in on[1:]:
        if v - out[-1][1] <= min_gap:
            out[-1][1] = v
        else:
            out.append([v, v])
    return [(int(s), int(e) + 1) for s, e in out if e - s + 1 >= min_len]


def split_sheet(img: Image.Image, min_gap: int) -> list[Image.Image]:
    """Separa gli oggetti di un foglio: prima per righe, poi per colonne dentro ogni riga.

    Le righe sono spesso vicine, quindi basta una riga vuota per separarle; le colonne
    si uniscono entro min_gap pixel (aloni e frange staccate restano con il loro oggetto)."""
    alpha = np.asarray(img.getchannel("A")) > 40
    pieces = []
    for y0, y1 in runs(alpha.sum(1), 2, 20):
        for x0, x1 in runs(alpha[y0:y1].sum(0), min_gap, 20):
            pieces.append(crop_to_content(img.crop((x0, y0, x1, y1)), 6))
    return pieces


def save(img: Image.Image, rel: str) -> None:
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
    print(f"  {rel:42s} {img.width}x{img.height}")


def process(entry: dict) -> None:
    src = SRC / entry["src"]
    mode = entry["mode"]
    if mode == "copy":
        dst = OUT / entry["out"]
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dst)
        print(f"  {entry['out']:42s} (copia)")
        return
    img = key_green(Image.open(src), entry.get("erode", 3))
    if entry.get("flip"):
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    if mode == "sprite":
        save(fit(crop_to_content(img, entry.get("pad", 8)), entry.get("max")), entry["out"])
    elif mode == "layer":
        save(fit(img, entry.get("max")), entry["out"])
    elif mode == "sheet":
        pieces = split_sheet(img, entry.get("gap", 24))
        names = entry["names"]
        if len(pieces) != len(names):
            raise SystemExit(f"{entry['src']}: trovati {len(pieces)} oggetti, attesi {len(names)}")
        for piece, name in zip(pieces, names):
            save(fit(piece, entry.get("max")), f"{entry['out']}/{name}.png")
    else:
        raise SystemExit(f"modalità sconosciuta: {mode}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", help="converte solo le voci la cui sorgente contiene questo testo")
    args = ap.parse_args()
    manifest = json.loads((Path(__file__).parent / "manifest.json").read_text())
    for entry in manifest["assets"]:
        if args.only and args.only not in entry["src"]:
            continue
        process(entry)


if __name__ == "__main__":
    main()
