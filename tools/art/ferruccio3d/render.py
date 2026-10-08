"""Renderizza clip trasparenti, atlanti e anteprime. Eseguire nel venv con bpy e Pillow."""
import argparse, json, math
from pathlib import Path
import bpy
from PIL import Image
import model, look, anims

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--clips',nargs='*',default=list(anims.CLIPS))
    args=parser.parse_args()
    args.out.mkdir(parents=True,exist_ok=True)
    arm,body=model.build(str((args.out/'ferruccio.blend').resolve()))
    look.setup(body)
    scene=bpy.context.scene
    metadata={'size':look.RES,'feet':look.feet_pixel(),'height_pixels':2.28/look.ORTHO*look.RES,'clips':{}}
    if (args.out/'animations.json').exists():
        metadata=json.loads((args.out/'animations.json').read_text(encoding='utf8'))
    for clip in args.clips:
        count,fps,loop=anims.CLIPS[clip]
        images=[]
        for i in range(count):
            anims.pose(arm,clip,i/(count if loop else count-1))
            bpy.context.view_layer.update()
            dest=args.out/f'{clip}-{i:02d}.png'
            scene.render.filepath=str(dest.resolve())
            bpy.ops.render.render(write_still=True)
            images.append(Image.open(dest).convert('RGBA'))
        cols=4; rows=math.ceil(count/cols)
        atlas=Image.new('RGBA',(look.RES*cols,look.RES*rows))
        for i,im in enumerate(images): atlas.paste(im,((i%cols)*look.RES,(i//cols)*look.RES))
        atlas.save(args.out/f'{clip}.png')
        previews=[]
        for im in images:
            bg=Image.new('RGBA',im.size,'#26303c'); bg.alpha_composite(im)
            previews.append(bg.convert('RGB'))
        previews[0].save(args.out/f'{clip}.gif',save_all=True,append_images=previews[1:],duration=round(1000/fps),loop=0)
        metadata['clips'][clip]={'frames':count,'fps':fps,'loop':loop,'columns':cols}
        print('CLIP COMPLETE',clip,flush=True)
    (args.out/'animations.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf8')
    bpy.ops.wm.save_as_mainfile(filepath=str((args.out/'ferruccio.blend').resolve()))

if __name__=='__main__': main()
