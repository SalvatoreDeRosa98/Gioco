"""Build atlas regions and articulated anatomy without editing generated bitmaps.

Generated images remain intact. Alpha components determine Sprite2D regions.
Each atlas has sixteen cells; painted ends overlap behind adjacent pieces.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'src/assets/art/characters/npc_puppets'
PARTS = ['head', 'torso', 'shoulder', 'shoulder_f', 'elbow', 'elbow_f',
         'wrist', 'wrist_f', 'thigh', 'thigh_f', 'knee', 'knee_f',
         'ankle', 'ankle_f', 'accessory', 'extra']
ALIASES = {'gaetano_umano': 'gaetano', 'violante_scesa': 'violante',
           'rosa': 'carmela', 'combat_duellante': 'taddeo',
           'combat_guardia': 'guardia', 'combat_capitano': 'capitano',
           'combat_madre': 'madre', 'combat_cavaliere': 'cavaliere',
           'combat_spettro': 'spettro'}
DRESSES = {'agnese', 'bianca', 'violante', 'assunta', 'carmela', 'elsa', 'lia', 'madre', 'statua'}
ACCESSORIES = {'guardia': 'sword', 'taddeo': 'sword', 'capitano': 'sword',
               'gaetano': 'hammer', 'tonino': 'cheese', 'agnese': 'scarf',
               'violante': 'handkerchief', 'carmela': 'basket', 'elsa': 'book',
               'cesare': 'keys', 'lia': 'shuttle', 'don_ciccio': 'cane',
               'gregorio': 'halberd', 'cavaliere': 'lily', 'madre': 'books',
               'custode': 'sword', 'statua': 'orb',
               'mariella': 'chair', 'lanterniere': 'lantern'}


def registration(path, parts):
    """Measure opaque joint centres, not the centres of atlas bounding boxes.

    This only writes coordinates; the original painted PNGs are untouched.
    Limb axes may be diagonal in the atlas and are registered before animation.
    """
    alpha = np.asarray(Image.open(path).convert('RGBA'))[:, :, 3]
    result = {}
    for key in PARTS[:14]:
        x, y, w, h = parts[key]
        mask = alpha[y:y+h, x:x+w] > 170
        def centre(fraction):
            row = int(h * fraction)
            _, xx = np.where(mask[max(0,row-3):min(h,row+4)])
            return [round(float(np.median(xx)) / w, 5) if len(xx) else .5, fraction]
        result[key] = dict(start=centre(.14), end=centre(.86))
        if key == 'head':
            result[key]['start'] = centre(.92)
        if key.startswith('ankle'):
            result[key]['start'] = centre(.12)
    return result


def regions(path):
    """Find isolated painted parts; return source rectangles in atlas pixels."""
    image = Image.open(path).convert('RGBA')
    alpha = np.asarray(image)[:, :, 3]
    labels, _ = label(alpha > 40)
    result = {}
    for i, sl in enumerate(find_objects(labels)):
        if sl is None:
            continue
        count = int(np.sum(labels[sl] == i + 1))
        if count < 500:
            continue
        x0, y0, x1, y1 = sl[1].start, sl[0].start, sl[1].stop, sl[0].stop
        cx, cy = (x0 + x1) / 2 / image.width, (y0 + y1) / 2 / image.height
        col = min(3, int(cx * 4))
        row = 0 if cy < .29 else (1 if cy < .50 else (2 if cy < .77 else 3))
        key = PARTS[row * 4 + col]
        rect = [max(0, x0-2), max(0, y0-2), min(image.width, x1+2), min(image.height, y1+2)]
        if key in result:
            old = result[key]
            rect = [min(old[0], rect[0]), min(old[1], rect[1]), max(old[2], rect[2]), max(old[3], rect[3])]
        result[key] = rect
    return {k: [r[0], r[1], r[2]-r[0], r[3]-r[1]] for k, r in result.items()}


def build():
    """Write completed puppet metadata; keep missing assets visible as errors."""
    configs = {}
    for path in sorted(ASSETS.glob('*.png')):
        name = path.stem
        repaired = ASSETS.parent / 'npc_puppets_jointfix' / path.name
        if repaired.exists():
            path = repaired
        parts = regions(path)
        # Several generated hand cells contain a second sleeve. Start at the
        # actual wrist; otherwise fitting the whole cell makes the palm tiny.
        wrist_trim = {'assunta': .48, 'capitano': .48, 'capuano': .54,
                      'don_ciccio': .48, 'elsa': .43, 'mariella': .47,
                      'nunziatina': .28, 'taddeo': .40, 'violante': .55,
                      'ratking': .40}.get(name, 0)
        if wrist_trim:
            for hand in ['wrist', 'wrist_f']:
                rect = parts[hand]
                trim = int(rect[3] * wrist_trim)
                rect[1] += trim
                rect[3] -= trim
        missing = [key for key in PARTS[:14] if key not in parts]
        if missing:
            print(f'ERROR {name}: missing {missing}')
            continue
        configs[name] = dict(atlas='res://' + path.relative_to(ROOT / 'src').as_posix(),
                             regions=parts, profile='dress' if name in DRESSES else 'standing',
                             accessory=ACCESSORIES.get(name, ''), height=1000,
                             pace=0.7 if name == 'don_ciccio' else 1.0,
                             registration=registration(path, parts),
                             sockets=dict(head=[.52,.045], shoulder=[.24,.23],
                                          shoulder_f=[.72,.23]),
                             head_span=160)
        if name in ['guardia','capuano','capitano','taddeo']:
            configs[name]['head_span'] = 230  # Height includes the shako, not a larger skull.
        if name == 'custode':
            configs[name]['head_span'] = 220  # Helmet crest above the skull.
        if name == 'nunziatina':
            configs[name]['head_span'] = 195  # Child proportions, not a miniature adult.
        if name == 'violante':
            # The veil extends below the neck; its bottom is not a neck pivot.
            configs[name]['registration']['head']['start'] = [.64,.86]
        if name == 'mariella':
            configs[name]['profile'] = 'seated'
            configs[name]['regions']['accessory'] = parts.pop('extra')
        if name == 'spettro':
            configs[name]['profile'] = 'insect'
        if name == 'bianca':
            configs[name]['sockets']['shoulder'] = [.40,.19]
        if name == 'gregorio':
            configs[name]['profile'] = 'kneeling'
            configs[name]['height'] = 850
        if name == 'assunta':
            configs[name]['companion'] = dict(character='nunziatina',height=.53,offset=[.28,0])
        if name in ['elsa','carmela','agnese','lia','madre']:
            configs[name]['rest_pose'] = dict(shoulder=-35,elbow=-55,wrist=0,
                                            shoulder_f=-18,elbow_f=-62)
        if name == 'madre' and 'extra' in parts:
            configs[name]['regions']['accessory'] = parts['extra']
        if name == 'statua' and 'extra' in parts:
            configs[name]['extra'] = 'pedestal'
            configs[name]['profile'] = 'statue'
            configs[name]['ground_offset'] = -230
            configs[name]['height'] = 1230
        if name == 'custode' and 'extra' in parts:
            configs[name]['extra'] = 'cloak'
        if name == 'ratking':
            configs[name]['extra'] = 'rat_tail'
        if name in ['guardia','taddeo','capitano','custode']:
            configs[name]['weapon'] = True
        print(name, len(parts))
    for alias, source in ALIASES.items():
        if source in configs:
            configs[alias] = configs[source]
    target = ROOT / 'src/data/npc_puppets.json'
    target.write_text(json.dumps(configs, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    cutouts = ROOT / 'src/data/npc_cutouts.json'
    old = json.loads(cutouts.read_text(encoding='utf8'))
    for key in old:
        if key in configs:
            old[key]['puppet'] = key
    cutouts.write_text(json.dumps(old, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    return configs


if __name__ == '__main__':
    build()
