"""Aspetto dipinto per i fotogrammi di Ferruccio: toon a tre bande con bordi a pennellata,
grana di colore, contorno scuro (scafo invertito) e sfondo trasparente.

Tutto è calcolato nello shader come emissione, così il render Cycles su CPU non dipende da luci
o rimbalzi: la direzione della luce è [LIGHT] e resta fissa per ogni fotogramma.
"""
import math

import bpy
from mathutils import Vector

## Luce dall'alto e da davanti-sinistra della telecamera (come DEFAULT_LIGHT_DIR del gioco).
LIGHT = Vector((0.55, -0.35, 0.75)).normalized()
## Tinte delle ombre: fredde, come le notti dipinte del gioco.
SHADOW_TINT = (0.46, 0.50, 0.66)
MID_TINT = (0.78, 0.79, 0.84)
OUTLINE = (0.012, 0.011, 0.016)
OUTLINE_WIDTH = 0.011
## Pixel della tela per unità di mondo (la figura alta ~1.95 unità occupa ~420 px).
RES = 512
ORTHO = 3.0


def _node(nt, kind, x, y, **props):
    n = nt.nodes.new(kind)
    n.location = (x, y)
    for k, v in props.items():
        setattr(n, k, v)
    return n


def toon_material(mat, emissive=False):
    base = tuple(mat["base"])
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = _node(nt, "ShaderNodeOutputMaterial", 900, 0)
    emit = _node(nt, "ShaderNodeEmission", 700, 0)
    nt.links.new(emit.outputs[0], out.inputs[0])
    if emissive:
        emit.inputs["Color"].default_value = (*base, 1)
        emit.inputs["Strength"].default_value = 2.2
        return
    geo = _node(nt, "ShaderNodeNewGeometry", -800, 100)
    dot = _node(nt, "ShaderNodeVectorMath", -600, 100, operation="DOT_PRODUCT")
    dot.inputs[1].default_value = LIGHT
    nt.links.new(geo.outputs["Normal"], dot.inputs[0])
    coord = _node(nt, "ShaderNodeTexCoord", -1000, -200)
    brush = _node(nt, "ShaderNodeTexNoise", -800, -150)
    brush.inputs["Scale"].default_value = 7.0
    brush.inputs["Detail"].default_value = 8.0
    brush.inputs["Roughness"].default_value = 0.65
    nt.links.new(coord.outputs["Object"], brush.inputs["Vector"])
    jitter = _node(nt, "ShaderNodeMapRange", -600, -150)
    jitter.inputs[3].default_value = -0.22
    jitter.inputs[4].default_value = 0.22
    nt.links.new(brush.outputs["Fac"], jitter.inputs[0])
    add = _node(nt, "ShaderNodeMath", -400, 50, operation="ADD")
    nt.links.new(dot.outputs["Value"], add.inputs[0])
    nt.links.new(jitter.outputs[0], add.inputs[1])
    to01 = _node(nt, "ShaderNodeMapRange", -250, 50)
    to01.inputs[1].default_value = -1.0
    to01.inputs[2].default_value = 1.0
    nt.links.new(add.outputs[0], to01.inputs[0])
    ramp = _node(nt, "ShaderNodeValToRGB", -50, 50)
    cr = ramp.color_ramp
    cr.interpolation = "CONSTANT"
    shadow = tuple(b * t for b, t in zip(base, SHADOW_TINT))
    mid = tuple(b * t for b, t in zip(base, MID_TINT))
    cr.elements[0].position = 0.0
    cr.elements[0].color = (*shadow, 1)
    cr.elements[1].position = 0.47
    cr.elements[1].color = (*mid, 1)
    e = cr.elements.new(0.72)
    e.color = (*base, 1)
    nt.links.new(to01.outputs[0], ramp.inputs[0])
    # Grana del colore: variazione leggera come pigmento steso a mano.
    grain = _node(nt, "ShaderNodeTexNoise", -250, -250)
    grain.inputs["Scale"].default_value = 38.0
    grain.inputs["Detail"].default_value = 4.0
    nt.links.new(coord.outputs["Object"], grain.inputs["Vector"])
    gmap = _node(nt, "ShaderNodeMapRange", -50, -250)
    gmap.inputs[3].default_value = 0.9
    gmap.inputs[4].default_value = 1.06
    nt.links.new(grain.outputs["Fac"], gmap.inputs[0])
    mul = _node(nt, "ShaderNodeVectorMath", 250, 0, operation="SCALE")
    nt.links.new(ramp.outputs["Color"], mul.inputs[0])
    nt.links.new(gmap.outputs[0], mul.inputs["Scale"])
    # Luce di contorno sul lato in ombra: stacca la figura dagli sfondi scuri.
    lw = _node(nt, "ShaderNodeLayerWeight", 250, -250)
    lw.inputs["Blend"].default_value = 0.12
    rim_mask = _node(nt, "ShaderNodeMath", 420, -250, operation="GREATER_THAN")
    rim_mask.inputs[1].default_value = 0.72
    nt.links.new(lw.outputs["Facing"], rim_mask.inputs[0])
    rim_col = _node(nt, "ShaderNodeMix", 520, 0, data_type="RGBA")
    rim_col.inputs["A"].default_value = (0, 0, 0, 1)
    nt.links.new(mul.outputs[0], rim_col.inputs["A"])
    rim_col.inputs["B"].default_value = (min(1, base[0] * 0.75 + 0.12), min(1, base[1] * 0.8 + 0.14), min(1, base[2] * 0.9 + 0.2), 1)
    rim_fac = _node(nt, "ShaderNodeMath", 520, -250, operation="MULTIPLY")
    rim_fac.inputs[1].default_value = 0.35
    nt.links.new(rim_mask.outputs[0], rim_fac.inputs[0])
    nt.links.new(rim_fac.outputs[0], rim_col.inputs["Factor"])
    nt.links.new(rim_col.outputs["Result"], emit.inputs["Color"])


