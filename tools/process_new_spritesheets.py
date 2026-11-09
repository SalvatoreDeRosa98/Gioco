import json
import os
from PIL import Image

brain = '/Users/salvatore/.gemini/antigravity/brain/416d4bbb-0fe9-4565-b24f-649afdd46fee/'
dest_gioco = 'gioco/assets/sprite_teatro/'
dest_root = 'assets/sprite_teatro/'

def cut_transparent_frame(im, box, bg_thresh=248, blend_thresh=225):
    crop = im.crop(box).convert('RGBA')
    w, h = crop.size
    pixels = crop.load()
    
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if min(r, g, b) < bg_thresh:
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y
                
    if min_x > max_x or min_y > max_y:
        return None
        
    crop = crop.crop((min_x, min_y, max_x + 1, max_y + 1))
    w, h = crop.size
    pixels = crop.load()
    
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            min_val = min(r, g, b)
            if min_val >= bg_thresh:
                pixels[x, y] = (0, 0, 0, 0)
            elif min_val > blend_thresh:
                alpha = int(255 * (bg_thresh - min_val) / (bg_thresh - blend_thresh))
                a_float = alpha / 255.0
                nr = max(0, min(255, int((r - 255 * (1 - a_float)) / a_float)))
                ng = max(0, min(255, int((g - 255 * (1 - a_float)) / a_float)))
                nb = max(0, min(255, int((b - 255 * (1 - a_float)) / a_float)))
                pixels[x, y] = (nr, ng, nb, alpha)
            else:
                pixels[x, y] = (r, g, b, 255)
                
    return crop

def build_grid_spritesheet(sheet_path, row_defs, max_cols=4, margin=4):
    im = Image.open(sheet_path).convert('RGB')
    extracted_rows = []
    max_w, max_h = 0, 0
    
    for posa_name, boxes in row_defs:
        frames = []
        for box in boxes:
            fr = cut_transparent_frame(im, box)
            if fr:
                frames.append(fr)
                if fr.size[0] > max_w: max_w = fr.size[0]
                if fr.size[1] > max_h: max_h = fr.size[1]
        extracted_rows.append((posa_name, frames))
        
    cella_l = max_w + margin * 2
    cella_a = max_h + margin * 2
    num_rows = len(extracted_rows)
    cols = max(len(frames) for _, frames in extracted_rows)
    if cols < max_cols: cols = max_cols
    
    sheet_w = cella_l * cols
    sheet_h = cella_a * num_rows
    out_img = Image.new('RGBA', (sheet_w, sheet_h), (0, 0, 0, 0))
    
    righe_meta = []
    for ri, (posa_name, frames) in enumerate(extracted_rows):
        righe_meta.append([posa_name, len(frames)])
        for ci, fr in enumerate(frames):
            fw, fh = fr.size
            draw_x = ci * cella_l + (cella_l - fw) // 2
            draw_y = (ri + 1) * cella_a - margin - fh
            out_img.alpha_composite(fr, (draw_x, draw_y))
            
    layout_meta = {
        'cella_l': cella_l,
        'cella_a': cella_a,
        'colonne': cols,
        'altezza_rif': max_h,
        'margine': margin,
        'righe': righe_meta
    }
    return out_img, layout_meta

