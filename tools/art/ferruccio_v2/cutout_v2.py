## Nuovo Ferruccio a ritaglio dal model sheet 02 (vista di profilo, figura centrale).
## Ricostruisce gli stessi pezzi e le stesse ossa del rig v1, cosi' le animazioni
## procedurali (data/ferruccio_anim.json) restano valide. Coordinate = pixel del foglio 02.
import numpy as np, json, os, sys, cv2
from PIL import Image, ImageDraw
from scipy import ndimage as nd
SRC=os.environ.get('SRC','/workspace/ferruccio-art/grok/02-ferruccio-model-sheet.png')
OUT=os.environ.get('OUT','/workspace/artproc/ferr_v2/')
OLD=os.environ.get('OLD','/workspace/Gioco-gameplay/src/assets/art/characters/ferruccio_cutout/rig.json')
os.makedirs(OUT,exist_ok=True)
X0,Y0,X1,Y1=466,0,862,674
a=np.asarray(Image.open(SRC).convert('RGB')).astype(np.int16)[Y0:Y1,X0:X1]
H,W=a.shape[:2]
bg=np.median(np.concatenate([a[0:15].reshape(-1,3),a[:,0:6].reshape(-1,3)]),axis=0)
diff=np.abs(a-bg).max(axis=2); sat=a.max(axis=2)-a.min(axis=2); val=a.max(axis=2)
r,g,b=a[...,0],a[...,1],a[...,2]
yy,xx=np.mgrid[0:H,0:W]; YY=yy+Y0; XX=xx+X0
bgl=(diff<16)&(sat<12)
lab,_=nd.label(bgl)
edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
fg=~np.isin(lab,list(edge))
_bs=nd.sum(bgl,lab,range(1,lab.max()+1)); fg&=~np.isin(lab,[i+1 for i,v in enumerate(_bs) if v>600])
fg&=~((YY>652)&(sat<20)&(val<bg[0]+10))   # ombra a terra
fl,fn=nd.label(fg); sz=nd.sum(fg,fl,range(1,fn+1)); objs=nd.find_objects(fl)
fg=np.isin(fl,[i+1 for i,s in enumerate(sz) if s>120 and objs[i][1].start+X0<820])
def poly(pts):
    m=Image.new('L',(W,H),0); ImageDraw.Draw(m).polygon([(x-X0,y-Y0) for x,y in pts],fill=255); return np.asarray(m)>0
def seg(p,q,w):
    m=Image.new('L',(W,H),0); ImageDraw.Draw(m).line([(p[0]-X0,p[1]-Y0),(q[0]-X0,q[1]-Y0)],fill=255,width=w); return np.asarray(m)>0
red=(r-(g+b)/2>14)&(r>55)
# --- stocco: lama sottile su fondo grigio (soglia più bassa), elsa e pomo
blade=seg((652,438),(858,642),16)&(diff>9)&(val<190)
hilt=(seg((586,362),(652,436),16)|poly([(628,412),(684,398),(690,418),(646,452),(624,452)]))&fg&(val<150)
glove=poly([(598,343),(658,343),(662,428),(606,428)])&fg&(val<85)
mano=blade|hilt|glove
fg|=blade
# --- sciarpa
tail=poly([(466,150),(600,120),(578,168),(568,250),(560,330),(530,410),(466,410)])&fg&(XX<572)
tail|=poly([(560,112),(626,112),(620,170),(572,172)])&fg&red
nodo=poly([(600,108),(700,108),(706,240),(655,240),(626,170)])&fg&red
tail&=~nodo
scarf=tail|nodo
head=fg&((YY<112)|(poly([(596,90),(670,90),(668,142),(626,146),(600,128)])&~red))&~scarf
# --- braccio vicino
manica_su=poly([(572,148),(642,146),(652,200),(656,272),(572,278),(566,200)])&fg&~scarf&~head
manica_giu=poly([(566,272),(658,266),(660,352),(642,360),(600,360),(568,348)])&fg&~scarf&~mano
# --- gambe (vicina = sinistra nel foglio)
coscia=poly([(566,440),(628,440),(632,528),(578,528)])&fg&~mano
stinco=poly([(580,518),(626,518),(624,634),(582,634)])&fg&~mano
piede=poly([(566,626),(624,626),(664,640),(668,674),(566,674)])&fg
# --- busto: tutto il resto sopra l'orlo; buchi del braccio ridipinti (inpaint)
upper=(YY<462)&~(YY>=440)|((YY>=440)&(YY<462)&~coscia)
busto=fg&upper&(XX>=545)&~head&~scarf&~manica_su&~manica_giu&~mano
hole=(manica_su|manica_giu|glove|hilt)&poly([(578,150),(668,150),(690,300),(700,455),(560,455)])
bgr=np.ascontiguousarray(a[...,::-1].astype(np.uint8))
inp=cv2.inpaint(bgr,hole.astype(np.uint8)*255,11,cv2.INPAINT_TELEA)[...,::-1].astype(np.int16)
busto_rgb=np.where(hole[...,None],inp,a)
busto_m=busto|hole
pieces={'testa':(head,a),'nodo':(nodo,a),'busto':(busto_m,busto_rgb),'manica_su':(manica_su,a),'manica_giu':(manica_giu,a),
 'mano':(mano,a),'pugno':(glove,a),'coscia':(coscia,a),'stinco':(stinco,a),'piede':(piede,a)}
