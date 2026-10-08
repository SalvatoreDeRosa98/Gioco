"""Ferruccio in 3D: modello stilizzato e scheletro costruiti da codice (Blender 5.2 come libreria bpy).

Il personaggio guarda verso +X, Z è l'alto, la telecamera del render sta in -Y (vista laterale).
Ogni pezzo è un tubo o un ellissoide legato rigidamente a un osso, tranne la tunica, che si
piega con le due ossa della gonna, e la sciarpa, che segue l'osso della coda.

Proporzioni prese da assets/art/characters/ferruccio_rig/figura.png (1 px della tela ≈ 0.002 unità).

Uso: python model.py OUT.blend
"""
import math
import sys

import bpy
import bmesh
from mathutils import Vector, Matrix

# ---------------------------------------------------------------- Colori (sRGB)
COL = {
    "tunica": "#dcd8cf",
    "cappello": "#e6e2da",
    "calzoni": "#d6d2c9",
    "calze": "#cfc9bb",
    "scarpe": "#1b1a1c",
    "testa": "#121114",
    "maschera": "#1f1e24",
    "occhio": "#a6e6ff",
    "sciarpa": "#8e2f26",
    "cintura": "#1c1b1d",
    "fibbia": "#9a9590",
    "bordo_maschera": "#554d41",
    "lama": "#c9ced3",
    "elsa": "#3a332c",
    "mano": "#2a2523",
}

# ---------------------------------------------------------------- Scheletro
# nome: (testa, coda, genitore). Coordinate nello spazio dell'armatura (X avanti, Z su).
BONES = {
    "root": ((0, 0, 0), (0, 0, 0.25), None),
    "hips": ((0, 0, 0.56), (0, 0, 0.80), "root"),
    "spine": ((0, 0, 0.80), (0.01, 0, 1.12), "hips"),
    "chest": ((0.01, 0, 1.12), (0.02, 0, 1.40), "spine"),
    "neck": ((0.02, 0, 1.40), (0.03, 0, 1.50), "chest"),
    "head": ((0.03, 0, 1.50), (0.03, 0, 1.80), "neck"),
    "hat": ((-0.04, 0, 1.70), (-0.14, 0, 1.86), "head"),
    "hat_tip": ((-0.14, 0, 1.86), (-0.40, 0, 1.94), "hat"),
    "scarf": ((0.02, 0, 1.38), (0.05, 0, 1.12), "chest"),
    "skirt_f": ((0.04, 0, 1.00), (0.20, 0, 0.50), "hips"),
    "skirt_b": ((-0.04, 0, 1.00), (-0.20, 0, 0.50), "hips"),
}
for side, y in (("R", -0.17), ("L", 0.17)):
    BONES[f"upperarm.{side}"] = ((0.0, y, 1.33), (0.02, y * 1.12, 1.08), "chest")
    BONES[f"forearm.{side}"] = ((0.02, y * 1.12, 1.08), (0.03, y * 1.12, 0.85), f"upperarm.{side}")
    BONES[f"hand.{side}"] = ((0.03, y * 1.12, 0.85), (0.04, y * 1.12, 0.76), f"forearm.{side}")
    ly = y * 0.6
    BONES[f"thigh.{side}"] = ((0.0, ly, 0.56), (0.0, ly, 0.29), "hips")
    BONES[f"shin.{side}"] = ((0.0, ly, 0.29), (0.0, ly, 0.075), f"thigh.{side}")
    BONES[f"foot.{side}"] = ((0.0, ly, 0.075), (0.13, ly, 0.03), f"shin.{side}")
for name in ("thigh.L","shin.L","foot.L"):
    head,tail,parent=BONES[name]
    BONES[name]=((head[0]+.13,head[1],head[2]),(tail[0]+.13,tail[1],tail[2]),parent)
BONES["hammer"] = ((0.04, -0.19, 0.80), (0.60, -0.19, 0.80), "hand.R")
BONES["sword"] = ((0.04, -0.19, 0.80), (0.60, -0.19, 0.80), "hand.R")


def hex_rgb(h):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb)


# ---------------------------------------------------------------- Geometria
def _frame(t):
    """Due assi perpendicolari alla direzione t, stabili per tubi quasi verticali o orizzontali."""
    ref = Vector((0, 1, 0)) if abs(t.y) < 0.9 else Vector((1, 0, 0))
    u = t.cross(ref).normalized()
    v = t.cross(u).normalized()
    return u, v