# Definitions for each sheet
definitions = {
    'guardia': (
        brain + 'guardia_borbonica_spritesheet_1794266086550.jpg',
        [
            ('fermo', [(70, 3, 190, 239), (280, 3, 405, 239)]),
            ('muove', [(50, 244, 185, 479), (270, 244, 410, 479), (490, 244, 630, 479), (710, 244, 850, 479)]),
            ('anticipo', [(50, 495, 325, 719), (460, 495, 770, 719)]),
            ('attacco', [(65, 736, 365, 960), (465, 736, 750, 960)]),
            ('colpito', [(40, 980, 285, 1198)]),
            ('morte', [(310, 980, 555, 1198), (580, 980, 865, 1198)])
        ]
    ),
    'vespa-cieca': (
        brain + 'vespa_cieca_spritesheet_v2_1794266108102.jpg',
        [
            ('vola', [(20, 19, 200, 276), (220, 19, 425, 276), (450, 19, 645, 276), (680, 19, 870, 276)]),
            ('carica', [(80, 313, 310, 542), (490, 313, 785, 542)]),
            ('colpito', [(60, 619, 310, 828)]),
            ('morte', [(25, 924, 260, 1194), (375, 924, 550, 1194), (600, 924, 860, 1194)])
        ]
    ),
    'bomba-ferma': (
        brain + 'bomba_ferma_spritesheet_1794266093010.jpg',
        [
            ('fermo', [(50, 39, 245, 264), (325, 39, 520, 264)]),
            ('miccia', [(50, 291, 245, 560), (330, 291, 535, 560), (620, 291, 840, 560), (910, 291, 1145, 560)]),
            ('esplode', [(15, 624, 260, 860), (270, 624, 520, 860), (525, 624, 765, 860), (785, 624, 945, 860), (965, 624, 1180, 860)])
        ]
    ),
    'maschera': (
        brain + 'maschera_spritesheet_1794266098104.jpg',
        [
            ('chiusa', [(25, 35, 225, 237), (250, 35, 450, 237)]),
            ('si-apre', [(25, 274, 225, 477), (290, 274, 520, 477), (610, 274, 825, 477)]),
            ('aperta-spara', [(20, 512, 245, 714), (280, 512, 555, 714)]),
            ('colpito', [(30, 755, 230, 948)]),
            ('morte', [(25, 988, 215, 1187), (245, 988, 440, 1187), (515, 988, 670, 1187), (680, 988, 875, 1187)])
        ]
    ),
    'statua': (
        brain + 'statua_torretta_spritesheet_1794266107690.jpg',
        [
            ('fermo', [(30, 18, 185, 244), (245, 18, 405, 244)]),
            ('trema', [(30, 259, 190, 487), (245, 259, 415, 487), (470, 259, 630, 487)]),
            ('spara', [(55, 505, 240, 730), (485, 505, 640, 730)]),
            ('colpito', [(40, 738, 215, 962)]),
            ('morte', [(30, 967, 205, 1199), (265, 967, 420, 1199), (475, 967, 650, 1199), (685, 967, 865, 1199)])
        ]
    ),
    'predone': (
        brain + 'predone_spritesheet_1794266110835.jpg',
        [
            ('fermo', [(20, 19, 200, 238), (235, 19, 420, 238)]),
            ('muove', [(5, 263, 195, 479), (215, 263, 425, 479), (440, 263, 640, 479), (665, 263, 865, 479)]),
            ('anticipo', [(20, 507, 275, 719), (440, 507, 640, 719)]),
            ('attacco', [(50, 748, 320, 959), (435, 748, 760, 959)]),
            ('colpito', [(45, 987, 225, 1198)]),
            ('morte', [(320, 987, 570, 1198), (580, 987, 865, 1198)])
        ]
    ),
    'boss-regina': (
        brain + 'boss_regina_vespe_spritesheet_1794266116309.jpg',
        [
            ('vola', [(30, 20, 210, 304), (250, 20, 430, 304), (450, 20, 650, 304), (675, 20, 870, 304)]),
            ('carica', [(90, 326, 390, 558), (520, 326, 815, 558)]),
            ('evoca', [(65, 605, 395, 880), (500, 605, 830, 880)]),
            ('colpito', [(30, 906, 280, 1181)]),
            ('morte', [(320, 906, 570, 1181), (610, 906, 875, 1181)])
        ]
    )
}

# Load existing layout.json
with open('gioco/assets/sprite_teatro/layout.json', 'r') as f:
    layout_data = json.load(f)

for name, (path, rows) in definitions.items():
    print(f'Processing {name} from {path}...')
    max_c = 5 if name == 'bomba-ferma' else 4
    sheet_img, meta = build_grid_spritesheet(path, rows, max_cols=max_c)
    
    # Target filename in assets
    out_fn = f'{name}.png' if name != 'boss-regina' else 'regina-vespa.png'
    sheet_img.save(dest_gioco + out_fn, optimize=True)
    sheet_img.save(dest_root + out_fn, optimize=True)
    
    # Update layout dict
    layout_key = name if name != 'boss-regina' else 'regina-vespa'
    layout_data[layout_key] = {
        'cella_l': meta['cella_l'],
        'cella_a': meta['cella_a'],
        'colonne': meta['colonne'],
        'altezza_rif': meta['altezza_rif'],
        'margine': meta['margine'],
        'righe': meta['righe']
    }
    print(f'  Saved {out_fn}: cella {meta["cella_l"]}x{meta["cella_a"]}, {meta["colonne"]} cols, {len(meta["righe"])} rows')

with open('gioco/assets/sprite_teatro/layout.json', 'w') as f:
    json.dump(layout_data, f, indent=2)
with open('assets/sprite_teatro/layout.json', 'w') as f:
    json.dump(layout_data, f, indent=2)

print('All 7 spritesheets processed and layout.json updated!')
