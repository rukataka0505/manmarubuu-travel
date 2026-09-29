"""Selected author-hosted CC0 monsters, packed into GLB without losing animations."""
import json,pathlib,urllib.request,concurrent.futures,base64,struct,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
source=ROOT/'assets/source/monsters';out=ROOT/'public/monsters';out.mkdir(exist_ok=True)
folders=json.loads((source/'ultimate-files.json').read_text())
selected={'Blob':['GreenBlob','Mushnub','GreenSpikyBlob','Yeti','Wizard'],
          'Flying':['Armabee','Armabee_Evolved','Dragon','Ghost','Ghost_Skull','Glub','Goleling','Goleling_Evolved','Dragon_Evolved'],
          'Big':['Orc','Orc_Skull']}
def download(fid):
    return urllib.request.urlopen('https://drive.google.com/uc?export=download&id='+fid,timeout=60).read()
def pack(g):
    binary=bytearray();offsets=[]
    for b in g.get('buffers',[]):
        offsets.append(len(binary));binary.extend(base64.b64decode(b['uri'].split(',',1)[1]));binary.extend(b'\0'*(-len(binary)%4))
    for v in g.get('bufferViews',[]):v['byteOffset']=v.get('byteOffset',0)+offsets[v.get('buffer',0)];v['buffer']=0
    for image in g.get('images',[]):
        uri=image.pop('uri',None)
        if not uri:continue
        data=base64.b64decode(uri.split(',',1)[1]) if uri.startswith('data:') else (out/'Atlas_Monsters.png').read_bytes()
        image['bufferView']=len(g.setdefault('bufferViews',[]));image['mimeType']='image/png'
        g['bufferViews'].append({'buffer':0,'byteOffset':len(binary),'byteLength':len(data)})
        binary.extend(data);binary.extend(b'\0'*(-len(binary)%4))
    g['buffers']=[{'byteLength':len(binary)}]
    encoded=json.dumps(g,separators=(',',':')).encode();encoded+=b' '*(-len(encoded)%4)
    return struct.pack('<III',0x46546c67,2,28+len(encoded)+len(binary))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(binary),0x004e4942)+binary
atlas=out/'Atlas_Monsters.png'
if not atlas.exists():atlas.write_bytes(download(next(i for i,n in folders['Big'] if n.startswith('Atlas_'))))
license_file=out/'LICENSE-Ultimate-Monsters.txt'
if not license_file.exists():license_file.write_bytes(download('16GqsDGESyEOfRbc4dS7EqAwkIUSIW4_y'))
jobs=[(kind,name,next(i for i,n in folders[kind] if n.startswith(name+'.gltf '))) for kind,names in selected.items() for name in names]
def process(job):
    kind,name,fid=job;key=kind+'_'+name;original=source/(key+'.gltf')
    if not original.exists():original.write_bytes(download(fid))
    g=json.loads(original.read_text());raw=pack(g);(out/(key+'.glb')).write_bytes(raw)
    clips=[a.get('name','') for a in g.get('animations',[])]
    print(key,len(raw),clips,flush=True)
    return key,{'file':key+'.glb','bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'sourceFileId':fid,'animations':clips}
files=dict(concurrent.futures.ThreadPoolExecutor(4).map(process,jobs))
(out/'sources.json').write_text(json.dumps({'author':'Quaternius','license':'CC0-1.0','source':'https://quaternius.com/packs/ultimatemonsters.html','files':files},indent=2),encoding='utf-8')
