#!/usr/bin/env python3
"""
tools/pulisci-fogli-riga.py — ripulisce i fogli «a una riga» delle figure nuove (terza ondata) che non stanno nella
tabella LAYOUT di 10-sprite.js e quindi non passano da tools/migliora-sprite-teatro.py.

Cosa toglie: il bianco di sfondo rimasto CHIUSO dentro la figura (fra braccio e corpo, dentro un cappio di corda,
fra le gambe e l'asta): chi ritaglia lo sfondo lo toglie solo dove tocca il bordo. Si riconosce perché è bianco pieno
e piatto (tutti i canali ≥ SOGLIA, nessuna sfumatura) e grande; barbe, lame e scie hanno sfumature e restano.
Gli originali dell'autore non si toccano: il foglio ripulito va in gioco/assets/sprite_teatro_v2/<nome>.png, che il
gioco carica quando in SPRITE_V2 (10-sprite.js) il nome vale 'leggera'.

Uso: python3 tools/pulisci-fogli-riga.py [--anteprima cartella] [nome ...]
     --anteprima  non scrive i fogli: salva <cartella>/<nome>.png con le zone che toglierebbe segnate in magenta
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

RADICE = Path(__file__).resolve().parent.parent
ORIG = RADICE / 'gioco' / 'assets' / 'sprite_teatro'
V2 = RADICE / 'gioco' / 'assets' / 'sprite_teatro_v2'

# nome del foglio → numero di pose (celle in riga)
FOGLI = {
    'gregorio': 7, 'h6_campanaro': 7, 'giudice-arena': 10, 'macchinista_h5': 4, 'assunta': 4, 'agnese_telaio': 2,
}
SOGLIA = 247        # un pixel è «bianco di sfondo» se R, G e B sono tutti almeno questo
ALFA_MIN = 200      # e se è opaco
AREA_MIN = 0.0012   # frazione dell'area della cella: sotto, è un riflesso (occhio, dente, luce sull'acciaio)
PIATTO_MAX = 2.2    # scarto medio dal bianco pieno dentro la zona: sopra, ha sfumature (barba, lama) e resta


def etichette(mask):
    """Componenti connesse (4 vicini) con una pila: rende (mappa delle etichette, numero)."""
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32)
    n = 0
    ys, xs = np.nonzero(mask)
    for y0, x0 in zip(ys.tolist(), xs.tolist()):
        if lab[y0, x0]:
            continue
        n += 1
        pila = [(y0, x0)]
        lab[y0, x0] = n
        while pila:
            y, x = pila.pop()
            for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n
                    pila.append((yy, xx))
    return lab, n


def zone_da_togliere(cella):
    """Maschera dei pixel di sfondo bianco rimasto chiuso in una cella RGBA uint8."""
    rgb = cella[..., :3].astype(np.int16)
    bianco = (rgb.min(axis=2) >= SOGLIA) & (cella[..., 3] >= ALFA_MIN)
    lab, n = etichette(bianco)
    via = np.zeros(bianco.shape, bool)
    area_cella = bianco.size
    for i in range(1, n + 1):
        z = lab == i
        area = int(z.sum())
        if area < AREA_MIN * area_cella:
            continue
        scarto = float((255 - rgb[z]).mean())
        if scarto <= PIATTO_MAX:
            via |= z
    if via.any():  # un pixel di bordo sfumato attorno alla zona: se è chiaro va via anche lui
        allarga = via.copy()
        allarga[1:, :] |= via[:-1, :]; allarga[:-1, :] |= via[1:, :]; allarga[:, 1:] |= via[:, :-1]; allarga[:, :-1] |= via[:, 1:]
        bordo = allarga & ~via & (rgb.min(axis=2) >= 225)
        via |= bordo
    return via


def lavora(nome, anteprima=None):
    pose = FOGLI[nome]
    im = Image.open(ORIG / f'{nome}.png').convert('RGBA')
    a = np.array(im)
    w = a.shape[1] // pose
    tolti = []
    segna = a.copy()
    for k in range(pose):
        cella = a[:, k * w:(k + 1) * w]
        via = zone_da_togliere(cella)
        tolti.append(int(via.sum()))
        if anteprima:
            segna[:, k * w:(k + 1) * w][via] = (255, 0, 255, 255)
        else:
            cella[via] = (0, 0, 0, 0)
    if anteprima:
        Path(anteprima).mkdir(parents=True, exist_ok=True)
        fondo = Image.new('RGBA', im.size, (70, 60, 80, 255))
        fondo.alpha_composite(Image.fromarray(segna))
        k = min(1.0, 1800 / im.width)
        fondo.resize((int(im.width * k), int(im.height * k)), Image.LANCZOS).convert('RGB').save(Path(anteprima) / f'{nome}.png')
    else:
        V2.mkdir(parents=True, exist_ok=True)
        Image.fromarray(a).save(V2 / f'{nome}.png', optimize=True)
    print(f'{nome}: pixel tolti per posa {tolti}')


def main():
    arg = sys.argv[1:]
    anteprima = None
    if '--anteprima' in arg:
        i = arg.index('--anteprima')
        anteprima = arg[i + 1]
        del arg[i:i + 2]
    for nome in (arg or FOGLI):
        if nome not in FOGLI:
            print(f'{nome}: non è nella tabella FOGLI'); continue
        lavora(nome, anteprima)


if __name__ == '__main__':
    main()
