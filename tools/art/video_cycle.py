#!/usr/bin/env python3
"""Estrae un ciclo che si ripete senza giunture da un video Grok (personaggio sul posto, sfondo grigio).

I fotogrammi del video vanno prima salvati in PNG (OpenCV del Python di sistema, vedi sotto): questo
script legge quella cartella, cerca il periodo del movimento confrontando le sagome, sceglie l'inizio
che chiude meglio il ciclo, scontorna il personaggio come gatto_cut.py e scrive:
  ciclo/NNN.png  fotogrammi RGBA ritagliati sullo stesso riquadro
  ciclo.gif      anteprima alla velocità del video
  campioni.jpg   un fotogramma ogni 8, per controllare il video intero

Uso:
  python -c "import cv2; ..."  (estrazione dei PNG in <dir>/frames)
  python -X utf8 tools/art/video_cycle.py <dir> [--skip 24] [--min 8] [--max 60] [--period N]
Richiede numpy, scipy, Pillow.
"""
import argparse
import glob
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

DARK = 80  # luminanza sotto cui un pixel conta come pelo nero per il confronto delle sagome


def silhouette(f):
    m = (f.mean(axis=2) < DARK).astype(np.uint8) * 255
    return np.asarray(Image.fromarray(m).resize((160, 160)), dtype=np.float32) / 255.0


def cut(f):
    """RGBA: interno pieno, bordo sfumato con lo scarto dal grigio di fondo."""
    lum = f.mean(axis=2)
    bg = np.median(np.concatenate([lum[:15].ravel(), lum[-15:].ravel(), lum[:, :15].ravel(), lum[:, -15:].ravel()]))
    own = lum < bg - 40
    lab, n = ndimage.label(own)
    if n == 0:
        return np.dstack([f, np.zeros(lum.shape, np.uint8)])
    sizes = ndimage.sum(own, lab, range(1, n + 1))
    own = lab == (1 + int(np.argmax(sizes)))
    holes, nh = ndimage.label(ndimage.binary_fill_holes(own) & ~own)
    hs = ndimage.sum(np.ones_like(holes), holes, range(1, nh + 1)) if nh else []
    solid = own | np.isin(holes, [i + 1 for i, s in enumerate(hs) if s < 2500])
    core = ndimage.binary_erosion(solid, iterations=3)
    edge = np.clip((bg - lum - 24) / 56, 0, 1) * ndimage.binary_dilation(solid, iterations=2)
    return np.dstack([f, (np.where(core, 1.0, edge) * 255).astype(np.uint8)])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dir", type=Path)
    ap.add_argument("--skip", type=int, default=24, help="fotogrammi iniziali da ignorare (transizione)")
    ap.add_argument("--min", type=int, default=8)
    ap.add_argument("--max", type=int, default=60)
    ap.add_argument("--period", type=int, default=0, help="periodo forzato; 0 = automatico")
    ap.add_argument("--fps", type=float, default=24.0)
    ap.add_argument("--range", type=int, nargs=2, metavar=("INIZIO", "FINE"), help="intervallo fisso, senza ricerca del loop")
    ap.add_argument("--step", type=int, default=1, help="passo nell'intervallo (2 = un fotogramma su due)")
    ap.add_argument("--name", default="ciclo", help="nome della cartella e del GIF di uscita")
    a = ap.parse_args()

    fr = [np.asarray(Image.open(p).convert("RGB")) for p in sorted(glob.glob(str(a.dir / "frames" / "*.png")))]
    n = len(fr)
    # Campioni del video intero.
    picks = list(range(0, n, 8))[:30]
    thumbs = [Image.fromarray(fr[i]).resize((200, 200)) for i in picks]
    sheet = Image.new("RGB", (200 * 6, 200 * ((len(thumbs) + 5) // 6)))
    for i, t in enumerate(thumbs):
        sheet.paste(t, ((i % 6) * 200, (i // 6) * 200))
    sheet.save(a.dir / "campioni.jpg")

    if a.range:
        # Azione che avviene una volta (salto, attacco...): intervallo scelto a mano, nessun loop.
        start, end = a.range
        chosen = fr[start:end + 1:a.step]
        print(f"intervallo {start}-{end}, passo {a.step}")
    else:
        S = [silhouette(f) for f in fr]
        if a.period:
            period = a.period
        else:
            scores = []
            for p in range(a.min, min(a.max, n - a.skip - 1)):
                d = np.mean([np.abs(S[t] - S[t + p]).mean() for t in range(a.skip, n - p)])
                scores.append((d, p))
            scores.sort()
            print("periodi migliori (diff, p):", [(round(float(d), 4), p) for d, p in scores[:6]])
            period = scores[0][1]
        start = min(range(a.skip, n - period), key=lambda t: np.abs(S[t] - S[t + period]).mean())
        close = float(np.abs(S[start] - S[start + period]).mean())
        print(f"periodo {period}, inizio {start}, differenza di chiusura {close:.4f}")
        chosen = fr[start:start + period]

    cuts = [cut(f) for f in chosen]
    union = np.zeros(cuts[0].shape[:2], bool)
    for c in cuts:
        union |= c[:, :, 3] > 20
    ys, xs = np.where(union)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    h, w = union.shape
    touches = [name for name, hit in (("sinistro", x0 == 0), ("destro", x1 == w - 1), ("alto", y0 == 0), ("basso", y1 == h - 1)) if hit]
    print("riquadro", (int(x0), int(y0), int(x1), int(y1)), "bordi toccati:", touches or "nessuno")

    out = a.dir / a.name
    out.mkdir(exist_ok=True)
    for old in out.glob("*.png"):  # un ciclo precedente più lungo lascerebbe fotogrammi in coda
        old.unlink()
    prev = []
    for i, c in enumerate(cuts):
        im = Image.fromarray(c[y0:y1 + 1, x0:x1 + 1], "RGBA")
        im.save(out / f"{i:03d}.png")
        bg = Image.new("RGBA", im.size, "#26303c")
        bg.alpha_composite(im)
        prev.append(bg.convert("RGB"))
    prev[0].save(a.dir / f"{a.name}.gif", save_all=True, append_images=prev[1:], duration=round(1000 / a.fps), loop=0)
    print("fotogrammi del ciclo:", len(cuts))


if __name__ == "__main__":
    main()
