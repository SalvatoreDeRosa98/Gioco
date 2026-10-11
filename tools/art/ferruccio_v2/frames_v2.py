## Fotogrammi interi di Ferruccio da 07 (attacco) e 08 (corsa): sfondo grigio tolto, alpha pulito,
## stessa scala del rig v2 (figura alta 1004 px della tela), ancora ai piedi.
import numpy as np, json, os
from PIL import Image
from scipy import ndimage as nd
SRCDIR=os.environ.get('SRCDIR','/workspace/ferruccio-art/grok/')
OUT=os.environ.get('OUT','/workspace/artproc/ferr_v2/')
def cut_sheet(fname,n,out,ref_height=1004*0.95,mult=0.5):
    a=np.asarray(Image.open(SRCDIR+fname).convert('RGB')).astype(np.int16)
    H,W=a.shape[:2]
    bg=np.median(np.concatenate([a[0:10].reshape(-1,3),a[-10:].reshape(-1,3)]),axis=0)
    diff=np.abs(a-bg).max(axis=2); sat=a.max(axis=2)-a.min(axis=2); val=a.max(axis=2)
    bgl=(diff<16)&(sat<12)
    lab,_=nd.label(bgl)
    edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    fg=~np.isin(lab,list(edge))
    _bs=nd.sum(bgl,lab,range(1,lab.max()+1)); fg&=~np.isin(lab,[i+1 for i,v in enumerate(_bs) if v>600])
    rows=np.where(fg.any(axis=1))[0]; low=rows.max()
    yy=np.arange(H)[:,None]
    shadow=(sat<16)&(val<bg[0]+6)&(val>48)&(yy>low-40)
    fg&=~shadow
    fl,fn=nd.label(fg); sz=nd.sum(fg,fl,range(1,fn+1)); fg=np.isin(fl,[i+1 for i,s in enumerate(sz) if s>150])
    col=fg.sum(axis=0); cuts=[0]
    for k in range(1,n):
        c=int(k*W/n); cuts.append(c-90+int(np.argmin(col[c-90:c+90])))
    cuts.append(W)
    rows=np.where(fg.any(axis=1))[0]; ground=rows.max()
    tops=[];frames=[]
    for i in range(n):
        m=fg.copy(); m[:,:cuts[i]]=False; m[:,cuts[i+1]:]=False
        l,k=nd.label(m); s=nd.sum(m,l,range(1,k+1)); big=np.argmax(s)+1
        ob=nd.find_objects(l)[big-1]
        keep=np.zeros_like(m)
        for j,ss in enumerate(s):
            o=nd.find_objects(l)[j]
            if j+1==big or ss>s.max()*0.004: keep|=l==j+1
        ys=np.where(keep.any(axis=1))[0]; tops.append(ys.min())
        frames.append(keep)
    ref=np.median([ground-t for t in tops]); S=ref_height/ref*mult
    soft=np.clip((diff-3)/22,0,1)
    imgs=[];meta=[]
    for keep in frames:
        ring=keep&~nd.binary_erosion(keep)
        al=np.where(ring,np.maximum(soft,0.3),1.0)*keep
        img=Image.fromarray(np.dstack([np.where(keep[...,None],a,0),al*255]).astype(np.uint8),'RGBA')
        x0,y0,x1,y1=img.getbbox(); y1=max(y1,ground+1)
        ys,xs=np.where(keep); h=ys.max()-ys.min()
        band=(ys>ys.min()+h*0.3)&(ys<ys.min()+h*0.55)
        ax=xs[band].mean()
        img=img.crop((x0,y0,x1,y1)).resize((round((x1-x0)*S),round((y1-y0)*S)),Image.LANCZOS)
        imgs.append(img); meta.append((ax-x0)*S)
    # atlante in fila
    Wt=sum(i.width for i in imgs)+4*len(imgs); Ht=max(i.height for i in imgs)
    sheet=Image.new('RGBA',(Wt,Ht),(0,0,0,0)); x=0; rects=[]
    for img,ax in zip(imgs,meta):
        sheet.alpha_composite(img,(x,Ht-img.height))
        rects.append([x,Ht-img.height,img.width,img.height,round(ax,1),img.height])
        x+=img.width+4
    sheet.save(OUT+out+'.png')
    print(out,sheet.size,'scala tela/atlante',round(1/mult,3))
    return {"atlas":out+".png","canvas_per_px":1/mult,"frames":rects}
fc={"run":dict(cut_sheet('08-ferruccio-run.jpg',6,'frames_corsa'),fps=12,progress=False,loop=True),
    "slash":dict(cut_sheet('07-ferruccio-slash.jpg',6,'frames_attacco'),progress=True)}
json.dump(fc,open(OUT+'frame_clips.json','w'),indent=1)
