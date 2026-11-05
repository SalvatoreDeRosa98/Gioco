#!/usr/bin/env python3
"""Pupazzo dipinto (npc_puppets.json) ritagliato da un model sheet di profilo, su grigio.

Stesso formato dei pupazzi generati (tools/art/npc_puppets.py): atlante 4x4, un pezzo per cella,
regioni, registrazione delle giunture (start/end a 0.14/0.86 dell'altezza del pezzo, testa 0.92,
piede 0.12) e prese del busto. Qui le giunture sono dichiarate a mano in pixel del foglio, e i pezzi
vengono imbottiti di trasparente perche' le giunture cadano esattamente a quelle frazioni.

Uso: python -X utf8 tools/art/sheet_puppet.py guardia [--preview E:/gioco/.tools/rig-preview]
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "src/assets/art/characters/npc_puppets_sheet"
PUPPETS = ROOT / "src/data/npc_puppets.json"
ORDER = ["head", "torso", "shoulder", "shoulder_f", "elbow", "elbow_f", "wrist", "wrist_f",
         "thigh", "thigh_f", "knee", "knee_f", "ankle", "ankle_f", "accessory", "extra"]
ATLAS = 1254
CELL = ATLAS // 4
FIT = 296  # lato massimo di un pezzo nella cella

# Definizioni per personaggio. Coordinate in pixel del foglio originale; "flip" se il profilo guarda a
# sinistra (i pupazzi del gioco guardano a destra). Per ogni pezzo: poly, start (giuntura in alto),
# end (giuntura in basso). "dup" copia un altro pezzo (arto lontano nascosto) scurendolo un po'.
# "exclude" toglie dal pezzo i poligoni di altri pezzi; "inpaint" riempie i buchi del busto copiando
# il pixel piu' vicino verso la schiena, cosi' il braccio che oscilla non scopre il vuoto.
CHARS = {
    "guardia": {
        "sheet": "assets/art-source/personaggi/guardia3-model-sheet.jpg",
        "flip": True,
        "names": ["guardia", "combat_guardia"],
        "accessory": "halberd",
        "head_span": 230,
        "pieces": {
            "head": {"poly": [(960, 35), (1215, 35), (1215, 300), (1110, 300), (1070, 312), (1030, 300), (960, 300)],
                     "neck": (1070, 300)},
            "torso": {"poly": [(1020, 285), (1120, 285), (1160, 330), (1215, 480), (1215, 830), (1150, 835), (1150, 700),
                               (1120, 700), (1100, 660), (1085, 620), (985, 620), (985, 335)],
                      "sockets": {"head": (1070, 300), "shoulder": (1035, 345), "shoulder_f": (1035, 345)}},
            "shoulder": {"poly": [(985, 335), (1062, 335), (1065, 520), (990, 520)], "start": (1030, 345), "end": (1030, 520)},
            "elbow": {"poly": [(990, 515), (1068, 515), (1070, 632), (1005, 632)], "start": (1030, 520), "end": (1035, 628)},
            "wrist": {"poly": [(1005, 625), (1075, 625), (1075, 705), (1005, 705)], "start": (1035, 628), "end": (1040, 700)},
            "shoulder_f": {"dup": "shoulder"},
            "elbow_f": {"dup": "elbow"},
            "wrist_f": {"dup": "wrist"},
            "thigh": {"poly": [(985, 612), (1100, 612), (1112, 862), (993, 862)], "start": (1045, 620), "end": (1050, 855),
                      "exclude": ["elbow", "wrist"], "inpaint": True},
            "knee": {"poly": [(993, 850), (1110, 850), (1108, 1042), (998, 1042)], "start": (1050, 855), "end": (1050, 1035)},
            "ankle": {"poly": [(985, 1028), (1115, 1028), (1115, 1100), (985, 1100)], "start": (1050, 1035), "end": (1050, 1095)},
            "thigh_f": {"poly": [(1085, 640), (1160, 640), (1150, 862), (1092, 862)], "start": (1120, 645), "end": (1118, 855)},
            "knee_f": {"poly": [(1090, 850), (1150, 850), (1145, 1040), (1087, 1040)], "start": (1118, 855), "end": (1115, 1035)},
            "ankle_f": {"poly": [(1040, 1022), (1140, 1022), (1140, 1090), (1040, 1090)], "start": (1100, 1030), "end": (1100, 1085)},
            # Alabarda: la presa della mano (y 495) deve cadere all'ancora dell'accessorio (0.52 dell'altezza).
            "accessory": {"poly": [(760, 25), (905, 25), (905, 1075), (760, 1075)],
                          "exclude_poly": [[(815, 462), (880, 462), (880, 528), (815, 528)]], "grip_y": 495, "anchor_y": 0.52},
        },
    },
}

FRACTIONS = {"head": (None, 0.92), "ankle": (0.12, 0.86), "ankle_f": (0.12, 0.86)}


def key_figure(rgb: np.ndarray) -> np.ndarray:
    """Alfa del personaggio su grigio piatto: scarto di luminanza o colore dal grigio di bordo."""
    f = rgb.astype(np.float32)
    lum = f.mean(axis=2)
    border = np.concatenate([lum[:12].ravel(), lum[-12:].ravel(), lum[:, :12].ravel(), lum[:, -12:].ravel()])
    bg = float(np.median(border))
    sat = f.max(axis=2) - f.min(axis=2)
    diff = np.abs(lum - bg)
    mask = (diff > 22) | (sat > 28)
    mask = ndimage.binary_closing(mask, iterations=2)
    holes, nh = ndimage.label(ndimage.binary_fill_holes(mask) & ~mask)
    hs = ndimage.sum(np.ones_like(holes), holes, range(1, nh + 1)) if nh else []
    mask = mask | np.isin(holes, [i + 1 for i, v in enumerate(hs) if v < 1500])
    lab, n = ndimage.label(mask)
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 2000])
    soft = np.clip((np.maximum(diff, sat * 0.8) - 10.0) / 24.0, 0.0, 1.0)
    core = ndimage.binary_erosion(keep, iterations=2)
    return np.where(core, 1.0, soft * keep).astype(np.float32)


def poly_mask(size, poly):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).polygon(poly, fill=255)
    return np.asarray(m, np.float32) / 255.0


def build(name: str, preview: Path | None) -> None:
    cfg = CHARS[name]
    sheet = Image.open(ROOT / cfg["sheet"]).convert("RGB")
    rgb = np.asarray(sheet)
    alpha = key_figure(rgb)
    H, W = alpha.shape
    pieces_px = {}
    joints = {}
    # Maschere dei pezzi (per le esclusioni).
    masks = {k: poly_mask(sheet.size, v["poly"]) for k, v in cfg["pieces"].items() if "poly" in v}
    for key, spec in cfg["pieces"].items():
        if "dup" in spec:
            continue
        m = masks[key].copy()
        for other in spec.get("exclude", []):
            m *= 1.0 - masks[other]
        for ep in spec.get("exclude_poly", []):
            m *= 1.0 - poly_mask(sheet.size, ep)
        a = alpha * m
        px = np.dstack([rgb.astype(np.float32), a * 255.0])
        if spec.get("inpaint"):
            # Buchi del busto (dove c'era il braccio): copia il pixel pieno piu' vicino verso la schiena,
            # cioe' a destra nel foglio (il profilo guarda a sinistra).
            hole = (masks[key] > 0.5) & (a < 0.5) & (alpha > 0.5)
            ys, xs = np.where(hole)
            for y, x in zip(ys, xs):
                row = np.where((masks[key][y] > 0.5) & (a[y] > 0.5) & (np.arange(W) > x))[0]
                if len(row):
                    px[y, x, :3] = rgb[y, row[0]]
                    px[y, x, 3] = 255.0
        ys, xs = np.where(px[..., 3] > 20)
        if not len(ys):
            raise SystemExit(f"pezzo vuoto: {key}")
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        # Imbottitura verticale: le giunture devono cadere alle frazioni della registrazione.
        if key == "head":
            top, neck = y0, spec["neck"][1]
            Hp = (neck - top) / 0.92
            T, B = top, int(round(top + Hp))
            s, e = spec["neck"], spec["neck"]
        elif key in ("torso", "accessory"):
            T, B = y0, y1
            s = e = None
            if "grip_y" in spec:
                # Imbottitura trasparente sopra o sotto finche' la presa sta alla frazione richiesta.
                g, f = spec["grip_y"], spec["anchor_y"]
                if (g - T) / (B - T) < f:
                    T = int(round(g - f * (B - g) / (1.0 - f)))
                else:
                    B = int(round(g + (g - T) * (1.0 - f) / f))
        else:
            fs, fe = FRACTIONS.get(key, (0.14, 0.86))
            s, e = spec["start"], spec["end"]
            Hp = (e[1] - s[1]) / (fe - fs)
            T = int(round(s[1] - fs * Hp))
            B = int(round(T + Hp))
        T, B = min(T, y0), max(B, y1)
        # Ritaglio con imbottitura trasparente anche fuori dal foglio.
        crop = np.zeros((B - T, x1 - x0, 4), np.float32)
        sy0, sy1 = max(T, 0), min(B, H)
        crop[sy0 - T:sy1 - T] = px[sy0:sy1, x0:x1]
        if key not in ("torso", "accessory"):
            # Contenuto oltre l'imbottitura calcolata: lo si lascia ma le frazioni restano quelle delle
            # giunture reali (calcolate sotto dall'altezza effettiva del ritaglio).
            pass
        img = Image.fromarray(crop.round().clip(0, 255).astype(np.uint8), "RGBA")
        info = {"img": img, "x0": x0, "T": T}
        if s is not None:
            info["start"] = ((s[0] - x0) / img.width, (s[1] - T) / img.height)
            info["end"] = ((e[0] - x0) / img.width, (e[1] - T) / img.height)
        if key == "torso":
            info["sockets"] = {k: ((v[0] - x0) / img.width, (v[1] - T) / img.height) for k, v in spec["sockets"].items()}
        pieces_px[key] = info
    for key, spec in cfg["pieces"].items():
        if "dup" in spec:
            src = pieces_px[spec["dup"]]
            img = src["img"].copy()
            arr = np.asarray(img).astype(np.float32)
            arr[..., :3] *= 0.82
            info = dict(src)
            info["img"] = Image.fromarray(arr.round().clip(0, 255).astype(np.uint8), "RGBA")
            pieces_px[key] = info
    # Specchia (profilo verso destra) e scala ogni pezzo nella cella.
    atlas = Image.new("RGBA", (ATLAS, ATLAS))
    regions, registration, sockets = {}, {}, {}
    for i, key in enumerate(ORDER):
        if key not in pieces_px:
            continue
        info = pieces_px[key]
        img = info["img"]
        if cfg["flip"]:
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
            fx = lambda p: (1.0 - p[0], p[1])
        else:
            fx = lambda p: p
        k = min(1.0, FIT / max(img.size))
        img = img.resize((max(1, int(img.width * k)), max(1, int(img.height * k))), Image.LANCZOS)
        col, row = i % 4, i // 4
        x = col * CELL + (CELL - img.width) // 2
        y = row * CELL + (CELL - img.height) // 2
        atlas.alpha_composite(img, (x, y))
        regions[key] = [x, y, img.width, img.height]
        if "start" in info:
            registration[key] = {"start": [round(v, 5) for v in fx(info["start"])],
                                 "end": [round(v, 5) for v in fx(info["end"])]}
        if key == "torso":
            sockets = {k: [round(v, 4) for v in fx(p)] for k, p in info["sockets"].items()}
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    atlas_path = OUT_DIR / f"{name}.png"
    atlas.save(atlas_path)
    entry = {
        "atlas": "res://" + atlas_path.relative_to(ROOT / "src").as_posix(),
        "regions": regions, "profile": "standing", "accessory": cfg["accessory"], "height": 1000, "pace": 1.0,
        "registration": registration, "sockets": sockets, "head_span": cfg["head_span"], "weapon": True,
    }
    data = json.loads(PUPPETS.read_text(encoding="utf8"))
    for n in cfg["names"]:
        old = data.get(n, {})
        keep = {k: old[k] for k in ("rest_pose", "companion", "pace") if k in old}
        data[n] = {**entry, **keep}
    PUPPETS.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf8")
    print(f"{name}: atlante {atlas_path.name}, {len(regions)} pezzi, voci {cfg['names']}")
    if preview:
        preview.mkdir(parents=True, exist_ok=True)
        bg = Image.new("RGBA", atlas.size, (90, 100, 120, 255))
        bg.alpha_composite(atlas)
        d = ImageDraw.Draw(bg)
        for key, (x, y, w, h) in regions.items():
            d.rectangle([x, y, x + w, y + h], outline=(255, 60, 60, 255), width=2)
            d.text((x + 4, y + 4), key, fill=(255, 255, 0, 255))
            if key in registration:
                for p in (registration[key]["start"], registration[key]["end"]):
                    cx, cy = x + p[0] * w, y + p[1] * h
                    d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=(0, 255, 120, 255))
        bg.convert("RGB").save(preview / f"{name}_puppet_atlas.jpg")
        over = sheet.copy()
        d = ImageDraw.Draw(over)
        for key, spec in cfg["pieces"].items():
            if "poly" in spec:
                d.polygon(spec["poly"], outline=(255, 0, 80))
        over.crop((700, 0, 1280, 1116)).save(preview / f"{name}_puppet_poligoni.jpg")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("name", choices=list(CHARS))
    ap.add_argument("--preview", type=Path)
    a = ap.parse_args()
    build(a.name, a.preview)
