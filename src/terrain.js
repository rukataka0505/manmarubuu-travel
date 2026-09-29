import * as THREE from 'three';
import {canvasTexture,random} from './graphics.js';
import {roadCenterline} from './roads.js';
import {BUILDINGS,ZONES} from './zone-data.js';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export function segmentDistance(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
const hill=(x,z,cx,cz,r,h)=>h*Math.exp(-((x-cx)**2+(z-cz)**2)/(r*r));
function villageBase(x,z){return hill(x,z,-29,-34,25,5.4)+hill(x,z,43,14,25,2.7)+hill(x,z,-43,28,16,1.8)-hill(x,z,-55,0,8,2);}
export class Terrain{
 constructor(zone){this.zone=zone;this.config=ZONES[zone];this.paths=[...this.config.paths];if(zone==='forest')this.paths.push([[0,94],[0,117],[0,155],[0,176]]);if(zone==='village')this.paths.push([[0,-47],[0,-60],[-5,-77],[-4,-96]]);if(zone==='village')for(const b of BUILDINGS)this.paths.push([[b.x,b.z+b.d/2+1],[0,b.z+b.d/2+1]]);this.paths=this.paths.map(roadCenterline);this.roadGrid=new Map();for(const path of this.paths)for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],segment={a,b,dx:b[0]-a[0],dz:b[1]-a[1]};segment.l2=segment.dx*segment.dx+segment.dz*segment.dz;for(let x=Math.floor((Math.min(a[0],b[0])-32)/16);x<=Math.floor((Math.max(a[0],b[0])+32)/16);x++)for(let z=Math.floor((Math.min(a[1],b[1])-32)/16);z<=Math.floor((Math.max(a[1],b[1])+32)/16);z++){const key=x+':'+z;if(!this.roadGrid.has(key))this.roadGrid.set(key,[]);this.roadGrid.get(key).push(segment);}}}
 pathDistance(x,z){let distance=Infinity;for(const {a,dx,dz,l2} of this.roadGrid.get(Math.floor(x/16)+':'+Math.floor(z/16))||[]){const px=x-a[0],pz=z-a[1],t=clamp((px*dx+pz*dz)/(l2||1));distance=Math.min(distance,(px-t*dx)**2+(pz-t*dz)**2);}return Math.sqrt(distance);}

 height(x,z){
  if(!['village','forest','tower','ruins','shrine-court'].includes(this.zone))return this.authoredHeight(x,z);
  const [w,d]=this.config.authoredSize||this.config.size,ox=Math.max(0,Math.abs(x)-w/2),oz=Math.max(0,Math.abs(z)-d/2),outside=Math.hypot(ox,oz);
  if(!outside)return this.authoredHeight(x,z);
  const edge=this.authoredHeight(clamp(x,-w/2,w/2),clamp(z,-d/2,d/2));
  const country=7+Math.sin(x*.017+z*.008)*6+Math.cos(z*.020-x*.006)*5+Math.sin(x*.042)*Math.cos(z*.027)*2.2;
  const ridges=(12+12*Math.sin(x*.008+1.2)**2+18*Math.cos(z*.009-.8)**2)*smooth(70,300,outside);
  return THREE.MathUtils.lerp(edge,country+ridges,smooth(0,80,outside));
 }
 authoredHeight(x,z){
  if(this.zone==='village'){
   let h=villageBase(x,z)*smooth(12,23,Math.hypot(x,z-7));
   h*=smooth(5,12,Math.abs(z-16))+ (1-smooth(5,12,Math.abs(z-16)))*smooth(7,18,Math.abs(x+55));
   for(const b of BUILDINGS){const dist=Math.max(Math.abs(x-b.x)-b.w/2,Math.abs(z-b.z)-b.d/2);if(dist<5){const base=villageBase(b.x,b.z)*smooth(12,23,Math.hypot(b.x,b.z-7));h=THREE.MathUtils.lerp(h,base,1-smooth(0,5,dist));}}
   // The bridge and its approach stay on the river's low crossing.
   return h;
  }
  if(this.zone==='forest'){
   const rolling=hill(x,z,-72,-10,46,13)+hill(x,z,72,-36,37,9)+hill(x,z,-42,-85,35,17)+hill(x,z,49,66,32,6)-hill(x,z,-94,5,12,5);
   const detail=(Math.sin(x*.09+z*.025)*Math.cos(z*.11)*1.3+Math.sin(z*.22+x*.11)*.36)*smooth(3,15,this.pathDistance(x,z));return rolling+detail;
  }
  if(this.zone==='tower')return z>19?0:z>-11?clamp((19-z)/12)*4:4+clamp((-11-z)/12)*4;
  if(this.zone==='ruins')return smooth(12,30,this.pathDistance(x,z))*(2.5+Math.sin(x*.08)*Math.cos(z*.055)*2);
  if(this.zone==='shrine-court')return smooth(9,25,Math.abs(x))*(2.4+Math.sin(z*.08));
  if(this.zone==='shrine-upper')return z>=19?0:z>15?-(19-z)*.625:z>=-15?-2.5:z>-19?-2.5-(-15-z)*.625:-5;
  if(this.zone==='shrine-lower')return z>=23?-5:z>15?-5-(23-z)*.4375:z>=-15?-8.5:z>-23?-8.5-(-15-z)*.4375:-12;
  if(this.zone==='shrine-core')return -12;return 0;
 }
}
const textures={};
export const terrainTextures=()=>Object.values(textures);
export async function loadTerrain(){
 // Painted surfaces are generated at runtime. No photographic ground is used.
 for(const kind of ['grass','earth','stone'])textures[kind]=canvasTexture(1024,(c,size)=>{
  const rng=random(kind==='grass'?392:kind==='earth'?441:12);
  c.fillStyle={grass:'#92b966',earth:'#d2b780',stone:'#7e8b76'}[kind];c.fillRect(0,0,size,size);
  if(kind==='stone'){
   const rows=9,columns=8,cw=size/columns,ch=size/rows;
   for(let row=-1;row<=rows;row++)for(let col=-1;col<=columns;col++){
    const x=col*cw+(row%2)*cw*.5,y=row*ch,w=cw-8-rng()*8,h=ch-9-rng()*8,shade=57+rng()*11;
    c.fillStyle=`hsl(${39+rng()*9},${16+rng()*8}%,${shade}%)`;c.beginPath();c.roundRect(x+5,y+5,w,h,[12+rng()*10,9,14,8]);c.fill();c.strokeStyle='#ece0b8';c.lineWidth=3;c.beginPath();c.moveTo(x+17,y+8);c.lineTo(x+w-9,y+8);c.stroke();c.strokeStyle='#68735c55';c.lineWidth=4;c.beginPath();c.moveTo(x+10,y+h+3);c.lineTo(x+w-4,y+h+3);c.stroke();
   }
  }
  for(let i=0;i<3000;i++){const x=rng()*size,y=rng()*size;c.strokeStyle=kind==='grass'?(i%2?'#ced99918':'#4f7e4819'):kind==='earth'?(i%2?'#f1d7a01d':'#846d4917'):'#fbefcf15';c.lineWidth=.8+rng()*2.5;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+4,y-7,x+8+rng()*13,y-10-rng()*8);c.stroke();}
 });
 for(const t of Object.values(textures)){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;}
}
export function surfaceMaterial(kind='grass',color='#ffffff',scale=3){
 const m=new THREE.MeshStandardMaterial({map:textures[kind],roughness:.95,color:kind==='grass'?'#ffffff':color});
 m.onBeforeCompile=s=>{
  s.vertexShader='varying vec3 vTerrainWorld;\n'+s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvTerrainWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
  s.fragmentShader=`varying vec3 vTerrainWorld;
   float terrainHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float terrainNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(terrainHash(i),terrainHash(i+vec2(1.,0.)),f.x),mix(terrainHash(i+vec2(0.,1.)),terrainHash(i+vec2(1.)),f.x),f.y);}
  `+s.fragmentShader;
  const tiledMap=THREE.ShaderChunk.map_fragment.replaceAll('vMapUv','(vTerrainWorld.xz / '+scale.toFixed(2)+')');
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',tiledMap+(kind==='grass'?`
   float meadow=terrainNoise(vTerrainWorld.xz*.065)*.7+terrainNoise(vTerrainWorld.xz*.19)*.3;
   diffuseColor.rgb*=mix(vec3(.73,.88,.58),vec3(1.10,1.08,.86),smoothstep(.2,.8,meadow));`:''));
 };m.customProgramCacheKey=()=> 'painted-'+kind+'-'+scale;return m;
}
export function terrainMesh(terrain){const [w,d]=terrain.config.size,geo=new THREE.PlaneGeometry(w,d,Math.ceil(w/1.5),Math.ceil(d/1.5));geo.rotateX(-Math.PI/2);const p=geo.attributes.position,colors=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,terrain.height(x,z));const tint=new THREE.Color().setRGB(.96+.03*Math.sin(x*.045+z*.023),.97+.025*Math.sin(z*.04),.93+.04*Math.cos(x*.039));colors.push(tint.r,tint.g,tint.b);}geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const m=surfaceMaterial('grass','#94b678',1.65);m.vertexColors=true;const mesh=new THREE.Mesh(geo,m);mesh.receiveShadow=true;return mesh;}
export function addLandscape(root,terrain,assets,{extent=590,trees=true}={}){
 if(!['village','forest','tower','ruins','shrine-court'].includes(terrain.zone))return;
 const [w,d]=terrain.config.size,positions=[],indices=[],uv=[],segments=384,rings=58;
 // The outer landscape uses exactly the same height sampler as walking and props.
 // More rings near the inner edge keep the playable boundary watertight.
 for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
  const angle=i/segments*Math.PI*2,sn=Math.sin(angle),cs=Math.cos(angle),square=1/Math.max(Math.abs(sn),Math.abs(cs)),t=(j/rings)**1.55;
  const x=sn*square*(w/2+(extent-w/2)*t),z=cs*square*(d/2+(extent-d/2)*t);
  positions.push(x,terrain.height(x,z),z);uv.push(x/4,z/4);
 }
 for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const n=j*(segments+1)+i;indices.push(n,n+segments+1,n+1,n+1,n+segments+1,n+segments+2);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,surfaceMaterial('grass','#ffffff',4));mesh.name='Continuous countryside';mesh.receiveShadow=true;root.add(mesh);
 const rng=random(731),anchors=[];if(trees)for(let i=0;i<1450;i++){
  const x=(rng()-.5)*920,z=(rng()-.5)*920;if(Math.abs(x)<w/2+4&&Math.abs(z)<d/2+4)continue;
  // Forested slopes alternate with open meadow glades, rather than a ring of trees.
  if(Math.sin(x*.036)*Math.cos(z*.029)<-.4)continue;
  const y=terrain.height(x,z),far=Math.hypot(x,z)>300,model=assets.place(root,['CommonTree_4','CommonTree_5','Pine_2','CommonTree_2'][i%4],x,y-.12,z,{scale:1+(rng()*.7),rotation:rng()*Math.PI*2});
  model.traverse(o=>{if(o.isMesh)o.castShadow=!far;});anchors.push({x,z,y,ground:terrain.height(x,z)});
  if(!far&&i%3===0)assets.place(root,'Rock_Medium_1',x+3,terrain.height(x+3,z)-.18,z,{width:3,height:1.6,depth:2.8,rotation:rng()*6});
 }
 root.userData.landscape={extent,treeAnchors:anchors};
 return mesh;
}
