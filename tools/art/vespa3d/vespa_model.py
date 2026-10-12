"""Vespa meccanica 3D: mesh e armatura. Stessa scala di Ferruccio (1 unità ~ 400 px del dipinto di riferimento).

Il dipinto src/assets/art/enemies/vespa.png (655×768) è proiettato dal lato, come la camera:
px = 330 + 400·x, py = 768 − 400·z. Le ali sono lame nel piano della camera: sbatterle è ruotarle attorno a Y.
"""
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "ferruccio3d"))
import model as shared  # tube, blob, hex_rgb: primitive condivise con Ferruccio

COL = {
    "corpo": "#e4e0d6",   # base neutro: il dipinto dà oro e nero
    "ala": "#d8e6f0",
    "occhio": "#c81e1e",  # rosso scuro: lo shader emissivo lo schiarisce
}

TEX_PATH = Path(__file__).resolve().parents[3] / "src/assets/art/enemies/vespa.png"
TEX_BOX = (-0.825, 0.8125, 0.0, 1.92)  # x0, x1, z0, z1 del riquadro del dipinto
TEX_FILL = (30, 24, 14)  # pixel trasparenti del dipinto: scuro, non bianco

BONES = {
    "root": ((0.0, 0, 1.10), (0.0, 0, 1.20), None),
    "thorax": ((0.00, 0, 1.12), (0.25, 0, 1.14), "root"),
    "head": ((0.25, 0, 1.14), (0.48, 0, 1.18), "thorax"),
    "abdomen": ((-0.05, 0, 1.08), (-0.32, 0, 0.80), "root"),
    "stinger": ((-0.32, 0, 0.80), (-0.06, 0, 0.08), "abdomen"),
}
for side, y in (("a", 0.06), ("b", -0.06)):
    # Ali: la anteriore grande verso l'alto-indietro, la posteriore più corta.
    BONES[f"wing_f.{side}"] = ((0.04, y, 1.30), (-0.74, y, 1.84), "thorax")
    BONES[f"wing_h.{side}"] = ((0.00, y, 1.26), (-0.22, y, 1.86), "thorax")

SOFT = 0.12


def _seg_dist(p, a, b):
    ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-9)))
    return (p - (a + ab * t)).length


def soft_weights(co):
    ws = {}
    for name, (h, t, _) in BONES.items():
        if name == "root":
            continue
        d = _seg_dist(co, Vector(h), Vector(t))
        w = max(0.0, 1.0 - d / SOFT) ** 2
        if w > 0:
            ws[name] = w
    if not ws:
        nearest = min(BONES, key=lambda n: _seg_dist(co, Vector(BONES[n][0]), Vector(BONES[n][1])))
        return {nearest: 1.0}
    total = sum(ws.values())
    return {k: v / total for k, v in ws.items()}


def _blade(name, a, b, width):
    """Lama piatta da a a b, nel piano XZ, larga `width` (ala)."""
    a, b = Vector(a), Vector(b)
    mid = (a + b) * 0.5
    d = b - a
    half = d.length * 0.5
    ob = shared.blob(name, (0, 0, 0), (half, 0.012, width * 0.5), seg=16, rings=10)
    theta = math.atan2(-d.z, d.x)
    ob.data.transform(Matrix.Translation(mid) @ Matrix.Rotation(theta, 4, "Y"))
    return ob


