"""Pose deterministiche, angoli in gradi nel piano dello schermo (+ = orario).

Il movimento e le hitbox restano in Godot: questi cicli modificano solo la figura.
"""
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
    """Resetta lo scheletro e applica una posa normalizzata (t in 0..1)."""
    for b in arm.pose.bones:
        b.rotation_mode = 'QUATERNION'
        b.rotation_quaternion = Quaternion()
        b.location = (0, 0, 0)
        b.scale = (1, 1, 1)
    arm.pose.bones['hammer'].scale = (1,1,1) if clip == 'hammer' else (0,0,0)
    if clip == 'hammer': arm.pose.bones['sword'].scale = (0,0,0)
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
            lift += .45*math.sin(math.pi*t)
    elif clip in ('skid','dash'):
        angles.update({'chest':-18 if clip=='skid' else 42,'head':-15,'thigh.R':-38,
                       'thigh.L':40,'shin.L':-50,'upperarm.R':35,'upperarm.L':45,'scarf':105})
    elif clip in ('grapple','wall'):
        angles.update({'upperarm.L':-160,'forearm.L':-15,'upperarm.R':-20,'forearm.R':-30,'scarf':90,'thigh.R':-35,'shin.R':-50,'thigh.L':20})
    elif clip == 'heal':
        angles.update({'upperarm.R':-50,'forearm.R':-90,'upperarm.L':-45,'forearm.L':-90,'head':15,'chest':10,'scarf':35})
    elif clip in ('slash_a','slash_b','pogo','hammer'):
        # Anticipo (0..0.28), lama attiva (0.28..0.55), recupero (0.55..1).
        # La lama segue un arco davanti al corpo, con il polso compensato:
        # evita la rotazione rigida dell'intero braccio della prima versione.
        keys = [(0, -10, -25, 50), (.28, -105, -65, -100),
                (.55, -45, -10, 60), (1, -10, -25, 50)]
        if clip == 'slash_b':
            keys = [(0, -10, -25, 50), (.28, -20, -45, 95),
                    (.55, -110, -10, -65), (1, -10, -25, 50)]
        for a,b in zip(keys,keys[1:]):
            if a[0] <= t <= b[0]:
                k=(t-a[0])/(b[0]-a[0]); k=k*k*(3-2*k)
                upper,fore,blade=[a[j]+(b[j]-a[j])*k for j in range(1,4)]
                angles.update({'upperarm.R':upper,'forearm.R':fore,
                               'sword':blade-upper-fore,'chest':8*math.sin(t*math.pi),
                               'upperarm.L':30,'thigh.R':-12,'thigh.L':15,'scarf':65})
                break
        if clip=='pogo': angles.update({'upperarm.R':-5,'forearm.R':0,'sword':95,'thigh.R':-50,'shin.R':-65})
    elif clip == 'parry':
        angles.update({'upperarm.R':-65,'forearm.R':-45,'sword':-40,'chest':-8,'upperarm.L':-20})
    elif clip == 'hurt':
        angles.update({'chest':-22*(1-t),'head':-12,'upperarm.R':25,'upperarm.L':30,'scarf':90})
    elif clip == 'death':
        spin = -80*min(1,t*1.5)
        angles.update({'thigh.R':-20,'shin.R':-40,'upperarm.R':35,'sword':65})
    if clip == 'hammer': angles['hammer'] = angles['sword']
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
    translation = pivot-q@pivot + Vector((1.4*t-.3*max(0,(t-.7)/.3) if clip=='death' else 0,0,lift + (.65*t if clip=='death' else 0)))
    basis = root.bone.matrix_local.to_quaternion()
    root.rotation_quaternion = basis.inverted() @ q @ basis
    root.location = basis.inverted() @ translation
