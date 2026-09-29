"""Read only the explicitly permitted Blender assets, never the Unity project."""
import bpy
import json
from pathlib import Path

source = Path(r'C:\Users\rukat\manmarubuu-project\models')
output = Path(r'C:\Users\rukat\manmarubuu-travel\artifacts')
output.mkdir(exist_ok=True)
result = []
for name in ['まんまるぶう_戦闘モーション.blend', 'まんまるぶう_アニメーション.blend', 'まんまるぶう_form.blend']:
    bpy.ops.wm.open_mainfile(filepath=str(source / name), load_ui=False, use_scripts=False)
    info = {'file': name, 'fps': bpy.context.scene.render.fps, 'objects': [], 'actions': [], 'materials': []}
    for o in bpy.data.objects:
        info['objects'].append({'name': o.name, 'type': o.type, 'dimensions': list(o.dimensions), 'location': list(o.location), 'visible': not o.hide_render, 'vertices': len(o.data.vertices) if o.type == 'MESH' else None, 'polygons': len(o.data.polygons) if o.type == 'MESH' else None, 'parent': o.parent.name if o.parent else None, 'modifiers': [m.type for m in o.modifiers], 'action': o.animation_data.action.name if o.animation_data and o.animation_data.action else None, 'nla': [t.name for t in o.animation_data.nla_tracks] if o.animation_data else []})
    for a in bpy.data.actions:
        info['actions'].append({'name': a.name, 'range': list(a.frame_range), 'slots': [{'name': s.identifier, 'type': s.target_id_type} for s in a.slots]})
    for m in bpy.data.materials:
        info['materials'].append({'name': m.name, 'diffuse': list(m.diffuse_color), 'nodes': [{'name': n.name, 'type': n.type, 'image': n.image.name if n.type == 'TEX_IMAGE' and n.image else None} for n in m.node_tree.nodes] if m.node_tree else []})
    result.append(info)
(output / 'model-inventory.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print('MODEL_INVENTORY_COMPLETE')
