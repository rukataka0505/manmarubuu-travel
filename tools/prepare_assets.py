"""Extract a curated, dependency-complete CC0 kit; never modify archives or originals."""
import json, zipfile, shutil, struct, sys
from pathlib import Path, PurePosixPath
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PICKS = {
 'village': ('Medieval Village', 'Wall_Plaster_Straight Wall_Plaster_Door_Round Wall_Plaster_Window_Wide_Round Wall_UnevenBrick_Straight Wall_UnevenBrick_Door_Round Wall_UnevenBrick_Window_Thin_Round Wall_Arch DoorFrame_Round_Brick Door_1_Round Window_Wide_Round1 Window_Thin_Round1 WindowShutters_Wide_Round_Open Roof_RoundTiles_4x4 Roof_RoundTiles_6x8 Roof_RoundTiles_8x10 Roof_Tower_RoundTiles Roof_Dormer_RoundTile Roof_Front_Brick4 Floor_UnevenBrick Floor_WoodDark Prop_Chimney Prop_Chimney2 Prop_Vine1 Prop_Vine4 Prop_Vine6 Prop_Wagon Prop_WoodenFence_Single Prop_WoodenFence_Extension1 Stairs_Exterior_Straight Balcony_Cross_Straight Corner_Exterior_Brick Prop_Brick1 Prop_Brick2 Prop_ExteriorBorder_Straight1 Prop_ExteriorBorder_Corner Prop_Support Floor_Brick Wall_UnevenBrick_Door_Flat Window_Roof_Thin Overhang_UnevenBrick_Long'),
 'nature': ('Stylized Nature', 'CommonTree_1 CommonTree_2 CommonTree_3 CommonTree_4 CommonTree_5 Pine_2 Pine_4 Clover_2 Grass_Common_Tall Grass_Wispy_Short Pine_1 Pine_3 TwistedTree_1 TwistedTree_2 DeadTree_1 Bush_Common Bush_Common_Flowers Fern_1 Clover_1 Flower_3_Group Flower_4_Group Grass_Common_Short Grass_Wispy_Tall Rock_Medium_1 Rock_Medium_2 Rock_Medium_3 RockPath_Round_Wide RockPath_Round_Small_1 Mushroom_Common Plant_1 Pebble_Round_1 RockPath_Round_Thin RockPath_Round_Small_2 RockPath_Round_Small_3 Pebble_Round_2 Pebble_Round_3 Flower_3_Single Flower_4_Single Mushroom_Laetiporus DeadTree_2'),
 'props': ('Fantasy Props', 'Anvil_Log Barrel Barrel_Apples Bed_Twin1 Bench Bookcase_2 BookGroup_Medium_1 Bottle_1 Bucket_Wooden_1 Cabinet CandleStick_Triple CandleStick_Stand Cauldron Chair_1 Chandelier Chest_Wood Crate_Wooden FarmCrate_Carrot FarmCrate_Apple Lantern_Wall Potion_1 Pot_1 Scroll_1 Shelf_Small_Bottles Stall_Cart_Empty Stall_Empty Stool Table_Large Torch_Metal Vase_2 Vase_4 Chalice Vase_Rubble_Medium WeaponStand Workbench Banner_1 Bag SmallBottles_1 Pouch_Large Shield_Wooden Coin Chain_Coil Banner_2 BookStand Key_Gold'),
}

manifest = {'author': 'Quaternius', 'license': 'CC0-1.0', 'models': {}}
for kit, (prefix, picks) in PICKS.items():
 archive = next(ROOT.glob(prefix+'*.zip'))
 out = ROOT/'public'/'assets'/kit
 source = ROOT/'assets'/'source'/kit
 out.mkdir(parents=True, exist_ok=True); source.mkdir(parents=True, exist_ok=True)
 with zipfile.ZipFile(archive) as z:
  paths = {Path(n).stem:n for n in z.namelist() if n.endswith('.gltf')}
  for name in picks.split():
   path = paths[name]; data = json.loads(z.read(path)); base = PurePosixPath(path).parent
   dependencies = [path] + [str(base / v['uri']) for key in ('buffers','images') for v in data.get(key,[]) if 'uri' in v and not v['uri'].startswith('data:')]
   for dep in dependencies:
    target=source/Path(dep).name
    if not target.exists(): target.write_bytes(z.read(dep))
    runtime=out/target.name
    if not runtime.exists():
     if target.suffix.lower()=='.png':
      with Image.open(target) as im:
       im.thumbnail((2048,2048)); im.save(runtime,optimize=True)
     else: shutil.copy2(target,runtime)
   # Buffer remains external; all materials share their source trim textures.
   vertices = sum(data['accessors'][p['attributes']['POSITION']]['count'] for m in data['meshes'] for p in m['primitives'])
   tris = sum(data['accessors'][p['indices']]['count']//3 for m in data['meshes'] for p in m['primitives'] if 'indices' in p)
   manifest['models'][name]={'url':f'/assets/{kit}/{name}.gltf','kit':kit,'archive':archive.name,'source':path,'vertices':vertices,'triangles':tris,'materials':len(data.get('materials',[]))}
  license_path=next(n for n in z.namelist() if n.endswith('License_Standard.txt'))
  (out/'LICENSE.txt').write_bytes(z.read(license_path))
(ROOT/'public/assets/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
if '--models-only' in sys.argv:
 print('Prepared',len(manifest['models']),'models.')
 raise SystemExit(0)

audio=Path(r'C:\Users\rukat\manmarubuu-project\game\audio-library')
for src in audio.rglob('*'):
 if src.is_file() and src.suffix.lower() in {'.mp3','.txt','.md'}:
  dest=ROOT/'public/audio'/src.relative_to(audio);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest)
print('Prepared',len(manifest['models']),'models and copied authorized audio.')