def build_parts():
    parts = []

    def add(ob, col):
        parts.append((ob, col))

    # Torace compatto, testa grande con occhi rossi a sfera, come il riferimento.
    add(shared.blob("torace", (0.10, 0, 1.13), (0.22, 0.15, 0.17), seg=24, rings=14), "corpo")
    add(shared.blob("testa", (0.44, 0, 1.17), (0.17, 0.14, 0.15), seg=24, rings=14), "corpo")
    add(shared.blob("occhio_a", (0.46, -0.10, 1.20), (0.11, 0.07, 0.11), seg=16, rings=10), "occhio")
    add(shared.blob("occhio_b", (0.46, 0.09, 1.20), (0.11, 0.07, 0.11), seg=16, rings=10), "occhio")

    # Addome segmentato che scende e si assottiglia, pungiglione scuro in fondo.
    add(shared.tube("addome", [(-0.05, 0, 1.08), (-0.32, 0, 0.84), (-0.30, 0, 0.46), (-0.08, 0, 0.10)],
                    [0.20, 0.20, 0.14, 0.04], seg=28, wobble=0.02, wobble_n=5), "corpo")
    add(shared.tube("pungiglione", [(-0.30, 0, 0.46), (-0.18, 0, 0.22), (-0.06, 0, 0.06)],
                    [0.05, 0.03, 0.005], seg=12), "corpo")

    # Antenne ricurve in avanti.
    add(shared.tube("antenna_a", [(0.48, -0.04, 1.26), (0.56, -0.04, 1.36), (0.66, -0.04, 1.34)],
                    [0.018, 0.012, 0.006], seg=8), "corpo")
    add(shared.tube("antenna_b", [(0.48, 0.04, 1.26), (0.57, 0.04, 1.36), (0.67, 0.04, 1.32)],
                    [0.018, 0.012, 0.006], seg=8), "corpo")

    # Tre paia di zampe che pendono dal torace.
    for side, y in (("a", 0.07), ("b", -0.07)):
        add(shared.tube(f"zampa_1_{side}", [(0.22, y, 1.02), (0.34, y, 0.80), (0.36, y, 0.62)],
                        [0.03, 0.022, 0.012], seg=8), "corpo")
        add(shared.tube(f"zampa_2_{side}", [(0.10, y, 1.04), (0.17, y, 0.78), (0.18, y, 0.60)],
                        [0.03, 0.022, 0.012], seg=8), "corpo")
        add(shared.tube(f"zampa_3_{side}", [(-0.02, y, 1.05), (0.00, y, 0.80), (0.00, y, 0.60)],
                        [0.03, 0.022, 0.012], seg=8), "corpo")

    # Ali: due per lato, lame trasparenti nel piano della camera.
    for side, y in (("a", 0.06), ("b", -0.06)):
        add(_blade(f"ala_f_{side}", BONES[f"wing_f.{side}"][0], BONES[f"wing_f.{side}"][1], 0.20), "ala")
        add(_blade(f"ala_h_{side}", BONES[f"wing_h.{side}"][0], BONES[f"wing_h.{side}"][1], 0.14), "ala")
    return parts


def build_armature():
    arm_data = bpy.data.armatures.new("VespaRig")
    arm = bpy.data.objects.new("Vespa", arm_data)
    bpy.context.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    for name, (head, tail, _) in BONES.items():
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


def fill_texture(out_dir):
    from PIL import Image
    src = Image.open(TEX_PATH).convert("RGBA")
    fill = Image.new("RGBA", src.size, TEX_FILL + (255,))
    fill.alpha_composite(src)
    dst = Path(out_dir) / "vespa_tex.png"
    fill.convert("RGB").save(dst)
    return dst


def build(out_path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    arm = build_armature()
    parts = build_parts()
    tex = fill_texture(Path(out_path).parent)
    mats = {}
    for _, col in parts:
        if col not in mats:
            m = bpy.data.materials.new(col)
            m["base"] = shared.hex_rgb(COL[col])
            if col in ("corpo", "ala"):
                m["texture"] = str(tex)
                m["tex_mix"] = 1.0
            mats[col] = m
    x0, x1, z0, z1 = TEX_BOX
    meshes = []
    for ob, col in parts:
        ob.data.materials.append(mats[col])
        uv_layer = ob.data.uv_layers.new(name="Projected")
        for loop in ob.data.loops:
            co = ob.data.vertices[loop.vertex_index].co
            uv_layer.data[loop.index].uv = ((co.x - x0) / (x1 - x0), (co.z - z0) / (z1 - z0))
        groups = {}
        for vtx in ob.data.vertices:
            for bone, w in soft_weights(vtx.co).items():
                if bone not in groups:
                    groups[bone] = ob.vertex_groups.new(name=bone)
                groups[bone].add([vtx.index], w, "REPLACE")
        meshes.append(ob)
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
    build(argv[0] if argv else "vespa.blend")
