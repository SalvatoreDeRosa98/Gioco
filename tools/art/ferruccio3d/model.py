# Ferruccio 3D - Modello rifinito fedele all'illustrazione originale
import math, sys
from pathlib import Path
import bpy, bmesh
from mathutils import Vector, Quaternion, Matrix

COL = {
    "tunica": "#e6e2da",
    "cappello": "#ebe6dc",
    "calzoni": "#e0dbd0",
    "calze": "#cfcac0",
    "scarpe": "#1c1b1f",
    "testa": "#121115",
    "maschera": "#1a1920",
    "occhio": "#a8ecff",
    "sciarpa": "#982e25",
    "cintura": "#222026",
    "fibbia": "#bfa058",
    "bordo_maschera": "#4e4438",
    "lama": "#e4eaf0",
    "elsa": "#36322e",
    "mano": "#1e1d22",
}

BONES = {
    "root": ((0, 0, 0), (0, 0, 0.25), None),
    "hips": ((0, 0, 0.56), (0, 0, 0.80), "root"),
    "spine": ((0, 0, 0.80), (0.01, 0, 1.12), "hips"),
    "chest": ((0.01, 0, 1.12), (0.02, 0, 1.40), "spine"),
    "neck": ((0.02, 0, 1.40), (0.03, 0, 1.50), "chest"),
    "head": ((0.03, 0, 1.50), (0.03, 0, 1.80), "neck"),
    "hat": ((-0.04, 0, 1.70), (-0.14, 0, 1.86), "head"),
    "hat_tip": ((-0.14, 0, 1.86), (-0.40, 0, 1.94), "hat"),
    "scarf": ((-0.06, 0, 1.38), (-0.35, 0, 1.05), "chest"),
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

for name in ("thigh.L", "shin.L", "foot.L"):
    head, tail, parent = BONES[name]
    BONES[name] = ((head[0] + 0.13, head[1], head[2]), (tail[0] + 0.13, tail[1], tail[2]), parent)

BONES["hammer"] = ((0.04, -0.19, 0.80), (0.60, -0.19, 0.80), "hand.R")
BONES["sword"] = ((0.04, -0.19, 0.80), (0.60, -0.19, 0.80), "hand.R")

def hex_rgb(h):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb)

def _frame(t):
    ref = Vector((0, 1, 0)) if abs(t.y) < 0.9 else Vector((1, 0, 0))
    u = t.cross(ref).normalized()
    v = t.cross(u).normalized()
    return u, v

def tube(name, pts, radii, seg=20, squash=(1.0, 1.0), wobble=0.0, wobble_n=7, cap_start=True, cap_end=True):
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

