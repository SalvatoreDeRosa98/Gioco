## NON PIÙ USATO: per decisione di Salvatore Ferruccio resta con le tinte originali dello 02 (vedi rig.json _doc).
## Ricolora pezzi e fotogrammi del Ferruccio v2 secondo CORREZIONI-FERRUCCIO-INGAME.md (§2):
## casacca/calzoni/cappello bianco con ombre grigio-fredde, neri #16171B/#0D0E11, sciarpa #74302A
## (luce #A8402F, ombra #49241D), lama acciaio, occhio bianco con alone #8FD3FF.
## I colori sono salvati moltiplicati per WHITE_POINT (0,82): lo shader del rig li divide per
## lo stesso valore, così a schermo escono i colori obiettivo. Uso: python recolor_v2.py SRC DST
import sys, os, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd
SRC, DST = sys.argv[1], sys.argv[2]
WHITE_POINT = 0.82
def hexc(h): return np.array([int(h[i:i+2],16) for i in (1,3,5)],float)
def ramp(t, stops):
    # stops: lista (posizione, colore)
    out=np.zeros(t.shape+(3,))
    for (p0,c0),(p1,c1) in zip(stops[:-1],stops[1:]):
        m=(t>=p0)&(t<=p1); u=((t-p0)/max(p1-p0,1e-6))[...,None]
        out[m]=(c0+(c1-c0)*u)[m]
    return out
CLOTH=[(0,hexc('#5E6068')),(0.35,hexc('#9A9DA6')),(0.72,hexc('#D8D3CC')),(1,hexc('#ECE8E0'))]
INKR=[(0,hexc('#0D0E11')),(0.6,hexc('#16171B')),(1,hexc('#3A3D45'))]
SCARF=[(0,hexc('#49241D')),(0.5,hexc('#74302A')),(1,hexc('#A8402F'))]
STEEL=[(0,hexc('#4A5058')),(0.5,hexc('#9AA3AA')),(1,hexc('#E8ECEF'))]
EYE_HALO,EYE_OUT=hexc('#8FD3FF'),hexc('#5FA8E0')
def recolor(path,out):
    im=Image.open(path).convert('RGBA'); a=np.asarray(im).astype(float)
    rgb,al=a[...,:3],a[...,3]
    r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]
    val=rgb.max(-1)
    eye=(b>r+35)&(val>140)
    scarf=((((r-g)/(r+1)>0.28)&(r>40))|((r>g*1.25)&(r-g>7)&(val<52)))&~eye
    dark=(val<52)&~scarf&~eye
    metal=(np.abs(r-b)<7)&(val>=52)&~eye&~scarf
    cloth=~(eye|scarf|dark|metal)
    o=rgb.copy()
    o[cloth]=ramp(np.clip((val-45)/125.0,0,1)**0.75,CLOTH)[cloth]
    o[dark]=ramp(np.clip(val/52.0,0,1),INKR)[dark]
    o[scarf]=ramp(np.clip((val-20)/90.0,0,1),SCARF)[scarf]
    o[metal]=ramp(np.clip((val-50)/150.0,0,1),STEEL)[metal]
    o*=WHITE_POINT
    o[eye]=255.0   # nucleo bianco
    img=Image.fromarray(np.clip(np.dstack([o,al]),0,255).astype(np.uint8),'RGBA')
    if eye.sum()>3:
        base=nd.binary_dilation(eye,iterations=1)
        for col,rad,alpha in ((EYE_OUT,max(4,im.height/90),0.5),(EYE_HALO,max(2,im.height/180),0.8)):
            m=Image.fromarray((base*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=rad))
            ga=np.asarray(m).astype(float)/255.0
            ga=np.clip(ga/max(ga.max(),1e-6),0,1)*alpha
            layer=Image.fromarray(np.dstack([np.broadcast_to(col,ga.shape+(3,)),ga*255]).astype(np.uint8),'RGBA')
            img.alpha_composite(layer)
        core=Image.fromarray(np.dstack([np.full(eye.shape+(3,),255.0),eye*255.0]).astype(np.uint8),'RGBA')
        img.alpha_composite(core)
    img.save(out)
os.makedirs(DST,exist_ok=True)
for f in sorted(os.listdir(SRC)):
    if f.endswith('.png') and f!='mano_martello.png':
        recolor(os.path.join(SRC,f),os.path.join(DST,f))
