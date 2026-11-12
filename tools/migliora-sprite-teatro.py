#!/usr/bin/env python3
"""
tools/migliora-sprite-teatro.py — catena di miglioramento degli sprite del Teatro (presepe d'ombre).

Prende le immagini dell'autore in gioco/assets/sprite_teatro/ (NON le tocca mai) e scrive le versioni
migliorate in gioco/assets/sprite_teatro_v2/ (leggera) e sprite_teatro_v2_ombre/ (a ombre decisa) con gli stessi nomi e le stesse griglie (layout.json e il
LAYOUT di teatro/t2-sprite.js restano validi). Il gioco sceglie quale usare con la tabella SPRITE_V2 di
teatro/10-sprite.js; tools/teatro-release.js incorpora la versione scelta.

Passi, ognuno attivabile per file nella TABELLA qui sotto:
  a. pulizia   — via frammenti e scritte (componenti piccole o lontane dal corpo, per cella), via la polvere
                 di pixel quasi trasparenti, via l'alone chiaro sul bordo (colore preso dall'interno);
  b. stabile   — nelle righe di animazione «ferme» (fermo, cammina, vola…) stessi piedi, stesso asse e,
                 se la differenza è piccola (TOLL_ALTEZZA), stessa altezza; salti, cadute, morti, colpi no;
  c. stile     — gradazione «a ombre» verso la Ferruccio: corpo più scuro e meno saturo, tinta fredda-viola,
                 accenti (occhi, fiamme, oro, rosso) conservati; intensità 0..1 per file;
     contorno  — bordo scuro all'interno più filo color lanterna attenuato all'esterno, di spessore uguale
                 A SCHERMO per tutti (si converte coi px di gioco della figura, ALTEZZA_GIOCO);
  d. PNG ottimizzato.

Uso:
  python3 tools/migliora-sprite-teatro.py                 # tutti i file della TABELLA → sprite_teatro_v2/ + tavole
  python3 tools/migliora-sprite-teatro.py --solo gatto    # un file solo (ripetibile: --solo a --solo b)
  python3 tools/migliora-sprite-teatro.py --anteprima     # solo tavole prima|dopo, non scrive sprite_teatro_v2/
  python3 tools/migliora-sprite-teatro.py --censimento    # misura gli originali → production/arte/censimento-sprite.md
Tavole: production/arte/prima-dopo-sprite/<nome>.png e _personaggi.png, _nemici.png, _boss.png.
Richiede Pillow e numpy (niente scipy).
"""
import argparse
import json
import os
import re
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

RADICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = os.path.join(RADICE, 'gioco', 'assets', 'sprite_teatro')
V2 = os.path.join(RADICE, 'gioco', 'assets', 'sprite_teatro_v2')
TAVOLE = os.path.join(RADICE, 'production', 'arte', 'prima-dopo-sprite')
CENSIMENTO = os.path.join(RADICE, 'production', 'arte', 'censimento-sprite.md')
T2 = os.path.join(RADICE, 'gioco', 'teatro', 't2-sprite.js')

# --------------------------------------------------------------------------------------------------
# Costanti (colori del palco dall'art bible; spessori in px di GIOCO, canvas 640x360)
# --------------------------------------------------------------------------------------------------
FONDO_PALCO = (24, 19, 31)
# fondo vero delle tavole: ritaglio del pavimento da una foto di gioco (file, riquadro)
PAVIMENTO = ('production/qa/evidence/teatro-t2-radice-partita.png', (470, 240, 620, 320))
TREMOLIO = [('ombra', 'cammina'), ('burattino', 'muove'), ('taddeo', 'cammina')]
LANTERNA = np.array([249, 203, 64], dtype=np.float32) / 255.0
SCURO = np.array([16, 11, 22], dtype=np.float32) / 255.0
VIOLA = np.array([0.20, 0.15, 0.30], dtype=np.float32)

ALFA_POLVERE = 24          # sotto: pixel sparsi quasi trasparenti → via
ALFA_CORPO = 40            # sopra: il pixel fa parte di una figura (per le componenti)
RAGGIO_UNIONE = 4          # px sorgente: pezzi più vicini di così sono la stessa figura (spada in mano…)
FRAZ_MIN = 0.03            # componente tenuta se area ≥ FRAZ_MIN × corpo principale…
DIST_MAX = 0.22            # …e se non dista dal corpo più di DIST_MAX × diagonale della cella
FRAZ_MIN_LIBERA = 0.004    # nelle righe con pezzi volanti (morte, esplode) si tolgono solo i granelli
RAGGIO_FRANGIA = 2         # px sorgente di bordo ripuliti dall'alone chiaro
TOLL_ALTEZZA = 0.08        # «respiro»: differenze d'altezza fino all'8% nella riga si pareggiano
SPOSTA_MAX = 0.035         # spostamento oltre il 3,5% della cella = movimento voluto (battito d'ali…): la riga resta com'è
SOGLIA_ALTEZZA = 0.015     # sotto l'1,5% non si ridimensiona (si evita di sfocare per nulla)
BORDO_SCURO_GIOCO = 0.8    # spessore del bordo scuro, px di gioco
FILO_ORO_GIOCO = 0.4       # spessore del filo lanterna, px di gioco
FILO_ORO_ALFA = 0.45       # «attenuato»

