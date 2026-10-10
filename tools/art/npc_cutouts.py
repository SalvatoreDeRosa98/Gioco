"""Contorni anatomici dei dipinti NPC, in coordinate normalizzate della tela.

Produce solo metadati: le figure originali sono campionate dal rig in Godot.
Le parti non visibili non vengono inventate; gli NPC mantengono la loro posa.
"""
import json
from pathlib import Path


def rect(x0, y0, x1, y1):
    return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]


def part(name, pivot, outline, parent="torso"):
    return dict(name=name, parent=parent, pivot=pivot, outline=outline)


def rig(head, neck, arm, elbow, forearm, wrist, legs=None, body=None):
    parts = [part("head", neck, rect(0, 0, 1, head))]
    parts += [part("arm_near", arm[0], arm[1]),
              part("hand_near", elbow, forearm, "arm_near")]
    if legs:
        split, top = legs
        parts += [part("leg_far", [split, top], rect(0, top, split, 1)),
                  part("leg_near", [split, top], rect(split, top, 1, 1))]
    return dict(body_pivot=body or [0.5, 0.68], parts=parts,
                motion=dict(torso=0.002, head=0.008, arm_near=0.004,
                            hand_near=0.006, leg_near=0.002, leg_far=-0.002),
                wrist=wrist, breath_period=3.4)


RIGS = {
    "tonino": rig(.205, [.55, .21],
        ([.28, .25], [[0,.23],[.40,.24],[.42,.45],[0,.47]]), [.26,.45],
        [[0,.47],[.42,.45],[.55,.67],[.27,.68]], [.42,.62], (.49,.80)),
    "taddeo": rig(.22, [.57,.22],
        ([.48,.26], [[.29,.23],[.63,.25],[.62,.48],[.30,.49]]), [.48,.47],
        [[.30,.49],[.62,.48],[.73,.65],[.43,.65]], [.60,.62], (.53,.76)),
    "mariella": rig(.29, [.38,.28],
        ([.27,.32], [[.13,.30],[.39,.31],[.44,.42],[.21,.44]]), [.35,.42],
        [[.21,.44],[.44,.42],[.70,.49],[.68,.54],[.34,.49]], [.65,.49], (.75,.82)),
    "agnese": rig(.22, [.52,.22],
        ([.29,.27], [[.16,.25],[.37,.26],[.47,.38],[.30,.40]]), [.39,.38],
        [[.30,.40],[.47,.38],[.72,.26],[.80,.30],[.48,.43]], [.72,.30], (.56,.88)),
    "gaetano_umano": rig(.21, [.56,.21],
        ([.29,.26], [[.08,.23],[.40,.24],[.44,.43],[.10,.44]]), [.30,.43],
        [[.10,.44],[.44,.43],[.52,.64],[.25,.66]], [.40,.61], (.49,.79)),
    "bianca": rig(.245, [.65,.245],
        ([.58,.28], [[.55,.25],[.66,.28],[.50,.36],[.42,.34]]), [.46,.35],
        [[.42,.34],[.50,.36],[.24,.40],[.17,.36]], [.22,.38], body=[.55,.67]),
    "violante": rig(.22, [.55,.22],
        ([.47,.28], [[.34,.25],[.54,.26],[.56,.43],[.38,.45]]), [.48,.43],
        [[.38,.45],[.56,.43],[.64,.62],[.46,.62]], [.55,.53], body=[.50,.74]),
    "assunta": rig(.23, [.42,.23],
        ([.25,.28], [[.12,.24],[.35,.25],[.39,.44],[.24,.46]]), [.33,.44],
        [[.24,.46],[.39,.44],[.59,.58],[.46,.62]], [.52,.57], (.40,.90)),
    "don_ciccio": rig(.23, [.56,.23],
        ([.28,.28], [[.06,.25],[.40,.26],[.55,.46],[.30,.49]]), [.45,.46],
        [[.30,.49],[.55,.46],[.83,.50],[.82,.57],[.59,.55]], [.78,.52], (.54,.65)),
    "carmela": rig(.22, [.39,.22],
        ([.25,.28], [[.11,.26],[.35,.25],[.49,.40],[.30,.43]]), [.40,.40],
        [[.30,.43],[.49,.40],[.75,.43],[.82,.51],[.65,.52],[.44,.47]], [.72,.48], (.50,.89)),
    "capuano": rig(.235, [.50,.235],
        ([.28,.29], [[.08,.25],[.41,.26],[.43,.48],[.12,.50]]), [.28,.48],
        [[.12,.50],[.43,.48],[.47,.69],[.20,.70]], [.35,.66], (.55,.73)),
    "gregorio": rig(.24, [.63,.24],
        ([.48,.30], [[.30,.25],[.53,.27],[.61,.45],[.37,.47]]), [.48,.45],
        [[.37,.47],[.61,.45],[.63,.58],[.43,.60]], [.53,.57], (.49,.62)),
}
RIGS["gaetano"] = RIGS["gaetano_umano"]
RIGS["violante_scesa"] = RIGS["violante"]
RIGS["elsa"] = rig(.22, [.53,.22],
    ([.35,.28], [[.22,.25],[.46,.25],[.51,.43],[.31,.45]]), [.41,.43],
    [[.31,.45],[.51,.43],[.73,.39],[.77,.48],[.49,.51]], [.70,.45], (.55,.94))
