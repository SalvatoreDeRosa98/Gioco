"""Pose deterministiche per Ferruccio 3D con fendente marziale fluido e dinamico."""
import math
from mathutils import Vector, Quaternion

CLIPS = {
    'grapple': (8, 16, True), 'wall': (6, 12, True), 'heal': (8, 16, True), 'hammer': (10, 24, False),
    'idle': (16, 12, True), 'run': (16, 24, True),
    'rise': (6, 18, False), 'fall': (6, 18, False),
    'double_jump': (12, 24, False), 'skid': (6, 20, False),
    'dash': (6, 24, False), 'slash_a': (9, 30, False),
    'slash_b': (9, 30, False), 'pogo': (8, 30, False),
    'parry': (6, 24, False), 'hurt': (6, 24, False), 'death': (12, 18, False),
}

def pose(arm, clip, t):
    for b in arm.pose.bones:
        b.rotation_mode = 'QUATERNION'
        b.rotation_quaternion = Quaternion()
        b.location = (0, 0, 0)
        b.scale = (1, 1, 1)
    arm.pose.bones['hammer'].scale = (1, 1, 1) if clip == 'hammer' else (0, 0, 0)
    if clip == 'hammer': arm.pose.bones['sword'].scale = (0, 0, 0)

    angles = {'sword': 65, 'scarf': 45}
    phase = t * math.tau
    lift = 0.0
    fwd = 0.0
    spin = 0.0

    if clip == 'idle':
        angles.update(chest=2 * math.sin(phase), head=-math.sin(phase), scarf=42 + 4 * math.sin(phase))
    elif clip == 'run':
        swing = math.sin(phase)
        angles.update(chest=12, head=-8, scarf=55 + 8 * math.sin(phase + 1))
        angles.update({
            'thigh.R': -40 * swing, 'thigh.L': 40 * swing,
            'shin.R': -max(0, -swing) * 65, 'shin.L': -max(0, swing) * 65,
            'upperarm.R': 28 * swing - 15, 'upperarm.L': -35 * swing,
            'forearm.R': -35, 'forearm.L': -25, 'sword': 65
        })
        lift = 0.035 * abs(math.cos(phase))
    elif clip in ('rise', 'fall', 'double_jump'):
        angles.update({
            'thigh.R': -35, 'thigh.L': 25, 'shin.R': -65, 'shin.L': -40,
            'upperarm.R': -35, 'upperarm.L': 30, 'forearm.R': -30, 'scarf': 60
        })
        if clip == 'fall':
            angles.update({'thigh.R': -15, 'thigh.L': 15, 'shin.R': -20, 'shin.L': -10, 'scarf': 65})
        if clip == 'double_jump':
            angles.update({'thigh.R': -65, 'thigh.L': -40, 'chest': 25, 'sword': 85})
            spin = -360 * t
            lift += 0.45 * math.sin(math.pi * t)
    elif clip in ('skid', 'dash'):
        angles.update({
            'chest': -18 if clip == 'skid' else 38, 'head': -15, 'thigh.R': -38,
            'thigh.L': 40, 'shin.L': -50, 'upperarm.R': 35, 'upperarm.L': 45, 'scarf': 62
        })
    elif clip in ('grapple', 'wall'):
        angles.update({
            'upperarm.L': -160, 'forearm.L': -15, 'upperarm.R': -20, 'forearm.R': -30,
            'scarf': 52, 'thigh.R': -35, 'shin.R': -50, 'thigh.L': 20
        })
    elif clip == 'heal':
        angles.update({'upperarm.R': -50, 'forearm.R': -90, 'upperarm.L': -45, 'forearm.L': -90, 'head': 15, 'chest': 10, 'scarf': 38})
    elif clip == 'slash_a':
        # 9 frame totali: anticipo (0..0.25), fendente dinamico in avanti (0.25..0.50), recupero fluido (0.50..1.0)
        if t <= 0.25:
            k = t / 0.25
            lift = -0.04 * k
            fwd = -0.02 * k
            angles.update({
                'chest': -12 * k, 'head': -6 * k,
                'upperarm.R': -15 + (-75) * k, 'forearm.R': -25 + (-30) * k, 'sword': 65 + (-90) * k,
                'upperarm.L': 15 + 20 * k, 'forearm.L': -20 + (-25) * k,
                'thigh.R': -10 + (-6) * k, 'thigh.L': 10 + 4 * k,
                'scarf': 45 + (-15) * k
            })
        elif t <= 0.50:
            k = (t - 0.25) / 0.25
            k_ease = k * k * (3 - 2 * k)
            lift = -0.04 + (-0.02) * k_ease
            fwd = -0.02 + 0.26 * k_ease
            angles.update({
                'chest': -12 + 32 * k_ease, 'head': -6 + 12 * k_ease,
                'upperarm.R': -90 + 25 * k_ease, 'forearm.R': -55 + 40 * k_ease, 'sword': -25 + 55 * k_ease,
                'upperarm.L': 35 + (-80) * k_ease, 'forearm.L': -45 + 30 * k_ease,
                'thigh.R': -16 + 48 * k_ease, 'shin.R': -35 * k_ease,
                'thigh.L': 14 + (-50) * k_ease, 'shin.L': -15 * k_ease,
                'scarf': 30 + 25 * k_ease, 'hat_tip': 12 * k_ease
            })
        elif t <= 0.75:
            k = (t - 0.50) / 0.25
            lift = -0.06 + 0.04 * k
            fwd = 0.24 + (-0.14) * k
            angles.update({
                'chest': 20 + (-12) * k, 'head': 6 + (-4) * k,
                'upperarm.R': -65 + 45 * k, 'forearm.R': -15 + (-10) * k, 'sword': 30 + 35 * k,
                'upperarm.L': -45 + 35 * k, 'forearm.L': -15 + (-10) * k,
                'thigh.R': 32 + (-22) * k, 'shin.R': -35 * (1 - k),
                'thigh.L': -36 + 46 * k, 'shin.L': -15 * (1 - k),
                'scarf': 55 + (-10) * k, 'hat_tip': 12 * (1 - k)
            })
        else:
            k = (t - 0.75) / 0.25
            lift = -0.02 * (1 - k)
            fwd = 0.10 * (1 - k)
            angles.update({
                'chest': 8 * (1 - k), 'head': 2 * (1 - k),
                'upperarm.R': -20 + 5 * k, 'forearm.R': -25, 'sword': 65,
                'upperarm.L': -10 + 25 * k, 'forearm.L': -25 + 5 * k,
                'thigh.R': 10 * (1 - k), 'thigh.L': 10 * k,
                'scarf': 45
            })
    elif clip == 'slash_b':
        # Secondo colpo: taglio ascendente in diagonale con passo avanti
        if t <= 0.25:
            k = t / 0.25
            lift = -0.04 * k
            fwd = -0.02 * k
            angles.update({
                'chest': -8 * k, 'head': -4 * k,
                'upperarm.R': -10 + 35 * k, 'forearm.R': -25 + (-25) * k, 'sword': 65 + (-140) * k,
                'upperarm.L': 15 + 15 * k, 'forearm.L': -20 + (-20) * k,
                'thigh.R': -8 * k, 'thigh.L': 8 * k,
                'scarf': 45 + (-10) * k
            })
        elif t <= 0.50:
            k = (t - 0.25) / 0.25
            k_ease = k * k * (3 - 2 * k)
            lift = -0.04 + 0.06 * k_ease
            fwd = -0.02 + 0.24 * k_ease
            angles.update({
                'chest': -8 + 28 * k_ease, 'head': -4 + 10 * k_ease,
                'upperarm.R': 25 + (-110) * k_ease, 'forearm.R': -50 + 50 * k_ease, 'sword': -75 + 105 * k_ease,
                'upperarm.L': 30 + (-90) * k_ease, 'forearm.L': -40 + 25 * k_ease,
                'thigh.R': -8 + 36 * k_ease, 'shin.R': -25 * k_ease,
                'thigh.L': 8 + (-40) * k_ease, 'shin.L': -15 * k_ease,
                'scarf': 35 + 22 * k_ease, 'hat_tip': 10 * k_ease
            })
        elif t <= 0.75:
            k = (t - 0.50) / 0.25
            lift = 0.02 + (-0.02) * k
            fwd = 0.22 + (-0.12) * k
            angles.update({
                'chest': 20 + (-12) * k, 'head': 6 + (-4) * k,
                'upperarm.R': -85 + 65 * k, 'forearm.R': 0 + (-20) * k, 'sword': 30 + 35 * k,
                'upperarm.L': -60 + 40 * k, 'forearm.L': -15 + (-10) * k,
                'thigh.R': 28 + (-18) * k, 'shin.R': -25 * (1 - k),
                'thigh.L': -32 + 42 * k, 'shin.L': -15 * (1 - k),
                'scarf': 57 + (-12) * k, 'hat_tip': 10 * (1 - k)
            })
        else:
            k = (t - 0.75) / 0.25
            lift = 0.0
            fwd = 0.10 * (1 - k)
            angles.update({
                'chest': 8 * (1 - k), 'head': 2 * (1 - k),
                'upperarm.R': -20 + 5 * k, 'forearm.R': -20 + (-5) * k, 'sword': 65,
                'upperarm.L': -20 + 35 * k, 'forearm.L': -25 + 5 * k,
                'thigh.R': 10 * (1 - k), 'thigh.L': 10 * k,
                'scarf': 45
            })
    elif clip == 'pogo':
        angles.update({
            'upperarm.R': 15, 'forearm.R': 5, 'sword': 95,
            'upperarm.L': 35, 'forearm.L': -25,
            'chest': 12, 'head': 10,
            'thigh.R': -48, 'shin.R': -60, 'thigh.L': -25, 'shin.L': -45,
            'scarf': 30
        })
    elif clip == 'parry':
        angles.update({'upperarm.R': -65, 'forearm.R': -45, 'sword': -40, 'chest': -8, 'upperarm.L': -20, 'scarf': 45})
    elif clip == 'hurt':
        angles.update({'chest': -22 * (1 - t), 'head': -12, 'upperarm.R': 25, 'upperarm.L': 30, 'scarf': 50})
    elif clip == 'death':
        spin = -80 * min(1, t * 1.5)
        angles.update({'thigh.R': -20, 'shin.R': -40, 'upperarm.R': 35, 'sword': 65, 'scarf': 40})
    elif clip == 'hammer':
        if t <= 0.4:
            k = t / 0.4
            angles.update({
                'upperarm.R': -10 + (-95) * k, 'forearm.R': -25 + (-40) * k, 'sword': 50 + (-120) * k,
                'chest': -12 * k, 'scarf': 35
            })
        else:
            k = (t - 0.4) / 0.6
            angles.update({
                'upperarm.R': -105 + 100 * k, 'forearm.R': -65 + 40 * k, 'sword': -70 + 135 * k,
                'chest': -12 + 30 * (1 - abs(k - 0.2)), 'thigh.R': 25 * (1 - k), 'scarf': 52
            })
        angles['hammer'] = angles['sword']

    angles['skirt_f'] = angles.get('thigh.R', 0) * 0.6
    angles['skirt_b'] = angles.get('thigh.L', 0) * 0.6
    angles['hat_tip'] = angles.get('hat_tip', 5 * math.sin(phase))

    for name, angle in angles.items():
        if name in arm.pose.bones:
            b = arm.pose.bones[name]
            axis = b.bone.matrix_local.to_quaternion().inverted() @ Vector((0, 1, 0))
            b.rotation_quaternion = Quaternion(axis, math.radians(angle))

    root = arm.pose.bones['root']
    q = Quaternion(Vector((0, 1, 0)), math.radians(spin))
    pivot = Vector((0, 0, 0.95 if clip == 'double_jump' else 0.12))
    translation = pivot - q @ pivot + Vector((fwd + (1.4 * t - 0.3 * max(0, (t - 0.7) / 0.3) if clip == 'death' else 0), 0, lift + (0.65 * t + 0.22 if clip == 'death' else 0)))
    basis = root.bone.matrix_local.to_quaternion()
    root.rotation_quaternion = basis.inverted() @ q @ basis
    root.location = basis.inverted() @ translation
