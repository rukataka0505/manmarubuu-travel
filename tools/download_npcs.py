import urllib.request,urllib.parse,http.cookiejar,re,json,zipfile,pathlib
op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
root=pathlib.Path('assets/source/kaykit');root.mkdir(parents=True,exist_ok=True)
for slug in ['kaykit-adventurers','kaykit-character-animations']:
 base='https://kaylousberg.itch.io/'+slug
 h=op.open(base).read().decode();csrf=re.search(r'name="csrf_token" value="([^"]+)',h)[1]
 def post(url,csrf):return json.load(op.open(urllib.request.Request(url,data=urllib.parse.urlencode({'csrf_token':csrf}).encode(),headers={'Referer':base,'X-Requested-With':'XMLHttpRequest'})))
 r=post(base+'/download_url',csrf);h=op.open(r['url']).read().decode();csrf=re.search(r'name="csrf_token" value="([^"]+)',h)[1];uid=re.search(r'data-upload_id="([0-9]+)',h)[1]
 r=post(base+'/file/'+uid+'?source=game_download&as_props=1',csrf)
 path=root/(slug+'.zip');path.write_bytes(op.open(r['url']).read())
 with zipfile.ZipFile(path) as z:
  for n in z.namelist():
   if n.lower().endswith(('.gltf','.glb','.bin','.png','.txt','.md')) and not n.startswith('__MACOSX'):
    target=(root/slug/n).resolve()
    if target.is_relative_to((root/slug).resolve()):z.extract(n,root/slug)
 print(slug,path.stat().st_size)
 print('\n'.join(str(p.relative_to(root)) for p in (root/slug).rglob('*.gltf')))

# Publish only the selected game-ready models and compatible animation sets.
import shutil,hashlib
out=pathlib.Path('public/npcs');out.mkdir(exist_ok=True)
for name in ['Mage','Ranger','Rogue','Knight','Barbarian']:
 src=next(root.rglob(name+'.glb'));shutil.copy2(src,out/src.name)
for kind in ['General','MovementBasic','Simulation','Tools']:
 src=next((root/'kaykit-character-animations').rglob('Rig_Medium_'+kind+'.glb'));shutil.copy2(src,out/src.name)
for name,slug in [('Adventurers','kaykit-adventurers'),('Animations','kaykit-character-animations')]:
 shutil.copy2(next((root/slug).rglob('License.txt')),out/('LICENSE-'+name+'.txt'))
manifest={'author':'Kay Lousberg','license':'CC0-1.0','sources':['https://kaylousberg.itch.io/kaykit','https://kaylousberg.itch.io/kaykit-character-animations'],'models':5,'importedClips':65,'files':{p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in out.glob('*.glb')}}
(out/'sources.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
