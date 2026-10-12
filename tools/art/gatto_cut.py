#!/usr/bin/env python3
"""Ritaglia le pose del gatto dai fogli Grok (sfondo grigio piatto) e ne fa fotogrammi allineati.

Per ogni foglio in assets/art-source/nemici/gatto/:
  1. separa il gatto dallo sfondo (il gatto è molto più scuro del grigio);
  2. trova le singole figure (componenti connesse), in ordine di lettura: righe dall'alto, poi da sinistra;
  3. prende le pose elencate in CLIPS, le mette su una tela comune con i piedi sulla stessa linea.

Uscita in --out (predefinito src/assets/art/enemies/gatto_frames): <clip>.png (atlante a 4 colonne) e
animations.json nello stesso formato di Ferruccio. In --preview (fuori dal progetto Godot):
<clip>.gif alla velocità del gioco e foglio.png con tutte le clip affiancate.

Uso: python -X utf8 tools/art/gatto_cut.py
Richiede numpy, scipy, Pillow.
"""
import argparse
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets/art-source/nemici/gatto"

# clip -> (foglio, indici delle figure in ordine di lettura, fps, loop, specchia)
CLIPS = {
    "idle": ("idle.jpg", [0, 1, 2, 3, 4, 5], 12, True, False),
    "walk": ("walk.jpg", [0, 1, 2, 3, 4, 5, 6], 12, True, False),
    "chase": ("chase.jpg", [0, 1, 2, 3, 4, 5, 6, 7], 30, True, False),
    "notice": ("notice_turn.jpg", [0, 1, 3], 24, False, True),
    "jump": ("jump.jpg", [0, 1, 2, 3, 4, 5, 6, 7], 24, False, False),
    "hurt": ("hurt.jpg", [1, 2, 3, 4, 5], 24, False, False),
    # Atterraggio: dal foglio del salto se manca il video (pose 7 e 8).
    "land": ("jump.jpg", [6, 7], 24, False, False),
    # Preavviso e balzo: dal foglio dell'attacco se mancano i video.
    "windup": ("attack.jpg", [0, 1, 2], 24, False, False),
    "pounce": ("attack.jpg", [3, 4, 5], 24, False, False),
}

# Cicli estratti dai video Grok (tools/art/video_cycle.py): cartella dei fotogrammi RGBA, fps, passo
# (1 = tutti i fotogrammi, 2 = uno su due).
# Sostituiscono il foglio della clip; ogni fotogramma è già ritagliato sullo stesso riquadro.
VIDEO_ROOT = ROOT.parent / ".tools/gatto-video"
VIDEO = {
    "walk": (VIDEO_ROOT / "camminata/ciclo", 24, 1),
    "chase": (VIDEO_ROOT / "corsa/ciclo", 24, 1),
    # Riposo: ciclo di 4 s preso a un fotogramma su due (12 fps) per tenere piccolo l'atlante.
    "idle": (VIDEO_ROOT / "riposo/ciclo", 12, 2),
    # Salto dal video, diviso come gli stati del gioco: volo (jump) e atterraggio (land).
    "jump": (VIDEO_ROOT / "salto/volo", 24, 1),
    "land": (VIDEO_ROOT / "salto/atterraggio", 24, 1),
    "hurt": (VIDEO_ROOT / "colpito/colpo", 24, 1),
    # Attacco dal video, diviso come gli stati del gioco: preavviso (crouch) e balzo (pounce).
    "windup": (VIDEO_ROOT / "attacco/preavviso", 24, 1),
    "pounce": (VIDEO_ROOT / "attacco/balzo", 24, 1),
}
# Clip video che si allineano sui piedi fotogramma per fotogramma: lo spostamento del gatto nel
# video (salita, rinculo, slancio) in gioco lo fa già la fisica.
FEET_ALIGN = {"jump", "land", "hurt", "windup", "pounce"}

# Pose intermedie (foglio, indici): si intercalano dopo ogni posa approvata della clip.
# Con il doppio delle pose la corsa sale a 30 fps: ciclo di circa mezzo secondo.
INTER = {
    "chase": ("chase_inter.jpg", [0, 1, 2, 3, 4, 5, 6, 7]),
    # Salto dai fogli (se manca il video): 8 pose + 7 intermedie = 15.
    "jump": ("jump_inter.jpg", [0, 1, 2, 3, 4, 5, 6]),
}

# Fogli con due righe di figure: si legge prima la riga in alto. Gli altri sono a riga unica.
TWO_ROWS = {"walk.jpg", "chase.jpg", "notice_turn.jpg", "hurt.jpg"}

CELL = 512         # lato della tela di ogni fotogramma
FEET_Y = 470        # riga dei piedi nella tela (come Ferruccio: 11/12 dell'altezza)
DARKER = 28         # quanto un pixel deve essere più scuro dello sfondo per essere gatto
MIN_AREA = 4000     # figure più piccole sono scie, polvere o testo