RIGS["cesare"] = rig(.23, [.57,.23],
    ([.28,.28], [[.10,.25],[.41,.26],[.44,.46],[.14,.48]]), [.30,.46],
    [[.14,.48],[.44,.46],[.55,.66],[.29,.67]], [.44,.62], (.53,.70))
RIGS["lia"] = rig(.23, [.53,.23],
    ([.37,.28], [[.23,.25],[.48,.26],[.49,.43],[.27,.44]]), [.40,.43],
    [[.27,.44],[.49,.43],[.75,.46],[.77,.53],[.57,.52]], [.72,.49], (.57,.93))
RIGS["rosa"] = RIGS["carmela"]
RIGS["bianca"]["joint_overlap"] = .003
RIGS["bianca"]["motion"] = dict(torso=.001, head=.0015, arm_near=.001, hand_near=.001)
RIGS["mariella"]["motion"]["torso"] = 0
RIGS["mariella"]["motion"]["leg_near"] = 0
RIGS["mariella"]["motion"]["leg_far"] = 0
# Madre e figlia sono un solo dipinto: la bambina ha un proprio perno del collo.
RIGS["assunta"]["parts"].insert(1, part("head_child", [.73,.63], rect(.56,.51,1,.635)))
RIGS["assunta"]["motion"]["head_child"] = -.006

# Gli avversari dipinti condividono lo stesso sistema, con contorni propri.
RIGS["combat_guardia"] = RIGS["capuano"]
RIGS["combat_capitano"] = rig(.235, [.43,.235],
    ([.24,.29], [[.04,.25],[.35,.26],[.39,.48],[.08,.50]]), [.25,.48],
    [[.08,.50],[.39,.48],[.45,.65],[.18,.66]], [.32,.62], (.47,.71))
RIGS["combat_madre"] = rig(.21, [.54,.21],
    ([.37,.28], [[.26,.23],[.48,.24],[.53,.38],[.35,.40]]), [.45,.38],
    [[.35,.40],[.53,.38],[.82,.39],[.85,.47],[.56,.47]], [.77,.44])
RIGS["combat_madre"]["motion"] = dict(torso=.001, head=.002, arm_near=.002, hand_near=.003)
RIGS["combat_cavaliere"] = rig(.245, [.49,.245],
    ([.36,.28], [[.22,.25],[.44,.26],[.49,.36],[.32,.39]]), [.41,.36],
    [[.32,.39],[.49,.36],[.70,.27],[.75,.32],[.48,.42]], [.68,.31])
RIGS["combat_cavaliere"]["motion"]["torso"] = 0
RIGS["combat_spettro"] = dict(body_pivot=[.61,.52], parts=[
    part("head",[.76,.25],rect(.62,0,1,.27)),
    part("wing_far",[.59,.35],[[0,0],[.55,0],[.68,.32],[.58,.46],[.17,.29]]),
    part("tail",[.59,.62],rect(0,.62,1,1))],
    motion=dict(torso=.001,head=.003,wing_far=.025,tail=.006),joint_overlap=.002)
RIGS["combat_duellante"] = RIGS["taddeo"]

if __name__ == "__main__":
    target = Path(__file__).resolve().parents[2] / "src/data/npc_cutouts.json"
    target.write_text(json.dumps(RIGS, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(f"{len(RIGS)} configurazioni cutout: {target}")
    # I nuovi atlanti completi sostituiscono i ritagli del dipinto nelle build.
    from npc_puppets import build
    build()
