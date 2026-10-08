#!/usr/bin/env python3
"""Pose chiave del pupazzo a ritaglio di Ferruccio -> src/data/ferruccio_anim.json.

Convenzioni (personaggio rivolto a destra, come il dipinto):
  angoli in gradi, positivo = orario sullo schermo.
  braccio o gamba in avanti = negativo; ginocchio piegato (stinco indietro) = positivo;
  busto inclinato in avanti = positivo; testa che guarda in basso = positivo;
  polso positivo = lama più verso il basso.
  hips_y: abbassamento del bacino in pixel della tela (positivo = più in basso).
  hips_x: spostamento in avanti del bacino; root_rot: rotazione di tutto il corpo attorno ai piedi.
  Le ossa con "_f" sono braccio e gamba lontani (dietro il busto).

Ogni clip ha fps (gli scatti da animazione disegnata: 12), loop, durata e una lista di chiavi
{t: secondi, ease: "in"/"out"/"inout"/"step", pose}. Le clip "progress" non hanno un tempo proprio:
il gioco le guida con l'avanzamento dell'azione (0..1 su t) per restare al passo con le hitbox.

Uso: python tools/art/cutout_anims.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "src/data/ferruccio_anim.json"

PAIRS = [("thigh", "thigh_f"), ("knee", "knee_f"), ("ankle", "ankle_f"), ("shoulder", "shoulder_f"), ("elbow", "elbow_f")]


def mirror(p):
    """Scambia arti vicini e lontani (secondo mezzo passo della corsa)."""
    q = dict(p)
    for a, b in PAIRS:
        q[a], q[b] = p.get(b, 0), p.get(a, 0)
    # La mano vicina regge la spada: il polso resta suo.
    return q


GUARD = {"shoulder": -12, "elbow": -38, "wrist": -18, "shoulder_f": 14, "elbow_f": -6}

# ---------------------------------------------------------------- Fermo
IDLE = [
    (0.0, {**GUARD, "torso": 2, "neck": 0, "hips_y": 0}),
    (0.9, {**GUARD, "torso": 4, "neck": 2, "hips_y": 4, "shoulder": -9, "wrist": -14, "elbow": -36}),
    (1.8, {**GUARD, "torso": 2, "neck": 0, "hips_y": 0}),
]

# ---------------------------------------------------------------- Corsa (mezzo ciclo + specchio)
RUN_A = {"hips_y": 2, "torso": 13, "neck": -6, "thigh": -40, "knee": 8, "ankle": -16, "thigh_f": 34, "knee_f": 28,
         "ankle_f": 18, "shoulder": 34, "elbow": -50, "wrist": -26, "shoulder_f": -36, "elbow_f": -48}
RUN_B = {"hips_y": 16, "torso": 15, "neck": -5, "thigh": -22, "knee": 26, "ankle": 2, "thigh_f": 42, "knee_f": 78,
         "ankle_f": 26, "shoulder": 26, "elbow": -46, "wrist": -22, "shoulder_f": -28, "elbow_f": -46}
RUN_C = {"hips_y": 4, "torso": 13, "neck": -6, "thigh": 2, "knee": 10, "ankle": 2, "thigh_f": -12, "knee_f": 96,
         "ankle_f": 18, "shoulder": 4, "elbow": -40, "wrist": -18, "shoulder_f": -4, "elbow_f": -40}
RUN_D = {"hips_y": -12, "torso": 12, "neck": -7, "thigh": 28, "knee": 18, "ankle": 24, "thigh_f": -46, "knee_f": 50,
         "ankle_f": -12, "shoulder": -22, "elbow": -38, "wrist": -14, "shoulder_f": 24, "elbow_f": -34}
RUN = [RUN_A, RUN_B, RUN_C, RUN_D]
RUN = RUN + [mirror(p) for p in RUN]
for p in RUN[4:]:
    p["wrist"] = -20
RUN_KEYS = [(i / 12.0, p) for i, p in enumerate(RUN)] + [(8 / 12.0, RUN_A)]

# ---------------------------------------------------------------- Aria
RISE = {"hips_y": 0, "torso": 6, "neck": -8, "thigh": -46, "knee": 72, "ankle": 10, "thigh_f": 14, "knee_f": 42,
        "ankle_f": 22, "shoulder": -30, "elbow": -50, "wrist": -26, "shoulder_f": 30, "elbow_f": -26}
FALL = {"hips_y": 0, "torso": -2, "neck": 4, "thigh": -14, "knee": 26, "ankle": -6, "thigh_f": 18, "knee_f": 34,
        "ankle_f": 6, "shoulder": -68, "elbow": -30, "wrist": -6, "shoulder_f": -84, "elbow_f": -22}
TUCK = {"hips_y": -40, "torso": 26, "neck": 10, "thigh": -86, "knee": 128, "ankle": 20, "thigh_f": -74, "knee_f": 122,
        "ankle_f": 20, "shoulder": -46, "elbow": -70, "wrist": -40, "shoulder_f": -40, "elbow_f": -80}

# ---------------------------------------------------------------- Fendenti (guidati dall'avanzamento)
# Affondo: ricalcato sul foglio di animazione disegnato (production/art/materiale-utente/).
# Angolo della lama nel mondo = 33.6 (riposo) + torso + spalla + gomito + polso: 0 = orizzontale.
LUNGE_LEGS = {"hips_y": 70, "hips_x": 40, "thigh": -75, "knee": 80, "ankle": -5,
              "thigh_f": 40, "knee_f": 5, "ankle_f": -30}
SLASH_A = [
    (0.00, {**GUARD, "torso": 6}, "out"),
    (0.12, {"hips_y": 30, "hips_x": 10, "torso": 10, "neck": -4, "thigh": -40, "knee": 62, "ankle": -12,
            "thigh_f": 26, "knee_f": 40, "ankle_f": 4, "shoulder": -40, "elbow": -60, "wrist": 16,
            "shoulder_f": 40, "elbow_f": -30}, "out"),
    (0.24, {"hips_y": 44, "hips_x": 16, "torso": 18, "neck": -8, "thigh": -52, "knee": 78, "ankle": -16,
            "thigh_f": 32, "knee_f": 36, "ankle_f": -6, "shoulder": 10, "elbow": -95, "wrist": 25,
            "shoulder_f": 34, "elbow_f": -30}, "step"),
    (0.28, {"hips_y": 44, "hips_x": 16, "torso": 18, "neck": -8, "thigh": -52, "knee": 78, "ankle": -16,
            "thigh_f": 32, "knee_f": 36, "ankle_f": -6, "shoulder": 10, "elbow": -95, "wrist": 25,
            "shoulder_f": 34, "elbow_f": -30}, "in"),
    (0.36, {**LUNGE_LEGS, "torso": 22, "neck": -10, "shoulder": -108, "elbow": 0, "wrist": 52,
            "shoulder_f": 38, "elbow_f": -24}, "out"),
    (0.62, {**LUNGE_LEGS, "hips_x": 46, "torso": 24, "neck": -10, "shoulder": -112, "elbow": 4, "wrist": 52,
            "shoulder_f": 40, "elbow_f": -22}, "inout"),
    (1.00, {**GUARD, "hips_y": 10, "hips_x": 12, "torso": 10, "thigh": -20, "knee": 18, "thigh_f": 16,
            "knee_f": 16}, "inout"),
]
SLASH_B = [  # dal basso in alto, avvitato
    (0.00, {**GUARD, "torso": 4}, "out"),
    (0.20, {"hips_y": 18, "torso": 20, "neck": 6, "thigh": -26, "knee": 40, "thigh_f": 22, "knee_f": 40,
            "shoulder": 52, "elbow": -10, "wrist": 52, "shoulder_f": -30, "elbow_f": -40}, "step"),
    (0.28, {"hips_y": 18, "torso": 20, "neck": 6, "thigh": -26, "knee": 40, "thigh_f": 22, "knee_f": 40,
            "shoulder": 52, "elbow": -10, "wrist": 52, "shoulder_f": -30, "elbow_f": -40}, "in"),
    (0.40, {"hips_y": 2, "hips_x": 20, "torso": -8, "neck": -10, "thigh": -38, "knee": 14, "thigh_f": 26, "knee_f": 20,
            "ankle_f": 20, "shoulder": -128, "elbow": -16, "wrist": -66, "shoulder_f": 40, "elbow_f": -20}, "out"),
    (0.62, {"hips_y": 0, "hips_x": 24, "torso": -12, "neck": -12, "thigh": -40, "knee": 14, "thigh_f": 28, "knee_f": 20,
            "ankle_f": 20, "shoulder": -168, "elbow": -10, "wrist": -88, "shoulder_f": 44, "elbow_f": -16}, "inout"),
    (1.00, {**GUARD, "hips_y": 4, "hips_x": 8, "torso": 4, "thigh": -16, "knee": 12, "thigh_f": 14, "knee_f": 14}, "inout"),
]
POGO = [  # in aria, lama sotto i piedi
    (0.00, {**TUCK, "shoulder": -70, "wrist": -50}, "out"),
    (0.22, {**TUCK, "shoulder": -100, "elbow": -40, "wrist": -70}, "step"),
    (0.28, {**TUCK, "shoulder": -100, "elbow": -40, "wrist": -70}, "in"),
    (0.40, {**TUCK, "torso": 30, "shoulder": -6, "elbow": 0, "wrist": 58, "thigh": -96, "thigh_f": -84}, "out"),
    (0.70, {**TUCK, "torso": 30, "shoulder": -2, "elbow": 0, "wrist": 60, "thigh": -96, "thigh_f": -84}, "inout"),
    (1.00, {**FALL}, "inout"),
]
HAMMER = [  # colpo pesante: carica lunga sopra la testa, impatto a terra
    (0.00, {**GUARD}, "out"),
    (0.45, {"hips_y": 6, "torso": -22, "neck": -12, "thigh": -14, "knee": 16, "thigh_f": 22, "knee_f": 20,
            "shoulder": 176, "elbow": -20, "wrist": -50, "shoulder_f": 168, "elbow_f": -24}, "out"),
    (0.58, {"hips_y": 40, "hips_x": 18, "torso": 38, "neck": 14, "thigh": -50, "knee": 70, "ankle": -12, "thigh_f": 34,
            "knee_f": 60, "ankle_f": 22, "shoulder": -40, "elbow": 0, "wrist": 40, "shoulder_f": -36, "elbow_f": -4}, "in"),
    (0.80, {"hips_y": 40, "hips_x": 18, "torso": 38, "neck": 14, "thigh": -50, "knee": 70, "ankle": -12, "thigh_f": 34,
            "knee_f": 60, "ankle_f": 22, "shoulder": -40, "elbow": 0, "wrist": 40, "shoulder_f": -36, "elbow_f": -4}, "step"),
    (1.00, {**GUARD, "hips_y": 10}, "inout"),
]

# ---------------------------------------------------------------- Altre pose
DASH = {"hips_y": -6, "torso": 38, "neck": -14, "thigh": 34, "knee": 46, "ankle": 30, "thigh_f": -26, "knee_f": 64,
        "ankle_f": 8, "shoulder": 78, "elbow": -6, "wrist": -34, "shoulder_f": 70, "elbow_f": -8}
SKID = {"hips_y": 14, "hips_x": -8, "torso": -18, "neck": -6, "thigh": -48, "knee": 8, "ankle": -26, "thigh_f": 22,
        "knee_f": 34, "ankle_f": 10, "shoulder": -44, "elbow": -30, "wrist": -24, "shoulder_f": -52, "elbow_f": -30}
PARRY = {"hips_y": 14, "torso": -6, "neck": -4, "thigh": -20, "knee": 22, "thigh_f": 24, "knee_f": 22,
         "shoulder": -56, "elbow": -66, "wrist": -84, "shoulder_f": -30, "elbow_f": -60}
HURT = {"hips_y": 6, "hips_x": -12, "torso": -22, "neck": -14, "thigh": -14, "knee": 18, "thigh_f": 10, "knee_f": 22,
        "shoulder": 44, "elbow": -20, "wrist": 10, "shoulder_f": 52, "elbow_f": -24}
GRAPPLE = {"hips_y": 0, "torso": -4, "neck": -12, "thigh": -18, "knee": 34, "ankle": 14, "thigh_f": 12, "knee_f": 44,
           "ankle_f": 24, "shoulder": 34, "elbow": -22, "wrist": -10, "shoulder_f": -150, "elbow_f": -6}
WALL = {"hips_y": 10, "torso": -8, "neck": 6, "thigh": -54, "knee": 74, "ankle": -20, "thigh_f": 6, "knee_f": 40,
        "ankle_f": 10, "shoulder": 24, "elbow": -30, "wrist": 20, "shoulder_f": -116, "elbow_f": -24}
HEAL_A = {"hips_y": 46, "torso": 16, "neck": 18, "thigh": -72, "knee": 112, "ankle": 10, "thigh_f": 18, "knee_f": 104,
          "ankle_f": 36, "shoulder": 10, "elbow": -20, "wrist": 40, "shoulder_f": -64, "elbow_f": -96}
HEAL_B = {**HEAL_A, "torso": 12, "neck": 12, "hips_y": 42}
DEATH = [
    (0.00, HURT, "out"),
    (0.25, {**HURT, "hips_y": 30, "torso": -30, "neck": -24, "knee": 40, "knee_f": 40}, "in"),
    (0.55, {"hips_y": 150, "torso": 30, "neck": 26, "thigh": -86, "knee": 150, "thigh_f": -70, "knee_f": 146,
            "ankle_f": 30, "shoulder": 30, "elbow": -10, "wrist": 30, "shoulder_f": 20, "elbow_f": -10}, "out"),
    (0.75, {"hips_y": 150, "torso": 30, "neck": 26, "thigh": -86, "knee": 150, "thigh_f": -70, "knee_f": 146,
            "ankle_f": 30, "shoulder": 30, "elbow": -10, "wrist": 30, "shoulder_f": 20, "elbow_f": -10}, "step"),
    (1.10, {"root_rot": -84, "root_y": -40, "hips_y": 30, "torso": -6, "neck": -10, "thigh": -10, "knee": 20,
            "thigh_f": 6, "knee_f": 30, "shoulder": -20, "elbow": 0, "wrist": 0, "shoulder_f": -30, "elbow_f": 0}, "in"),
]


def clip(keys, fps=12, loop=False, progress=False, default_ease="inout"):
    out = []
    for k in keys:
        t, pose = k[0], k[1]
        ease = k[2] if len(k) > 2 else default_ease
        out.append({"t": round(t, 4), "ease": ease, "pose": pose})
    return {"fps": fps, "loop": loop, "progress": progress, "length": out[-1]["t"], "keys": out}


def hold(pose):
    return clip([(0.0, pose), (0.5, pose)], loop=True)


CLIPS = {
    "idle": clip(IDLE, loop=True),
    "run": clip(RUN_KEYS, loop=True, default_ease="step"),
    "rise": hold(RISE),
    "fall": clip([(0.0, RISE), (0.18, FALL), (0.6, FALL)]),
    "double_jump": clip([(0.0, TUCK, "out"), (0.7, TUCK), (1.0, FALL)], progress=True),
    "skid": hold(SKID),
    "dash": hold(DASH),
    "slash_a": clip(SLASH_A, progress=True),
    "slash_b": clip(SLASH_B, progress=True),
    "pogo": clip(POGO, progress=True),
    "hammer": clip(HAMMER, progress=True),
    "parry": clip([(0.0, GUARD, "out"), (0.08, PARRY), (0.5, PARRY)]),
    "hurt": clip([(0.0, HURT, "step"), (0.3, HURT)]),
    "grapple": hold(GRAPPLE),
    "wall": hold(WALL),
    "heal": clip([(0.0, HEAL_A), (0.5, HEAL_B), (1.0, HEAL_A)], loop=True),
    "death": clip(DEATH),
}

if __name__ == "__main__":
    data = {"_doc": "Generato da tools/art/cutout_anims.py: modificare lì e rigenerare. Angoli in gradi, positivo = orario.",
            "clips": CLIPS}
    OUT.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf8")
    print("clip:", ", ".join(CLIPS))
