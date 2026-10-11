## Pose a fotogrammi di Ferruccio dai fogli 02 finali a griglia 4x2 (sfondo grigio #808080):
##   15-ferruccio-salto-scatto-colpito-02.jpg -> frames_salto.png
##   16-ferruccio-parata-rampino-martello-cura-02.jpg -> frames_azioni.png
## (la 14 è annullata e non va usata). Scontorno con alpha pulito, 4 px di margine per
## fotogramma, stessa scala dei fotogrammi 07/08 (figura in piedi = 1004*0.95 px di tela),
## ancora ai piedi (fondo del riquadro). Scrive pose_clips.json: nome posa -> rettangolo.
import numpy as np, json, os
from PIL import Image
from scipy import ndimage as nd
SRCDIR=os.environ.get('SRCDIR','/workspace/ferruccio-art/grok/')
OUT=os.environ.get('OUT','/workspace/artproc/ferr_v2/')
M=4
SHEETS={
 'frames_salto':('15-ferruccio-salto-scatto-colpito-02.jpg',
   ['salita','apice','caduta','doppio_salto','scatto','fine_scatto','colpito','ripresa_colpo']),
 'frames_azioni':('16-ferruccio-parata-rampino-martello-cura-02.jpg',
   ['parata','riposta','lancio_rampino','appeso','martello_carica','martello_colpo','cura','ripresa']),
}
def cut(fname,names,ref_height=1004*0.95,mult=0.5):
    a=np.asarray(Image.open(SRCDIR+fname).convert('RGB')).astype(np.int16)
    H,W=a.shape[:2]
    bg=np.median(np.concatenate([a[0:8].reshape(-1,3),a[-8:].reshape(-1,3),a[:,:8].reshape(-1,3)]),axis=0)
    diff=np.abs(a-bg).max(axis=2); sat=a.max(axis=2)-a.min(axis=2); val=a.max(axis=2)
    bgl=(diff<14)&(sat<12)
    lab,_=nd.label(bgl)
    edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    fg=~np.isin(lab,list(edge))
    _bs=nd.sum(bgl,lab,range(1,lab.max()+1)); fg&=~np.isin(lab,[i+1 for i,v in enumerate(_bs) if v>400])
    # ombra a terra: grigia, poco satura, poco più scura dello sfondo, sotto i piedi di ogni riga
    yy=np.arange(H)[:,None]
    shadow=np.zeros_like(fg)
    for r in range(2):
        y0,y1=r*H//2,(r+1)*H//2
        rows=np.where(fg[y0:y1].any(axis=1))[0]; low=y0+rows.max()
        shadow|=(sat<16)&(val<bg[0]+4)&(val>bg[0]-45)&(yy>low-34)&(yy<=low+2)
    fg&=~shadow
    l,k=nd.label(fg); s=nd.sum(fg,l,range(1,k+1)); fg=np.isin(l,[i+1 for i,v in enumerate(s) if v>25])
    # semi: busto di ogni figura (fascia centrale della cella); crescita geodetica dentro la sagoma,
    # così lame, catene e martelli che escono dalla cella restano alla figura giusta;
    # i pezzi staccati (scintille, detriti, punte) vanno alla figura più vicina entro 80 px.
    seeds=np.zeros(fg.shape,np.int32)
    for r in range(2):
        for c in range(4):
            y0,y1=r*H//2,(r+1)*H//2; x0,x1=c*W//4,(c+1)*W//4
            m=fg[y0:y1,x0:x1]; ys,xs=np.where(m); t,bt=ys.min(),ys.max(); hh=bt-t
            band=(ys>t+hh*0.3)&(ys<t+hh*0.5); cx=int(np.median(xs[band])); cy=int(t+hh*0.4)
            sl=np.zeros_like(fg); sl[y0+cy-30:y0+cy+30,x0+cx-22:x0+cx+22]=True
            seeds[sl&fg]=r*4+c+1
    lab=seeds.copy()
    while True:
        dil=nd.grey_dilation(lab,size=(3,3)); nw=(lab==0)&fg&(dil>0)
        if not nw.any(): break
        lab[nw]=dil[nw]
    rest=fg&(lab==0)
    if rest.any():
        dist,(iy,ix)=nd.distance_transform_edt(lab==0,return_indices=True)
        near=lab[iy,ix]; ok=rest&(dist<80); lab[ok]=near[ok]
    cells=[lab==i+1 for i in range(8)]
    # scala: altezza mediana delle figure a terra (riga in basso)
    hs=[np.ptp(np.where(k.any(axis=1))[0]) for k in cells[4:]]
    S=ref_height/np.median(hs)*mult
    soft=np.clip((diff-3)/20,0,1)
    imgs=[];meta=[]
    for keep in cells:
        ring=keep&~nd.binary_erosion(keep)
        al=np.where(ring,np.maximum(soft,0.3),1.0)*keep
        img=Image.fromarray(np.dstack([np.where(keep[...,None],a,0),al*255]).astype(np.uint8),'RGBA')
        x0,y0,x1,y1=img.getbbox()
        ys,xs=np.where(keep); h=ys.max()-ys.min()
        band=(ys>ys.min()+h*0.3)&(ys<ys.min()+h*0.55); ax=xs[band].mean()
        img=img.crop((x0,y0,x1,y1)).resize((round((x1-x0)*S),round((y1-y0)*S)),Image.LANCZOS)
        imgs.append(img); meta.append((ax-x0)*S)
    Wt=sum(i.width+2*M for i in imgs); Ht=max(i.height for i in imgs)+2*M
    sheet=Image.new('RGBA',(Wt,Ht),(0,0,0,0)); x=0; rects={}
    for name,img,ax in zip(names,imgs,meta):
        sheet.alpha_composite(img,(x+M,Ht-M-img.height))
        rects[name]=[x,Ht-2*M-img.height,img.width+2*M,img.height+2*M,round(ax+M,1),img.height+M]
        x+=img.width+2*M
    return sheet,rects
out={}
for atlas,(fname,names) in SHEETS.items():
    sheet,rects=cut(fname,names); sheet.save(OUT+atlas+'.png')
    for n,r in rects.items(): out[n]={"atlas":atlas+".png","rect":r}
    print(atlas,sheet.size)
json.dump(out,open(OUT+'pose_clips.json','w'),indent=1)
