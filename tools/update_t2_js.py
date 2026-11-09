with open('gioco/teatro/t2-sprite.js', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update LAYOUT in t2-sprite.js
old_layout = """  /* T2-LAYOUT: inizio (da assets/sprite_teatro/layout.json; righe = [posa, fotogrammi]) */
  const LAYOUT = {
    "ferruccio": {"cella_l": 305, "cella_a": 136, "altezza_rif": 128, "margine": 4, "righe": [["fermo", 2], ["cammina", 4], ["spara", 2], ["colpito", 1], ["morto", 3]]},
    "agnese": {"cella_l": 212, "cella_a": 138, "altezza_rif": 127, "margine": 4, "righe": [["fermo", 2], ["cammina", 4], ["spara", 2], ["colpito", 1], ["morto", 3]]},
    "taddeo": {"cella_l": 188, "cella_a": 132, "altezza_rif": 123, "margine": 4, "righe": [["fermo", 2], ["cammina", 4], ["spara", 2], ["colpito", 1], ["morto", 3]]},
    "ombra": {"cella_l": 377, "cella_a": 142, "altezza_rif": 130, "margine": 4, "righe": [["fermo", 2], ["cammina", 4], ["spara", 2], ["colpito", 1], ["morto", 3]]},
    "teste-mira": {"cella_l": 60, "cella_a": 74, "altezza_rif": 64, "margine": 4, "righe": [["tutto", 4]]},
    "gatto": {"cella_l": 422, "cella_a": 136, "altezza_rif": 124, "margine": 4, "righe": [["fermo", 2], ["muove", 4], ["anticipo", 2], ["attacco", 2], ["colpito", 1], ["morte", 4]]},
    "vespa-cieca": {"cella_l": 237, "cella_a": 142, "altezza_rif": 122, "margine": 4, "righe": [["vola", 4], ["carica", 2], ["colpito", 1], ["morte", 3]]},
    "maschera": {"cella_l": 207, "cella_a": 153, "altezza_rif": 129, "margine": 4, "righe": [["chiusa", 2], ["si-apre", 3], ["aperta-spara", 2], ["colpito", 1], ["morte", 4]]},
    "bomba-ferma": {"cella_l": 113, "cella_a": 136, "altezza_rif": 124, "margine": 4, "righe": [["fermo", 2], ["miccia", 4], ["esplode", 5]]},
    "guardia": {"cella_l": 285, "cella_a": 135, "altezza_rif": 123, "margine": 4, "righe": [["fermo", 2], ["muove", 4], ["anticipo", 2], ["attacco", 2], ["colpito", 1], ["morte", 4]]},
    "statua": {"cella_l": 269, "cella_a": 171, "altezza_rif": 129, "margine": 4, "righe": [["fermo", 2], ["trema", 3], ["spara", 2], ["colpito", 1], ["morte", 4]]},
    "predone": {"cella_l": 318, "cella_a": 151, "altezza_rif": 128, "margine": 4, "righe": [["fermo", 2], ["muove", 4], ["anticipo", 2], ["attacco", 2], ["colpito", 1], ["morte", 4]]}
  };
  /* T2-LAYOUT: fine */"""

new_layout = """  /* T2-LAYOUT: inizio (da assets/sprite_teatro/layout.json; righe = [posa, fotogrammi]) */
  const LAYOUT = {
    "ferruccio": {"cella_l": 305, "cella_a": 136, "altezza_rif": 128, "margine": 4, "righe": [["fermo", 2], ["cammina", 4], ["spara", 2], ["colpito", 1], ["morto", 3]]},
    "agnese": {"cella_l": 212, "cella_a": 138, "altezza_rif": 127, "margine": 4, "righe": [["fermo", 2], ["cammina", 4], ["spara", 2], ["colpito", 1], ["morto", 3]]},
    "taddeo": {"cella_l": 188, "cella_a": 132, "altezza_rif": 123, "margine": 4, "righe": [["fermo", 2], ["cammina", 4], ["spara", 2], ["colpito", 1], ["morto", 3]]},
    "ombra": {"cella_l": 377, "cella_a": 142, "altezza_rif": 130, "margine": 4, "righe": [["fermo", 2], ["cammina", 4], ["spara", 2], ["colpito", 1], ["morto", 3]]},
    "teste-mira": {"cella_l": 60, "cella_a": 74, "altezza_rif": 64, "margine": 4, "righe": [["tutto", 4]]},
    "gatto": {"cella_l": 422, "cella_a": 136, "altezza_rif": 124, "margine": 4, "righe": [["fermo", 2], ["muove", 4], ["anticipo", 2], ["attacco", 2], ["colpito", 1], ["morte", 4]]},
    "vespa-cieca": {"cella_l": 297, "cella_a": 265, "colonne": 4, "altezza_rif": 257, "margine": 4, "righe": [["vola", 4], ["carica", 2], ["colpito", 1], ["morte", 3]]},
    "maschera": {"cella_l": 272, "cella_a": 211, "colonne": 4, "altezza_rif": 203, "margine": 4, "righe": [["chiusa", 2], ["si-apre", 3], ["aperta-spara", 2], ["colpito", 1], ["morte", 4]]},
    "bomba-ferma": {"cella_l": 251, "cella_a": 277, "colonne": 5, "altezza_rif": 269, "margine": 4, "righe": [["fermo", 2], ["miccia", 4], ["esplode", 5]]},
    "guardia": {"cella_l": 307, "cella_a": 244, "colonne": 4, "altezza_rif": 236, "margine": 4, "righe": [["fermo", 2], ["muove", 4], ["anticipo", 2], ["attacco", 2], ["colpito", 1], ["morte", 2]]},
    "statua": {"cella_l": 192, "cella_a": 240, "colonne": 4, "altezza_rif": 232, "margine": 4, "righe": [["fermo", 2], ["trema", 3], ["spara", 2], ["colpito", 1], ["morte", 4]]},
    "predone": {"cella_l": 331, "cella_a": 227, "colonne": 4, "altezza_rif": 219, "margine": 4, "righe": [["fermo", 2], ["muove", 4], ["anticipo", 2], ["attacco", 2], ["colpito", 1], ["morte", 2]]},
    "regina-vespa": {"cella_l": 328, "cella_a": 292, "colonne": 4, "altezza_rif": 284, "margine": 4, "righe": [["vola", 4], ["carica", 2], ["evoca", 2], ["colpito", 1], ["morte", 2]]}
  };
  /* T2-LAYOUT: fine */"""

assert old_layout in text, "old_layout not found!"
text = text.replace(old_layout, new_layout, 1)

# 2. Update CONFIG.altezza to add regina-vespa and cadenza evoca
old_cfg = """    altezza: Object.freeze({
      ferruccio: 58, agnese: 56, taddeo: 56, ombra: 56,
      gatto: 26, 'vespa-cieca': 26, maschera: 30, 'bomba-ferma': 28, guardia: 40, statua: 42, predone: 38,
    }),"""

new_cfg = """    altezza: Object.freeze({
      ferruccio: 58, agnese: 56, taddeo: 56, ombra: 56,
      gatto: 26, 'vespa-cieca': 26, maschera: 30, 'bomba-ferma': 28, guardia: 40, statua: 42, predone: 38,
      'regina-vespa': 58,
    }),"""

assert old_cfg in text, "old_cfg not found!"
text = text.replace(old_cfg, new_cfg, 1)

# Add evoca to cadenza
old_cad = "attacco: 6, carica: 5, miccia: 6, esplode: 5, chiusa: 24, 'si-apre': 5,"
new_cad = "attacco: 6, carica: 5, evoca: 8, miccia: 6, esplode: 5, chiusa: 24, 'si-apre': 5,"
assert old_cad in text, "old_cad not found!"
text = text.replace(old_cad, new_cad, 1)

# 3. Update disegnaFotogramma to accept optional customH
old_dis = """  function disegnaFotogramma(ctx, nome, posa, f, piediY, tinta, tintaAlfa) {
    if (!pronta(nome)) return false;
    const L = LAYOUT[nome];
    const p = L.indice[posa] || L.indice[L.righe[0][0]];
    if (!p) return false;
    const col = ((f % p.n) + p.n) % p.n;
    const sx = col * L.cella_l, sy = p.riga * L.cella_a;
    const s = (CONFIG.altezza[nome] || 40) / L.altezza_rif;"""

new_dis = """  function disegnaFotogramma(ctx, nome, posa, f, piediY, tinta, tintaAlfa, customH) {
    if (!pronta(nome)) return false;
    const L = LAYOUT[nome];
    const p = L.indice[posa] || L.indice[L.righe[0][0]];
    if (!p) return false;
    const col = ((f % p.n) + p.n) % p.n;
    const sx = col * L.cella_l, sy = p.riga * L.cella_a;
    const s = (customH || CONFIG.altezza[nome] || 40) / L.altezza_rif;"""

assert old_dis in text, "old_dis not found!"
text = text.replace(old_dis, new_dis, 1)

# 4. Export disegnaFotogramma, fotogramma in window.__teatro.t2
old_exp = "window.__teatro.t2 = {\n    personaggio, nemico, dopoNemici,"
new_exp = "window.__teatro.t2 = {\n    personaggio, nemico, dopoNemici, disegnaFotogramma, fotogramma,"
assert old_exp in text, "old_exp not found!"
text = text.replace(old_exp, new_exp, 1)

with open('gioco/teatro/t2-sprite.js', 'w', encoding='utf-8') as f:
    f.write(text)
with open('teatro/t2-sprite.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated gioco/teatro/t2-sprite.js and teatro/t2-sprite.js successfully!")
