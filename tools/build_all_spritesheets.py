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

definitions = {
    'capitano': (
        brain + 'capitano_gregorio_spritesheet_1794313648085.jpg',
        [
            ('fermo', [(26, 17, 204, 253), (256, 17, 435, 253)]),
            ('muove', [(17, 266, 217, 501), (233, 266, 444, 501), (453, 266, 663, 501), (680, 266, 883, 501)]),
            ('anticipo', [(19, 532, 269, 715), (346, 532, 547, 715)]),
            ('carica', [(52, 747, 269, 944), (271, 747, 471, 944), (471, 747, 680, 944), (680, 747, 885, 944)]),
            ('morte', [(25, 966, 214, 1189), (238, 966, 602, 1189), (620, 966, 862, 1189)])
        ]
    ),
    'donna-luciana': (
        brain + 'donna_luciana_spritesheet_1794313682335.jpg',
        [
            ('fermo', [(17, 13, 195, 263), (241, 13, 420, 263), (465, 13, 643, 263), (687, 13, 866, 263)]),
            ('evoca', [(16, 289, 208, 536), (240, 289, 432, 536), (464, 289, 656, 536), (688, 289, 880, 536)]),
            ('attacco', [(9, 552, 270, 761), (320, 552, 730, 761)]),
            ('colpito', [(19, 777, 249, 982)]),
            ('morte', [(33, 999, 272, 1195), (302, 999, 560, 1195), (573, 999, 844, 1195)])
        ]
    ),
    'custode-marmo': (
        brain + 'custode_di_marmo_spritesheet_1794313686500.jpg',
        [
            ('fermo', [(5, 10, 245, 238), (269, 10, 510, 238)]),
            ('apre', [(5, 246, 389, 478), (430, 246, 766, 478)]),
            ('spara', [(5, 487, 295, 719), (303, 487, 591, 719), (600, 487, 892, 719)]),
            ('colpito', [(10, 727, 230, 957)]),
            ('morte', [(4, 967, 220, 1195), (229, 967, 444, 1195), (453, 967, 669, 1195), (676, 967, 891, 1195)])
        ]
    ),
    'spezzafili': (
        brain + 'lo_spezzafili_ottone_spritesheet_v2_1794313721753.jpg',
        [
            ('fermo', [(30, 13, 217, 238), (251, 13, 438, 238)]),
            ('muove', [(22, 248, 210, 475), (244, 248, 431, 475), (467, 248, 655, 475), (686, 248, 874, 475)]),
            ('anticipo', [(27, 479, 393, 717), (430, 479, 789, 717)]),
            ('attacco', [(41, 757, 421, 956), (462, 757, 857, 956)]),
            ('morte', [(33, 969, 253, 1193), (329, 969, 568, 1193), (611, 969, 876, 1193)])
        ]
    ),
    'lucciola': (
        brain + 'lucciola_pungente_spritesheet_1794313707506.jpg',
        [
            ('vola', [(60, 36, 290, 250), (351, 36, 581, 250), (635, 36, 869, 250), (918, 36, 1160, 250)]),
            ('carica', [(61, 281, 345, 459), (353, 281, 638, 459)]),
            ('colpito', [(69, 477, 281, 671)]),
            ('morte', [(100, 683, 315, 874), (375, 683, 594, 874), (660, 683, 884, 874)])
        ]
    ),
    'burattino': (
        brain + 'burattino_scucito_spritesheet_1794313724979.jpg',
        [
            ('fermo', [(31, 9, 201, 268), (252, 9, 424, 268)]),
            ('muove', [(28, 295, 202, 523), (254, 295, 413, 523), (469, 295, 651, 523), (696, 295, 876, 523)]),
            ('anticipo', [(29, 549, 262, 761), (275, 549, 508, 761)]),
            ('attacco', [(12, 775, 260, 957), (270, 775, 570, 957)]),
            ('morte', [(4, 971, 253, 1194), (304, 971, 520, 1194), (577, 971, 805, 1194)])
        ]
    )
}

with open(dest_gioco + 'layout.json', 'r', encoding='utf-8') as f:
    layout_data = json.load(f)

for name, (path, row_defs) in definitions.items():
    print(f"Processing {name} from {path}...")
    out_img, meta = build_grid_spritesheet(path, row_defs)
    
    # Save to gioco and root
    gioco_path = os.path.join(dest_gioco, f"{name}.png")
    root_path = os.path.join(dest_root, f"{name}.png")
    out_img.save(gioco_path, 'PNG')
    out_img.save(root_path, 'PNG')
    print(f"  Saved {gioco_path} and {root_path}: size {out_img.size}, meta {meta}")
    
    layout_data[name] = meta

with open(dest_gioco + 'layout.json', 'w', encoding='utf-8') as f:
    json.dump(layout_data, f, indent=2, ensure_ascii=False)
with open(dest_root + 'layout.json', 'w', encoding='utf-8') as f:
    json.dump(layout_data, f, indent=2, ensure_ascii=False)

print("Updated layout.json successfully in both locations!")