# catena della sciarpa (dietro la schiena): tre tratti
s1=tail&(YY<200); s2=tail&(YY>=200)&(YY<285); s3=tail&(YY>=285)
pieces.update({'sciarpa1':(s1,a),'sciarpa2':(s2,a),'sciarpa3':(s3,a)})
soft=np.clip((diff-3)/22,0,1)
top=int(np.argmax(fg.any(axis=1))); bot=int(H-np.argmax(fg[::-1].any(axis=1)))
S=1004.0/(bot-top)
def C(x,y): return [round((x-X0)*S+12), round((y-Y0-top)*S+8)]
pos={}
for k,(m,rgb) in pieces.items():
    m2=m|(nd.binary_dilation(m,iterations=2)&fg&~(scarf if k in('busto','manica_su','manica_giu') else np.zeros_like(fg)))
    ring=m2&~nd.binary_erosion(m2,iterations=1)
    al=np.where(m2,1.0,0.0)
    excl=hole if k=='busto' else np.zeros_like(fg)
    al=np.where(ring&~excl, np.minimum(1.0,np.maximum(soft,0.25)),al)
    rgbx=np.where(m2[...,None],rgb,0).astype(np.uint8)
    img=Image.fromarray(np.dstack([rgbx,(al*255).astype(np.uint8)]),'RGBA')
    bb=img.getbbox(); img=img.crop(bb)
    img=img.resize((max(1,round(img.width*S)),max(1,round(img.height*S))),Image.LANCZOS)
    img.save(OUT+k+'.png')
    pos[k]=[round(bb[0]*S+12),round((bb[1]-top)*S+8)]
B={'root':(606,top+Y0+(bot-top)-1),'hips':(615,305),'torso':(615,292),'neck':(616,128),'shoulder':(608,166),
 'elbow':(606,272),'wrist':(628,352),'thigh':(600,335),'knee':(600,520),'ankle':(603,628),
 'scarf1':(592,140),'scarf2':(552,205),'scarf3':(526,288),'shoulder_f':(640,170),'elbow_f':(646,276),
 'wrist_f':(662,352),'thigh_f':(630,335),'knee_f':(635,520),'ankle_f':(640,616)}
old=json.load(open(OLD))
rig={'_doc':'Ferruccio v2 a ritaglio dal model sheet 02 (arte approvata in ferruccio-art/grok): stessi pezzi, ossa e animazioni del rig v1. Generato da tools/art/ferruccio_v2/cutout_v2.py.',
 'canvas':[round(W*S)+24,1024],'feet':C(*B['root']),'far_tint':old['far_tint'],'bones':{},'pieces':{},'sprites':old['sprites']}
for k,v in old['bones'].items(): rig['bones'][k]={'pivot':C(*B[k]),'parent':v['parent']}
for k in pieces: rig['pieces'][k]={'file':k+'.png','pos':pos[k]}
json.dump(rig,open(OUT+'rig.json','w'),indent=1)
print('S=%.3f canvas %s feet %s'%(S,rig['canvas'],rig['feet']))