def figures(path, two_rows):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.int16)
    lum = a.mean(axis=2)
    border = np.concatenate([lum[:20].ravel(), lum[-20:].ravel(), lum[:, :20].ravel(), lum[:, -20:].ravel()])
    bg = np.median(border)
    # Niente riempimento dei buchi: gli spazi tra le zampe sono sfondo, non gatto.
    mask = ndimage.binary_closing(lum < bg - DARKER, iterations=1)
    # Figure che si toccano: si separano sui nuclei erosi, poi ogni pixel va al nucleo più vicino.
    cores, n = ndimage.label(ndimage.binary_erosion(mask, iterations=7))
    _, (iy, ix) = ndimage.distance_transform_edt(cores == 0, return_indices=True)
    labels = np.where(mask, cores[iy, ix], 0)
    figs = []
    for i, sl in enumerate(ndimage.find_objects(labels), start=1):
        if sl is None:
            continue
        area = int((labels[sl] == i).sum())
        if area < MIN_AREA:
            continue
        figs.append({"id": i, "sl": sl, "area": area,
                     "cy": (sl[0].start + sl[0].stop) / 2, "cx": (sl[1].start + sl[1].stop) / 2})
    # Figure larghe quasi il doppio della mediana sono due pose che si toccano: si tagliano nella
    # colonna più vuota della loro parte centrale.
    if len(figs) > 2:
        med_w = float(np.median([f["sl"][1].stop - f["sl"][1].start for f in figs]))
        next_id = int(labels.max()) + 1
        for f in list(figs):
            sl = f["sl"]
            w = sl[1].stop - sl[1].start
            if w < med_w * 1.7:
                continue
            own = labels[sl] == f["id"]
            cols = own.sum(axis=0)
            lo, hi = int(w * 0.3), int(w * 0.7)
            cut_x = sl[1].start + lo + int(np.argmin(cols[lo:hi]))
            right = (labels == f["id"]) & (np.arange(labels.shape[1])[None, :] >= cut_x)
            labels[right] = next_id
            figs.remove(f)
            for lid in (f["id"], next_id):
                part = ndimage.find_objects((labels == lid).astype(int))[0]
                figs.append({"id": lid, "sl": part, "area": int((labels == lid).sum()),
                             "cy": (part[0].start + part[0].stop) / 2, "cx": (part[1].start + part[1].stop) / 2})
            next_id += 1
        figs = [f for f in figs if f["area"] >= MIN_AREA]
    # Ordine di lettura: con due righe prima quella in alto (metà superiore del foglio), poi da sinistra.
    half = lum.shape[0] / 2
    key = (lambda f: (f["cy"] >= half, f["cx"])) if two_rows else (lambda f: f["cx"])
    return im, lum, labels, sorted(figs, key=key), bg


def cut(im, lum, labels, f, bg):
    """Ritaglio RGBA della figura. L'alfa cresce con lo scarto dallo sfondo: l'ombra a terra,
    poco più scura del grigio, resta quasi trasparente; il pelo nero è pieno."""
    sl = f["sl"]
    rgb = np.asarray(im)[sl].copy()
    own = labels[sl] == f["id"]
    inside = ndimage.binary_dilation(own, iterations=2)
    # Interno pieno: i riflessi chiari del pelo e la sfocatura della corsa non diventano trasparenti.
    # Solo la fascia di bordo sfuma con lo scarto dallo sfondo (antialias, ombra a terra quasi invisibile).
    # I riflessi più chiari restano fuori dalla maschera e lasciano buchi piccoli nel pelo: si chiudono
    # solo quelli piccoli, non gli spazi tra le zampe o sotto la coda.
    holes, nh = ndimage.label(ndimage.binary_fill_holes(own) & ~own)
    sizes = ndimage.sum(np.ones_like(holes), holes, range(1, nh + 1)) if nh else []
    small = np.isin(holes, [i + 1 for i, s in enumerate(sizes) if s < 1500])
    solid = own | small
    core = ndimage.binary_erosion(solid, iterations=3)
    inside = inside | small
    diff = bg - lum[sl]
    edge = np.clip((diff - DARKER * 0.6) / (DARKER * 1.4), 0.0, 1.0)
    alpha = np.where(core, 1.0, edge) * inside
    return Image.fromarray(np.dstack([rgb, (alpha * 255).astype(np.uint8)]), "RGBA")


