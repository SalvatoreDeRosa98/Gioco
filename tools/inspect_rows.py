from PIL import Image

def find_rows(im_path, num_rows_expected=5, thresh=245):
    im = Image.open(im_path).convert('L')
    w, h = im.size
    pixels = im.load()
    
    min_per_row = []
    for y in range(h):
        m = 255
        for x in range(w):
            v = pixels[x, y]
            if v < m: m = v
        min_per_row.append(m)
        
    bands = []
    in_band = False
    start_y = 0
    for y in range(h):
        if min_per_row[y] < thresh:
            if not in_band:
                in_band = True
                start_y = y
        else:
            if in_band:
                in_band = False
                if y - start_y > 20:
                    bands.append((start_y, y))
    if in_band and h - start_y > 20:
        bands.append((start_y, h))
        
    print(f"{im_path.split('/')[-1]}: {len(bands)} bands found -> {bands}")
    return bands

sheets = [
    ('capitano', '/Users/salvatore/.gemini/antigravity/brain/416d4bbb-0fe9-4565-b24f-649afdd46fee/capitano_gregorio_spritesheet_1794313648085.jpg', 5),
    ('luciana', '/Users/salvatore/.gemini/antigravity/brain/416d4bbb-0fe9-4565-b24f-649afdd46fee/donna_luciana_spritesheet_1794313682335.jpg', 5),
    ('custode', '/Users/salvatore/.gemini/antigravity/brain/416d4bbb-0fe9-4565-b24f-649afdd46fee/custode_di_marmo_spritesheet_1794313686500.jpg', 5),
    ('spezzafili', '/Users/salvatore/.gemini/antigravity/brain/416d4bbb-0fe9-4565-b24f-649afdd46fee/lo_spezzafili_ottone_spritesheet_v2_1794313721753.jpg', 5),
    ('lucciola', '/Users/salvatore/.gemini/antigravity/brain/416d4bbb-0fe9-4565-b24f-649afdd46fee/lucciola_pungente_spritesheet_1794313707506.jpg', 4),
    ('burattino', '/Users/salvatore/.gemini/antigravity/brain/416d4bbb-0fe9-4565-b24f-649afdd46fee/burattino_scucito_spritesheet_1794313724979.jpg', 5),
]

for name, path, expected in sheets:
    find_rows(path, expected)
