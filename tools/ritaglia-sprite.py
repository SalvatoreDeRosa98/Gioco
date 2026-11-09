#!/usr/bin/env python3
"""Ritaglia i fogli sprite dell'autore (gioco/assets/sprite_ombre/) in fogli puliti a griglia regolare.

Passo T2 del Teatro delle Marionette. Per ciascuno dei 12 fogli di arte vera:

1. rimuove lo sfondo a scacchiera finto (celle grigie/bianche dipinte al posto della trasparenza),
   se presente: pixel chiari poco saturi collegati al bordo del foglio -> alfa 0;
2. rimuove, se richiesto dalla configurazione, le linee guida sottili (righe/colonne lunghe e sottili);
3. trova le componenti connesse (8-connessione, etichettatura a run in numpy), scarta i pixel spuri
   (area sotto soglia) e le scritte (lettere piccole allineate in riga, es. «Idle_1»);
4. unisce i frammenti della stessa figura (alone, arma staccata, schegge) con un raggruppamento
   agglomerativo vincolato: due «nuclei» (componenti grandi) non finiscono mai nella stessa figura;
5. ordina le figure in righe (sovrapposizione verticale) e colonne (x);
6. ricompone un foglio a celle uguali (figura più grande + margine), figure ancorate ai piedi
   in basso al centro della cella, una riga per posa nell'ordine del manifesto
   (gioco/contenuti/sprite.json > voci[].layout.pose);
7. scrive gioco/assets/sprite_teatro/<nome>.png, gioco/assets/sprite_teatro/layout.json e il foglio
   di contatti production/qa/evidence/sprite-teatro-contatti.png; stampa un rapporto.

Uso:  python3 tools/ritaglia-sprite.py [nome ...]
Richiede Pillow e numpy (nessun'altra dipendenza).
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

RADICE = Path(__file__).resolve().parent.parent
SORGENTE = RADICE / "gioco" / "assets" / "sprite_ombre"
DESTINAZIONE = RADICE / "gioco" / "assets" / "sprite_teatro"
MANIFESTO = RADICE / "gioco" / "contenuti" / "sprite.json"
CONTATTI = RADICE / "production" / "qa" / "evidence" / "sprite-teatro-contatti.png"

# I 12 fogli di arte vera consegnati dall'autore (gli altri 79 in sprite_ombre/ sono segnaposto).
FOGLI = [
    "ferruccio", "agnese", "taddeo", "ombra", "teste-mira",
    "gatto", "vespa-cieca", "maschera", "bomba-ferma", "guardia", "statua", "predone",
]

# Soglie di base (in pixel del foglio sorgente); ogni foglio può sovrascriverle in CONFIG.
BASE = {
    "alfa_min": 100,         # alfa sotto cui un pixel non conta per le componenti (l'alone bianco
                             # a ~47 unirebbe lettere e figure vicine; lo si recupera nel ritaglio)
    "bordo_ritaglio": 5,     # px di dilatazione della maschera nel ritaglio (alone e antialias)
    "area_min": 60,          # componenti più piccole: pixel spuri
    "nucleo_frazione": 0.18, # una componente è «nucleo» se area >= frazione * area del nucleo mediano
    "dist_unione": 40,       # distanza massima (gap tra riquadri) per unire frammenti a una figura
    "figura_frazione": 0.12, # un gruppo senza nucleo è una figura se area >= frazione * area mediana
    "promozione": 0.25,      # un gruppo di soli frammenti con area >= promozione * nucleo mediano è un nucleo
    "linee": False,          # rimuovere linee guida lunghe e sottili
    "linea_lung": 120,       # lunghezza minima di una linea guida
    "linea_spess": 5,        # spessore massimo di una linea guida
    "testo_alt_max": 34,     # altezza massima di una lettera
    "testo_area_max": 700,   # area massima di una lettera
    "altezza_rif": 128,      # altezza in px (foglio di uscita) della figura di riferimento (riga 0)
    "margine": 4,            # margine in px attorno alla figura nella cella (foglio di uscita)
}
CONFIG: dict[str, dict] = {
    "ombra": {"linee": True},
    "predone": {"linee": True},
    "statua": {"linee": True},
    "vespa-cieca": {"dist_unione": 55, "promozione": 1.0},
    "bomba-ferma": {"dist_unione": 20},
    "teste-mira": {"altezza_rif": 64},
}


# --------------------------------------------------------------------------------------------
# Etichettatura a run (8-connessione) senza scipy
# --------------------------------------------------------------------------------------------
class UnioneTrova:
    """Union-find con compressione dei cammini."""

    def __init__(self, n: int):
        self.p = list(range(n))

    def trova(self, a: int) -> int:
        p = self.p
        while p[a] != a:
            p[a] = p[p[a]]
            a = p[a]
        return a

    def unisci(self, a: int, b: int) -> None:
        ra, rb = self.trova(a), self.trova(b)
        if ra != rb:
            if ra < rb:
                self.p[rb] = ra
            else:
                self.p[ra] = rb


def runs_orizzontali(mask: np.ndarray):
    """Restituisce (y, inizio, fine_esclusa) di ogni run orizzontale di True, in ordine di riga."""
    h, w = mask.shape
    pad = np.zeros((h, w + 2), dtype=np.int8)
    pad[:, 1:-1] = mask
    d = np.diff(pad, axis=1)
    ys, xs = np.nonzero(d == 1)
    _, xe = np.nonzero(d == -1)
    return ys, xs, xe


def etichetta(mask: np.ndarray):
    """Componenti connesse 8-connesse. Restituisce (etichette int32, n, statistiche).

    statistiche: array (n, 5) con area, x0, y0, x1, y1 (x1/y1 esclusi); etichette 1..n, 0 = sfondo.
    """
    ys, xs, xe = runs_orizzontali(mask)
    nr = len(ys)
    uf = UnioneTrova(nr)
    if nr:
        # indice del primo run di ogni riga
        h = mask.shape[0]
        primo = np.searchsorted(ys, np.arange(h + 1))
        ysl, xsl, xel = ys.tolist(), xs.tolist(), xe.tolist()
        for y in range(1, h):
            a0, a1 = primo[y - 1], primo[y]
            b0, b1 = primo[y], primo[y + 1]
            i, j = a0, b0
            while i < a1 and j < b1:
                # sovrapposizione 8-connessa: [s1, e1) e [s2, e2) si toccano se s1 <= e2 e s2 <= e1
                if xsl[i] <= xel[j] and xsl[j] <= xel[i]:
                    uf.unisci(i, j)
                if xel[i] < xel[j]:
                    i += 1
                else:
                    j += 1
    radici = np.array([uf.trova(k) for k in range(nr)], dtype=np.int64)
    uniche, inv = np.unique(radici, return_inverse=True)
    n = len(uniche)
    lab_run = inv + 1
    lab = np.zeros(mask.shape, dtype=np.int32)
    for k in range(nr):
        lab[ys[k], xs[k]:xe[k]] = lab_run[k]
    stats = np.zeros((n, 5), dtype=np.int64)
    if n:
        lunghezze = xe - xs
        stats[:, 0] = np.bincount(inv, weights=lunghezze, minlength=n).astype(np.int64)
        stats[:, 1] = np.iinfo(np.int64).max
        stats[:, 2] = np.iinfo(np.int64).max
        np.minimum.at(stats[:, 1], inv, xs)
        np.minimum.at(stats[:, 2], inv, ys)
        np.maximum.at(stats[:, 3], inv, xe)
        np.maximum.at(stats[:, 4], inv, ys + 1)
    return lab, n, stats


def lunghezza_run(mask: np.ndarray) -> np.ndarray:
    """Per ogni pixel True, la lunghezza del run orizzontale che lo contiene."""
    out = np.zeros(mask.shape, dtype=np.int32)
    ys, xs, xe = runs_orizzontali(mask)
    for y, s, e in zip(ys.tolist(), xs.tolist(), xe.tolist()):
        out[y, s:e] = e - s
    return out


def dilata(mask: np.ndarray, r: int) -> np.ndarray:
    """Dilatazione quadrata di raggio r con spostamenti numpy."""
    out = mask.copy()
    for _ in range(r):
        m = out.copy()
        m[1:, :] |= out[:-1, :]
        m[:-1, :] |= out[1:, :]
        m[:, 1:] |= out[:, :-1]
        m[:, :-1] |= out[:, 1:]
        out = m
    return out


# --------------------------------------------------------------------------------------------
# Pulizia
# --------------------------------------------------------------------------------------------
def togli_scacchiera(rgba: np.ndarray, note: list[str]) -> None:
    """Se il foglio ha uno sfondo a scacchiera dipinto, lo porta ad alfa 0 (in place)."""
    rgb = rgba[..., :3].astype(np.float32)
    a = rgba[..., 3]
    mx = rgb.max(axis=2)
    mn = rgb.min(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1)
    candidato = (a > 0) & (sat < 0.10) & (mx > 140)
    frazione = candidato.mean()
    if frazione < 0.20:
        return
    # Regolarità: le celle della scacchiera alternano due livelli di grigio; si controlla che il
    # candidato contenga sia grigi medi (~185) sia quasi-bianchi (>240) in quantità comparabili.
    medi = (candidato & (mx < 215)).sum()
    chiari = (candidato & (mx >= 215)).sum()
    if min(medi, chiari) < 0.15 * max(medi, chiari):
        return
    sfondo = candidato | (a == 0)
    lab, n, st = etichetta(sfondo)
    h, w = a.shape
    bordo = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])).tolist()) - {0}
    togli = np.isin(lab, list(bordo)) & candidato
    # Alone di bordo: pixel grigi poco saturi a contatto con lo sfondo rimosso.
    alone = dilata(togli, 2) & (a > 0) & (sat < 0.14) & (mx > 95) & ~togli
    togli |= alone
    rgba[togli, 3] = 0
    note.append(f"scacchiera finta rimossa ({togli.sum()} px, {frazione:.0%} del foglio)")


def togli_linee(mask: np.ndarray, cfg: dict, note: list[str]) -> np.ndarray:
    """Toglie righe/colonne lunghe e sottili (linee guida e bordi di cella dipinti)."""
    L, S = cfg["linea_lung"], cfg["linea_spess"]
    hl = lunghezza_run(mask)
    vl = lunghezza_run(mask.T).T
    linea = ((hl >= L) & (vl <= S)) | ((vl >= L) & (hl <= S))
    linea = dilata(linea, 1) & mask
    if linea.any():
        note.append(f"linee guida rimosse ({linea.sum()} px)")
    return mask & ~linea


def trova_testo(stats: np.ndarray, vivi: list[int], cfg: dict) -> set[int]:
    """Lettere: componenti piccole, basse, allineate in riga a gruppi di almeno 3."""
    piccole = [i for i in vivi
               if stats[i, 4] - stats[i, 2] <= cfg["testo_alt_max"] and stats[i, 0] <= cfg["testo_area_max"]
               and stats[i, 3] - stats[i, 1] <= 2.2 * cfg["testo_alt_max"]]
    if not piccole:
        return set()
    uf = UnioneTrova(len(piccole))
    for a in range(len(piccole)):
        ia = piccole[a]
        ya0, ya1 = stats[ia, 2], stats[ia, 4]
        for b in range(a + 1, len(piccole)):
            ib = piccole[b]
            yb0, yb1 = stats[ib, 2], stats[ib, 4]
            sovr = min(ya1, yb1) - max(ya0, yb0)
            if sovr < 0.4 * min(ya1 - ya0, yb1 - yb0):
                continue
            gap = max(stats[ia, 1], stats[ib, 1]) - min(stats[ia, 3], stats[ib, 3])
            if gap <= 0.9 * max(ya1 - ya0, yb1 - yb0) + 2:
                uf.unisci(a, b)
    gruppi: dict[int, list[int]] = {}
    for k, i in enumerate(piccole):
        gruppi.setdefault(uf.trova(k), []).append(i)
    testo: set[int] = set()
    for membri in gruppi.values():
        if len(membri) < 3:
            continue
        x0 = min(stats[i, 1] for i in membri); x1 = max(stats[i, 3] for i in membri)
        y0 = min(stats[i, 2] for i in membri); y1 = max(stats[i, 4] for i in membri)
        if (x1 - x0) >= 1.8 * (y1 - y0):
            testo.update(membri)
    return testo


def taglia_cuciture(f: dict, k: int, alfa: np.ndarray) -> list[dict]:
    """Taglia una figura in k parti lungo cuciture verticali di alfa minima (programmazione dinamica).

    Ogni cucitura scende dall'alto in basso spostandosi di al più 1 px per riga, dentro una finestra
    attorno a j*larghezza/k, e passa dove la figura è più trasparente (tipicamente il varco tra due
    fotogrammi che si toccano appena).
    """
    x0, y0, x1, y1 = f["riq"]
    m = f["m"]
    costo = np.where(m, alfa[y0:y1, x0:x1].astype(np.float64) / 255.0, 0.0)
    h, w = costo.shape
    cuciture = [np.zeros(h, dtype=np.int64)]
    for j in range(1, k):
        c = j * w / k
        a, b = int(max(1, c - w / (7 * k))), int(min(w - 1, c + w / (7 * k)))
        sub = costo[:, a:b] + 1e-3 * np.abs(np.arange(a, b) - c) / w  # a parità, vicino al centro
        acc = sub.copy()
        for y in range(1, h):
            prev = acc[y - 1]
            sx = np.concatenate([[np.inf], prev[:-1]])
            dx = np.concatenate([prev[1:], [np.inf]])
            acc[y] += np.minimum(prev, np.minimum(sx, dx))
        seam = np.zeros(h, dtype=np.int64)
        seam[-1] = int(np.argmin(acc[-1]))
        for y in range(h - 2, -1, -1):
            xp = seam[y + 1]
            lo, hi = max(0, xp - 1), min(acc.shape[1], xp + 2)
            seam[y] = lo + int(np.argmin(acc[y, lo:hi]))
        cuciture.append(seam + a)
    cuciture.append(np.full(h, w, dtype=np.int64))
    xx = np.arange(w)[None, :]
    pezzi = []
    for j in range(k):
        sel = m & (xx >= cuciture[j][:, None]) & (xx < cuciture[j + 1][:, None])
        ys_, xs_ = np.nonzero(sel)
        if ys_.size == 0:
            continue
        pm = sel[ys_.min():ys_.max() + 1, xs_.min():xs_.max() + 1]
        riq = [x0 + int(xs_.min()), y0 + int(ys_.min()), x0 + int(xs_.max()) + 1, y0 + int(ys_.max()) + 1]
        pezzi.append({"membri": f["membri"], "area": int(pm.sum()), "riq": riq, "m": pm,
                      "nucleo": True, "vy": f["vy"]})
    return pezzi


def gap_riquadri(a, b) -> float:
    """Distanza tra due riquadri (x0, y0, x1, y1), 0 se si sovrappongono."""
    dx = max(0, max(a[0], b[0]) - min(a[2], b[2]))
    dy = max(0, max(a[1], b[1]) - min(a[3], b[3]))
    return math.hypot(dx, dy)


# --------------------------------------------------------------------------------------------
# Un foglio
# --------------------------------------------------------------------------------------------
def elabora(nome: str, voce: dict):
    cfg = {**BASE, **CONFIG.get(nome, {})}
    note: list[str] = []
    rgba = np.array(Image.open(SORGENTE / f"{nome}.png").convert("RGBA"))
    togli_scacchiera(rgba, note)
    mask = rgba[..., 3] >= cfg["alfa_min"]
    if cfg["linee"]:
        mask = togli_linee(mask, cfg, note)

    lab, n, st = etichetta(mask)
    vivi = [i for i in range(n) if st[i, 0] >= cfg["area_min"]]
    spuri = n - len(vivi)
    testo = trova_testo(st, vivi, cfg)
    vivi = [i for i in vivi if i not in testo]
    testo_mask = dilata(np.isin(lab, [i + 1 for i in testo]), 6) if testo else np.zeros(lab.shape, bool)
    if testo:
        note.append(f"scritte rimosse ({len(testo)} lettere)")

    aree = np.array([st[i, 0] for i in vivi], dtype=np.float64)
    soglia_nucleo = cfg["nucleo_frazione"] * np.median(np.sort(aree)[-max(1, len(aree) // 3):])
    nucleo = {i: st[i, 0] >= soglia_nucleo for i in vivi}

    # Raggruppamento agglomerativo vincolato (single link sul gap tra riquadri), in due fasi:
    # 1) si uniscono solo frammenti senza nucleo tra loro; un gruppo di frammenti abbastanza grande
    #    (es. il fotogramma «schegge» di un'esplosione) diventa a sua volta un nucleo;
    # 2) i frammenti rimasti si attaccano al gruppo più vicino; due nuclei non si uniscono mai.
    idx = {i: k for k, i in enumerate(vivi)}
    uf = UnioneTrova(len(vivi))
    ha_nucleo = [nucleo[i] for i in vivi]
    area_g = [int(st[i, 0]) for i in vivi]
    riq = {i: (st[i, 1], st[i, 2], st[i, 3], st[i, 4]) for i in vivi}
    coppie = []
    for a in range(len(vivi)):
        for b in range(a + 1, len(vivi)):
            d = gap_riquadri(riq[vivi[a]], riq[vivi[b]])
            if d <= cfg["dist_unione"]:
                coppie.append((d, a, b))
    coppie.sort()

    def unisci_gruppi(ra, rb):
        uf.unisci(ra, rb)
        r = uf.trova(ra)
        ha_nucleo[r] = ha_nucleo[ra] or ha_nucleo[rb]
        area_g[r] = area_g[ra] + area_g[rb]

    for d, a, b in coppie:
        ra, rb = uf.trova(a), uf.trova(b)
        if ra != rb and not ha_nucleo[ra] and not ha_nucleo[rb]:
            unisci_gruppi(ra, rb)
    area_nuclei = float(np.median([st[i, 0] for i in vivi if nucleo[i]]))
    for k in range(len(vivi)):
        r = uf.trova(k)
        if not ha_nucleo[r] and area_g[r] >= cfg["promozione"] * area_nuclei:
            ha_nucleo[r] = True
    for d, a, b in coppie:
        ra, rb = uf.trova(a), uf.trova(b)
        if ra == rb or (ha_nucleo[ra] and ha_nucleo[rb]):
            continue
        unisci_gruppi(ra, rb)
    gruppi: dict[int, list[int]] = {}
    for i in vivi:
        gruppi.setdefault(uf.trova(idx[i]), []).append(i)

    figure = []
    b = cfg["bordo_ritaglio"]
    for radice, membri in gruppi.items():
        area = sum(int(st[i, 0]) for i in membri)
        x0 = min(st[i, 1] for i in membri); y0 = min(st[i, 2] for i in membri)
        x1 = max(st[i, 3] for i in membri); y1 = max(st[i, 4] for i in membri)
        princ = max(membri, key=lambda i: st[i, 0])
        figure.append({"membri": membri, "area": area, "riq": [int(x0), int(y0), int(x1), int(y1)],
                       "nucleo": ha_nucleo[radice], "vy": (int(st[princ, 2]), int(st[princ, 4]))})
    area_med = float(np.median([f["area"] for f in figure if f["nucleo"]]))
    scartate = [f for f in figure if not f["nucleo"] and f["area"] < cfg["figura_frazione"] * area_med]
    figure = [f for f in figure if f not in scartate]
    if scartate:
        note.append(f"{len(scartate)} frammenti isolati scartati")

    # Maschera di ogni figura: pixel delle sue componenti + bordo (alone/antialias), senza le scritte.
    alfa = rgba[..., 3]
    for f in figure:
        x0, y0, x1, y1 = f["riq"]
        x0, y0 = max(0, x0 - b), max(0, y0 - b)
        x1, y1 = min(lab.shape[1], x1 + b), min(lab.shape[0], y1 + b)
        m = np.isin(lab[y0:y1, x0:x1], [i + 1 for i in f["membri"]])
        m = dilata(m, b) & (alfa[y0:y1, x0:x1] > 0) & ~testo_mask[y0:y1, x0:x1]
        f["riq"], f["m"] = [x0, y0, x1, y1], m

    # Righe: sovrapposizione verticale (sul riquadro del nucleo principale, più stabile delle armi).
    figure.sort(key=lambda f: (f["vy"][0] + f["vy"][1]) / 2)
    righe: list[list[dict]] = []
    for f in figure:
        y0, y1 = f["vy"]
        posto = None
        for r in righe:
            ry0 = min(g["vy"][0] for g in r); ry1 = max(g["vy"][1] for g in r)
            sovr = min(y1, ry1) - max(y0, ry0)
            if sovr >= 0.3 * min(y1 - y0, ry1 - ry0):
                posto = r
                break
        if posto is None:
            righe.append([f])
        else:
            posto.append(f)
    righe.sort(key=lambda r: min(g["vy"][0] for g in r))
    for r in righe:
        r.sort(key=lambda f: f["riq"][0])

    pose_man = voce.get("layout", {}).get("pose", [])
    attesi = [p["fotogrammi"] for p in pose_man]

    # Figure che si toccano (es. la luce della lanterna sul coltello del fotogramma accanto): se una
    # riga ha meno figure del manifesto, la figura più larga si taglia lungo cuciture di alfa minima.
    if len(righe) == len(pose_man):
        for ri, r in enumerate(righe):
            mancano = attesi[ri] - len(r)
            if mancano <= 0:
                continue
            larga = max(r, key=lambda f: f["riq"][2] - f["riq"][0])
            pezzi = taglia_cuciture(larga, mancano + 1, alfa)
            r.remove(larga)
            r.extend(pezzi)
            r.sort(key=lambda f: f["riq"][0])
            note.append(f"riga {ri}: una figura larga tagliata in {len(pezzi)} lungo cuciture di alfa minima")

    trovate = [len(r) for r in righe]
    if (len(righe) != len(pose_man) and sum(trovate) == sum(attesi)
            and all(len(r) >= 1 for r in righe)):
        # Il foglio mette più pose sulla stessa riga (es. spara×2 + colpito×1): stessa somma di
        # figure del manifesto, quindi le si ridistribuisce in ordine di lettura secondo il manifesto,
        # purché nessuna posa scavalchi una riga del foglio.
        lettura = [f for r in righe for f in r]
        confini = set(np.cumsum(trovate).tolist())
        tagli = np.cumsum(attesi).tolist()
        if confini <= set(tagli):
            nuove, k = [], 0
            for a in attesi:
                nuove.append(lettura[k:k + a]); k += a
            note.append(f"righe del foglio {trovate} ridistribuite secondo il manifesto {attesi}")
            righe = nuove
            trovate = [len(r) for r in righe]
    if len(righe) != len(pose_man):
        note.append(f"righe trovate {len(righe)} invece di {len(pose_man)} del manifesto")

    # Ritaglio: immagine RGBA della figura ridotta al riquadro dei suoi pixel.
    ritagli = []
    for r in righe:
        rr = []
        for f in r:
            x0, y0, x1, y1 = f["riq"]
            m = f["m"]
            ys_, xs_ = np.nonzero(m)
            m = m[ys_.min():ys_.max() + 1, xs_.min():xs_.max() + 1]
            x0, y0 = x0 + xs_.min(), y0 + ys_.min()
            x1, y1 = x0 + m.shape[1], y0 + m.shape[0]
            pezzo = rgba[y0:y1, x0:x1].copy()
            pezzo[~m] = 0
            # ancora orizzontale: baricentro del quarto inferiore della figura (i piedi)
            hh = y1 - y0
            cols = np.nonzero(m[int(hh * 0.75):, :])[1]
            ax = float(cols.mean()) if cols.size else (x1 - x0) / 2
            rr.append({"img": Image.fromarray(pezzo, "RGBA"), "ax": ax, "riq": [x0, y0, x1, y1]})
        ritagli.append(rr)


    # Scala: la mediana delle altezze della riga 0 diventa altezza_rif.
    alt_rif = float(np.median([f["riq"][3] - f["riq"][1] for f in righe[0]]))
    scala = min(1.0, cfg["altezza_rif"] / alt_rif)
    for rr in ritagli:
        for f in rr:
            w, h = f["img"].size
            nw, nh = max(1, round(w * scala)), max(1, round(h * scala))
            f["img"] = f["img"].resize((nw, nh), Image.LANCZOS)
            f["ax"] *= nw / w
    mg = cfg["margine"]
    semil = max(max(f["ax"], f["img"].size[0] - f["ax"]) for rr in ritagli for f in rr)
    cella_l = int(math.ceil(2 * semil)) + 2 * mg
    cella_a = max(f["img"].size[1] for rr in ritagli for f in rr) + 2 * mg
    colonne = max(len(rr) for rr in ritagli)
    foglio = Image.new("RGBA", (cella_l * colonne, cella_a * len(ritagli)), (0, 0, 0, 0))
    for ri, rr in enumerate(ritagli):
        for ci, f in enumerate(rr):
            w, h = f["img"].size
            px = ci * cella_l + round(cella_l / 2 - f["ax"])
            py = ri * cella_a + cella_a - mg - h
            foglio.alpha_composite(f["img"], (px, py))

    righe_out = []
    for k, rr in enumerate(ritagli):
        if k < len(pose_man):
            posa = pose_man[k]["posa"]
            attesi = pose_man[k]["fotogrammi"]
            if attesi != len(rr):
                note.append(f"posa «{posa}»: {len(rr)} fotogrammi trovati invece di {attesi}")
        else:
            posa = f"riga_{k}"
        righe_out.append({"posa": posa, "fotogrammi": len(rr)})
    for k in range(len(ritagli), len(pose_man)):
        note.append(f"posa «{pose_man[k]['posa']}» assente nel foglio")

    # Altezza a schermo di riferimento: la figura «fermo» (riga 0, colonna 0) nel foglio di uscita.
    altezza_rif = ritagli[0][0]["img"].size[1]
    voce_layout = {
        "cella_l": cella_l, "cella_a": cella_a, "colonne": colonne,
        "scala": round(scala, 4), "altezza_rif": altezza_rif, "margine": mg,
        "righe": righe_out,
    }
    if note:
        voce_layout["note"] = note
    rapporto = {"nome": nome, "trovate": trovate, "spuri": spuri, "note": note,
                "cella": (cella_l, cella_a), "foglio": foglio.size}
    return foglio, voce_layout, rapporto


def foglio_contatti(fogli: dict[str, Image.Image], layout: dict) -> Image.Image:
    """Tutti i fogli puliti affiancati, con la griglia delle celle e il nome, su fondo grigio."""
    pannelli = []
    for nome, img in fogli.items():
        L = layout[nome]
        lab_h = 18
        p = Image.new("RGBA", (img.size[0], img.size[1] + lab_h), (96, 92, 104, 255))
        # celle alternate leggermente diverse per vedere i bordi
        d = ImageDraw.Draw(p)
        for r in range(len(L["righe"])):
            for c in range(L["colonne"]):
                col = (110, 104, 118, 255) if (r + c) % 2 == 0 else (86, 82, 94, 255)
                d.rectangle([c * L["cella_l"], lab_h + r * L["cella_a"],
                             (c + 1) * L["cella_l"] - 1, lab_h + (r + 1) * L["cella_a"] - 1], fill=col)
            # linea dei piedi
            yb = lab_h + (r + 1) * L["cella_a"] - L["margine"]
            d.line([0, yb, img.size[0], yb], fill=(200, 60, 60, 255))
            d.text((2, lab_h + r * L["cella_a"] + 2), f"{L['righe'][r]['posa']}", fill=(255, 255, 160, 255))
        p.alpha_composite(img, (0, lab_h))
        d.text((2, 2), f"{nome}  {L['cella_l']}x{L['cella_a']}", fill=(255, 255, 255, 255))
        pannelli.append(p)
    # impaginazione a scaffale, larghezza massima 2400
    LMAX, sp = 2400, 10
    x = y = 0
    alt_riga = 0
    pos = []
    for p in pannelli:
        if x + p.size[0] > LMAX and x > 0:
            x = 0
            y += alt_riga + sp
            alt_riga = 0
        pos.append((x, y))
        x += p.size[0] + sp
        alt_riga = max(alt_riga, p.size[1])
    tot = Image.new("RGBA", (LMAX, y + alt_riga), (40, 36, 44, 255))
    for p, (px, py) in zip(pannelli, pos):
        tot.alpha_composite(p, (px, py))
    return tot


def main(argv: list[str]) -> int:
    manifesto = json.loads(MANIFESTO.read_text(encoding="utf-8"))
    voci = {v["nome"]: v for v in manifesto["voci"]}
    nomi = argv or FOGLI
    DESTINAZIONE.mkdir(parents=True, exist_ok=True)
    percorso_layout = DESTINAZIONE / "layout.json"
    layout = json.loads(percorso_layout.read_text(encoding="utf-8")) if (argv and percorso_layout.exists()) else {}
    fogli = {}
    print(f"{'foglio':<12} {'figure per riga':<28} {'cella':>9}  note")
    for nome in nomi:
        foglio, voce_layout, rap = elabora(nome, voci[nome])
        foglio.save(DESTINAZIONE / f"{nome}.png", optimize=True)
        layout[nome] = voce_layout
        fogli[nome] = foglio
        print(f"{nome:<12} {str(rap['trovate']):<28} {rap['cella'][0]:>4}x{rap['cella'][1]:<4}  "
              f"spuri={rap['spuri']}; " + "; ".join(rap["note"]))
    ordinato = {k: layout[k] for k in FOGLI if k in layout}
    percorso_layout.write_text(json.dumps(ordinato, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    tutti = {k: Image.open(DESTINAZIONE / f"{k}.png").convert("RGBA") for k in ordinato}
    CONTATTI.parent.mkdir(parents=True, exist_ok=True)
    foglio_contatti(tutti, ordinato).convert("RGB").save(CONTATTI)
    print(f"\nscritti: {DESTINAZIONE.relative_to(RADICE)}/*.png, layout.json; contatti: {CONTATTI.relative_to(RADICE)}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
