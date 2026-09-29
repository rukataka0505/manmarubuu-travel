import * as THREE from 'three';
import {random,canvasTexture} from './graphics.js';
let bladeGeometry;
function grassBlade(){if(bladeGeometry)return bladeGeometry;const pos=[],normal=[],color=[],uv=[],index=[];
 for(let blade=0;blade<3;blade++){const angle=blade*Math.PI*2/3,cs=Math.cos(angle),sn=Math.sin(angle),base=pos.length/3;
  for(let j=0;j<=4;j++){const t=j/4,width=.048*(1-t)+.001,bend=t*t*.17;for(const side of [-1,1]){const x=side*width;pos.push(x*cs+bend*sn,t*(.42+blade*.05),-x*sn+bend*cs);normal.push(sn*.2,.96,cs*.2);color.push(.66+t*.3,.78+t*.22,.43+t*.32);uv.push((side+1)/2,t);}if(j<4){const n=base+j*2;index.push(n,n+1,n+2,n+1,n+3,n+2);}}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normal,3));g.setAttribute('color',new THREE.Float32BufferAttribute(color,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(index);g.userData.shared=true;bladeGeometry=g;return g;
}
export function addMeadows(world){if(!['village','forest','tower','ruins','shrine-court'].includes(world.zone))return;
 const rng=random(926),[w,d]=world.config.size,total=Math.round(w*d*(world.zone==='village'?2.5:1.85)),cells=new Map();
 for(let i=0;i<total;i++){const x=(rng()-.5)*(w-6),z=(rng()-.5)*(d-6),path=world.pathDistance(x,z),patch=Math.sin(x*.22+Math.sin(z*.12)*2)*Math.cos(z*.18);
  if(path<3.4||patch<-.55||!world.walkable(x,z)||world.houses.some(b=>Math.abs(x-b.x)<b.w/2+1.6&&Math.abs(z-b.z)<b.d/2+1.6))continue;
  const key=Math.floor(x/24)+':'+Math.floor(z/24);if(!cells.has(key))cells.set(key,[]);cells.get(key).push({x,z,y:world.height(x,z),scale:.8+rng()*.7,angle:rng()*6.283});
 }
 const mat=new THREE.MeshStandardMaterial({color:'#9cb768',roughness:1,vertexColors:true,side:THREE.DoubleSide});mat.onBeforeCompile=s=>{s.uniforms.meadowTime=world.assets.time;s.vertexShader='uniform float meadowTime;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec3 bladeWorld=(instanceMatrix*vec4(position,1.)).xyz;transformed.x+=sin(meadowTime*1.6+bladeWorld.x*.5+bladeWorld.z*.3)*.09*uv.y*uv.y;');};mat.customProgramCacheKey=()=> 'meadow-wind';
 const temp=new THREE.Object3D();for(const blades of cells.values()){const mesh=new THREE.InstancedMesh(grassBlade(),mat,blades.length);mesh.receiveShadow=true;mesh.castShadow=false;mesh.userData.decor=true;mesh.userData.grassRange='near';mesh.userData.fullCount=blades.length;blades.forEach((b,i)=>{temp.position.set(b.x,b.y,b.z);temp.rotation.y=b.angle;temp.scale.setScalar(b.scale);temp.updateMatrix();mesh.setMatrixAt(i,temp.matrix);});mesh.computeBoundingSphere();world.root.add(mesh);}
 world.meadowCount=[...cells.values()].reduce((sum,c)=>sum+c.length,0);
 world.farMeadowCount=addDistantMeadows(world.root,world.terrain,world.assets,{exclude:(x,z)=>Math.abs(x)<w/2&&Math.abs(z)<d/2&&(world.pathDistance(x,z)<3.3||!world.walkable(x,z)||world.houses.some(b=>Math.abs(x-b.x)<b.w/2+1.8&&Math.abs(z-b.z)<b.d/2+1.8))});
}

