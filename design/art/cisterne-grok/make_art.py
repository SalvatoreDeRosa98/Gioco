# Prepara gli asset del prototipo artistico Cisterne dalle immagini approvate (grok/).
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
import numpy as np, os
SRC='/workspace/ferruccio-art/grok'; OUT='/workspace/ferruccio-levels/art3/out'
os.makedirs(OUT, exist_ok=True)
T=64
def shade_border(tile, k=0.55, w=2):
    a=np.asarray(tile).astype(float)
    a[:w,:,:3]*=k+0.2; a[-w:,:,:3]*=k; a[:,:w,:3]*=k+0.1; a[:,-w:,:3]*=k
    return Image.fromarray(a.clip(0,255).astype('uint8'), tile.mode)

src=Image.open(f'{SRC}/03-tufo-tileset.jpg').convert('RGBA')
def seamless(img, axes=(0, 1)):
    # Rende ripetibile un'immagine: miscela con la copia spostata di mezza misura, pesata verso i bordi.
    a=np.asarray(img).astype(float); h,w=a.shape[:2]
    r=a.copy()
    if 0 in axes: r=np.roll(r,h//2,0)
    if 1 in axes: r=np.roll(r,w//2,1)
    wy=1-np.abs(np.linspace(-1,1,h))[:,None] if 0 in axes else np.ones((h,1))
    wx=1-np.abs(np.linspace(-1,1,w))[None,:] if 1 in axes else np.ones((1,w))
    m=np.clip(np.minimum(wy,wx)*2.2,0,1)[:,:,None]
    return Image.fromarray((a*m+r*(1-m)).clip(0,255).astype('uint8'),img.mode)
# Muro: un blocco 4x4 celle continuo (256 px) ripetibile; le celle sono tagli sfalsati dello stesso blocco,
# quindi celle vicine combaciano e la ripetizione cade ogni 4 celle.
wall=seamless(src.crop((60,356,572,740)).resize((4*T,4*T),Image.LANCZOS))
# Cresta: fascia superiore ripetibile solo in orizzontale (4 celle).
crest=seamless(src.crop((40,226,552,354)).resize((4*T,T),Image.LANCZOS),axes=(1,))
plate=seamless(src.crop((200,221,712,300)).resize((4*T,30),Image.LANCZOS),axes=(1,)).crop((0,0,T,30))
atlas=Image.new('RGBA',(6*T,6*T),(0,0,0,0))
# riga 0: 0 muro, 1 mensola alta, 2 spuntoni, 3 riferimento, 4 mensola bassa, 5 cresta
atlas.paste(wall.crop((0,0,T,T)),(0,0)); atlas.paste(plate,(T,0)); atlas.paste(plate,(4*T,32)); atlas.paste(crest.crop((0,0,T,T)),(5*T,0))
d=ImageDraw.Draw(atlas)
for i in range(4):  # spuntoni di ferro sul bordo inferiore
    x=2*T+i*16
    d.polygon([(x,T),(x+8,T-22),(x+16,T)],fill=(120,118,124,255),outline=(40,38,42,255))
    d.line([(x+8,T-22),(x+8,T-2)],fill=(170,168,176,255))
d.rectangle((3*T,0,4*T-1,T-1),fill=(230,140,40,90))
atlas.paste(wall,(0,T))          # righe 1-4: blocco di muro 4x4
atlas.paste(crest,(0,5*T))       # riga 5: cresta 4x1
atlas.save(f'{OUT}/tufo_tiles.png')

def mid(img, name, crop=None, cover=None):
    im=Image.open(f'{SRC}/{img}').convert('RGB')
    if crop: im=im.crop(crop)
    if cover:
        # Copre una parte dipinta con la porzione alla sua sinistra (bordi sfumati): es. ruota e chiusa del
        # fondale 04, che in scena sono già oggetti interattivi (sarebbero doppioni).
        x0,y0,x1,y1=cover; w=x1-x0; h=y1-y0
        m=Image.new('L',(w,h),0); m.paste(255,(40,40,w-40,h-40)); m=m.filter(ImageFilter.GaussianBlur(28))
        im.paste(im.crop((x0-w,y0,x0,y1)),(x0,y0),m)
    im=ImageEnhance.Color(im).enhance(0.55)   # desaturato
    im=ImageEnhance.Brightness(im).enhance(0.6)  # scurito: piano medio dietro al gioco
    im=ImageEnhance.Contrast(im).enhance(0.85)
    im.save(f'{OUT}/{name}.png')
mid('04-cisterne-reali-mid.jpg','cisterne_reali_mid',(0,0,2128,660),cover=(1060,170,1580,560))  # via la fascia grigia, la ruota e la chiusa dipinte
mid('09-cisterne-sepolte-mid.jpg','cisterne_sepolte_mid')
mid('10-tana-ratking-mid.jpg','tana_ratking_mid')

def cut_grey(im, tol=16, holes=False):
    # Toglie lo sfondo grigio piatto per riempimento dai bordi.
    im=im.convert('RGBA'); a=np.asarray(im).astype(int)
    h,w=a.shape[:2]; ref=a[2,2,:3]
    grey=(np.abs(a[:,:,:3]-ref).max(2)<tol)&(np.abs(a[:,:,0]-a[:,:,2])<8)
    mask=np.zeros((h,w),bool)
    if holes: mask|=(np.abs(a[:,:,:3]-ref).max(2)<9)&(a[:,:,:3].max(2)-a[:,:,:3].min(2)<5)
    mask2=mask.copy(); mask=np.zeros((h,w),bool); stack=[(0,0),(0,w-1),(h-1,0),(h-1,w-1)]+[(0,x) for x in range(0,w,7)]+[(y,0) for y in range(0,h,7)]+[(y,w-1) for y in range(0,h,7)]+[(h-1,x) for x in range(0,w,7)]
    while stack:
        y,x=stack.pop()
        if 0<=y<h and 0<=x<w and not mask[y,x] and grey[y,x]:
            mask[y,x]=True; stack+= [(y+1,x),(y-1,x),(y,x+1),(y,x-1)]
    mask|=mask2
    al=Image.fromarray(np.where(mask,0,255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1))
    im.putalpha(al); return im.crop(im.getbbox())

# 11: tre pannelli (intatto/danneggiato/rotto), senza scritte (le etichette stanno sotto y=780)
m=Image.open(f'{SRC}/11-muro-incrinato.jpg')
sx=m.width/1024
for name,(x0,x1) in zip(['intatto','danneggiato','rotto'],[(8,336),(347,675),(685,1015)]):
    p=m.crop((int(x0*sx),int(124*sx),int(x1*sx),int(470*sx)))
    # striscia centrale: è lì la crepa; il muro della stanza è largo 64 px
    strip=p  # pannello intero: il gioco ne ritaglia il centro con le proporzioni del muro (niente schiacciamento)
    if name=='intatto':  # niente segno di gesso col martello disegnato (testo/simbolo): striscia centrale lo esclude
        pass
    strip.convert('RGBA').save(f'{OUT}/muro_incrinato_{name}.png')

# 12: ruota (seconda figura), cancello chiuso (A) e aperto a due battenti (B); etichette tagliate
g=Image.open(f'{SRC}/12-chiusa-saracinesca.jpg'); s=g.width/1024
def part(x0,y0,x1,y1,holes=False): return cut_grey(g.crop((int(x0*s),int(y0*s),int(x1*s),int(y1*s))),holes=holes)
part(255,95,505,445,True).save(f'{OUT}/ruota_chiusa.png')
part(520,90,765,445).save(f'{OUT}/cancello_chiuso.png')
part(765,90,1015,445).save(f'{OUT}/cancello_aperto.png')
for f in sorted(os.listdir(OUT)): print(f, Image.open(f'{OUT}/{f}').size)
