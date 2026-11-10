from PIL import Image

def find_columns_in_band(im, y1, y2, thresh=245):
    w, _ = im.size
    pixels = im.load()
    
    min_per_col = []
    for x in range(w):
        m = 255
        for y in range(y1, y2):
            v = pixels[x, y]
            if v < m: m = v
        min_per_col.append(m)
        
    cols = []
    in_col = False
    start_x = 0
    for x in range(w):
        if min_per_col[x] < thresh:
            if not in_col:
                in_col = True
                start_x = x
        else:
            if in_col:
                in_col = False
                if x - start_x > 15: # ignore noise
                    cols.append((start_x, x))
    if in_col and w - start_x > 15:
        cols.append((start_x, w))
    return cols

import inspect_rows
for name, path, expected in inspect_rows.sheets:
    bands = inspect_rows.find_rows(path, expected)
    im = Image.open(path).convert('L')
    print(f"=== {name} ===")
    for bi, (y1, y2) in enumerate(bands):
        cols = find_columns_in_band(im, y1, y2)
        print(f"  Row {bi}: {len(cols)} cols -> {cols}")
