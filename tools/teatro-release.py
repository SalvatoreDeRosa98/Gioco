#!/usr/bin/env python3
"""
tools/teatro-release.py — build del Teatro delle Marionette in un solo file HTML (alternativa Python a tools/teatro-release.js).
Uso: python3 tools/teatro-release.py
"""
import os
import re
import json
import base64

def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    src = os.path.join(root, 'teatro_marionette.html')
    sprite_dir = os.path.join(root, 'assets', 'sprite_teatro')
    out_file = os.path.join(root, 'production', 'release', 'teatro.html')

    with open(src, 'r', encoding='utf-8') as f:
        html = f.read()

    risorse = {}
    if os.path.isdir(sprite_dir):
        for fn in sorted(os.listdir(sprite_dir)):
            if fn.endswith('.png'):
                fp = os.path.join(sprite_dir, fn)
                with open(fp, 'rb') as img_f:
                    b64 = base64.b64encode(img_f.read()).decode('ascii')
                    risorse[f'assets/sprite_teatro/{fn}'] = f'data:image/png;base64,{b64}'

    blocco = ('<script>\n// Risorse incorporate da tools/teatro-release.py (PNG come data: URI)\n'
              + f'window.__risorseTeatro = {json.dumps(risorse)};\n</script>\n')

    rx = re.compile(r'<script\s+src=\"(teatro/[^\"]+\.js)\"\s*></script>')

    first = True
    def repl(m):
        nonlocal first
        rel = m.group(1)
        fp = os.path.join(root, rel)
        if os.path.exists(fp):
            with open(fp, 'r', encoding='utf-8') as js_f:
                js_code = js_f.read().replace('</script', '<\\/script').replace('<!--', '<\\!--')
            res = f'<script>\n/* {rel} (incorporato) */\n{js_code}\n</script>'
            if first:
                first = False
                res = blocco + res
            return res
        return m.group(0)

    new_html = rx.sub(repl, html)
    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(new_html)

    size_kb = os.path.getsize(out_file) / 1024
    print(f"Scritto {out_file} ({size_kb:.1f} KB)")

if __name__ == '__main__':
    main()