# Come si allinea ogni posa: 'piedi' (stessa base), 'centro' (creature in volo), assente = non si tocca.
ALLINEA_POSA = {
    'fermo': 'piedi', 'cammina': 'piedi', 'muove': 'piedi', 'spara': 'piedi', 'chiusa': 'piedi',
    'aperta-spara': 'piedi', 'vola': 'centro', 'miccia': 'piedi',
}
POSE_LIBERE = {'morte', 'morto', 'esplode', 'evoca', 'attacco', 'carica', 'spara'}  # pezzi staccati ammessi

# Altezza a schermo (px di gioco) con cui il gioco disegna la figura (t2-sprite.js CONFIG.altezza,
# b6-boss.js SCHEDE_B6.foglio.altezza, 10-sprite.js SPRITE_BOSS_A): dà lo stesso contorno a schermo a tutti.
ALTEZZA_GIOCO = {
    'ferruccio': 58, 'agnese': 56, 'taddeo': 56, 'ombra': 56, 'teste-mira': 20,
    'gatto': 26, 'vespa-cieca': 26, 'maschera': 30, 'bomba-ferma': 28, 'guardia': 40, 'statua': 42,
    'predone': 38, 'lucciola': 26, 'burattino': 38,
    'regina-vespa': 58, 'capitano': 68, 'donna-luciana': 76, 'custode-marmo': 72, 'spezzafili': 68,
    'accendilumi': 70, 'cigno-latta': 60, 'giostra-lucciole': 72, 'tessitrice-pietra': 72,
    'boss/gatto_fermo': 46, 'boss/gatto_accucciato': 24, 'boss/gatto_salto': 29, 'boss/gatto_cammina': 23,
    'boss/capitano_guardia_fermo': 66, 'boss/colosso_statua_fermo': 72, 'boss/colosso_statua_aperto': 72,
    'boss/maestro_fucina_fermo': 66, 'boss/maestro_fucina_attacco': 66, 'boss/donna_luciana_ferma': 76,
    'boss/regina_vespa_ferma': 64,
}

GRUPPI = {
    'personaggi': ['ferruccio', 'agnese', 'taddeo', 'ombra'],
    'nemici': ['gatto', 'vespa-cieca', 'maschera', 'bomba-ferma', 'guardia', 'statua', 'predone', 'lucciola',
               'burattino'],
    'boss': ['regina-vespa', 'capitano', 'donna-luciana', 'custode-marmo', 'spezzafili', 'accendilumi',
             'cigno-latta', 'giostra-lucciole', 'tessitrice-pietra'],
}

# Per file: pulizia, stabile, stile (0 = niente … 1 = pieno), contorno. Le scelte vengono dalle tavole
# production/arte/prima-dopo-sprite/ (vedi production/arte/censimento-sprite.md, colonna «scelta»).
PREDEFINITO = {'pulizia': True, 'stabile': True, 'stile': 0.6, 'contorno': True}
# scelta: 'leggera' | 'ombre' | 'prima' (si scrive comunque la versione pulita, ma SPRITE_V2 resta spento);
# dubbio: True = scelta mia incerta, SPRITE_V2 spento finché l'autore non guarda la tavola.
TABELLA = {
    # personaggi: la Ferruccio è il modello; «a ombre» li ingrigisce e li perde sul pavimento scuro
    # scelta dell'AUTORE: originale, nessun ritocco (né pulizia, né piedi, né stile, né contorno); niente file v2
    'ferruccio': {'pulizia': False, 'stabile': False, 'stile': 0.0, 'contorno': False, 'scelta': 'prima', 'autore': True},
    'agnese': {'stile': 0.4, 'scelta': 'leggera'},
    'taddeo': {'stile': 0.3, 'scelta': 'leggera'},
    'ombra': {'stile': 0.2, 'scelta': 'leggera'},
    'teste-mira': {'pulizia': False, 'stabile': False, 'stile': 0.0, 'contorno': False, 'scelta': 'prima', 'autore': True},  # parte di Ferruccio
    # nemici
    'gatto': {'stile': 0.4, 'scelta': 'leggera'},
    'vespa-cieca': {'stile': 0.7, 'scelta': 'ombre'},
    'maschera': {'stile': 0.5, 'scelta': 'leggera'},     # il bianco della maschera è la sua identità
    'bomba-ferma': {'stile': 0.6, 'scelta': 'leggera'},
    'guardia': {'stile': 0.7, 'scelta': 'leggera'},
    'statua': {'stile': 0.5, 'scelta': 'leggera'},       # marmo: «a ombre» lo fa sembrare piombo
    'predone': {'stile': 0.4, 'scelta': 'leggera'},
    'lucciola': {'stile': 0.6, 'scelta': 'ombre', 'dubbio': True},
    'burattino': {'stile': 0.7, 'scelta': 'ombre'},
    # boss (fogli t2/b6)
    'regina-vespa': {'stile': 0.6, 'scelta': 'ombre', 'dubbio': True},
    'capitano': {'stile': 0.5, 'scelta': 'leggera'},  # «a ombre» spegne l'armatura
    'donna-luciana': {'stile': 0.5, 'scelta': 'leggera'},
    'custode-marmo': {'stile': 0.6, 'scelta': 'leggera'},
    'spezzafili': {'stile': 0.6, 'scelta': 'leggera'},
    'accendilumi': {'stile': 0.6, 'scelta': 'leggera'},
    'cigno-latta': {'stile': 0.6, 'scelta': 'leggera'},
    'giostra-lucciole': {'stile': 0.6, 'scelta': 'leggera'},
    'tessitrice-pietra': {'stile': 0.6, 'scelta': 'leggera'},
}
for _n in ALTEZZA_GIOCO:
    if _n.startswith('boss/'):
        TABELLA[_n] = {'stile': 0.6, 'stabile': False, 'scelta': 'leggera'}


