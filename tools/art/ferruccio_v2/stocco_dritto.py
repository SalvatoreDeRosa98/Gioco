## Lama dritta (stocco) nel primo fotogramma dell'attacco: la 07 disegna una sciabola curva.
## Cancella la lama curva sopra la guardia e ridisegna uno stocco dritto che parte dalla stessa
## guardia, con la tangenza iniziale della lama originale. Coordinate in pixel dell'atlante
## frames_attacco.png prodotto da frames_v2.py. Uso: OUT=... python stocco_dritto.py
import os, numpy as np
from PIL import Image, ImageDraw
OUT=os.environ.get('OUT','/workspace/artproc/ferr_v2/')
p=OUT+'frames_attacco.png'
im=Image.open(p).convert('RGBA'); a=np.array(im)
H,W=a.shape[:2]; yy,xx=np.mgrid[0:H,0:W]
erase=((yy<104)&(xx>79)&(xx<118))|((yy<88)&(xx>=118)&(xx<412))
a[erase]=0
base=Image.fromarray(a,'RGBA')
S=4  # supercampionamento
g=(80,104); d=np.array([0.9,-0.43]); d/=np.linalg.norm(d); L=232
t=(g[0]+d[0]*L,g[1]+d[1]*L); n=np.array([-d[1],d[0]])
lay=Image.new('RGBA',(W*S,H*S),(0,0,0,0)); dr=ImageDraw.Draw(lay)
def quad(w0,w1,col):
    pts=[(g[0]+n[0]*w0,g[1]+n[1]*w0),(t[0]+n[0]*w1,t[1]+n[1]*w1),(t[0]-n[0]*w1,t[1]-n[1]*w1),(g[0]-n[0]*w0,g[1]-n[1]*w0)]
    dr.polygon([(x*S,y*S) for x,y in pts],fill=col)
quad(3.2,0.6,(42,44,50,255))      # filo scuro
quad(2.0,0.35,(150,156,162,255))  # acciaio
o=1.0;  # riflesso sul lato in luce
pts=[(g[0]-n[0]*o,g[1]-n[1]*o),(t[0],t[1])]
dr.line([(x*S,y*S) for x,y in pts],fill=(214,218,222,255),width=S)
lay=lay.resize((W,H),Image.LANCZOS)
out=Image.new('RGBA',(W,H)); out.alpha_composite(lay); out.alpha_composite(base)  # mano e guardia sopra la lama
out.save(p); print('stocco dritto:',p)
