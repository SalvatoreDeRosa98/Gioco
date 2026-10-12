"""Pose della vespa. Stesso meccanismo di Ferruccio e del gatto: angoli in gradi attorno all'asse Y.

CLIPS: nome -> (fotogrammi, fps di riferimento, loop). Regola per i mob: 12 per il riposo,
24 per attacco, colpito e volo sbattuto; la morte a 18.
"""
import math

from mathutils import Quaternion, Vector

CLIPS = {
    "fly": (6, 24, True),        # ali che sbattono in ciclo breve
    "windup": (4, 24, False),    # preavviso: si solleva e il pungiglione si alza
    "attack": (6, 24, False),    # picchiata con il pungiglione avanti
    "hurt": (6, 24, False),      # sbalzo indietro
    "death": (12, 18, False),    # cade ruotando, le ali si fermano
}

WING_KEYS = ("wing_f.a", "wing_h.a", "wing_f.b", "wing_h.b")


def _smooth(k):
    k = max(0.0, min(1.0, k))
    return k * k * (3 - 2 * k)


def _lerp(a, b, k):
    return a + (b - a) * k


def pose(arm, clip, t):
    for b in arm.pose.bones:
        b.rotation_mode = "QUATERNION"
        b.rotation_quaternion = Quaternion()
        b.location = (0, 0, 0)
        b.scale = (1, 1, 1)

    phase = t * math.tau
    angles = {}
    fwd = 0.0
    lift = 0.0
    spin = 0.0

    if clip == "fly":
        flap = 34 * math.sin(phase)
        angles.update({"wing_f.a": flap, "wing_f.b": flap, "wing_h.a": flap * 0.8, "wing_h.b": flap * 0.8})
        lift = 0.02 * math.sin(2 * phase)
        angles.update(abdomen=4 * math.sin(phase), stinger=6 * math.sin(phase))
    elif clip == "windup":
        k = _smooth(t)
        angles.update({"wing_f.a": 20 * k, "wing_f.b": 20 * k, "wing_h.a": 16 * k, "wing_h.b": 16 * k,
                       "abdomen": 18 * k, "stinger": 28 * k, "head": -8 * k})
        lift = 0.06 * k
    elif clip == "attack":
        strike = _smooth((t - 0.3) / 0.7) if t > 0.3 else 0.0
        prep = _smooth(min(1.0, t / 0.3))
        angles.update({
            "wing_f.a": _lerp(20, -30, strike), "wing_f.b": _lerp(20, -30, strike),
            "wing_h.a": _lerp(16, -24, strike), "wing_h.b": _lerp(16, -24, strike),
            "abdomen": 18 * prep - 44 * strike, "stinger": _lerp(28, -40, strike),
            "head": _lerp(-8, 12, strike),
        })
        fwd = 0.35 * strike
        spin = 38 * strike
    elif clip == "hurt":
        r = math.sin(min(1.0, t * 2.0) * math.pi)
        angles.update({"wing_f.a": 10 * r, "wing_f.b": 10 * r, "head": -22 * r, "abdomen": 12 * r})
        fwd = -0.16 * r
        spin = -20 * r
    elif clip == "death":
        k = min(1.0, t * 1.3)
        flutter = 14 * math.sin(phase * 2) * max(0.0, 1.0 - t * 2)
        angles.update({"wing_f.a": flutter, "wing_f.b": flutter, "wing_h.a": flutter, "wing_h.b": flutter,
                       "abdomen": 22 * t})
        spin = -95 * k
        lift = -0.30 * t
        fwd = -0.12 * t

    for name in WING_KEYS:
        if name not in angles:
            angles[name] = 0.0
    for name, angle in angles.items():
        if name in arm.pose.bones:
            b = arm.pose.bones[name]
            axis = b.bone.matrix_local.to_quaternion().inverted() @ Vector((0, 1, 0))
            b.rotation_quaternion = Quaternion(axis, math.radians(angle))

    root = arm.pose.bones["root"]
    q = Quaternion(Vector((0, 1, 0)), math.radians(spin))
    pivot = Vector((0, 0, 1.12))
    translation = pivot - q @ pivot + Vector((fwd, 0, lift))
    basis = root.bone.matrix_local.to_quaternion()
    root.rotation_quaternion = basis.inverted() @ q @ basis
    root.location = basis.inverted() @ translation
