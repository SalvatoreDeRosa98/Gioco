#!/usr/bin/env python3
"""
tools/meshy-motore.py — i disegni dei modelli 3D (Meshy) nelle misure del motore modulare (gioco/motore/).

Uso:  python3 tools/meshy-motore.py            (serve Pillow)

Parte dai fogli già resi per il Teatro (tools/meshy-foglio.js, meshy-animali.js, meshy-oggetti.js) e scrive i fogli
per il motore in gioco/assets/sprite/meshy/ — una cartella a parte: i disegni dell'autore in gioco/assets/sprite/
non si toccano. Il motore li usa come VARIANTE «meshy» delle voci di gioco/contenuti/sprite.json (campo `varianti`,
vedi motore/resa/sprite.js › applicaVariante): `?disegni=autore` nell'URL riporta i disegni dell'autore.

Cosa fa:
 - personaggi (Ferruccio, Taddeo): alle tre righe del foglio (fermo ×2, cammina ×8, corre ×8) aggiunge le pose che
   il motore chiede e il modello non ha — «colpito» (la figura piegata all'indietro) e «morto» ×3 (cade e resta a
   terra) — ricavate dal primo fotogramma da fermo; tutte le celle scendono di SCENDE px, così i piedi stanno a
   2 px logici dal bordo basso come nei fogli dell'autore;
 - gatto e vespa: stessa griglia e stesso ordine di pose del motore, celle strette sul contenuto;
 - scena: colonna e panca ritagliate sul disegno; braciere in 4 fotogrammi (spento, braci, acceso ×2); cassa, telaio,
   statua, siepe e banco per gli ostacoli che nel motore non hanno ancora un disegno dell'autore.
Stampa per ogni foglio le misure da scrivere nel manifesto.
"""
import os
import sys

from PIL import Image, ImageChops, ImageEnhance

RADICE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
TEATRO = os.path.join(RADICE, 'gioco', 'assets', 'sprite_teatro')
TEATRO_M = os.path.join(RADICE, 'gioco', 'assets', 'sprite_teatro_meshy')
USCITA = os.path.join(RADICE, 'gioco', 'assets', 'sprite', 'meshy')

CELLA_L, CELLA_A = 224, 256   # cella dei fogli dei personaggi
PIEDI = 240                   # riga dei piedi nella cella d'origine
SCENDE = 10                   # di quanto scende la figura nella cella del motore (piedi a 250 su 256)


def contenuto(img):
    """Il rettangolo dei pixel visibili (alfa > 24), o None."""
    return img.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()


def scurisci(img, quanto):
    """La stessa immagine più scura (quanto: 1 = uguale), con l'alfa intatta."""
    a = img.getchannel('A')
    out = ImageEnhance.Brightness(img.convert('RGB')).enhance(quanto).convert('RGBA')
    out.putalpha(a)
    return out


def personaggio(nome):
    """Foglio 8×5 del personaggio: fermo, cammina, corre (dal modello) + colpito, morto (ricavati)."""
    src = Image.open(os.path.join(TEATRO, f'{nome}_meshy.png')).convert('RGBA')
    out = Image.new('RGBA', (CELLA_L * 8, CELLA_A * 5), (0, 0, 0, 0))
    for riga, n in ((0, 2), (1, 8), (2, 8)):
        for c in range(n):
            cella = src.crop((c * CELLA_L, riga * CELLA_A, (c + 1) * CELLA_L, (riga + 1) * CELLA_A - SCENDE))
            out.alpha_composite(cella, (c * CELLA_L, riga * CELLA_A + SCENDE))
    fermo = src.crop((0, 0, CELLA_L, CELLA_A))
    # la figura senza quello che scende sotto i piedi (la punta dello spadino): ruota attorno ai piedi
    figura = fermo.crop((0, 0, CELLA_L, PIEDI + 2))
    box = contenuto(figura)
    figura = figura.crop(box)
    terra = PIEDI + SCENDE

    def posa(colonna, riga, angolo, scuro, giu=0):
        g = figura.rotate(angolo, resample=Image.BICUBIC, expand=True)
        b = contenuto(g)
        g = scurisci(g.crop(b), scuro)
        x = colonna * CELLA_L + (CELLA_L - g.width) // 2
        y = riga * CELLA_A + terra + giu - g.height
        out.alpha_composite(g, (max(colonna * CELLA_L, x), max(riga * CELLA_A, y)))

    posa(0, 3, 9, 1.0)                 # colpito: piegato all'indietro
    posa(0, 4, -32, 0.92)              # morto: cade…
    posa(1, 4, -64, 0.8, 2)
    posa(2, 4, -90, 0.66, 4)           # …e resta a terra
    return out, {'larghezza': CELLA_L, 'altezza': CELLA_A, 'colonne': 8, 'righe': 5}