def opzioni(nome):
    o = dict(PREDEFINITO)
    o.update(TABELLA.get(nome, {}))
    return o


# --------------------------------------------------------------------------------------------------
# Griglie
# --------------------------------------------------------------------------------------------------
def leggi_layout():
    """Il LAYOUT di teatro/t2-sprite.js (fra i segnaposto T2-LAYOUT): nome → {cella_l, cella_a, righe…}."""
    js = open(T2, encoding='utf8').read()
    m = re.search(r'const LAYOUT = (\{.*?\n  \});\s*/\* T2-LAYOUT: fine', js, re.S)
    if not m:
        sys.exit('LAYOUT non trovato in teatro/t2-sprite.js')
    return json.loads(m.group(1))


def celle(nome, im, layout):
    """Elenco di (riga, posa, colonna, x0, y0, x1, y1). Le immagini ferme sono una cella sola."""
    L = layout.get(nome)
    if not L:
        return [(0, 'fermo', 0, 0, 0, im.width, im.height)]
    out = []
    for r, (posa, n) in enumerate(L['righe']):
        for c in range(n):
            x0, y0 = c * L['cella_l'], r * L['cella_a']
            if x0 + L['cella_l'] <= im.width and y0 + L['cella_a'] <= im.height:
                out.append((r, posa, c, x0, y0, x0 + L['cella_l'], y0 + L['cella_a']))
    return out


def scala_gioco(nome, im, layout):
    """px di gioco per px sorgente."""
    L = layout.get(nome)
    rif = L['altezza_rif'] if L else im.height
    return ALTEZZA_GIOCO.get(nome, 40) / float(rif)


# --------------------------------------------------------------------------------------------------
# Morfologia senza scipy
# --------------------------------------------------------------------------------------------------
def _sposta(a, dy, dx, riempi):
    out = np.full_like(a, riempi)
    h, w = a.shape[:2]
    ys, yd = (slice(0, h - dy), slice(dy, h)) if dy >= 0 else (slice(-dy, h), slice(0, h + dy))
    xs, xd = (slice(0, w - dx), slice(dx, w)) if dx >= 0 else (slice(-dx, w), slice(0, w + dx))
    out[yd, xd] = a[ys, xs]
    return out


_VICINI8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
_VICINI4 = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def massimo(a, r):
    """Filtro di massimo di raggio r (alterna croce e quadrato: forma quasi ottagonale)."""
    for i in range(r):
        vic = _VICINI8 if i % 2 else _VICINI4
        b = a.copy()
        for dy, dx in vic:
            b = np.maximum(b, _sposta(a, dy, dx, a.min() if a.dtype != bool else False))
        a = b
    return a


def minimo(a, r):
    for i in range(r):
        vic = _VICINI8 if i % 2 else _VICINI4
        b = a.copy()
        for dy, dx in vic:
            b = np.minimum(b, _sposta(a, dy, dx, 0))
        a = b
    return a


def etichette(mask):
    """Componenti connesse (4-vicini): etichetta = indice del pixel minimo della componente, -1 fuori."""
    h, w = mask.shape
    INF = h * w
    lab = np.where(mask, np.arange(h * w).reshape(h, w), INF)
    while True:
        m = lab.copy()
        for dy, dx in _VICINI4:
            m = np.minimum(m, _sposta(lab, dy, dx, INF))
        m = np.where(mask, m, INF).ravel()
        ok = m < INF
        for _ in range(4):  # salti di puntatore: convergenza veloce
            m[ok] = m[m[ok]]
        m = m.reshape(h, w)
        if np.array_equal(m, lab):
            break
        lab = m
    return np.where(mask, lab, -1)


def box3(a):
    s = a.copy()
    for dy, dx in _VICINI8:
        s = s + _sposta(a, dy, dx, 0)
    return s


