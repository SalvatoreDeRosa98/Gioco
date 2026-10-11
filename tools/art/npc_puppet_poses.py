"""Anatomical proportions, painted joint overlap and authored NPC keyframe clips."""
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def build():
    """Write reusable anatomy compatible with Ferruccio's named animation bones."""
    bones = {
        'root': dict(parent='', offset=[0, 0]),
        'hips': dict(parent='root', offset=[0, -480]),
        'torso': dict(parent='hips', offset=[0, 0]),
        'head': dict(parent='torso', offset=[0, -310]),
        'shoulder_f': dict(parent='torso', offset=[35, -320]),
        'elbow_f': dict(parent='shoulder_f', offset=[0, 155]),
        'wrist_f': dict(parent='elbow_f', offset=[0, 140]),
        'shoulder': dict(parent='torso', offset=[-25, -320]),
        'elbow': dict(parent='shoulder', offset=[0, 155]),
        'wrist': dict(parent='elbow', offset=[0, 140]),
        'thigh_f': dict(parent='hips', offset=[27, 0]),
        'knee_f': dict(parent='thigh_f', offset=[0, 225]),
        'ankle_f': dict(parent='knee_f', offset=[0, 210]),
        'thigh': dict(parent='hips', offset=[-22, 0]),
        'knee': dict(parent='thigh', offset=[0, 225]),
        'ankle': dict(parent='knee', offset=[0, 210]),
    }
    pieces = {}
    for name, span, anchor, z in [
        ('head', 160, [.45,.94], 3), ('torso', 350, [.52,.78],0),
        ('shoulder',210,[.50,.13],4),('shoulder_f',210,[.50,.13],-3),
        ('elbow',205,[.50,.13],5),('elbow_f',205,[.50,.13],-2),
        ('wrist',75,[.50,.12],6),('wrist_f',75,[.50,.12],-1),
        ('thigh',195,[.50,.13],-1),('thigh_f',195,[.50,.13],-3),
        ('knee',195,[.50,.13],-1),('knee_f',195,[.50,.13],-3),
        ('ankle',85,[.32,.35],-1),('ankle_f',85,[.32,.35],-3),
    ]:
        pieces[name] = dict(bone=name,span=span,anchor=anchor,z=z)
    standing = dict(bones=bones,pieces=pieces)
    dress = copy.deepcopy(standing)
    for name in ['thigh','thigh_f','knee','knee_f']:
        dress['pieces'][name]['span'] = 235
        dress['pieces'][name]['anchor'][1] = .14
    dress['pieces']['thigh']['span'] = 485
    dress['pieces']['thigh_f']['span'] = 480
    dress['motion_scale'] = dict(thigh=.28,thigh_f=.28,knee=.5,knee_f=.5)
    seated = copy.deepcopy(dress)
    seated['bones']['ankle']['offset'][1] = 210
    seated['bones']['ankle_f']['offset'][1] = 210
    seated['pieces']['knee']['span'] = 330
    seated['pieces']['knee_f']['span'] = 330
    seated['pieces']['thigh']['span'] = 230
    seated['pieces']['thigh_f']['span'] = 230
    seated['motion_scale'] = {}
    kneeling = copy.deepcopy(standing)
    kneeling['bones']['hips']['offset'][1] = -200
    insect = copy.deepcopy(standing)
    # Non-human wing/leg atlas uses its own pre-existing attachment geometry.
    insect['bones']['hips']['offset'][1] = -350
    insect['bones']['head']['offset'] = [20,-355]
    for name in ['knee','knee_f','ankle','ankle_f']:
        insect['bones'][name]['offset'][1] = 155
    for name in ['elbow','elbow_f']:
        insect['bones'][name]['offset'][1] = 170
    for name in ['wrist','wrist_f']:
        insect['bones'][name]['offset'][1] = 165
    insect['pieces']['head']['span'] = 290
    insect['pieces']['torso']['span'] = 420
    insect['pieces']['torso']['anchor'] = [.52,.93]
    insect['bones']['shoulder']['offset'] = [-25,-270]
    insect['bones']['shoulder_f']['offset'] = [-15,-290]
    # Wings are independent appendages; arms must not hang from their tips.
    insect['bones']['elbow'] = dict(parent='torso',offset=[-30,-270])
    insect['bones']['elbow_f'] = dict(parent='torso',offset=[35,-260])
    insect['pieces']['shoulder']['span'] = 420
    insect['pieces']['shoulder_f']['span'] = 420
    insect['pieces']['shoulder']['anchor'] = [.80,.85]
    insect['pieces']['shoulder_f']['anchor'] = [.80,.85]
    statue = copy.deepcopy(dress)
    accessories = {}
    for name, span, anchor, bone in [
        ('sword',430,[.5,.12],'wrist'),('hammer',210,[.5,.82],'wrist'),
        ('cheese',100,[.5,.5],'wrist'),('scarf',240,[.5,.05],'wrist'),
        ('handkerchief',140,[.5,.05],'wrist'),('basket',190,[.18,.30],'wrist'),
        ('book',160,[.5,.5],'wrist'),('keys',160,[.5,.05],'hips'),
        ('shuttle',120,[.5,.5],'wrist'),('cane',410,[.5,.04],'wrist'),
        ('halberd',600,[.5,.52],'wrist'),('orb',140,[.5,.5],'wrist'),
        ('chair',600,[.50,1.0],''),
        ('lily',460,[.50,.75],'wrist'),('books',230,[.50,.40],'wrist'),
        ('pedestal',240,[.50,1.0],''),('cloak',670,[.50,.05],'torso'),
    ]:
        accessories[name] = dict(span=span,anchor=anchor,bone=bone,z=7)
    accessories['keys']['position'] = [50,0]
    accessories['lantern'] = dict(span=170,anchor=[.5,.06],bone='wrist',z=7)
    accessories['rat_tail'] = dict(span=340,anchor=[.08,.08],bone='hips',z=-7,position=[-45,0])
    accessories['chair']['position'] = [-35,47]
    accessories['chair']['z'] = -8
    accessories['cloak']['position'] = [-25,-265]
    accessories['cloak']['span'] = 550
    accessories['cloak']['z'] = -6
    accessories['pedestal']['z'] = -6
    accessories['sword']['angle'] = -35
    for profile in [standing,dress,seated,kneeling,insect,statue]:
        profile['shoulder_x_fraction'] = -.32

    def clip(length, poses):
        return dict(fps=12,loop=True,progress=False,length=length,
                    keys=[dict(t=t,ease='inout',pose=p) for t,p in poses])

    rest = dict(shoulder=0,elbow=-6,wrist=0,shoulder_f=4,elbow_f=-6,
                torso=0,neck=0,thigh=-1,thigh_f=1)
    idle_b = dict(rest,torso=.6,neck=1.5,shoulder=-2,elbow=-8,hips_y=-2)
    talk_a = dict(rest,shoulder=-18,elbow=-65,wrist=-10,neck=-2,torso=-2)
    talk_b = dict(rest,shoulder=-42,elbow=-42,wrist=-22,neck=5,torso=3,
                  shoulder_f=12,elbow_f=-18)
    talk_c = dict(rest,shoulder=-8,elbow=-72,wrist=12,neck=0,torso=1)
    clips = {
        'npc_idle': clip(3.0,[(0,rest),(1.5,idle_b),(3,rest)]),
        'talk': clip(2.4,[(0,talk_a),(.7,talk_b),(1.4,talk_c),(2.4,talk_a)]),
    }
    seat = dict(rest,thigh=-87,thigh_f=-84,knee=86,knee_f=85,
                shoulder=-23,elbow=-70,wrist=2,shoulder_f=-18,elbow_f=-78)
    clips['seated_idle'] = clip(3,[(0,seat),(1.5,dict(seat,neck=3,torso=2)),(3,seat)])
    clips['seated_talk'] = clip(2.4,[(0,seat),(.8,dict(seat,elbow=-42,shoulder=-42,neck=4)),
                                        (1.6,dict(seat,wrist=-18,neck=-3)),(2.4,seat)])
    kneel = dict(rest,thigh=72,thigh_f=68,knee=-132,knee_f=-128,
                 shoulder=-20,elbow=-42,wrist=-8,neck=6)
    clips['kneeling_idle'] = clip(3,[(0,kneel),(1.5,dict(kneel,neck=9,torso=4)),(3,kneel)])
    clips['kneeling_talk'] = clip(2.4,[(0,kneel),(1.2,dict(kneel,shoulder=-38,elbow=-52,neck=-3)),(2.4,kneel)])
    insect_rest = dict(rest,neck=-2,shoulder=-10,shoulder_f=10,elbow=4,elbow_f=-4,
                       thigh=5,thigh_f=-5,knee=3,knee_f=-3)
    clips['insect_idle'] = clip(.6,[(0,insect_rest),(.3,dict(insect_rest,neck=3,shoulder=18,shoulder_f=-18)),(.6,insect_rest)])
    cast = dict(rest,shoulder=-42,elbow=-50,wrist=-12,neck=-4,torso=-4)
    clips['cast'] = clip(1,[(0,rest),(.32,cast),(.50,dict(cast,shoulder=-82,elbow=-12,torso=8)),(1,rest)])
    clips['cast']['loop'] = False
    combat = dict(windup=dict(clip='slash_a',start=0,end=.32),
                  strike=dict(clip='slash_a',start=.36,end=1),
                  cast_windup=dict(clip='cast',start=0,end=.32),
                  cast_strike=dict(clip='cast',start=.36,end=1),
                  crouch=dict(clip='parry',start=0,end=1))
    output = dict(profiles=dict(standing=standing,dress=dress,seated=seated,
                               kneeling=kneeling,insect=insect,statue=statue),
                  accessories=accessories,clips=clips,transition_speed=14,hand_grip=35,
                  combat=combat,secondary=dict(cloak_angle=4,cloak_period=2.0),
                  animated=list(bones)+['neck','hips_x','hips_y','root_x','root_y','root_rot'])
    (ROOT/'src/data/npc_puppet_anatomy.json').write_text(json.dumps(output,indent=2)+'\n',encoding='utf8')


if __name__ == '__main__':
    build()
