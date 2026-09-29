import bpy,json
from pathlib import Path
bpy.ops.wm.open_mainfile(filepath=r'C:\Users\rukat\manmarubuu-project\models\まんまるぶう_戦闘モーション.blend',load_ui=False,use_scripts=False)
result={'materials':[], 'eyes':[], 'bones':[]}
for m in bpy.data.materials:
 result['materials'].append({'name':m.name,'color':list(m.diffuse_color),'nodes':[{'type':n.type,'name':n.name,'inputs':{i.name:list(i.default_value) if hasattr(i.default_value,'__len__') else i.default_value for i in n.inputs if hasattr(i,'default_value') and i.type in ['VALUE','RGBA','VECTOR']}} for n in m.node_tree.nodes] if m.use_nodes else []})
for o in bpy.data.objects:
 if 'eye' in o.name.lower():
  result['eyes'].append({'name':o.name,'matrix':[list(r) for r in o.matrix_world],'data':str(o.type),'modifiers':[{'name':m.name,'nodes':[{'type':n.type,'name':n.name} for n in m.node_group.nodes] if m.type=='NODES' else []} for m in o.modifiers]})
rig=bpy.data.objects['Manmarubuu_Rig']; result['bones']=[{'name':b.name,'head':list(b.head_local),'tail':list(b.tail_local)} for b in rig.data.bones]
Path('artifacts/character-detail.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print('DETAIL_COMPLETE')
