"""Gatto nero 3D: mesh e armatura. Stesse primitive (tube, blob) e stesso shader di Ferruccio,
così i due personaggi condividono luce, contorno e scala in pixel (look.RES / look.ORTHO).

Unità: 1 unità = stessa scala di Ferruccio (figura ~1,95). Il gatto guarda a destra, come il riferimento 2D
src/assets/art/enemies/gatto.png. Le ossa ruotano nel piano laterale (asse Y del mondo), come in anims.py.
"""
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "ferruccio3d"))
import model as shared  # tube, blob, hex_rgb: primitive condivise con Ferruccio

# "pelo" è chiaro di proposito: lo shader moltiplica la luce per questo colore e il dipinto
# (src/assets/art/enemies/gatto.png) fa il resto. Un base nero annerisce anche i dettagli.
COL = {
    "pelo": "#d8d6e0",
    "occhio": "#b9a6ff",
}

# Ossa: (testa, coda, genitore). Lato a = y positivo, lato b = y negativo.
BONES = {
    "root": ((0, 0, 0), (0, 0, 0.1), None),
    "hips": ((-0.42, 0, 0.90), (-0.05, 0, 1.00), "root"),
    "chest": ((-0.05, 0, 1.00), (0.36, 0, 0.96), "hips"),
    "neck": ((0.36, 0, 0.96), (0.55, 0, 1.12), "chest"),
    "head": ((0.55, 0, 1.12), (0.72, 0, 1.22), "neck"),
    "tail1": ((-0.42, 0, 0.90), (-0.70, 0, 0.86), "hips"),
    "tail2": ((-0.70, 0, 0.86), (-0.92, 0, 0.90), "tail1"),
    "tail3": ((-0.92, 0, 0.90), (-1.02, 0, 1.05), "tail2"),
    "tail4": ((-1.02, 0, 1.05), (-0.98, 0, 1.22), "tail3"),
}
for side, y in (("a", 0.10), ("b", -0.10)):
    BONES[f"fore_up.{side}"] = ((0.30, y, 0.92), (0.33, y, 0.52), "chest")
    # Niente ossa per il piede: sarebbero ferme mentre lo stinco ruota, e il piede resterebbe indietro.
    BONES[f"fore_lo.{side}"] = ((0.33, y, 0.52), (0.36, y, 0.10), f"fore_up.{side}")
    BONES[f"hind_up.{side}"] = ((-0.38, y, 0.94), (-0.34, y, 0.48), "hips")
    BONES[f"hind_lo.{side}"] = ((-0.34, y, 0.48), (-0.48, y, 0.12), f"hind_up.{side}")

SOFT = 0.14  # raggio (unità) della sfumatura dei pesi attorno a ogni osso

# Il dipinto di riferimento (src/assets/art/enemies/gatto.png) è proiettato dal lato, come la camera:
# la figura a riposo mostra il dipinto così com'è. Il riquadro è la figura a riposo (x, z).
TEX_PATH = Path(__file__).resolve().parents[3] / "src/assets/art/enemies/gatto.png"
TEX_BOX = (-1.10, 0.95, -0.02, 1.50)  # x0, x1, z0, z1


def _seg_dist(p, a, b):
    ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-9)))
    return (p - (a + ab * t)).length


def soft_weights(co):
    """Pesi morbidi tra le ossa vicine: le giunture non hanno cuciture nette."""
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


def fur_texture(out_dir):
    """Copia del dipinto con il trasparente riempito di pelo scuro: i pixel vuoti non diventano bianchi
    sulle parti che il dipinto non copre (coda, zampe, orecchie)."""
    from PIL import Image
    src = Image.open(TEX_PATH).convert("RGBA")
    fill = Image.new("RGBA", src.size, (24, 22, 32, 255))
    fill.alpha_composite(src)
    dst = Path(out_dir) / "gatto_tex.png"
    fill.convert("RGB").save(dst)
    return dst


def build_parts():
    parts = []

    def add(ob, col):
        parts.append((ob, col))

    # Corpo arcuato, schiena alta a metà e coda bassa (come il riferimento).
    # Schiena arcuata: il punto più alto è sopra le anche, la pancia si abbassa verso il petto.
    add(shared.tube("torso", [(-0.44, 0, 0.92), (-0.22, 0, 1.00), (0.04, 0, 1.03), (0.30, 0, 0.98)],
                    [0.14, 0.18, 0.18, 0.14], seg=28, squash=(1.0, 0.85), wobble=0.10, wobble_n=9),
        "pelo")
    add(shared.tube("collo", [(0.30, 0, 0.96), (0.44, 0, 1.04), (0.56, 0, 1.14)],
                    [0.12, 0.10, 0.09], seg=20, wobble=0.08, wobble_n=7), "pelo")
    add(shared.blob("testa", (0.66, 0, 1.18), (0.19, 0.14, 0.16)), "pelo")
    add(shared.blob("muso", (0.82, 0, 1.13), (0.09, 0.07, 0.07)), "pelo")
    add(shared.tube("orecchio_a", [(0.60, 0.07, 1.26), (0.57, 0.07, 1.46)], [0.085, 0.005], seg=12), "pelo")
    add(shared.tube("orecchio_b", [(0.66, -0.07, 1.26), (0.63, -0.07, 1.46)], [0.085, 0.005], seg=12), "pelo")
    add(shared.blob("occhio", (0.84, -0.08, 1.17), (0.035, 0.02, 0.035)), "occhio")

    tail = shared.tube("coda", [(-0.42, 0, 0.90), (-0.70, 0, 0.86), (-0.92, 0, 0.90), (-1.02, 0, 1.05), (-0.98, 0, 1.22)],
                       [0.08, 0.065, 0.05, 0.04, 0.02], seg=16, wobble=0.14, wobble_n=6)
    add(tail, "pelo")

    # Zampe: il tubo arriva fino al piede, così non restano palline staccate.
    # Il piede è la punta della zampa: stessa mesh, quindi segue lo stinco quando ruota.
    for side, y in (("a", 0.10), ("b", -0.10)):
        add(shared.tube(f"zampa_ant_{side}", [(0.30, y, 0.92), (0.33, y, 0.52), (0.36, y, 0.10), (0.40, y, 0.03)],
                        [0.08, 0.058, 0.045, 0.045], seg=14), "pelo")
        add(shared.tube(f"zampa_post_{side}", [(-0.38, y, 0.94), (-0.34, y, 0.48), (-0.48, y, 0.12), (-0.44, y, 0.03)],
                        [0.11, 0.065, 0.05, 0.05], seg=14), "pelo")
    return parts


def build_armature():
    arm_data = bpy.data.armatures.new("GattoRig")
    arm = bpy.data.objects.new("Gatto", arm_data)
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


def build(out_path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    arm = build_armature()
    parts = build_parts()
    mats = {}
    for _, col in parts:
        if col not in mats:
            m = bpy.data.materials.new(col)
            m["base"] = shared.hex_rgb(COL[col])
            if col == "pelo":
                m["texture"] = str(fur_texture(Path(out_path).parent))
                m["tex_mix"] = 1.0  # il dipinto è il colore, la luce toon lo modula
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
    build(argv[0] if argv else "gatto.blend")