def tube(name, pts, radii, seg=20, squash=(1.0, 1.0), wobble=0.0, wobble_n=7, cap_start=True, cap_end=True):
    """Mesh a tubo lungo una polilinea; radii per punto, squash schiaccia la sezione (u, v)."""
    pts = [Vector(p) for p in pts]
    bm = bmesh.new()
    rings = []
    u_prev = None
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        u, v = _frame(t)
        if u_prev is not None and u.dot(u_prev) < 0:
            u, v = -u, -v
        u_prev = u
        ring = []
        for k in range(seg):
            a = 2 * math.pi * k / seg
            r = radii[i] * (1.0 + wobble * math.sin(a * wobble_n + i * 0.7))
            off = u * math.cos(a) * r * squash[0] + v * math.sin(a) * r * squash[1]
            ring.append(bm.verts.new(p + off))
        rings.append(ring)
    for i in range(len(rings) - 1):
        for k in range(seg):
            a, b = rings[i][k], rings[i][(k + 1) % seg]
            c, d = rings[i + 1][(k + 1) % seg], rings[i + 1][k]
            bm.faces.new((a, b, c, d))
    if cap_start:
        bm.faces.new(list(reversed(rings[0])))
    if cap_end:
        bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    for poly in me.polygons:
        poly.use_smooth = True
    return ob


