## Lanterniere v2 (CONTROLLO-SLICE3 punto 7): solleva le ombre del mantello perché la parte in luce
## non scenda sotto circa #3A4656 su fondale scuro. Curva sui toni scuri (il nero puro resta nero,
## i toni medi e la lanterna restano invariati). Uso: python schiarisci_lanterniere.py PNG
import sys, numpy as np
from PIL import Image
p=sys.argv[1]; a=np.asarray(Image.open(p).convert('RGBA')).astype(float)
c=a[...,:3]; L=c@np.array([0.299,0.587,0.114])
f=1+1.6*np.clip(1-L/120,0,1)
a[...,:3]=np.clip(c*f[...,None],0,255)
Image.fromarray(a.astype(np.uint8),'RGBA').save(p); print('ok',p)
