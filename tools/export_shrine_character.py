"""Game derivative: bake original cloth, preserve embroidery, sample real terry loops.
The permitted source blend is read with auto-execution disabled and never saved.
"""
import bpy, json, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/models'; OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=r'C:\Users\rukat\manmarubuu-project\models\まんまるぶう_戦闘モーション.blend',load_ui=False,use_scripts=False)
scene=bpy.context.scene;scene.frame_set(1)
rig=bpy.data.objects['Manmarubuu_Rig']
def belongs(o):
 p=o
 while p:
  if p==rig:return True
  p=p.parent
 return False
for o in list(bpy.data.objects):
 if not belongs(o):bpy.data.objects.remove(o,do_unlink=True)
clips=['Idle','Walk','Run','Battle_Idle','BodyBlow','HornDrill','Guard','Hit','KO','Victory','Jump_Start','Jump_Air','Landing']
for a in list(bpy.data.actions):
 if a.name not in clips:bpy.data.actions.remove(a)
report={'source':'permitted original Blender model','baked':[],'sampledLoops':0,'objects':[],'clips':clips}
original_materials={m.name:m.copy() for m in bpy.data.materials}
baked_materials=set()
report['originalPalette']={m.name:list(m.diffuse_color) for m in bpy.data.materials if m.name[:2].isdigit() and not m.name.endswith('.001')}
for o in list(bpy.data.objects):
 if o.type=='MESH':
  for mod in list(o.modifiers):
   if mod.type=='SUBSURF':o.modifiers.remove(mod)

# Convert a bounded sample of the actual curves into world-radius tubes.
# Original curve objects have a very small world scale: using a fixed local radius
# was why the former export made the embroidered eyes nearly disappear.
for o in list(bpy.data.objects):
 if o.type!='CURVES':continue
 low=o.name.lower();micro=any(w in low for w in ['fuzz','fiber','terry','loops','pile'])
 if 'fuzz' in low or 'fiber' in low:
  bpy.data.objects.remove(o,do_unlink=True);continue
 count=len(o.data.curves)
 budget=(260 if 'head' in low else 170 if 'body' in low else 32) if micro else (180 if 'eye' in low else 90)
 stride=max(1,math.ceil(count/budget)); vertices=[];faces=[]
 radius=(.000065 if micro else .00028 if 'eye' in low else .00015)/max(o.matrix_world.to_scale().length/math.sqrt(3),.000001)
 # Curves are already attached to the original rigid, bone-parented part.
 for ci in range(0,count,stride):
  curve=o.data.curves[ci];pts=[p.position.copy() for p in curve.points]
  if len(pts)<2:continue
  if len(pts)>8:pts=[pts[round(k*(len(pts)-1)/7)] for k in range(8)]
  if micro:report['sampledLoops']+=1
  sides=3 if micro else 5;base=len(vertices)
  for i,p in enumerate(pts):
   tangent=(pts[min(i+1,len(pts)-1)]-pts[max(0,i-1)]).normalized()
   normal=tangent.cross(Vector((0,0,1)))
   if normal.length<.01:normal=tangent.cross(Vector((0,1,0)))
   normal.normalize();binormal=tangent.cross(normal).normalized()
   for k in range(sides):vertices.append(p+radius*(math.cos(k*math.tau/sides)*normal+math.sin(k*math.tau/sides)*binormal))
   if i:
    for k in range(sides):a=base+(i-1)*sides+k;b=base+(i-1)*sides+(k+1)%sides;c=base+i*sides+(k+1)%sides;d=base+i*sides+k;faces.append((a,b,c,d))
 mesh=bpy.data.meshes.new(o.name+'_web');mesh.from_pydata(vertices,[],faces);mesh.update()
 copy=bpy.data.objects.new(('FurLOD_' if micro else '')+o.name,mesh);bpy.context.collection.objects.link(copy)
 copy.parent=o.parent;copy.parent_type=o.parent_type;copy.parent_bone=o.parent_bone;copy.matrix_parent_inverse=o.matrix_parent_inverse.copy();copy.matrix_basis=o.matrix_basis.copy()
 wanted='01' if micro else '06' if 'eye' in low else '07' if 'nostril' in low else '05' if 'tie' in low else '03'
 mat=next((m for m in bpy.data.materials if m.name.startswith(wanted)),None)
 if mat:mesh.materials.append(mat)
 for p in mesh.polygons:p.use_smooth=True
 bpy.data.objects.remove(o,do_unlink=True)

scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=False
scene.render.bake.use_pass_direct=False;scene.render.bake.use_pass_indirect=False;scene.render.bake.use_pass_color=True;scene.render.bake.margin=8
# Bake the original procedural material into each important cloth surface's UVs.
for o in list(bpy.data.objects):
 if o.type!='MESH' or o.name.startswith('FurLOD_') or not o.data.materials:continue
 low=o.name.lower();fabric=any(w in low for w in ['shaped cheeks','compressed seated','ivory sleeve','folded over','pleated inner','upward tilted stuffed pink','tied pink end','flattened pink foot'])
 if not fabric:continue
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 if not o.data.uv_layers:
  bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.015);bpy.ops.object.mode_set(mode='OBJECT')
 mats=[]
 for i,m in enumerate(o.data.materials):
  mat=m.copy();o.data.materials[i]=mat;mats.append(mat)
 size=2048 if 'head' in low else 1024 if 'body' in low else 512
 textures={}
 for kind in ['DIFFUSE','NORMAL']:
  # The ears use separate ivory outer and pink inner materials whose source UVs
  # overlap. Baking both slots into one image lets the pink side overwrite the
  # ivory backside. Keep one bake target per ear material slot so the exported
  # derivative matches the Blender source without changing the source asset.
  per_material=[]
  separate_targets=low.startswith('ear.') and len(mats)>1
  for i,mat in enumerate(mats):
   image=bpy.data.images.new(o.name+'_'+kind+(f'_{i}' if separate_targets else ''),width=size,height=size,alpha=False) if separate_targets or i==0 else per_material[0]
   if kind=='NORMAL':image.colorspace_settings.name='Non-Color'
   node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;mat.node_tree.nodes.active=node
   per_material.append(image)
  bpy.ops.object.bake(type=kind)
  textures[kind]=per_material
 for i,mat in enumerate(mats):
  baked_materials.add(mat.name)
  base=mat.diffuse_color[:];mat.node_tree.nodes.clear();nodes=mat.node_tree.nodes;links=mat.node_tree.links
  out=nodes.new('ShaderNodeOutputMaterial');bs=nodes.new('ShaderNodeBsdfPrincipled');bs.inputs['Roughness'].default_value=.92;bs.inputs['Sheen Weight'].default_value=.28
  if low.startswith('ear.') and i==0:
   # Ear backs are the same ivory cloth as the body. Keep this slot simple and
   # solid so an ear UV/bake artifact can never turn the outer/back side dark.
   bs.inputs['Base Color'].default_value=base
  else:
   color=nodes.new('ShaderNodeTexImage');color.image=textures['DIFFUSE'][i];links.new(color.outputs['Color'],bs.inputs['Base Color'])
   tex=nodes.new('ShaderNodeTexImage');tex.image=textures['NORMAL'][i];normal=nodes.new('ShaderNodeNormalMap');links.new(tex.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],bs.inputs['Normal'])
  links.new(bs.outputs['BSDF'],out.inputs['Surface'])
 report['baked'].append({'object':o.name,'size':size})
 print('BAKED',o.name,flush=True)

for o in bpy.data.objects:
 if o.type!='MESH':continue
 for m in o.data.materials:
  if m.name in baked_materials:continue
  m.node_tree.nodes.clear();out=m.node_tree.nodes.new('ShaderNodeOutputMaterial');bs=m.node_tree.nodes.new('ShaderNodeBsdfPrincipled');bs.inputs['Base Color'].default_value=m.diffuse_color;bs.inputs['Roughness'].default_value=.87;m.node_tree.links.new(bs.outputs['BSDF'],out.inputs['Surface'])
 low=o.name.lower();budget=10000 if 'shaped cheeks' in low else 6000 if 'compressed seated' in low else 1500 if 'eye' in low else 1300
 if o.name.startswith('FurLOD_'):budget=999999
 if len(o.data.polygons)>budget:
  if o.data.shape_keys:o.shape_key_clear()
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
  mod=o.modifiers.new('Preserve silhouette budget','DECIMATE');mod.ratio=budget/len(o.data.polygons);bpy.ops.object.modifier_apply(modifier=mod.name)
 report['objects'].append({'name':o.name,'triangles':sum(len(p.vertices)-2 for p in o.data.polygons)})
rig.animation_data.action=bpy.data.actions['Idle'];rig.animation_data.action_slot=bpy.data.actions['Idle'].slots[0];scene.frame_set(1)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'manmarubuu-shrine.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_frame_range=False,export_force_sampling=True,export_frame_step=2,export_skins=True,export_morph=False,export_apply=False,export_cameras=False,export_lights=False,export_materials='EXPORT')
(OUT/'shrine-character-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('SHRINE_CHARACTER_COMPLETE',sum(x['triangles'] for x in report['objects']),flush=True)