# --------------------------------------------------------------------------------------------------
# a. pulizia
# --------------------------------------------------------------------------------------------------
def pulisci(cella, posa):
    """Toglie frammenti, scritte, polvere e alone chiaro da una cella RGBA (float 0..1, modificata)."""
    a = cella[..., 3]
    a[a < ALFA_POLVERE / 255.0] = 0
    corpo = a > ALFA_CORPO / 255.0
    if not corpo.any():
        return
    unione = massimo(corpo, RAGGIO_UNIONE)
    lab = etichette(unione)
    ids, aree = np.unique(lab[corpo], return_counts=True)
    princ = ids[np.argmax(aree)]
    amax = aree.max()
    ys, xs = np.nonzero(lab == princ)
    by0, by1, bx0, bx1 = ys.min(), ys.max(), xs.min(), xs.max()
    diag = float(np.hypot(*a.shape))
    libera = posa in POSE_LIBERE
    via = np.zeros_like(corpo)
    for i, ar in zip(ids, aree):
        if i == princ:
            continue
        zy, zx = np.nonzero(lab == i)
        dy = max(0, by0 - zy.max(), zy.min() - by1)
        dx = max(0, bx0 - zx.max(), zx.min() - bx1)
        lontana = np.hypot(dy, dx) > DIST_MAX * diag
        piccola = ar < (FRAZ_MIN_LIBERA if libera else FRAZ_MIN) * amax
        if piccola or (lontana and not libera and ar < 0.25 * amax):
            via |= lab == i
    via |= ~unione  # polvere lontana da ogni figura
    a[via] = 0
    # alone chiaro: i pixel del bordo esterno prendono il colore dell'interno se sono più chiari
    vuoto = a < ALFA_POLVERE / 255.0
    banda = massimo(vuoto, RAGGIO_FRANGIA) & ~vuoto
    interno = (a > 0.78) & ~banda
    rgb = cella[..., :3]
    col = rgb * interno[..., None]
    pes = interno.astype(np.float32)
    piena = rgb.copy()
    fatto = interno.copy()
    for _ in range(RAGGIO_FRANGIA + 3):
        s, sw = box3(col), box3(pes)
        nuovo = (~fatto) & (sw > 0)
        piena[nuovo] = s[nuovo] / sw[nuovo, None]
        col[nuovo] = piena[nuovo]
        pes[nuovo] = 1
        fatto |= nuovo
    luma = lambda c: c[..., 0] * 0.299 + c[..., 1] * 0.587 + c[..., 2] * 0.114
    chiaro = banda & fatto & (luma(rgb) > luma(piena) + 0.04)
    rgb[chiaro] = piena[chiaro]


# --------------------------------------------------------------------------------------------------
# b. stabilità
# --------------------------------------------------------------------------------------------------
def misura(cella):
    """(base, cx, cy, altezza, x0, y0, x1, y1) del contenuto (alfa > 0.25) o None."""
    m = cella[..., 3] > 0.25
    if not m.any():
        return None
    ys, xs = np.nonzero(m)
    w = cella[..., 3][m]
    # asse orizzontale = baricentro del quarto basso (gambe/piedi): un braccio o un'arma tesa non sposta il corpo
    basso = ys >= ys.max() - 0.25 * (ys.max() - ys.min() + 1)
    wb = w[basso]
    return (ys.max(), float((xs[basso] * wb).sum() / wb.sum()), float((ys * w).sum() / w.sum()),
            ys.max() - ys.min() + 1, xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)


def riscala(cella, f, mis):
    """Ridimensiona il contenuto di f tenendo fermo il punto basso-centrale."""
    _, cx, _, _, x0, y0, x1, y1 = mis
    pezzo = Image.fromarray((cella[y0:y1, x0:x1] * 255).astype(np.uint8), 'RGBA')
    nw, nh = max(1, round(pezzo.width * f)), max(1, round(pezzo.height * f))
    pezzo = np.asarray(pezzo.resize((nw, nh), Image.LANCZOS), dtype=np.float32) / 255.0
    out = np.zeros_like(cella)
    h, w = cella.shape[:2]
    px = int(round(cx - (cx - x0) * f))
    py = y1 - nh
    sx0, sy0 = max(0, -px), max(0, -py)
    dx0, dy0 = max(0, px), max(0, py)
    ww, hh = min(nw - sx0, w - dx0), min(nh - sy0, h - dy0)
    if ww > 0 and hh > 0:
        out[dy0:dy0 + hh, dx0:dx0 + ww] = pezzo[sy0:sy0 + hh, sx0:sx0 + ww]
    return out


def stabilizza(riga, modo):
    """Allinea i fotogrammi di una riga (lista di celle float, modificata). Ritorna una nota."""
    mis = [misura(c) for c in riga]
    if len(riga) < 2 or any(m is None for m in mis):
        return ''
    alt = np.array([m[3] for m in mis], dtype=np.float32)
    med = float(np.median(alt))
    var = (alt.max() - alt.min()) / med
    nota = []
    if SOGLIA_ALTEZZA < var <= TOLL_ALTEZZA:
        for i, c in enumerate(riga):
            f = med / alt[i]
            if abs(f - 1) > 0.005:
                riga[i] = riscala(c, f, mis[i])
        mis = [misura(c) for c in riga]
        nota.append(f'altezza ±{var * 100:.0f}% pareggiata')
    cx_t = float(np.median([m[1] for m in mis]))
    if modo == 'piedi':
        y_t = float(np.median([m[0] for m in mis]))
        ys = [m[0] for m in mis]
    else:
        y_t = float(np.median([m[2] for m in mis]))
        ys = [m[2] for m in mis]
    lim = SPOSTA_MAX * max(riga[0].shape[:2])
    sp = [(int(round(y_t - ys[i])), int(round(cx_t - mis[i][1]))) for i in range(len(riga))]
    if max(max(abs(a), abs(b)) for a, b in sp) > lim:
        return ', '.join(nota + [f'spostamento {max(max(abs(a), abs(b)) for a, b in sp)}px > limite: non allineata'])
    spost = 0
    for i, c in enumerate(riga):
        dy, dx = int(round(y_t - ys[i])), int(round(cx_t - mis[i][1]))
        if dy or dx:
            riga[i] = _sposta(c, dy, dx, 0)
            spost = max(spost, abs(dy), abs(dx))
    if spost:
        nota.append(f'spostati fino a {spost}px')
    return ', '.join(nota)


