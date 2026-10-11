import os
from PIL import Image

BRAIN_DIR = r"C:\Users\salva\.gemini\antigravity\brain\3a01546c-a954-4d5f-84d5-f889a796272d"
OUT_DIR = r"E:\gioco\github-base\src\assets\art\ui\carta"
os.makedirs(OUT_DIR, exist_ok=True)

# 1. Copia e converti la Carta Reale
map_src = os.path.join(BRAIN_DIR, "carta_reale_mappa_1791731730013.jpg")
if os.path.exists(map_src):
    img = Image.open(map_src).convert("RGBA")
    img.save(os.path.join(OUT_DIR, "carta_reale.png"))
    print("carta_reale.png salvata")

# 2. Ritaglia i 7 sigilli da sigilli_borbonici_1791731747801.jpg (1024x1024)
# In alto 3: chiusa, telaio, campane
# In basso 3 (con caserma e tempo combinati/affiancati)
seals_src = os.path.join(BRAIN_DIR, "sigilli_borbonici_1791731747801.jpg")
if os.path.exists(seals_src):
    s_img = Image.open(seals_src).convert("RGBA")
    w, h = s_img.size
    # 6 riquadri principali:
    # row 0: col 0 = chiusa, col 1 = telaio, col 2 = campane
    # row 1: col 0 = martello/fabbro, col 1 = orologio/caserma, col 2 = mercato
    col_w = w / 3.0
    row_h = h / 2.0
    
    crops = {
        "sigillo_chiusa": (int(0 * col_w + 20), int(0 * row_h + 30), int(1 * col_w - 20), int(1 * row_h - 40)),
        "sigillo_telaio": (int(1 * col_w + 20), int(0 * row_h + 30), int(2 * col_w - 20), int(1 * row_h - 40)),
        "sigillo_campane": (int(2 * col_w + 20), int(0 * row_h + 30), int(3 * col_w - 20), int(1 * row_h - 40)),
        "sigillo_disegno": (int(0 * col_w + 20), int(1 * row_h + 30), int(1 * col_w - 20), int(2 * row_h - 40)),
        "sigillo_caserma": (int(1 * col_w + 20), int(1 * row_h + 30), int(2 * col_w - 20), int(2 * row_h - 40)),
        "sigillo_orologio": (int(1 * col_w + 20), int(1 * row_h + 30), int(2 * col_w - 20), int(2 * row_h - 40)),
        "sigillo_mercato": (int(2 * col_w + 20), int(1 * row_h + 30), int(3 * col_w - 20), int(2 * row_h - 40)),
    }
    for name, box in crops.items():
        cropped = s_img.crop(box)
        cropped.save(os.path.join(OUT_DIR, f"{name}.png"))
        print(f"{name}.png salvato")

# 3. Ritaglia le icone abilità da icone_abilita_1791731767085.jpg (1024x1024)
# row 0: col 0 = grapple, col 1 = hammer, col 2 = parry
# row 1: col 1 = scarf, col 2 = heal
icons_src = os.path.join(BRAIN_DIR, "icone_abilita_1791731767085.jpg")
if os.path.exists(icons_src):
    i_img = Image.open(icons_src).convert("RGBA")
    w, h = i_img.size
    col_w = w / 3.0
    row_h = h / 2.0
    
    icon_crops = {
        "icona_catena": (int(0 * col_w + 40), int(0 * row_h + 80), int(1 * col_w - 40), int(1 * row_h - 70)),
        "icona_martello": (int(1 * col_w + 40), int(0 * row_h + 80), int(2 * col_w - 40), int(1 * row_h - 70)),
        "icona_parata": (int(2 * col_w + 40), int(0 * row_h + 80), int(3 * col_w - 40), int(1 * row_h - 70)),
        "icona_sciarpa": (int(1 * col_w + 40), int(1 * row_h + 80), int(2 * col_w - 40), int(2 * row_h - 70)),
        "icona_cura": (int(2 * col_w + 40), int(1 * row_h + 80), int(3 * col_w - 40), int(2 * row_h - 70)),
    }
    for name, box in icon_crops.items():
        cropped = i_img.crop(box)
        cropped.save(os.path.join(OUT_DIR, f"{name}.png"))
        print(f"{name}.png salvato")
