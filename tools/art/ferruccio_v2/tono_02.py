## Schiarisce l'avorio e ravviva la sciarpa del Ferruccio 02 SENZA cambiare tinte, costume o
## macchie (CORREZIONI-FERRUCCIO-INGAME.md §6): curva di sola luminanza, il rapporto fra i canali
## (la tinta) di ogni pixel resta quello dello 02.
##   avorio: ombra #9C9086, mezzatinta #D0C2AE, luce #E6DAC8
##   sciarpa: #4A2219 / #7A3324 / #9C4430 (rosso ruggine del 02, solo più luminoso e saturo)
## I neri (maschera, guanti, scarpe), il metallo e gli occhi azzurri restano invariati.
## Uso: OUT=cartella python tono_02.py   (agisce su tutti i .png tranne mano_martello)
import os, numpy as np
from PIL import Image
OUT=os.environ.get('OUT','/workspace/artproc/ferr_v2/')
def L(h): c=[int(h[i:i+2],16) for i in (1,3,5)]; return 0.299*c[0]+0.587*c[1]+0.114*c[2]
CLOTH_SRC=[0,60,95,140,190,255]; CLOTH_DST=[0,60,L('#9C9086'),L('#D0C2AE'),L('#E6DAC8'),250]
SCARF_SRC=[0,38,55,90,255];       SCARF_DST=[0,L('#4A2219'),L('#7A3324'),L('#9C4430'),255]
def sstep(a,b,x): t=np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)
def tone(path):
    im=np.asarray(Image.open(path).convert('RGBA')).astype(float)
    rgb,al=im[...,:3],im[...,3:]
    r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]
    v=rgb.max(-1); s=(v-rgb.min(-1))/np.maximum(v,1)
    lum=0.299*r+0.587*g+0.114*b
    eye=(b>r+25)&(b>120)
    w_cloth=sstep(70,105,v)*(1-sstep(0.26,0.36,s))*(~eye)
    w_scarf=sstep(0.30,0.42,s)*((r>=g)&(r>=b)&(r-g>18))*sstep(20,35,v)*(1-w_cloth)
    gc=np.interp(lum,CLOTH_SRC,CLOTH_DST)/np.maximum(lum,1)
    gs=np.interp(lum,SCARF_SRC,SCARF_DST)/np.maximum(lum,1)
    out=rgb*(1+(gc[...,None]-1)*w_cloth[...,None])
    sc=rgb*gs[...,None]; m=sc.mean(-1,keepdims=True); sc=m+(sc-m)*1.15   # un filo più saturo, stessa tinta
    out=out*(1-w_scarf[...,None])+sc*w_scarf[...,None]
    Image.fromarray(np.clip(np.concatenate([out,al],-1),0,255).astype(np.uint8),'RGBA').save(path)
for f in sorted(os.listdir(OUT)):
    if f.endswith('.png') and f!='mano_martello.png':
        tone(os.path.join(OUT,f))
print('tono 02 applicato in',OUT)