def blob(name, center, size, seg=24, rings=14):
    """Ellissoide (testa, mani, fibbia...)."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1.0)
    for vtx in bm.verts:
        vtx.co = Vector((vtx.co.x * size[0], vtx.co.y * size[1], vtx.co.z * size[2])) + Vector(center)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    for poly in me.polygons:
        poly.use_smooth = True
    return ob


def box(name, center, size):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for vtx in bm.verts:
        vtx.co = Vector((vtx.co.x * size[0], vtx.co.y * size[1], vtx.co.z * size[2])) + Vector(center)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob


def lerp(a, b, t):
    return a + (b - a) * t


# ---------------------------------------------------------------- Pezzi
def build_parts():
    """Restituisce [(oggetto, colore, peso)] dove peso è un osso o una funzione(vertice)->{osso: w}."""
    parts = []

    # Tunica: campana larga, pieghe leggere, orlo all'altezza del ginocchio.
    zs = [1.40, 1.30, 1.15, 1.00, 0.95, 0.80, 0.65, 0.50]
    rs = [0.10, 0.17, 0.18, 0.165, 0.17, 0.21, 0.245, 0.27]
    tun = tube("tunica", [(0.01, 0, z) for z in zs], rs, seg=32, squash=(1.0, 0.82), wobble=0.11, wobble_n=9, cap_end=False)

    def tunic_w(co):
        drop = max(0.0, min(1.0, (0.98 - co.z) / 0.45))
        if drop <= 0:
            return {"chest": 1.0} if co.z > 1.12 else {"spine": 1.0}
        side = "skirt_f" if co.x >= 0 else "skirt_b"
        frac = min(1.0, abs(co.x) / 0.12)
        return {"hips": 1.0 - drop * frac, side: drop * frac}
    parts.append((tun, "tunica", tunic_w))

    # Cintura e fibbia.
    parts.append((tube("cintura", [(0.01, 0, 0.94), (0.01, 0, 1.0)], [0.178, 0.178], seg=32, squash=(1.0, 0.84)), "cintura", "spine"))
    parts.append((box("fibbia", (0.185, 0, 0.97), (0.03, 0.05, 0.05)), "fibbia", "spine"))

    # Testa scura e collo.
    parts.append((blob("testa", (0.04, 0, 1.60), (0.155, 0.14, 0.165)), "testa", "head"))
    parts.append((tube("collo", [(0.02, 0, 1.38), (0.03, 0, 1.50)], [0.07, 0.07]), "testa", "neck"))

    # Maschera: mezza conchiglia sulla parte alta del viso, becco curvo in avanti.
    mask = blob("maschera", (0.10, 0, 1.635), (0.115, 0.135, 0.07))
    parts.append((mask, "maschera", "head"))
    beak = tube("becco", [(0.19, 0, 1.63), (0.27, 0, 1.60), (0.33, 0, 1.555), (0.35, 0, 1.53)],
                [0.045, 0.034, 0.02, 0.004], seg=14, squash=(1.0, 0.8))
    parts.append((beak, "maschera", "head"))
    for side, y in (("R", -0.085), ("L", 0.085)):
        parts.append((blob(f"bordo_occhio.{side}", (.155, y*1.55, 1.645), (.058,.039,.075)), "maschera", "head"))
        parts.append((blob(f"occhio.{side}", (0.16, y * 1.8, 1.645), (0.035, 0.035, 0.048)), "occhio", "head"))

    eye_ring=[(.155+.057*math.cos(i*math.tau/32),-.151,1.645+.078*math.sin(i*math.tau/32)) for i in range(33)]
    parts.append((tube("bordo_maschera",eye_ring,[.008]*33,seg=8),"bordo_maschera","head"))

    # Cappello continuo: risvolto e piega hanno contatto, senza pezzi sospesi.
    parts.append((tube("risvolto", [(0.05, 0, 1.69), (0.01, 0, 1.75)], [0.215, 0.212], seg=36, squash=(1.0, .88), wobble=.045), "cappello", "head"))
    pts=[(.01,0,1.735),(-.035,0,1.84),(-.13,0,2.04),(-.24,0,2.20),(-.32,0,2.22),(-.45,0,2.12),(-.56,0,2.00)]
    parts.append((tube("cappello_piegato",pts,[.23,.22,.18,.12,.085,.05,.006],seg=32,wobble=.08,wobble_n=6),"cappello","head"))

    # Sciarpa: anello attorno al collo e due code annodate davanti.
    parts.append((tube("sciarpa_collo", [(0.02, 0, 1.36), (0.02, 0, 1.44)], [0.12, 0.10], seg=24, wobble=0.08, wobble_n=5), "sciarpa", "chest"))
    parts.append((blob("nodo", (0.12, -0.04, 1.37), (0.05, 0.05, 0.045)), "sciarpa", "chest"))
    parts.append((tube("coda1", [(0.12, -0.05, 1.36), (0.10, -0.06, 1.02), (0.19, -0.06, 0.17)], [0.07, 0.11, 0.075], seg=12, squash=(1.0, 0.35)), "sciarpa", "scarf"))
    parts.append((tube("coda2", [(0.11, -0.03, 1.36), (0.08, 0.05, 1.09), (0.02, 0.05, 0.73)], [0.06, 0.09, 0.04], seg=12, squash=(1.0, 0.35)), "sciarpa", "scarf"))

    # Braccia: manica a sbuffo, polsino, pugno scuro.
    for side, y in (("R", -0.17), ("L", 0.17)):
        yy = y * 1.12
        parts.append((tube(f"manica.{side}", [(0.0, y, 1.36), (0.0, y * 1.05, 1.28), (0.015, y * 1.1, 1.18), (0.02, yy, 1.07)],
                           [0.08, 0.105, 0.09, 0.065], seg=18, wobble=0.05), "tunica", f"upperarm.{side}"))
        parts.append((tube(f"avambraccio.{side}", [(0.02, yy, 1.09), (0.025, yy, 0.98), (0.03, yy, 0.89), (0.03, yy, 0.86)],
                           [0.062, 0.07, 0.06, 0.05], seg=18, wobble=0.04), "tunica", f"forearm.{side}"))
        parts.append((blob(f"pugno.{side}", (0.04, yy, 0.81), (0.04, 0.038, 0.05)), "mano", f"hand.{side}"))
        ly = y * 0.6
        # Calzoni a sbuffo fino al ginocchio, calza, scarpa.
        parts.append((tube(f"calzone.{side}", [(0.0, ly, 0.58), (0.0, ly, 0.45), (0.0, ly, 0.33), (0.0, ly, 0.27)],
                           [0.085, 0.095, 0.085, 0.06], seg=18, wobble=0.04), "calzoni", f"thigh.{side}"))
        parts.append((tube(f"calza.{side}", [(0.0, ly, 0.30), (0.0, ly, 0.18), (0.0, ly, 0.08)], [0.052, 0.048, 0.043], seg=16), "calze", f"shin.{side}"))
        parts.append((tube(f"scarpa.{side}", [(-0.05, ly, 0.045), (0.03, ly, 0.045), (0.11, ly, 0.035), (0.15, ly, 0.03)],
                           [0.045, 0.05, 0.042, 0.022], seg=16, squash=(0.75, 1.0)), "scarpe", f"foot.{side}"))

    # Spada del fabbro: lama dritta, guardia di ferro battuto, pomolo.
    y = -0.19
    parts.append((tube("lama", [(0.10, y, 0.80), (0.65, y, 0.80), (0.85, y, 0.80)], [0.033, 0.025, 0.002], seg=4, squash=(1.0, 0.25)), "lama", "sword"))
    parts.append((box("guardia", (0.085, y, 0.80), (0.022, 0.03, 0.14)), "elsa", "sword"))
    parts.append((tube("impugnatura", [(-0.02, y, 0.80), (0.08, y, 0.80)], [0.016, 0.016], seg=8), "elsa", "sword"))
    parts.append((blob("pomolo", (-0.03, y, 0.80), (0.022, 0.022, 0.022)), "elsa", "sword"))
    parts.append((tube("manico_martello",[(.04,y,.8),(.53,y,.8)],[.024,.022],seg=12),"elsa","hammer"))
    parts.append((box("testa_martello",(.54,y,.8),(.17,.12,.25)),"lama","hammer"))
    # La gamba lontana è avanzata come nel disegno originale, visibile anche a riposo.
    for ob,col,weight in parts:
        if ob.name.endswith(".L") and any(ob.name.startswith(k) for k in ("calzone","calza","scarpa")):
            for vertex in ob.data.vertices: vertex.co.x += .13
    return parts


def build_armature():
    arm_data = bpy.data.armatures.new("FerruccioRig")
    arm = bpy.data.objects.new("Ferruccio", arm_data)
    bpy.context.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    for name, (head, tail, parent) in BONES.items():
        b = arm_data.edit_bones.new(name)
        b.head, b.tail = Vector(head), Vector(tail)
        if b.length < 1e-4:
            b.tail = b.head + Vector((0, 0, 0.1))
        b.roll = 0.0
    for name, (_, _, parent) in BONES.items():
        if parent:
            arm_data.edit_bones[name].parent = arm_data.edit_bones[parent]
            arm_data.edit_bones[name].use_connect = False
    bpy.ops.object.mode_set(mode="OBJECT")
    return arm


def build(out_path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    arm = build_armature()
    parts = build_parts()
    mats = {}
    for _, col, _ in parts:
        if col not in mats:
            m = bpy.data.materials.new(col)
            m["base"] = hex_rgb(COL[col])
            mats[col] = m
    meshes = []
    for ob, col, weight in parts:
        ob.data.materials.append(mats[col])
        # UV del dipinto originale: pieghe, pigmento e fibre restano riconoscibili
        # sulla superficie 3D, senza ricreare il costume con colori piatti.
        regions={"tunica":(311,375,353,572),"cappello":(200,35,380,180),
                 "calzoni":(315,790,395,862),"calze":(328,900,368,941),
                 "sciarpa":(95,490,240,650),"scarpe":(325,955,397,985)}
        if col in regions:
            x0,y0,x1,y1=regions[col]
            coords=[v.co for v in ob.data.vertices]
            lo_x,hi_x=min(v.x for v in coords),max(v.x for v in coords)
            lo_z,hi_z=min(v.z for v in coords),max(v.z for v in coords)
            uv=ob.data.uv_layers.new(name="Dipinto originale")
            for loop in ob.data.loops:
                co=ob.data.vertices[loop.vertex_index].co
                u=(co.x-lo_x)/max(hi_x-lo_x,.001)
                v=(co.z-lo_z)/max(hi_z-lo_z,.001)
                uv.data[loop.index].uv=((x0+u*(x1-x0))/679,1-(y1-v*(y1-y0))/1024)
        if col in ("lama", "elsa", "fibbia"):
            crease = ob.data.attributes.new("crease_edge", "FLOAT", "EDGE")
            for edge in crease.data: edge.value = 0.85
        groups = {}
        for vtx in ob.data.vertices:
            ws = weight(vtx.co) if callable(weight) else {weight: 1.0}
            for bone, w in ws.items():
                if w <= 0:
                    continue
                if bone not in groups:
                    groups[bone] = ob.vertex_groups.new(name=bone)
                groups[bone].add([vtx.index], w, "REPLACE")
        meshes.append(ob)
    # Un solo oggetto per il render e per l'esportazione.
    bpy.ops.object.select_all(action="DESELECT")
    for ob in meshes:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
    body = bpy.context.view_layer.objects.active
    body.name = "Corpo"
    body.parent = arm
    mod = body.modifiers.new("Armatura", "ARMATURE")
    mod.object = arm
    bpy.ops.wm.save_as_mainfile(filepath=out_path)
    return arm, body


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    build(argv[0] if argv else "ferruccio.blend")