def build_parts():
    parts = []
    # 1. TUNICA
    zs = [1.40, 1.28, 1.15, 1.00, 0.95, 0.80, 0.65, 0.50]
    rs = [0.10, 0.165, 0.175, 0.165, 0.175, 0.215, 0.25, 0.275]
    tun = tube("tunica", [(0.01, 0, z) for z in zs], rs, seg=32, squash=(1.0, 0.84), wobble=0.08, wobble_n=8, cap_end=False)
    def tunic_w(co):
        drop = max(0.0, min(1.0, (0.98 - co.z) / 0.45))
        if drop <= 0:
            return {"chest": 1.0} if co.z > 1.12 else {"spine": 1.0}
        side = "skirt_f" if co.x >= 0 else "skirt_b"
        frac = min(1.0, abs(co.x) / 0.12)
        return {"hips": 1.0 - drop * frac, side: drop * frac}
    parts.append((tun, "tunica", tunic_w))

    # Cintura e fibbia
    parts.append((tube("cintura", [(0.01, 0, 0.94), (0.01, 0, 1.0)], [0.178, 0.178], seg=32, squash=(1.0, 0.85)), "cintura", "spine"))
    parts.append((box("fibbia", (0.185, 0, 0.97), (0.025, 0.055, 0.05)), "fibbia", "spine"))

    # 2. TESTA E COLLO
    parts.append((blob("testa", (0.03, 0, 1.58), (0.135, 0.125, 0.145)), "testa", "head"))
    parts.append((tube("collo", [(0.015, 0, 1.38), (0.025, 0, 1.48)], [0.065, 0.062], seg=16), "testa", "neck"))

    # Maschera e becco
    parts.append((blob("maschera", (0.095, 0, 1.61), (0.105, 0.13, 0.075)), "maschera", "head"))
    beak_pts = [(0.17, 0, 1.62), (0.25, 0, 1.60), (0.32, 0, 1.55), (0.37, 0, 1.48), (0.39, 0, 1.42)]
    beak_radii = [0.044, 0.034, 0.022, 0.011, 0.003]
    parts.append((tube("becco", beak_pts, beak_radii, seg=16, squash=(1.0, 0.7)), "maschera", "head"))

    # Occhiale
    for side, y in (("R", -0.095), ("L", 0.095)):
        parts.append((blob(f"bordo_occhio.{side}", (0.155, y * 1.35, 1.625), (0.052, 0.040, 0.065)), "bordo_maschera", "head"))
        parts.append((blob(f"occhio.{side}", (0.160, y * 1.40, 1.625), (0.038, 0.035, 0.048)), "occhio", "head"))

    # Cinghia maschera
    ring = [(-0.06, -0.11, 1.58), (0.04, -0.12, 1.60), (0.14, -0.12, 1.625)]
    parts.append((tube("cinghia", ring, [0.008, 0.008, 0.008], seg=8), "cintura", "head"))

    # 3. CAPPELLO
    parts.append((tube("risvolto", [(0.05, 0, 1.68), (0.01, 0, 1.74)], [0.208, 0.205], seg=36, squash=(1.0, 0.86), wobble=0.03), "cappello", "head"))
    hat_pts = [
        (0.01, 0, 1.72),
        (-0.035, 0, 1.83),
        (-0.11, 0, 1.97),
        (-0.21, 0, 2.11),
        (-0.32, 0, 2.20),
        (-0.43, 0, 2.16),
        (-0.53, 0, 2.05),
        (-0.58, 0, 1.95),
    ]
    hat_radii = [0.20, 0.18, 0.15, 0.12, 0.085, 0.055, 0.030, 0.008]
    def hat_w(co):
        k = max(0.0, min(1.0, (co.z - 1.85) / 0.35))
        return {"head": 1.0 - k, "hat_tip": k}
    parts.append((tube("cappello_piegato", hat_pts, hat_radii, seg=32, squash=(1.0, 0.85), wobble=0.06, wobble_n=6), "cappello", hat_w))

    # 4. SCIARPA (fluida, avvolgente, knot e code posteriori)
    parts.append((tube("sciarpa_collo", [(0.02, 0, 1.34), (0.02, 0, 1.44)], [0.125, 0.11], seg=24, wobble=0.06, wobble_n=5), "sciarpa", "chest"))
    parts.append((blob("nodo", (0.12, -0.03, 1.37), (0.055, 0.055, 0.05)), "sciarpa", "chest"))
    parts.append((tube("piega_nodo", [(0.12, -0.03, 1.35), (0.13, -0.04, 1.25), (0.14, -0.04, 1.15)], [0.035, 0.045, 0.025], seg=10, squash=(1.0, 0.3)), "sciarpa", "chest"))

    tail1_pts = [
        (-0.05, -0.02, 1.38),
        (-0.16, -0.02, 1.33),
        (-0.28, -0.03, 1.20),
        (-0.40, -0.03, 1.02),
        (-0.52, -0.04, 0.80),
        (-0.62, -0.04, 0.58),
        (-0.70, -0.04, 0.38),
    ]
    tail1_radii = [0.06, 0.075, 0.09, 0.11, 0.125, 0.135, 0.14]
    def scarf_w(co):
        k = max(0.0, min(1.0, (-co.x - 0.05) / 0.25))
        return {"chest": 1.0 - k, "scarf": k}
    parts.append((tube("sciarpa_coda1", tail1_pts, tail1_radii, seg=16, squash=(1.0, 0.22), wobble=0.04), "sciarpa", scarf_w))

    tail2_pts = [
        (-0.04, 0.03, 1.35),
        (-0.14, 0.03, 1.26),
        (-0.24, 0.03, 1.10),
        (-0.35, 0.03, 0.90),
        (-0.46, 0.03, 0.68),
        (-0.54, 0.03, 0.48),
    ]
    tail2_radii = [0.055, 0.07, 0.085, 0.10, 0.115, 0.12]
    parts.append((tube("sciarpa_coda2", tail2_pts, tail2_radii, seg=16, squash=(1.0, 0.22), wobble=0.04), "sciarpa", scarf_w))

    # 5. BRACCIA (continue e sovrapposte)
    for side, y in (("R", -0.17), ("L", 0.17)):
        yy = y * 1.12
        parts.append((tube(f"manica.{side}", [(0.0, y, 1.36), (0.0, y * 1.05, 1.28), (0.015, y * 1.1, 1.18), (0.02, yy, 1.04)],
                           [0.085, 0.11, 0.095, 0.075], seg=18, wobble=0.04), "tunica", f"upperarm.{side}"))
        parts.append((tube(f"avambraccio.{side}", [(0.02, yy, 1.12), (0.025, yy, 1.00), (0.03, yy, 0.90), (0.035, yy, 0.85)],
                           [0.072, 0.082, 0.070, 0.052], seg=18, wobble=0.03), "tunica", f"forearm.{side}"))
        parts.append((tube(f"polsino.{side}", [(0.035, yy, 0.86), (0.037, yy, 0.83)], [0.056, 0.054], seg=16), "tunica", f"forearm.{side}"))
        parts.append((blob(f"pugno.{side}", (0.042, yy, 0.80), (0.042, 0.040, 0.052)), "mano", f"hand.{side}"))

        # 6. GAMBE (senza fessure)
        ly = y * 0.6
        parts.append((tube(f"calzone.{side}", [(0.0, ly, 0.58), (0.0, ly, 0.46), (0.0, ly, 0.34), (0.0, ly, 0.23)],
                           [0.088, 0.102, 0.092, 0.068], seg=18, wobble=0.04), "calzoni", f"thigh.{side}"))
        parts.append((tube(f"calza.{side}", [(0.0, ly, 0.32), (0.0, ly, 0.20), (0.0, ly, 0.07)],
                           [0.054, 0.050, 0.044], seg=16), "calze", f"shin.{side}"))
        shoe_pts = [(-0.06, ly, 0.05), (0.03, ly, 0.05), (0.11, ly, 0.04), (0.16, ly, 0.03)]
        parts.append((tube(f"scarpa.{side}", shoe_pts, [0.046, 0.052, 0.044, 0.024], seg=16, squash=(0.75, 1.0)), "scarpe", f"foot.{side}"))
        parts.append((box(f"fibbia_scarpa.{side}", (0.06, ly, 0.07), (0.02, 0.035, 0.015)), "fibbia", f"foot.{side}"))

    # 7. SPADA (Stocco italiano proporzionato, elegante e tagliente)
    y = -0.19
    blade_pts = [(0.08, y, 0.80), (0.35, y, 0.80), (0.62, y, 0.80), (0.76, y, 0.80), (0.80, y, 0.80)]
    blade_radii = [0.028, 0.024, 0.018, 0.009, 0.001]
    parts.append((tube("lama", blade_pts, blade_radii, seg=4, squash=(1.0, 0.20)), "lama", "sword"))

    parts.append((box("guardia_centro", (0.08, y, 0.80), (0.025, 0.032, 0.032)), "elsa", "sword"))
    guard_pts = [(0.085, y, 0.72), (0.08, y, 0.76), (0.08, y, 0.84), (0.085, y, 0.88)]
    parts.append((tube("guardia_bracci", guard_pts, [0.012, 0.014, 0.014, 0.012], seg=10), "elsa", "sword"))
    parts.append((blob("guardia_pomello_sup", (0.087, y, 0.885), (0.014, 0.014, 0.014)), "elsa", "sword"))
    parts.append((blob("guardia_pomello_inf", (0.087, y, 0.715), (0.014, 0.014, 0.014)), "elsa", "sword"))

    parts.append((tube("impugnatura", [(-0.01, y, 0.80), (0.075, y, 0.80)], [0.016, 0.016], seg=10), "elsa", "sword"))
    parts.append((blob("pomolo", (-0.025, y, 0.80), (0.025, 0.025, 0.025)), "elsa", "sword"))

    parts.append((tube("manico_martello", [(0.04, y, 0.8), (0.53, y, 0.8)], [0.024, 0.022], seg=12), "elsa", "hammer"))
    parts.append((box("testa_martello", (0.54, y, 0.8), (0.17, 0.12, 0.25)), "lama", "hammer"))

    for ob, col, weight in parts:
        if ob.name.endswith(".L") and any(ob.name.startswith(k) for k in ("calzone", "calza", "scarpa")):
            for vertex in ob.data.vertices: vertex.co.x += 0.13

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
        uv_layer = ob.data.uv_layers.new(name="Projected")
        for poly in ob.data.polygons:
            for loop_index in poly.loop_indices:
                v_idx = ob.data.loops[loop_index].vertex_index
                co = ob.data.vertices[v_idx].co
                u = (co.x - (-0.4)) / 1.1
                v = (co.z - 0.0) / 2.0
                uv_layer.data[loop_index].uv = (u, v)
        if col in ("lama", "elsa", "fibbia"):
            crease = ob.data.attributes.new("crease_edge", "FLOAT", "EDGE")
            for edge in crease.data: edge.value = 0.85
        groups = {}
        for vtx in ob.data.vertices:
            ws = weight(vtx.co) if callable(weight) else {weight: 1.0}
            for bone, w in ws.items():
                if w <= 0: continue
                if bone not in groups:
                    groups[bone] = ob.vertex_groups.new(name=bone)
                groups[bone].add([vtx.index], w, "REPLACE")
        meshes.append(ob)
    bpy.ops.object.select_all(action="DESELECT")
    for ob in meshes: ob.select_set(True)
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
