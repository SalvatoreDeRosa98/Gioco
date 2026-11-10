#!/usr/bin/env python3
"""
tools/ottimizza-png-release.py — alleggerisce un PNG per il file unico di release.

Riduce i colori a una tavolozza di 256 (con trasparenza) senza cambiare le dimensioni: i fogli sprite
restano allineati al loro layout. Gli originali non si toccano. Lo chiama tools/teatro-release.js
(se Python o Pillow mancano, la release incorpora gli originali).
Uso: python3 tools/ottimizza-png-release.py <ingresso.png> <uscita.png>
"""
import sys
from PIL import Image


def main():
    ingresso, uscita = sys.argv[1], sys.argv[2]
    im = Image.open(ingresso).convert('RGBA')
    ridotta = im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    ridotta.save(uscita, optimize=True)


if __name__ == '__main__':
    main()