# --------------------------------------------------------------------------------------------------
# c. stile «a ombre» e contorno
# --------------------------------------------------------------------------------------------------
def _liscio(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def accenti(x):
    """0..1: quanto un pixel è un accento (saturo e luminoso: occhi, fiamme, oro, rosso)."""
    mx, mn = x.max(-1), x.min(-1)
    sat = (mx - mn) / (mx + 1e-6)
    return _liscio((sat - 0.35) / 0.25) * _liscio((mx - 0.35) / 0.25)


def stilizza(cella, k, deciso=False):
    """Gradazione «a ombre». k = intensità 0..1. deciso: valori compressi nella fascia scura
    (OMBRE_FASCIA), saturazione dimezzata; in entrambi i casi gli accenti restano com'erano."""
    if k <= 0:
        return
    x = cella[..., :3]
    accento = accenti(x)
    luma = (x[..., 0] * 0.299 + x[..., 1] * 0.587 + x[..., 2] * 0.114)[..., None]
    y = x + (luma - x) * (0.5 * k)  # k = 1: saturazione dimezzata
    if deciso:
        lo, hi = OMBRE_FASCIA
        y = lo + (hi - lo) * np.power(np.clip(y, 0, 1), 1.4)
        y = y * (1 - 0.22) + VIOLA * 0.22
    else:
        y = np.power(np.clip(y, 0, 1), 1 + 0.6 * k)
        y = y * (1 - 0.15 * k) + VIOLA * (0.15 * k)
    cella[..., :3] = y * (1 - accento[..., None]) + x * accento[..., None]


def contorna(cella, r_scuro, r_oro, forza):
    a = cella[..., 3]
    rim = np.clip(a - minimo(a, r_scuro), 0, 1) * 0.85 * forza * (1 - 0.8 * accenti(cella[..., :3]))
    cella[..., :3] = cella[..., :3] * (1 - rim[..., None]) + SCURO * rim[..., None]
    anello = np.clip(massimo(a, r_oro) - a, 0, 1) * FILO_ORO_ALFA * forza
    na = a + anello * (1 - a)
    pieno = na > 1e-4
    rgb = cella[..., :3] * a[..., None] + LANTERNA * (anello * (1 - a))[..., None]
    cella[..., :3] = np.where(pieno[..., None], rgb / np.maximum(na, 1e-4)[..., None], 0)
    cella[..., 3] = na


# --------------------------------------------------------------------------------------------------
# Catena: tre varianti per figura
#   pulita  = solo pulizia + stabilità (miglioramenti certi);
#   leggera = pulita + gradazione all'intensità della TABELLA + contorno unico;
#   ombre   = pulita + gradazione decisa (STILE_OMBRE) + contorno unico.
# --------------------------------------------------------------------------------------------------
STILE_OMBRE = 1.0
OMBRE_FASCIA = (0.03, 0.62)  # «a ombre»: il bianco più chiaro arriva al 62%
VARIANTI = ('prima', 'leggera', 'ombre')


def migliora(nome, layout):
    """Ritorna (varianti {prima, pulita, leggera, ombre} come immagini PIL, note, pulita_float per il tremolio)."""
    sorg = Image.open(os.path.join(ORIG, nome + '.png')).convert('RGBA')
    o = opzioni(nome)
    arr = np.asarray(sorg, dtype=np.float32) / 255.0
    note = []
    cel = celle(nome, sorg, layout)
    s = scala_gioco(nome, sorg, layout)
    r_scuro = max(1, int(round(BORDO_SCURO_GIOCO / s)))
    r_oro = max(1, int(round(FILO_ORO_GIOCO / s)))
    lavori = {(r, c): arr[y0:y1, x0:x1].copy() for (r, posa, c, x0, y0, x1, y1) in cel}
    if o['pulizia']:
        for (r, posa, c, *_r) in cel:
            pulisci(lavori[(r, c)], posa)
    if o['stabile'] and nome in layout:
        for r, (posa, n) in enumerate(layout[nome]['righe']):
            modo = ALLINEA_POSA.get(posa)
            if not modo:
                continue
            chiavi = [(r, c) for c in range(n) if (r, c) in lavori]
            riga = [lavori[k] for k in chiavi]
            nota = stabilizza(riga, modo)
            for k, v in zip(chiavi, riga):
                lavori[k] = v
            if nota:
                note.append(f'{posa}: {nota}')

    def componi(k, contorno, deciso=False):
        out = np.zeros_like(arr)
        for (r, posa, c, x0, y0, x1, y1) in cel:
            q = lavori[(r, c)].copy()
            stilizza(q, k, deciso)
            if contorno:
                contorna(q, r_scuro, r_oro, 1.0)
            out[y0:y1, x0:x1] = q
        return Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA')

    var = {'prima': sorg, 'pulita': componi(0, False),
           'leggera': componi(o['stile'], o['contorno']), 'ombre': componi(STILE_OMBRE, True, True)}
    return var, note


# --------------------------------------------------------------------------------------------------
# Tavole
# --------------------------------------------------------------------------------------------------
def _font(n=14):
    try:
        return ImageFont.load_default(size=n)
    except TypeError:
        return ImageFont.load_default()


_PAV = {}


def pavimento(w, h):
    """Fondo vero del palco: ritaglio del pavimento da una foto di gioco, ripetuto (ripiego: tinta del palco)."""
    if 'tassello' not in _PAV:
        f = os.path.join(RADICE, PAVIMENTO[0])
        _PAV['tassello'] = Image.open(f).convert('RGBA').crop(PAVIMENTO[1]) if os.path.exists(f) else None
    t = _PAV['tassello']
    fondo = Image.new('RGBA', (w, h), FONDO_PALCO + (255,))
    if t is not None:
        for y in range(0, h, t.height):
            for x in range(0, w, t.width):
                fondo.paste(t, (x, y))
    return fondo


def a_schermo(nome, im, cella, layout, k=2.0):
    """La cella come la vede il giocatore: altezza di gioco × k (palco 640x360 su schermo 1280x720 = ×2)."""
    x0, y0, x1, y1 = cella
    s = scala_gioco(nome, im, layout) * k
    pezzo = im.crop((x0, y0, x1, y1))
    return pezzo.resize((max(1, round(pezzo.width * s)), max(1, round(pezzo.height * s))), Image.LANCZOS)


def _ingrandisci(im, k):
    return im.resize((im.width * k, im.height * k), Image.NEAREST)


ETICHETTA = {'prima': 'PRIMA (originale)', 'leggera': 'LEGGERA', 'ombre': 'A OMBRE (decisa)'}


def tavola(nome, var, layout, note):
    """Tre fasce (prima | leggera | a ombre) sul pavimento del palco: tutte le pose a grandezza di schermo
    (×2 del palco) e la prima posa ingrandita ×3; in fondo i fogli interi prima e pulito (frammenti, scritte)."""
    F = _font(16)
    prima = var['prima']
    prime = [x for x in celle(nome, prima, layout) if x[2] == 0]
    fasce = []
    for v in VARIANTI:
        sch = [a_schermo(nome, var[v], x[3:], layout) for x in prime]
        zoom = _ingrandisci(sch[0], 3)
        fasce.append((v, sch, zoom))
    hs = max(max(i.height for i in f[1]) for f in fasce) + 10
    ws = sum(i.width for i in fasce[0][1]) + 8 * len(prime) + 8
    zw, zh = fasce[0][2].width + 16, fasce[0][2].height + 10
    hb = max(hs, zh)
    f = min(1.0, 700 / prima.width, 360 / prima.height)
    th = (max(1, int(prima.width * f)), max(1, int(prima.height * f)))
    W = max(ws + zw + 30, 2 * th[0] + 40, 700)
    H = 34 + 3 * (hb + 30) + th[1] + 40 + 18 * len(note)
    T = Image.new('RGBA', (W, H), (12, 10, 16, 255))
    d = ImageDraw.Draw(T)
    sc = opzioni(nome)
    d.text((10, 6), f'{nome}  -  scelta: {"originale (scelta dell autore)" if sc.get("autore") else sc.get("scelta", "?")}{"  (DUBBIO: decide l autore)" if sc.get("dubbio") else ""}',
           fill=(249, 203, 64), font=F)
    y = 34
    for v, sch, zoom in fasce:
        d.text((10, y), ETICHETTA[v] + ' - a grandezza di schermo | prima posa x3', fill=(220, 210, 190), font=F)
        y += 22
        barra = pavimento(ws, hb)
        x = 4
        for im in sch:
            barra.alpha_composite(im, (x, hb - im.height - 5))
            x += im.width + 8
        T.alpha_composite(barra, (10, y))
        z = pavimento(zw, hb)
        z.alpha_composite(zoom, (8, hb - zoom.height - 5))
        T.alpha_composite(z, (20 + ws, y))
        y += hb + 8
    d.text((10, y), 'foglio intero: originale | pulito (senza frammenti, scritte, aloni; piedi allineati)', fill=(200, 200, 200), font=F)
    y += 22
    for i, v in enumerate(('prima', 'pulita')):
        im = var[v].resize(th, Image.LANCZOS)
        fo = Image.new('RGBA', th, FONDO_PALCO + (255,))
        fo.alpha_composite(im)
        T.alpha_composite(fo, (10 + i * (th[0] + 20), y))
    y += th[1] + 6
    for n in note:
        d.text((10, y), n, fill=(180, 180, 180), font=_font(13))
        y += 18
    return T.convert('RGB')


def tavola_gruppo(titolo, coppie, k=3.0):
    """coppie: [(nome, varianti, layout)]: tre file (prima, leggera, a ombre), prima posa a k× il palco,
    sotto ogni figura la scelta."""
    F = _font(14)
    pezzi = []
    for nome, var, layout in coppie:
        c = celle(nome, var['prima'], layout)[0][3:]
        pezzi.append((nome, [a_schermo(nome, var[v], c, layout, k) for v in VARIANTI]))
    hs = max(max(i.height for i in p[1]) for p in pezzi) + 10
    W = sum(max(p[1][0].width, 110) + 16 for p in pezzi) + 130
    H = 36 + 3 * hs + 44
    T = pavimento(W, H)
    d = ImageDraw.Draw(T)
    d.rectangle((0, 0, W, 30), fill=(12, 10, 16, 255))
    d.text((10, 8), f'{titolo}: file PRIMA / LEGGERA / A OMBRE (x{k:g} del palco); sotto, la scelta', fill=(249, 203, 64), font=F)
    for i, v in enumerate(VARIANTI):
        d.text((8, 36 + i * hs + hs // 2), v.upper(), fill=(249, 203, 64), font=F)
    x = 120
    for nome, ims in pezzi:
        for i, im in enumerate(ims):
            T.alpha_composite(im, (x, 36 + i * hs + hs - im.height))
        sc = opzioni(nome)
        d.rectangle((x, 36 + 3 * hs + 2, x + max(ims[0].width, 110), H), fill=(12, 10, 16, 255))
        d.text((x, 36 + 3 * hs + 4), nome, fill=(220, 220, 220), font=F)
        d.text((x, 36 + 3 * hs + 22), 'scelta: originale (autore)' if sc.get('autore') else f'scelta: {sc.get("scelta", "?")}{" (?)" if sc.get("dubbio") else ""}',
               fill=(249, 203, 64), font=F)
        x += max(ims[0].width, 110) + 16
    return T.convert('RGB')


def tavola_tremolio(voci, layout):
    """Fotogrammi di una riga sovrapposti con trasparenza, prima e dopo: contorni sdoppiati = tremolio."""
    F = _font(15)
    blocchi = []
    for nome, posa, var in voci:
        L = layout[nome]
        r = L['righe'].index(next(x for x in L['righe'] if x[0] == posa))
        n = L['righe'][r][1]
        out = []
        for v in ('prima', 'pulita'):
            acc = np.zeros((L['cella_a'], L['cella_l'], 4), dtype=np.float32)
            for c in range(n):
                q = np.asarray(var[v].crop((c * L['cella_l'], r * L['cella_a'], (c + 1) * L['cella_l'], (r + 1) * L['cella_a'])), dtype=np.float32) / 255.0
                acc[..., :3] += q[..., :3] * q[..., 3:4] / n
                acc[..., 3] += q[..., 3] / n
            rgb = np.where(acc[..., 3:4] > 0, acc[..., :3] / np.maximum(acc[..., 3:4], 1e-4), 0)
            im = Image.fromarray((np.clip(np.dstack([rgb, np.minimum(1, acc[..., 3] * 1.0)]), 0, 1) * 255).astype(np.uint8), 'RGBA')
            k = 2 if L['cella_a'] < 180 else 1
            out.append(im.resize((im.width * k, im.height * k), Image.LANCZOS))
        blocchi.append((f'{nome} «{posa}» ({n} fotogrammi sovrapposti)', out))
    W = max(b[1][0].width * 2 + 40 for b in blocchi)
    H = sum(b[1][0].height + 40 for b in blocchi) + 30
    T = Image.new('RGBA', (W, H), (12, 10, 16, 255))
    d = ImageDraw.Draw(T)
    d.text((10, 6), 'TREMOLIO: a sinistra PRIMA (contorni sdoppiati), a destra DOPO (piedi e asse fermi)', fill=(249, 203, 64), font=F)
    y = 30
    for titolo, (p, q) in blocchi:
        d.text((10, y), titolo, fill=(220, 220, 220), font=F)
        y += 20
        for i, im in enumerate((p, q)):
            fo = Image.new('RGBA', im.size, (60, 50, 70, 255))
            fo.alpha_composite(im)
            dd = ImageDraw.Draw(fo)
            dd.line((0, im.height - 4 * (2 if im.height < 360 else 1), im.width, im.height - 4 * (2 if im.height < 360 else 1)), fill=(249, 203, 64, 120))
            T.alpha_composite(fo, (10 + i * (p.width + 20), y))
        y += p.height + 20
    return T.convert('RGB')


# --------------------------------------------------------------------------------------------------
# Censimento
# --------------------------------------------------------------------------------------------------
def censimento(layout):
    """Misura gli originali usati e scrive production/arte/censimento-sprite.md."""
    righe = []
    for nome in list(layout) + [n for n in ALTEZZA_GIOCO if n.startswith('boss/')]:
        f = os.path.join(ORIG, nome + '.png')
        if not os.path.exists(f):
            righe.append(f'| {nome} | FILE MANCANTE | | | | | |')
            continue
        im = Image.open(f).convert('RGBA')
        arr = np.asarray(im, dtype=np.float32) / 255.0
        cel = celle(nome, im, layout)
        alt, piedi_sp, alt_sp, semi, sat, val = [], 0, 0.0, [], [], []
        per_riga = {}
        for (r, posa, c, x0, y0, x1, y1) in cel:
            q = arr[y0:y1, x0:x1]
            m = misura(q)
            if m is None:
                continue
            alt.append(m[3])
            per_riga.setdefault((r, posa), []).append(m)
            a = q[..., 3]
            vis = a > 0
            semi.append(float(((a > 0) & (a < 0.9)).sum()) / max(1, vis.sum()))
            op = a > 0.9
            if op.any():
                rgb = q[..., :3][op]
                mx, mn = rgb.max(-1), rgb.min(-1)
                sat.append(float(((mx - mn) / (mx + 1e-6)).mean()))
                val.append(float(mx.mean()))
        peggiore = ''
        for (r, posa), ms in per_riga.items():
            if posa not in ALLINEA_POSA or len(ms) < 2:
                continue
            ps = max(m[0] for m in ms) - min(m[0] for m in ms)
            hs = (max(m[3] for m in ms) - min(m[3] for m in ms)) / float(np.median([m[3] for m in ms]))
            if ps > piedi_sp:
                piedi_sp = ps
            if hs > alt_sp:
                alt_sp, peggiore = hs, posa
        dove = 't2 LAYOUT' if nome in layout else '10-sprite SPRITE_BOSS_A (ripiego)'
        righe.append(f'| {nome} | {dove} | {len(cel)} | {min(alt) if alt else 0}–{max(alt) if alt else 0} | '
                     f'{piedi_sp} px / {alt_sp * 100:.0f}%{" (" + peggiore + ")" if peggiore else ""} | '
                     f'{np.mean(semi) * 100:.0f}% | {np.mean(sat) if sat else 0:.2f} / {np.mean(val) if val else 0:.2f} |')
    return righe


# --------------------------------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[1])
    ap.add_argument('--solo', action='append', help='elabora solo questo nome (ripetibile)')
    ap.add_argument('--anteprima', action='store_true', help='solo tavole, non scrive sprite_teatro_v2/')
    ap.add_argument('--censimento', action='store_true', help='misura gli originali e stampa la tabella')
    ap.add_argument('--senza-tavole', action='store_true')
    arg = ap.parse_args()
    layout = leggi_layout()
    if arg.censimento:
        print('\n'.join(censimento(layout)))
        return
    nomi = arg.solo or list(TABELLA)
    os.makedirs(TAVOLE, exist_ok=True)
    fatti = {}
    for nome in nomi:
        if not os.path.exists(os.path.join(ORIG, nome + '.png')):
            print(f'[salto] {nome}: originale mancante')
            continue
        var, note = migliora(nome, layout)
        fatti[nome] = var
        o = opzioni(nome)
        scelta = o.get('scelta', 'leggera')
        if not arg.anteprima and o.get('autore'):
            for cartella in (V2, V2 + '_ombre'):  # l'autore tiene l'originale: nessun file migliorato
                f = os.path.join(cartella, nome + '.png')
                if os.path.exists(f):
                    os.remove(f)
        elif not arg.anteprima:
            # sprite_teatro_v2/ = leggera (pulita se il contorno è spento), sprite_teatro_v2_ombre/ = a ombre
            for cartella, v in ((V2, 'leggera' if o['contorno'] else 'pulita'), (V2 + '_ombre', 'ombre')):
                dest = os.path.join(cartella, nome + '.png')
                os.makedirs(os.path.dirname(dest), exist_ok=True)
                var[v].save(dest, optimize=True)
        if not arg.senza_tavole:
            tavola(nome, var, layout, note).save(os.path.join(TAVOLE, nome.replace('/', '_') + '.png'), optimize=True)
        print(f'{nome}: scelta {scelta}{" (dubbio)" if o.get("dubbio") else ""}, stile {o["stile"]}; ' + ('; '.join(note) or 'nessun riallineamento'))
    if not arg.senza_tavole:
        for g, lista in GRUPPI.items():
            coppie = [(n, fatti[n], layout) for n in lista if n in fatti]
            if coppie:
                tavola_gruppo(g, coppie).save(os.path.join(TAVOLE, f'_{g}.png'), optimize=True)
        boss_img = [n for n in fatti if n.startswith('boss/')]
        if boss_img:
            tavola_gruppo('boss (immagini ferme, ripiego)', [(n, fatti[n], layout) for n in boss_img], k=2.0).save(
                os.path.join(TAVOLE, '_boss-ripiego.png'), optimize=True)
        voci = [(n, p, fatti[n]) for n, p in TREMOLIO if n in fatti]
        if voci:
            tavola_tremolio(voci, layout).save(os.path.join(TAVOLE, '_tremolio.png'), optimize=True)
    # tabella per teatro/10-sprite.js (SPRITE_V2): di partenza 'leggera' dove c'è una scelta senza dubbio
    print('SPRITE_V2 = ' + json.dumps({n: ('leggera' if opzioni(n).get('scelta', 'leggera') != 'prima'
                                            and not opzioni(n).get('dubbio') else False) for n in TABELLA}))


if __name__ == '__main__':
    main()
