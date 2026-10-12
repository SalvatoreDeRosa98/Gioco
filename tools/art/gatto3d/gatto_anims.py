"""Pose del gatto. Stesso meccanismo di Ferruccio (anims.py): angoli in gradi attorno all'asse Y del mondo.

CLIPS: nome -> (fotogrammi, fps di riferimento, loop). Il fps del manifesto del gioco vale per la clip:
regola scelta per tutti i mob: 12 per riposo e camminata, 24 per attacco, colpito, morte.
"""
import math

from mathutils import Quaternion, Vector

CLIPS = {
    "idle": (16, 12, True),
    "walk": (12, 12, True),
    "windup": (4, 24, False),
    "attack": (6, 24, False),
    "hurt": (6, 24, False),
    "death": (12, 18, False),
}


def _lerp(a, b, k):
    return a + (b - a) * k


def _smooth(k):
    k = max(0.0, min(1.0, k))
    return k * k * (3 - 2 * k)


def _leg(angles, up, lo, phase, hind=False):
    """Una gamba del passo: il femore oscilla, lo stinco si piega durante il ritorno.
    Le posteriori hanno l'oscillazione ribaltata rispetto alle anteriori."""
    s = math.sin(phase)
    k = -1.0 if hind else 1.0
    angles[up] = 24 * k * s
    angles[lo] = -30 * max(0.0, -s)


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

    if clip == "idle":
        angles.update(
            chest=1.5 * math.sin(phase), neck=-2 * math.sin(phase), head=-3 * math.sin(phase + 0.5),
            tail1=6 * math.sin(phase), tail2=10 * math.sin(phase - 0.6),
            tail3=14 * math.sin(phase - 1.2), tail4=18 * math.sin(phase - 1.8),
        )
    elif clip == "walk":
        # Passo diagonale: anteriore sinistra con posteriore destra, l'altra coppia sfasata di mezzo giro.
        _leg(angles, "fore_up.a", "fore_lo.a", phase)
        _leg(angles, "hind_up.b", "hind_lo.b", phase, hind=True)
        _leg(angles, "fore_up.b", "fore_lo.b", phase + math.pi)
        _leg(angles, "hind_up.a", "hind_lo.a", phase + math.pi, hind=True)
        angles.update(
            chest=3 * math.sin(2 * phase), neck=-2 * math.sin(2 * phase + 0.4),
            head=-4 * math.sin(2 * phase + 0.8),
            tail1=8 * math.sin(phase + math.pi), tail2=12 * math.sin(phase + math.pi - 0.6),
            tail3=16 * math.sin(phase + math.pi - 1.2), tail4=20 * math.sin(phase + math.pi - 1.8),
        )
    elif clip == "windup":
        k = _smooth(t)
        angles.update({
            "chest": -8 * k, "neck": -12 * k, "head": -12 * k,
            "tail1": 8 * k, "tail2": 16 * k, "tail3": 26 * k, "tail4": 20 * k,
            "fore_up.a": -20 * k, "fore_up.b": -20 * k, "fore_lo.a": 40 * k, "fore_lo.b": 40 * k,
            "hind_up.a": 15 * k, "hind_up.b": 15 * k, "hind_lo.a": -25 * k, "hind_lo.b": -25 * k,
        })
    elif clip == "attack":
        prep = _smooth(min(1.0, t / 0.35))
        strike = _smooth((t - 0.35) / 0.65) if t > 0.35 else 0.0
        swipe = _lerp(-20, 70, strike) if t > 0.35 else _lerp(0, -20, prep)
        angles.update({
            "fore_up.a": swipe, "fore_lo.a": _lerp(40, -10, strike),
            "fore_up.b": _lerp(-20, 30, strike) * 0.6, "fore_lo.b": _lerp(40, 10, strike),
            "chest": _lerp(-8, 14, strike), "neck": _lerp(-12, 10, strike), "head": _lerp(-12, 8, strike),
            "tail3": 26 * (1 - strike), "tail4": 20 * (1 - strike),
        })
        fwd = 0.25 * strike
    elif clip == "hurt":
        r = math.sin(min(1.0, t * 2.0) * math.pi)
        angles.update({
            "chest": -16 * r, "neck": -20 * r, "head": -24 * r,
            "tail1": 30 * r, "tail2": 40 * r, "tail3": 50 * r, "tail4": 40 * r,
            "fore_up.a": -15 * r, "fore_up.b": -15 * r, "hind_up.a": 15 * r, "hind_up.b": 15 * r,
        })
        fwd = -0.12 * r
    elif clip == "death":
        k = min(1.0, t * 1.4)
        spin = -85 * k
        lift = -0.05 * t
        fwd = -0.3 * t
        angles.update({
            "fore_up.a": 30 * t, "fore_up.b": 30 * t, "hind_up.a": -25 * t, "hind_up.b": -25 * t,
            "tail1": 15 * t, "head": -20 * t, "neck": -15 * t,
        })

    for name, angle in angles.items():
        if name in arm.pose.bones:
            b = arm.pose.bones[name]
            axis = b.bone.matrix_local.to_quaternion().inverted() @ Vector((0, 1, 0))
            b.rotation_quaternion = Quaternion(axis, math.radians(angle))

    root = arm.pose.bones["root"]
    q = Quaternion(Vector((0, 1, 0)), math.radians(spin))
    pivot = Vector((0, 0, 0.12))
    translation = pivot - q @ pivot + Vector((fwd, 0, lift))
    basis = root.bone.matrix_local.to_quaternion()
    root.rotation_quaternion = basis.inverted() @ q @ basis
    root.location = basis.inverted() @ translation
