"""Download the author's free editions; preserve archives as source evidence."""
import urllib.request,urllib.parse,http.cookiejar,re,json,zipfile,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
out=ROOT/'assets/source/monsters';out.mkdir(parents=True,exist_ok=True)
op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
for slug in ['bestiary-dungeon-monsters-kit','universal-animation-library-2']:
    base='https://quaternius.itch.io/'+slug
    h=op.open(base).read().decode();csrf=re.search(r'name="csrf_token" value="([^"]+)',h)[1]
    def post(url,token):
        return json.load(op.open(urllib.request.Request(url,data=urllib.parse.urlencode({'csrf_token':token}).encode(),headers={'Referer':base,'X-Requested-With':'XMLHttpRequest'})))
    r=post(base+'/download_url',csrf);h=op.open(r['url']).read().decode();csrf=re.search(r'name="csrf_token" value="([^"]+)',h)[1]
    uid=re.search(r'data-upload_id="([0-9]+)',h)[1]
    r=post(base+'/file/'+uid+'?source=game_download&as_props=1',csrf)
    archive=out/(slug+'.zip')
    if not archive.exists():archive.write_bytes(op.open(r['url']).read())
    dest=(out/slug).resolve()
    with zipfile.ZipFile(archive) as z:
        for info in z.infolist():
            p=(dest/info.filename).resolve()
            if not p.is_relative_to(dest):raise ValueError('Unsafe archive path')
            z.extract(info,dest)
        print(slug,archive.stat().st_size,flush=True)
        print('\n'.join(n for n in z.namelist() if n.lower().endswith(('.gltf','.glb','.txt'))),flush=True)
