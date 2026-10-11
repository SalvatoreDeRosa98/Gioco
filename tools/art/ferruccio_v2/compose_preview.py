import json,sys
from PIL import Image, ImageDraw
D=sys.argv[1]; out=sys.argv[2]; far=len(sys.argv)>3
r=json.load(open(D+'rig.json'))
can=Image.new('RGBA',tuple(r['canvas']),(88,88,88,255))
for s in sorted(r['sprites'],key=lambda s:s['z']):
    if s['bone'].endswith('_f') and not far: continue
    p=r['pieces'][s['piece']]
    im=Image.open(D+p['file']).convert('RGBA')
    pos=list(p['pos'])
    if s['bone'].endswith('_f'):
        b=r['bones'][s['bone']]['pivot']; nb=r['bones'][s['bone'][:-2]]['pivot']
        pos=[pos[0]+b[0]-nb[0],pos[1]+b[1]-nb[1]]
        im=Image.blend(im,Image.new('RGBA',im.size,(0,0,0,0)),0) 
    can.alpha_composite(im,tuple(pos))
d=ImageDraw.Draw(can)
for k,b in r['bones'].items():
    x,y=b['pivot']; d.ellipse((x-4,y-4,x+4,y+4),fill=(255,0,0))
can.save(out)