def solid_area(piece):
    return int((np.asarray(piece)[:, :, 3] > 128).sum())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, default=ROOT / "src/assets/art/enemies/gatto_frames")
    ap.add_argument("--preview", type=Path, default=ROOT.parent / ".tools/gatto-preview")
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    args.preview.mkdir(parents=True, exist_ok=True)
    meta = {"size": CELL, "feet": [CELL / 2, FEET_Y], "height_pixels": None, "clips": {}}
    report = []
    rows_img = []

    def load(sheet, picks, mirror):
        im, lum, labels, figs, bg = figures(SRC / sheet, sheet in TWO_ROWS)
        report.append(f"{sheet} -> {len(figs)} figure trovate, uso {picks}")
        out = []
        for k in picks:
            if k >= len(figs):
                report.append(f"  ATTENZIONE: figura {k} mancante in {sheet}")
                continue
            piece = cut(im, lum, labels, figs[k], bg)
            out.append(piece.transpose(Image.FLIP_LEFT_RIGHT) if mirror else piece)
        return out

    # Primo passo: ritagli grezzi di ogni clip, come coppie (pezzo, foglio di provenienza).
    # Con un foglio di intermedie (INTER) le pose si alternano: approvata, intermedia, approvata...
    raw = {}
    for clip, (sheet, picks, fps, loop, mirror) in CLIPS.items():
        if clip in VIDEO and VIDEO[clip][0].is_dir():
            folder = VIDEO[clip][0]
            files = sorted(folder.glob("*.png"))[::VIDEO[clip][2]]
            report.append(f"{clip}: video {folder} -> {len(files)} fotogrammi")
            pieces = [Image.open(p).convert("RGBA") for p in files]
            if clip in FEET_ALIGN:
                # Il video contiene lo spostamento verticale (il gatto sale nell'inquadratura), ma in gioco
                # il corpo sale già per la fisica: ogni fotogramma si ritaglia sulla sua sagoma, così i
                # piedi restano sulla riga dei piedi.
                pieces = [p.crop(p.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()) for p in pieces]
            # Altrimenti il riquadro del video è comune a tutti i fotogrammi: i piedi del ciclo restano fermi.
            raw[clip] = [(p, str(folder)) for p in pieces]
            continue
        base = [(p, sheet) for p in load(sheet, picks, mirror)]
        if clip in INTER:
            isheet, ipicks = INTER[clip]
            inter = [(p, isheet) for p in load(isheet, ipicks, mirror)]
            merged = []
            for i, b in enumerate(base):
                merged.append(b)
                if i < len(inter):
                    merged.append(inter[i])
            base = merged
        raw[clip] = base

    # Grok non usa la stessa scala in ogni foglio. La superficie del gatto cambia poco con la posa,
    # quindi ogni foglio viene scalato perché la sua superficie mediana sia quella della camminata.
    by_sheet = {}
    for ps in raw.values():
        for p, s in ps:
            by_sheet.setdefault(s, []).append(solid_area(p))
    ref_area = float(np.median(by_sheet[raw["walk"][0][1]]))
    sheet_scale = {s: math.sqrt(ref_area / float(np.median(a))) for s, a in by_sheet.items()}
    # Riduzione comune perché la posa più grande stia nella tela.
    biggest = max(max(p.size) * sheet_scale[s] for ps in raw.values() for p, s in ps)
    fit = min(1.0, (CELL - 24) / biggest)

    for clip, (sheet, picks, fps, loop, mirror) in CLIPS.items():
        report.append(f"  scala {clip}: {sheet_scale[raw[clip][0][1]] * fit:.3f}, {len(raw[clip])} fotogrammi")
        frames = []
        for piece, src_sheet in raw[clip]:
            k_scale = sheet_scale[src_sheet] * fit
            w, h = piece.size
            piece = piece.resize((max(1, int(w * k_scale)), max(1, int(h * k_scale))), Image.LANCZOS)
            w, h = piece.size
            canvas = Image.new("RGBA", (CELL, CELL))
            canvas.alpha_composite(piece, (int(CELL / 2 - w / 2), int(FEET_Y - h)))
            frames.append(canvas)
        if clip == "walk":
            # Altezza di riferimento per il gioco: il gatto in piedi della camminata, dai piedi alle orecchie.
            bbox = frames[0].getchannel("A").point(lambda v: 255 if v > 128 else 0).getbbox()
            meta["height_pixels"] = float(bbox[3] - bbox[1])
        cols = 4
        atlas = Image.new("RGBA", (CELL * cols, CELL * math.ceil(len(frames) / cols)))
        for i, fr in enumerate(frames):
            atlas.paste(fr, ((i % cols) * CELL, (i // cols) * CELL))
        atlas.save(args.out / f"{clip}.png")
        previews = []
        for fr in frames:
            bg_img = Image.new("RGBA", fr.size, "#26303c")
            bg_img.alpha_composite(fr)
            previews.append(bg_img.convert("RGB"))
        previews[0].save(args.preview / f"{clip}.gif", save_all=True, append_images=previews[1:],
                         duration=round(1000 / fps), loop=0)
        if clip in VIDEO and VIDEO[clip][0].is_dir():
            fps = VIDEO[clip][1]
        meta["clips"][clip] = {"frames": len(frames), "fps": fps, "loop": loop, "columns": cols}
        row = Image.new("RGB", (256 * 8, 256), "#26303c")
        for i, p in enumerate(previews[:8]):
            row.paste(p.resize((256, 256)), (i * 256, 0))
        rows_img.append(row)
    sheet = Image.new("RGB", (256 * 8, 256 * len(rows_img)))
    for i, r in enumerate(rows_img):
        sheet.paste(r, (0, i * 256))
    sheet.save(args.preview / "foglio.png")
    (args.out / "animations.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf8")
    print("\n".join(report))


if __name__ == "__main__":
    main()
