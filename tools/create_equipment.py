"""Author fitted accessories in a separate Blender file; never touch the hero source.

Surfaces have actual hems, folds, rolled edges, stitching and fitted gem settings.
Coordinates below are in the game's Y-up space. The GLB is a reusable asset library.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
TAU=math.tau
def vec(p): return (p[0],-p[2],p[1])
def mat(name,color,metal=0,rough=.6):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough
 return m
gold=mat('Brushed antique gold',(.65,.42,.15),.72,.31);silver=mat('Hammered warm silver',(.63,.72,.70),.7,.35);stitch=mat('Ivory embroidery',(.88,.79,.58),0,.9);leather=mat('Saddle leather',(.20,.10,.04),0,.82)
colors=[(.40,.22,.09),(.16,.33,.17),(.12,.43,.43),(.23,.34,.39),(.59,.35,.09),(.47,.57,.61),(.25,.38,.57),(.65,.35,.20)]
cloth=[mat('Woven '+str(i),c,0,.89) for i,c in enumerate(colors)]
metal=[mat('Enamel '+str(i),c,.5,.28) for i,c in enumerate(colors)]
gems=[mat('Polished jewel '+str(i),c,.28,.17) for i,c in enumerate([(.1,.5,.34),(.33,.24,.6),(.14,.47,.64),(.78,.38,.13)])]
root=None
def mesh(name,verts,faces,material,thick=0):
 me=bpy.data.meshes.new(name);me.from_pydata([vec(v) for v in verts],[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.parent=root;me.materials.append(material)
 for p in me.polygons:p.use_smooth=True
 if thick:
  so=o.modifiers.new('Tailored thickness','SOLIDIFY');so.thickness=thick
 return o
def tube(name,points,r,material,closed=False):
 cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=8;cu.bevel_depth=r;cu.bevel_resolution=3
 s=cu.splines.new('POLY');s.points.add(len(points)-1)
 for p,q in zip(s.points,points):p.co=(*vec(q),1)
 s.use_cyclic_u=closed;o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);o.parent=root;cu.materials.append(material);return o
def ring(name,x,y,z,rx,rz,r,material,n=64):return tube(name,[(x+rx*math.sin(t*TAU/n),y,z+rz*math.cos(t*TAU/n)) for t in range(n)],r,material,True)
def gem(name,x,y,z,size,material):
 # A cabochon with a gold bezel, seen from the front (+Z).
 n=24;verts=[];faces=[]
 for j in range(7):
  a=j/6*math.pi/2
  for k in range(n):
   t=k/n*TAU;verts.append((x+math.cos(a)*math.cos(t)*size,y+math.cos(a)*math.sin(t)*size*1.2,z+math.sin(a)*size*.5))
 for j in range(6):
  for k in range(n):a=j*n+k;b=j*n+(k+1)%n;faces.append((a,b,b+n,a+n))
 mesh(name,verts,faces,material)
 tube('Raised jewel bezel',[(x+math.cos(t*TAU/64)*size,y+math.sin(t*TAU/64)*size*1.2,z) for t in range(64)],size*.13,gold,True)
def panel(name,x,y,z,w,h,material):
 verts=[];faces=[]
 for j in range(13):
  v=j/12
  for i in range(17):
   u=i/16*2-1;verts.append((x+u*w*.5,y+(v-.5)*h,z+.06*(1-u*u)+.012*math.sin(v*math.pi*5)))
 for j in range(12):
  for i in range(16):n=j*17+i;faces.append((n,n+1,n+18,n+17))
 return mesh(name,verts,faces,material,.012)
def leaf(x,y,z,angle,size,material):
 verts=[]
 for j in range(13):
  t=j/12;w=math.sin(t*math.pi)*size*.31
  for s in [-1,0,1]:
   px=s*w;py=t*size;verts.append((x+px*math.cos(angle)-py*math.sin(angle),y+px*math.sin(angle)+py*math.cos(angle),z+(1-abs(s))*.024*math.sin(t*math.pi)))
 faces=[]
 for j in range(12):
  for i in range(2):n=j*3+i;faces.append((n,n+1,n+4,n+3))
 mesh('Sculpted leaf',verts,faces,material,.006)
def cape(i):
 n,m=72,16;verts=[];faces=[];extent=2.62 if i in [2,4,6,7] else 2.95
 def p(u,v):
  a=(u*2-1)*extent;r=.46+.14*v+.018*math.sin(a*11)*v;return (math.sin(a)*r,.32-v*.60,-math.cos(a)*r+.02)
 for j in range(m+1):
  for k in range(n+1):verts.append(p(k/n,j/m))
 for j in range(m):
  for k in range(n):q=j*(n+1)+k;faces.append((q,q+1,q+n+2,q+n+1))
 mesh('Tailored cloth',verts,faces,cloth[i],.016)
 for v in [0,1]:tube('Rolled hem',[p(k/96,v) for k in range(97)],.014,gold if i>3 else leather)
 for u in [0,1]:tube('Front seam',[p(u,j/24) for j in range(25)],.009,stitch)
 for k in range(48):
  x,y,z=p((k+.5)/48,.94);a=((k+.5)/48*2-1)*extent;tube('Hem stitches',[(x,y-.012,z),(x+math.cos(a)*.012,y+.012,z+math.sin(a)*.012)],.0028,stitch)
 if i in [1,3,5]:
  panel('Contoured breastplate',0,.04,.47,.65,.44,metal[i]);gem('Armour crest',0,.06,.55,.07,gems[i%4])
  for s in [-1,1]:tube('Raised plate border',[(s*(.25+.045*math.sin(t*math.pi)),.24-t*.4,.535) for t in [j/24 for j in range(25)]],.013,silver if i==5 else gold)
 else:
  for s in [-1,1]:gem('Cape fastening',s*.17,.25,.45,.045,gems[i%4])
  tube('Fastening chain',[(-.17+j/20*.34,.25-.055*math.sin(j/20*math.pi),.46) for j in range(21)],.009,gold)
 # Embroidered rays on the back, with an inset medallion; geometry, not a flat decal.
 for k in range(7):
  a=(k-3)*.23;tube('Back embroidery',[(math.sin(a)*(.13+t*.13),.02+math.cos(a)*t*.16,-.59) for t in [j/8 for j in range(9)]],.004,stitch)
def horn(i):
 n=80;verts=[];faces=[]
 for j in range(7):
  v=j/6;r=.205-.034*v
  for k in range(n):a=k/n*TAU;verts.append((math.sin(a)*r,v*.095-.03,math.cos(a)*r))
 for j in range(6):
  for k in range(n):a=j*n+k;b=j*n+(k+1)%n;faces.append((a,b,b+n,a+n))
 mesh('Engraved horn cuff',verts,faces,metal[i],.012)
 for y,r in [(-.03,.207),(.064,.173)]:ring('Rolled cuff border',0,y,0,r,r,.009,gold)
 for k in range(8):
  a=k/8*TAU;tube('Inlaid chevron',[(math.sin(a-.07)*.194,.0,math.cos(a-.07)*.194),(math.sin(a)*.186,.047,math.cos(a)*.186),(math.sin(a+.07)*.194,.0,math.cos(a+.07)*.194)],.004,stitch)
 gem('Horn jewel',0,.019,.202,.033+(i>3)*.015,gems[i%4])
 if i in [1,2,6,7]:
  for s in [-1,1]:leaf(s*.16,.025,.02,-s*.85,.17,metal[i])
def head(i):
 if i in [1,4]:
  verts=[];faces=[];n=64
  for j in range(25):
   t=j/24;r=.17*(1-t)**.78+.004;cx=-.11*t*t
   for k in range(n):a=k/n*TAU;verts.append((cx+math.sin(a)*r,.03+t*.42,math.cos(a)*r*.85-.06))
  for j in range(24):
   for k in range(n):a=j*n+k;b=j*n+(k+1)%n;faces.append((a,b,b+n,a+n))
  mesh('Curved felt hat',verts,faces,cloth[i],.008);ring('Wide soft brim',0,.025,-.06,.225,.185,.035,cloth[i]);ring('Hat ribbon',0,.1,-.06,.151,.132,.014,gold);gem('Hat clasp',0,.10,.074,.03,gems[i%4])
 else:
  for k in range(5 if i==0 else 7):
   a=k/7*TAU if i else k/5*TAU;leaf(0,0,0,a,.115,cloth[4] if i==3 else metal[i])
  gem('Hairpin heart',0,0,.03,.036,gems[i%4])
  for s in [-1,1]:leaf(s*.03,-.035,-.01,s*.75+math.pi,.14,cloth[1]);tube('Braided tie',[(s*(.018+t*.035),-.06-t*.17,.015+math.sin(t*5)*.01) for t in [j/20 for j in range(21)]],.007,gold)
def feet(i):
 for y in [0,.07]:
  ring('Wrapped ankle leather',0,y,0,.143,.128,.021,cloth[i]);ring('Stitched ankle trim',0,y+.017,0,.144,.129,.004,stitch)
 gem('Ankle buckle',0,.035,.131,.025,gems[i%4])
 if i in [1,2,4]:
  # Open toe gaiter preserves the original pink foot, rather than painting it white.
  verts=[];faces=[];n=40
  for j in range(9):
   v=j/8
   for k in range(n+1):a=-2.30+k/n*4.6;verts.append((math.sin(a)*(.14+.02*v),.045-v*.10,-math.cos(a)*(.13+.035*v)))
  for j in range(8):
   for k in range(n):q=j*(n+1)+k;faces.append((q,q+1,q+n+2,q+n+1))
  mesh('Fitted open-toe gaiter',verts,faces,metal[i] if i==2 else cloth[i],.009)
def charm(i):
 for s in [-1,1]:tube('Pendant necklace',[(s*.17*(1-t),.16-.20*t,.02+.022*math.sin(t*math.pi)) for t in [j/32 for j in range(33)]],.006,gold)
 gem('Pendant cabochon',0,-.09,.015,.061,gems[i%4]);tube('Decorative bail',[(-.02,-.03,.014),(0,.0,.014),(.02,-.03,.014)],.007,gold)
 if i in [2,6,7]:
  for s in [-1,1]:leaf(s*.045,-.12,.016,s*.8,.073,metal[i])
 for j in range(5):
  a=j/5*TAU;gem('Pendant border stone',math.sin(a)*.081,-.09+math.cos(a)*.093,.004,.012,silver)
counts={'horn':8,'head':6,'body':8,'feet':6,'charm':8};report=[]
for slot,count in counts.items():
 for i in range(count):
  root=bpy.data.objects.new(slot+str(i),None);bpy.context.collection.objects.link(root)
  {'horn':horn,'head':head,'body':cape,'feet':feet,'charm':charm}[slot](i)
  report.append({'id':root.name,'parts':len(root.children),'source':'Tailored in this project for the original Blender proportions'})
for o in list(bpy.data.objects):
 if o.type=='CURVE':
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
for item in report:
 parent=bpy.data.objects[item['id']];parts=list(parent.children)
 for o in parts:
  bpy.context.view_layer.objects.active=o
  for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();parts[0].name='Fitted_'+item['id']
 item['triangles']=sum(len(p.vertices)-2 for p in parts[0].data.polygons)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'assets/source/manmarubuu-equipment.blend'))
bpy.ops.export_scene.gltf(filepath=str(R/'public/models/manmarubuu-equipment.glb'),export_format='GLB',export_animations=False,export_apply=True,export_cameras=False,export_lights=False)
(R/'public/models/equipment-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('EQUIPMENT_COMPLETE',len(report),flush=True)