def griglia_stretta(file, colonne, righe, margine=6):
    """Lo stesso foglio a griglia con le celle strette (in larghezza) sul contenuto di tutte le celle, centrate."""
    src = Image.open(file).convert('RGBA')
    cl, ca = src.width // colonne, src.height // righe
    sx, dx = cl, 0
    for r in range(righe):
        for c in range(colonne):
            b = contenuto(src.crop((c * cl, r * ca, (c + 1) * cl, (r + 1) * ca)))
            if b:
                sx, dx = min(sx, b[0]), max(dx, b[2])
    # simmetrico attorno al centro della cella: l'asse della figura resta in mezzo
    mezzo = max(cl // 2 - sx, dx - cl // 2) + margine
    mezzo = min(mezzo, cl // 2)
    nl = mezzo * 2
    out = Image.new('RGBA', (nl * colonne, ca * righe), (0, 0, 0, 0))
    for r in range(righe):
        for c in range(colonne):
            cella = src.crop((c * cl + cl // 2 - mezzo, r * ca, c * cl + cl // 2 + mezzo, (r + 1) * ca))
            out.alpha_composite(cella, (c * nl, r * ca))
    return out, {'larghezza': nl, 'altezza': ca, 'colonne': colonne, 'righe': righe}


def ritaglio(file, margine=6, base=0):
    """Il disegno ritagliato sul contenuto (con un margine); `base`: px vuoti aggiunti sotto."""
    src = Image.open(file).convert('RGBA')
    b = contenuto(src)
    box = (max(0, b[0] - margine), max(0, b[1] - margine), min(src.width, b[2] + margine), min(src.height, b[3] + margine))
    g = src.crop(box)
    if base:
        t = Image.new('RGBA', (g.width, g.height + base), (0, 0, 0, 0))
        t.alpha_composite(g, (0, 0))
        g = t
    return g, {'larghezza': g.width, 'altezza': g.height, 'colonne': 1, 'righe': 1}


def braciere():
    """4 fotogrammi: spento, braci (la fiamma appena accennata), acceso, acceso che guizza."""
    src = Image.open(os.path.join(TEATRO_M, 'scena', 'ostacolo-braciere.png')).convert('RGBA')
    l = src.width // 2
    spento, acceso = src.crop((0, 0, l, src.height)), src.crop((l, 0, src.width, src.height))
    b = contenuto(acceso)
    bs = contenuto(spento)
    box = (min(b[0], bs[0]) - 6, min(b[1], bs[1]) - 6, max(b[2], bs[2]) + 6, max(b[3], bs[3]) + 6)
    box = (max(0, box[0]), max(0, box[1]), min(l, box[2]), min(src.height, box[3]))
    spento, acceso = spento.crop(box), acceso.crop(box)
    w, h = spento.size
    # braci: sopra lo spento, la parte bassa della fiamma al 55%
    fiamma = acceso.copy()
    # sfuma dall'alto: niente fino al 24% dell'altezza, poi sale fino al 60% a metà (nessun taglio netto)
    da, a_ = int(h * 0.24), int(h * 0.5)
    rampa = Image.new('L', (1, h))
    rampa.putdata([0 if y < da else int(153 * min(1.0, (y - da) / max(1, a_ - da))) for y in range(h)])
    fiamma.putalpha(ImageChops.multiply(fiamma.getchannel('A'), rampa.resize((w, h))))
    braci = spento.copy()
    braci.alpha_composite(fiamma)
    # guizzo: la fiamma un poco più alta e più chiara (si allunga solo la metà alta, il tripode resta fermo)
    meta = int(h * 0.5)
    alta = acceso.crop((0, 0, w, meta)).resize((w, meta + 10), Image.BICUBIC)
    alta = scurisci(alta, 1.12)
    guizzo = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    guizzo.alpha_composite(acceso.crop((0, meta, w, h)), (0, meta))
    guizzo.alpha_composite(alta.crop((0, 10, w, meta + 10)), (0, 0))
    out = Image.new('RGBA', (w * 4, h), (0, 0, 0, 0))
    for i, f in enumerate((spento, braci, acceso, guizzo)):
        out.alpha_composite(f, (i * w, 0))
    return out, {'larghezza': w, 'altezza': h, 'colonne': 4, 'righe': 1}


def main():
    os.makedirs(USCITA, exist_ok=True)
    fogli = {
        'ferruccio': lambda: personaggio('ferruccio'),
        'taddeo': lambda: personaggio('taddeo'),
        'gatto': lambda: griglia_stretta(os.path.join(TEATRO_M, 'gatto.png'), 4, 6),
        'vespa-cieca': lambda: griglia_stretta(os.path.join(TEATRO_M, 'vespa-cieca.png'), 4, 4),
        'scena-colonna': lambda: ritaglio(os.path.join(TEATRO_M, 'scena', 'ostacolo-colonna.png')),
        'scena-panca': lambda: ritaglio(os.path.join(TEATRO_M, 'scena', 'ostacolo-panchina.png')),
        'scena-braciere': braciere,
        # ostacoli che nel motore non hanno ancora un disegno dell'autore (oggi si vedono come panche o colonne)
        'scena-cassa': lambda: ritaglio(os.path.join(TEATRO_M, 'scena', 'ostacolo-botte.png')),  # una botte: si rompe, non scoppia
        'scena-telaio': lambda: ritaglio(os.path.join(TEATRO_M, 'scena', 'ostacolo-telaio.png')),
        'scena-statua': lambda: ritaglio(os.path.join(TEATRO_M, 'scena', 'ostacolo-statua.png')),
        'scena-siepe': lambda: ritaglio(os.path.join(TEATRO_M, 'scena', 'ostacolo-aiuola.png')),
        'scena-banco': lambda: ritaglio(os.path.join(TEATRO_M, 'scena', 'ostacolo-carretto.png')),
    }
    for nome, fai in fogli.items():
        img, m = fai()
        dest = os.path.join(USCITA, f'{nome}.png')
        img.save(dest, optimize=True)
        print(f"{nome}: {img.width}x{img.height} · fotogramma {m['larghezza']}x{m['altezza']} · griglia {m['colonne']}x{m['righe']} · {os.path.getsize(dest) // 1024} KB")
    return 0


if __name__ == '__main__':
    sys.exit(main())
