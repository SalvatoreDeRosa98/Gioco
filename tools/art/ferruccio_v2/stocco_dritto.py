## Lama dritta (stocco) nei fotogrammi 1 e 2 dell'attacco: la 07 disegna lame curve.
## ONLY=2 per applicarlo a un solo fotogramma (es. su un atlante già lavorato).
## Cancella la lama curva sopra la guardia e ridisegna uno stocco dritto che parte dalla stessa
## guardia, con la tangenza iniziale della lama originale. Coordinate in pixel dell'atlante
## frames_attacco.png prodotto da frames_v2.py. Uso: OUT=... python stocco_dritto.py
import os, numpy as np
from PIL import Image, ImageDraw
OUT=os.environ.get('OUT','/workspace/artproc/ferr_v2/')
p=OUT+'frames_attacco.png'
# (fotogramma, zona da cancellare come lista di rettangoli x0,y0,x1,y1, guardia, punta) in pixel
# dell'atlante. Fotogramma 1: sciabola curva della 07; fotogramma 2: lama ancora leggermente curva.
BLADES=[
 (1,[(79,0,118,104),(118,0,412,88)],(80,104),None),
 (2,[(412+360,100,412+496,100+75),(412+352,100,412+360,100+62)],(412+349,100+74),(412+478,100+6)),
]
ONLY=[int(x) for x in os.environ.get('ONLY','1,2').split(',')]
im=Image.open(p).convert('RGBA'); a=np.array(im)
H,W=a.shape[:2]
S=4  # supercampionamento
lay=Image.new('RGBA',(W*S,H*S),(0,0,0,0)); dr=ImageDraw.Draw(lay)
for idx,rects,g,tip in BLADES:
    if idx not in ONLY: continue
    for x0,y0,x1,y1 in rects: a[y0:y1,x0:x1]=0
    if tip is None:
        d=np.array([0.9,-0.43]); d/=np.linalg.norm(d); L=232
        t=(g[0]+d[0]*L,g[1]+d[1]*L)
    else:
        t=tip; d=np.array([t[0]-g[0],t[1]-g[1]],float); d/=np.linalg.norm(d)
    n=np.array([-d[1],d[0]])
    def quad(w0,w1,col):
        pts=[(g[0]+n[0]*w0,g[1]+n[1]*w0),(t[0]+n[0]*w1,t[1]+n[1]*w1),(t[0]-n[0]*w1,t[1]-n[1]*w1),(g[0]-n[0]*w0,g[1]-n[1]*w0)]
        dr.polygon([(x*S,y*S) for x,y in pts],fill=col)
    quad(3.2,0.6,(42,44,50,255))      # filo scuro
    quad(2.0,0.35,(150,156,162,255))  # acciaio
    dr.line([((g[0]-n[0])*S,(g[1]-n[1])*S),(t[0]*S,t[1]*S)],fill=(214,218,222,255),width=S)  # riflesso
base=Image.fromarray(a,'RGBA')
lay=lay.resize((W,H),Image.LANCZOS)
out=Image.new('RGBA',(W,H)); out.alpha_composite(lay); out.alpha_composite(base)  # mano e guardia sopra la lama
out.save(p); print('stocco dritto:',p,ONLY)