def outline_material():
    mat = bpy.data.materials.new("contorno")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = _node(nt, "ShaderNodeOutputMaterial", 600, 0)
    mix = _node(nt, "ShaderNodeMixShader", 400, 0)
    geo = _node(nt, "ShaderNodeNewGeometry", 100, 200)
    emit = _node(nt, "ShaderNodeEmission", 100, 0)
    emit.inputs["Color"].default_value = (*OUTLINE, 1)
    transp = _node(nt, "ShaderNodeBsdfTransparent", 100, -150)
    nt.links.new(geo.outputs["Backfacing"], mix.inputs[0])
    nt.links.new(emit.outputs[0], mix.inputs[1])
    nt.links.new(transp.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])
    return mat


def setup(body, res=RES):
    """Materiali, contorno, telecamera e impostazioni del render sulla scena già caricata."""
    for slot in body.material_slots:
        toon_material(slot.material, emissive=slot.material.name == "occhio")
    sub = body.modifiers.new("Sagoma morbida", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 1
    body.data.materials.append(outline_material())
    sol = body.modifiers.new("Contorno", "SOLIDIFY")
    sol.thickness = OUTLINE_WIDTH
    sol.offset = 1.0
    sol.use_flip_normals = True
    sol.use_rim = False
    sol.material_offset = len(body.data.materials) - 1

    scene = bpy.context.scene
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = ORTHO
    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    # I piedi stanno a 1/12 dall'alto del fondo: c'è spazio per salti, fendenti e cappello.
    cam.location = (0.0, -10.0, ORTHO * 0.5 - ORTHO / 12.0)
    cam.rotation_euler = (math.radians(90), 0, 0)
    scene.camera = cam
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 12
    scene.cycles.use_denoising = False
    scene.cycles.max_bounces = 2
    scene.cycles.transparent_max_bounces = 8
    scene.cycles.filter_width = 1.2
    scene.render.film_transparent = True
    scene.render.resolution_x = res
    scene.render.resolution_y = res
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    world = bpy.data.worlds.new("Mondo")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.0
    scene.world = world
    return cam


def feet_pixel(res=RES):
    """Punto tra i piedi (origine del mondo) in pixel dell'immagine: (x, y) dall'alto a sinistra."""
    return (res * 0.5, res * (1.0 - 1.0 / 12.0))
