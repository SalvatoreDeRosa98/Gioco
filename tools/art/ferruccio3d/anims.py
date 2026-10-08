"""Pose deterministiche, angoli in gradi nel piano dello schermo (+ = orario).

Il movimento e le hitbox restano in Godot: questi cicli modificano solo la figura.
"""
import math
from mathutils import Vector, Quaternion

CLIPS = {
    'idle': (16, 12, True), 'run': (16, 24, True),
    'rise': (6, 18, False), 'fall': (6, 18, False),
    'double_jump': (12, 24, False), 'skid': (6, 20, False),
    'dash': (6, 24, False), 'slash_a': (9, 30, False),
    'slash_b': (9, 30, False), 'pogo': (8, 30, False),
    'parry': (6, 24, False), 'hurt': (6, 24, False), 'death': (12, 18, False),
}

def pose(arm, clip, t):
    """Resetta lo scheletro e applica una posa normalizzata (t in 0..1)."""
    for b in arm.pose.bones:
        b.rotation_mode = 'QUATERNION'
        b.rotation_quaternion = Quaternion()
        b.location = (0, 0, 0)
        b.scale = (1, 1, 1)
    angles = {'sword': 65, 'scarf': 45}
    phase = t * math.tau
    lift = 0.0
    spin = 0.0
    if clip == 'idle':
        angles.update(chest=2*math.sin(phase), head=-math.sin(phase), scarf=35+5*math.sin(phase))
    elif clip == 'run':
        swing = math.sin(phase)
        angles.update(chest=12, head=-8, scarf=85+12*math.sin(phase+1))
        angles.update({'thigh.R':-42*swing,'thigh.L':42*swing,
                      'shin.R':-max(0,-swing)*65,'shin.L':-max(0,swing)*65,
                      'upperarm.R':28*swing-15,'upperarm.L':-35*swing,
                      'forearm.R':-35,'forearm.L':-25,'sword':65})
        lift = .035*abs(math.cos(phase))
    elif clip in ('rise','fall','double_jump'):
        angles.update({'thigh.R':-35,'thigh.L':25,'shin.R':-65,'shin.L':-40,
                       'upperarm.R':-35,'upperarm.L':30,'forearm.R':-30,'scarf':100})
        if clip == 'fall': angles.update({'thigh.R':-15,'thigh.L':15,'shin.R':-20,'shin.L':-10,'scarf':130})
        if clip == 'double_jump':
            angles.update({'thigh.R':-65,'thigh.L':-40,'chest':25,'sword':85})
            spin = -360*t
    elif clip in ('skid','dash'):
        angles.update({'chest':-18 if clip=='skid' else 42,'head':-15,'thigh.R':-38,
                       'thigh.L':40,'shin.L':-50,'upperarm.R':35,'upperarm.L':45,'scarf':105})
    elif clip in ('slash_a','slash_b','pogo'):
        # Anticipo breve, taglio rapido, recupero leggibile.
        k = min(1, max(0, (t-.15)/.5))
        sweep = -110+155*k if clip!='slash_b' else 35-145*k
        if t>.72: sweep *= 1-(t-.72)/.28
        angles.update({'upperarm.R':sweep,'forearm.R':-30,'sword':-20,'chest':12*k,
                       'upperarm.L':35,'thigh.R':-15,'thigh.L':20,'scarf':70})
        if clip=='pogo': angles.update({'upperarm.R':-5,'forearm.R':0,'sword':100,'thigh.R':-50,'shin.R':-65})
    elif clip == 'parry':
        angles.update({'upperarm.R':-65,'forearm.R':-45,'sword':-40,'chest':-8,'upperarm.L':-20})
    elif clip == 'hurt':
        angles.update({'chest':-22*(1-t),'head':-12,'upperarm.R':25,'upperarm.L':30,'scarf':90})
    elif clip == 'death':
        spin = -80*min(1,t*1.5)
        angles.update({'thigh.R':-20,'shin.R':-40,'upperarm.R':35,'sword':65})
    angles['skirt_f'] = angles.get('thigh.R',0)*.6
    angles['skirt_b'] = angles.get('thigh.L',0)*.6
    angles['hat_tip'] = 5*math.sin(phase)
    for name, angle in angles.items():
        b = arm.pose.bones[name]
        axis = b.bone.matrix_local.to_quaternion().inverted() @ Vector((0,1,0))
        b.rotation_quaternion = Quaternion(axis, math.radians(angle))
    root = arm.pose.bones['root']
    q = Quaternion(Vector((0,1,0)), math.radians(spin))
    pivot = Vector((0,0,.95 if clip=='double_jump' else .12))
    translation = pivot-q@pivot + Vector((.65*t if clip=='death' else 0,0,lift))
    basis = root.bone.matrix_local.to_quaternion()
    root.rotation_quaternion = basis.inverted() @ q @ basis
    root.location = basis.inverted() @ translation
