## Uniforma gli atlanti di Ferruccio sull'avorio del 02 (CONTROLLO-SLICE3 punto 3), da lanciare
## una volta dopo tono_02.py: attacco +15% di luminosità, corsa -15% di saturazione. Tinte invariate.
## Uso: DIR=cartella python uniforma_atlanti.py
import os, numpy as np
from PIL import Image
D=os.environ.get('DIR','src/assets/art/characters/ferruccio_cutout_v2/')
def edit(name,fn):
    a=np.asarray(Image.open(D+name).convert('RGBA')).astype(float)
    a[...,:3]=np.clip(fn(a[...,:3]),0,255); Image.fromarray(a.astype(np.uint8),'RGBA').save(D+name)
edit('frames_attacco.png',lambda c:c*1.15)
edit('frames_corsa.png',lambda c:(lambda m:m+(c-m)*0.85)(c@np.array([0.299,0.587,0.114])[:,None] if False else (0.299*c[...,0:1]+0.587*c[...,1:2]+0.114*c[...,2:3])))
print('ok')
