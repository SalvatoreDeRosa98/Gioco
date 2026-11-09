#!/usr/bin/env python3
"""
tools/teatro-release.py — build del Teatro delle Marionette in un solo file HTML (speculare a tools/teatro-release.js).
Uso: python3 tools/teatro-release.py   →  production/release/teatro.html

Parte sempre da gioco/teatro_marionette.html e gioco/teatro/*.js.
"""
import os
import re
import json
import base64

def main():
    radice = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    cartella_gioco = os.path.join(radice, 'gioco')
    sorgente = os.path.join(cartella_gioco, 'teatro_marionette.html')
    sprite_dir = os.path.join(cartella_gioco, 'assets', 'sprite_teatro')
    uscita = os.path.join(radice, 'production', 'release', 'teatro.html')

    with open(sorgente, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Risorse PNG di gioco/assets/sprite_teatro/ in data: URI
    risorse = {}
    if os.path.isdir(sprite_dir):
        for fn in sorted(os.listdir(sprite_dir)):
            if fn.endswith('.png'):
                fp = os.path.join(sprite_dir, fn)
                with open(fp, 'rb') as img_f:
                    b64 = base64.b64encode(img_f.read()).decode('ascii')
                    risorse[f'assets/sprite_teatro/{fn}'] = f'data:image/png;base64,{b64}'

    blocco = ('<script>\n// Risorse incorporate da tools/teatro-release.py (PNG di gioco/assets/sprite_teatro come data: URI)\n'
              + f'window.__risorseTeatro = {json.dumps(risorse)};\n</script>\n')

    rx = re.compile(r'<script\s+src=\"(teatro/[^\"]+\.js)\"\s*></script>')

    first = True
    def repl(m):
        nonlocal first
        rel = m.group(1)
        fp = os.path.join(cartella_gioco, rel)
        if os.path.exists(fp):
            with open(fp, 'r', encoding='utf-8') as js_f:
                js_code = js_f.read().replace('</script', '<\\/script').replace('<!--', '<\\!--')
            res = f'<script>\n/* {rel} (incorporato da tools/teatro-release.py da gioco/{rel}) */\n{js_code}\n</script>'
            if first:
                first = False
                res = blocco + res
            return res
        return m.group(0)

    new_html = rx.sub(repl, html)
    if first:
        new_html = new_html.replace('</body>', blocco + '</body>')

    os.makedirs(os.path.dirname(uscita), exist_ok=True)
    with open(uscita, 'w', encoding='utf-8') as f:
        f.write(new_html)

    size_kb = os.path.getsize(uscita) / 1024
    print(f"Scritto {uscita} ({size_kb:.1f} KB) leggendo da gioco/")

if __name__ == '__main__':
    main()
