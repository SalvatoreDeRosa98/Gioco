#!/usr/bin/env python3
"""
tools/pulisci-sprite-boss.py — ripulisce i ritagli dei boss fatti dai fogli modello.

I PNG in gioco/assets/sprite_teatro/ (capitano_guardia_fermo.png, ...) contengono anche scritte del foglio
modello («BOSS», il nome) e pezzi di figure vicine. Per ogni immagine dell'elenco: si tiene solo la figura
principale (la componente connessa più grande della trasparenza, allargata di qualche pixel per non perdere
i dettagli staccati di poco), si rifila ai bordi e si riduce all'altezza che serve in gioco.
Uscita: gioco/assets/sprite_teatro/boss/<nome>.png. Gli originali non si toccano.
Uso: python3 tools/pulisci-sprite-boss.py
"""
import os
from collections import deque
from PIL import Image, ImageFilter

RADICE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SORG = os.path.join(RADICE, 'gioco', 'assets', 'sprite_teatro')
DEST = os.path.join(SORG, 'boss')
ALTEZZA_MAX = 420      # px: basta per lo schermo 4K (boss alti ~70 px nel canvas 640x360, scala 6)
PASSO = 4              # la maschera si analizza ridotta di 4 volte
ALLARGA = 2            # celle di allargamento (≈ 8 px): tiene i dettagli staccati di poco
# Non in elenco perché tagliate male all'origine (figura mozzata dal bordo): donna_luciana_evoca,
# regina_vespa_attacco, regina_vespa_volo; capitano_guardia_carica contiene un'altra figura.
ELENCO = [
    'gatto_fermo', 'gatto_accucciato', 'gatto_salto', 'gatto_cammina',
    'capitano_guardia_fermo',
    'colosso_statua_fermo', 'colosso_statua_aperto',
    'maestro_fucina_fermo', 'maestro_fucina_attacco',
    'donna_luciana_ferma',
    'regina_vespa_ferma',
]
# Residui attaccati alla figura (scritte, pezzi di figure vicine): rettangoli da cancellare dopo la rifilatura,
# in frazioni [x1, y1, x2, y2] dell'immagine rifilata.
CANCELLA = {
    'maestro_fucina_attacco': [(0.0, 0.0, 0.30, 0.11)],
    'donna_luciana_ferma': [(0.84, 0.0, 1.0, 0.56)],
    'regina_vespa_ferma': [(0.0, 0.86, 0.40, 1.0)],
}


def figura_principale(im):
    """Maschera (L, 0/255, grandezza piena) della componente connessa più grande."""
    w, h = im.size
    alfa = im.getchannel('A').point(lambda v: 255 if v > 24 else 0)
    pw, ph = max(1, w // PASSO), max(1, h // PASSO)
    piccola = alfa.resize((pw, ph), Image.BOX).point(lambda v: 255 if v > 40 else 0)
    larga = piccola.filter(ImageFilter.MaxFilter(ALLARGA * 2 + 1))
    px = larga.load()
    etichetta = [[0] * pw for _ in range(ph)]
    aree = {}
    n = 0
    for y0 in range(ph):
        for x0 in range(pw):
            if not px[x0, y0] or etichetta[y0][x0]:
                continue
            n += 1
            coda = deque([(x0, y0)])
            etichetta[y0][x0] = n
            area = 0
            while coda:
                x, y = coda.popleft()
                area += 1
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < pw and 0 <= ny < ph and px[nx, ny] and not etichetta[ny][nx]:
                        etichetta[ny][nx] = n
                        coda.append((nx, ny))
            aree[n] = area
    if not aree:
        return alfa, 0, 0
    migliore = max(aree, key=aree.get)
    tieni = Image.new('L', (pw, ph), 0)
    tp = tieni.load()
    for y in range(ph):
        riga = etichetta[y]
        for x in range(pw):
            if riga[x] == migliore:
                tp[x, y] = 255
    return tieni.resize((w, h), Image.NEAREST), len(aree) - 1, aree[migliore]


def main():
    os.makedirs(DEST, exist_ok=True)
    for nome in ELENCO:
        im = Image.open(os.path.join(SORG, nome + '.png')).convert('RGBA')
        maschera, tolte, _ = figura_principale(im)
        r, g, b, a = im.split()
        a = Image.composite(a, Image.new('L', im.size, 0), maschera)
        pulita = Image.merge('RGBA', (r, g, b, a))
        riq = a.getbbox()
        if riq:
            pulita = pulita.crop(riq)
        for fx1, fy1, fx2, fy2 in CANCELLA.get(nome, []):
            w, h = pulita.size
            pulita.paste((0, 0, 0, 0), (round(fx1 * w), round(fy1 * h), round(fx2 * w), round(fy2 * h)))
        riq = pulita.getchannel('A').getbbox()
        if riq:
            pulita = pulita.crop(riq)
        if pulita.height > ALTEZZA_MAX:
            k = ALTEZZA_MAX / pulita.height
            pulita = pulita.resize((max(1, round(pulita.width * k)), ALTEZZA_MAX), Image.LANCZOS)
        esce = os.path.join(DEST, nome + '.png')
        pulita.save(esce, optimize=True)
        print(f'{nome}: {im.size} -> {pulita.size}, pezzi tolti: {tolte}, {os.path.getsize(esce) // 1024} KB')


if __name__ == '__main__':
    main()
