"""Make geometry-only LODs from the local derivative, sharing its baked materials at runtime."""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/models'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(OUT/'manmarubuu-shrine.glb'))
report=[]
for level,ratio in [(1,.42),(2,.4)]:
 for o in list(bpy.data.objects):
  if o.type!='MESH':continue
  if o.name.startswith('FurLOD_'):
   bpy.data.objects.remove(o,do_unlink=True);continue
  detail=any(k in o.name.lower() for k in ['eye','nostril','stitch','seam','tie'])
  if detail and level==1 and 'eye' in o.name.lower():continue
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
  if len(o.data.polygons)>350:
   dec=o.modifiers.new('Distance silhouette','DECIMATE');dec.ratio=(.35 if detail and level==2 else ratio);bpy.ops.object.modifier_apply(modifier=dec.name)
 bpy.ops.object.select_all(action='SELECT')
 bpy.ops.export_scene.gltf(filepath=str(OUT/f'manmarubuu-lod{level}.glb'),export_format='GLB',use_selection=True,export_animations=False,export_materials='NONE',export_texcoords=True,export_normals=True,export_cameras=False,export_lights=False)
 report.append({'level':level,'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in bpy.data.objects if o.type=='MESH')})
(OUT/'character-lods.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(report)