let coverTexture,coverGeometry;
function meadowCard(){
 if(!coverTexture)coverTexture=canvasTexture(256,(c,s)=>{const rng=random(147);c.clearRect(0,0,s,s);for(let i=0;i<85;i++){const x=rng()*s,y=s-8-rng()*24,h=25+rng()*178,bend=(rng()-.5)*50;c.fillStyle=['#628741','#789849','#94ae59','#b1bb69'][i%4];c.beginPath();c.moveTo(x-3,y);c.quadraticCurveTo(x+bend*.3,y-h*.5,x+bend,y-h);c.quadraticCurveTo(x+bend*.3+6,y-h*.4,x+5,y);c.fill();}});
 if(!coverGeometry){const pos=[],uv=[],normal=[],indices=[];for(let i=0;i<3;i++){const a=i*Math.PI/3,dx=Math.cos(a)*1.05,dz=Math.sin(a)*1.05,n=pos.length/3;pos.push(-dx,0,-dz,dx,0,dz,-dx,.83,-dz,dx,.83,dz);uv.push(0,0,1,0,0,1,1,1);normal.push(0,1,0,0,1,0,0,1,0,0,1,0);indices.push(n,n+1,n+2,n+1,n+3,n+2);}coverGeometry=new THREE.BufferGeometry();coverGeometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));coverGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));coverGeometry.setAttribute('normal',new THREE.Float32BufferAttribute(normal,3));coverGeometry.setIndex(indices);coverGeometry.userData.shared=true;}
 return coverGeometry;
}
// Wider painted clumps retain a meadow silhouette when individual blades are sub-pixel.
export function addDistantMeadows(root,terrain,assets,{extent=445,count=52000,exclude=()=>false}={}){
 const geo=meadowCard(),rng=random(642),cells=new Map(),farLimit={value:400},mat=new THREE.MeshStandardMaterial({map:coverTexture,alphaTest:.36,side:THREE.DoubleSide,roughness:1});mat.forceSinglePass=true;
 mat.onBeforeCompile=s=>{s.uniforms.meadowTime=assets.time;s.uniforms.meadowLimit=farLimit;s.vertexShader='uniform float meadowTime;varying float meadowDistance;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 vec3 meadowWorld=(modelMatrix*instanceMatrix*vec4(position,1.)).xyz;meadowDistance=distance(cameraPosition,meadowWorld);transformed.x+=sin(meadowTime*1.4+meadowWorld.x*.5+meadowWorld.z*.21)*.12*uv.y*uv.y;`);s.fragmentShader='uniform float meadowLimit;varying float meadowDistance;\n'+s.fragmentShader.replace('#include <alphatest_fragment>',`diffuseColor.a*=(1.-smoothstep(meadowLimit-55.,meadowLimit,meadowDistance));\n#include <alphatest_fragment>`);};mat.customProgramCacheKey=()=> 'meadow-cover-persistent';mat.userData.meadowLimit=farLimit;
 for(let i=0;i<count;i++){const x=(rng()-.5)*extent*2,z=(rng()-.5)*extent*2;if(exclude(x,z)||Math.sin(x*.031)*Math.cos(z*.045)<-.75)continue;const key=Math.floor(x/48)+':'+Math.floor(z/48);if(!cells.has(key))cells.set(key,[]);cells.get(key).push({x,z,y:terrain.height(x,z)-.035,s:1+rng()*.65,a:rng()*6.28});}
 let total=0;const transform=new THREE.Object3D();for(const plants of cells.values()){const mesh=new THREE.InstancedMesh(geo,mat,plants.length);mesh.receiveShadow=true;mesh.userData.decor=true;mesh.userData.grassRange='far';mesh.userData.fullCount=plants.length;plants.forEach((b,i)=>{transform.position.set(b.x,b.y,b.z);transform.rotation.y=b.a;transform.scale.setScalar(b.s);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);});mesh.computeBoundingSphere();root.add(mesh);total+=plants.length;}return total;
}
