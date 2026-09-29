import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {MONSTER_CATALOG,MONSTER_MOTIONS} from './monster-catalog.js';

const assets=new Map(),materials=new Map();
export async function loadMonsters(){
 const loader=new GLTFLoader();
 await Promise.all([...new Set(Object.values(MONSTER_CATALOG).map(p=>p.asset))].map(async name=>{
  const gltf=await loader.loadAsync('/monsters/'+name+'.glb');
  gltf.scene.traverse(o=>{if(o.isMesh){o.geometry.userData.shared=true;o.castShadow=o.receiveShadow=true;o.frustumCulled=false;}});
  assets.set(name,gltf);
 }));
}
function surface(base,profile,id){
 const key=id+':'+base.uuid;if(materials.has(key))return materials.get(key);
 const m=base.clone();m.roughness=.74;m.metalness=.02;if(m.map)m.map.anisotropy=8;
 if(profile.tint){const tint=new THREE.Color(profile.tint);m.onBeforeCompile=s=>{
  s.uniforms.creatureTint={value:tint};s.fragmentShader='uniform vec3 creatureTint;\n'+s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   float chroma=max(max(diffuseColor.r,diffuseColor.g),diffuseColor.b)-min(min(diffuseColor.r,diffuseColor.g),diffuseColor.b);
   float value=dot(diffuseColor.rgb,vec3(.3,.59,.11));
   diffuseColor.rgb=mix(diffuseColor.rgb,creatureTint*(.42+value*.85),smoothstep(.07,.28,chroma)*.88);`);
 };m.customProgramCacheKey=()=> 'monster-palette';}
 materials.set(key,m);return m;
}
export function monster(id){
 const profile=MONSTER_CATALOG[id],asset=profile&&assets.get(profile.asset);
 if(!asset)throw new Error('魔物アセット未読込: '+id);
 const root=new THREE.Group(),body=new THREE.Group(),model=clone(asset.scene);body.add(model);root.add(body);
 root.name='Monster:'+id;root.userData.dynamic=true;root.userData.id=id;root.userData.body=body;
 model.traverse(o=>{if(o.isMesh)o.material=Array.isArray(o.material)?o.material.map(m=>surface(m,profile,id)):surface(o.material,profile,id);});
 const mixer=new THREE.AnimationMixer(model),actions=new Map(asset.animations.map(c=>[c.name,mixer.clipAction(c)]));
 const control={asset:profile.asset,profile,model,mixer,actions,state:'',time:0,dead:false};root.userData.monster=control;
 playMonster(root,'idle');mixer.update(0);model.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=profile.height/size.y;
 model.scale.multiplyScalar(scale);model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);body.position.y=profile.hover||0;
 const radius=Math.min(1.65,size.x*scale*.35),shadow=new THREE.Mesh(new THREE.CircleGeometry(radius,40),new THREE.MeshBasicMaterial({color:'#182c31',transparent:true,opacity:.17,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;root.add(shadow);control.shadow=shadow;root.userData.height=profile.height+(profile.hover||0);
 return root;
}
export function playMonster(root,state,{loop=['idle','walk','run','guard'].includes(state),duration,force=false}={}){
 const c=root?.userData.monster;if(!c||c.dead&&state!=='death'||c.state===state&&!force)return;
 const name=MONSTER_MOTIONS[state]?.find(n=>c.actions.has(n));if(!name)return;
 const action=c.actions.get(name);c.action?.fadeOut(.12);action.reset().setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1).setEffectiveWeight(1).setEffectiveTimeScale(duration?action.getClip().duration/duration:state==='run'&&!c.actions.has('Run')?1.55:1).fadeIn(.12).play();action.clampWhenFinished=!loop;
 c.action=action;c.state=state;c.time=0;c.once=!loop;c.duration=duration||action.getClip().duration;c.dead=state==='death';
}
export function animateMonster(root,dt,motion){
 const c=root?.userData.monster;if(!c)return;
 if(motion&&!c.dead)playMonster(root,motion);
 c.time+=dt;c.mixer.update(dt);
 if(c.once&&!c.dead&&c.time>=c.duration)playMonster(root,'idle');
}
export function disposeMonster(root){
 const c=root?.userData.monster;if(!c)return;c.mixer.stopAllAction();c.mixer.uncacheRoot(c.model);const done=new Set();c.model.traverse(o=>{if(o.isSkinnedMesh&&!done.has(o.skeleton)){done.add(o.skeleton);o.skeleton.dispose();}});c.shadow.material.dispose();
}
export const monsterAssetInfo=()=>({models:assets.size,characters:Object.keys(MONSTER_CATALOG).length,files:[...assets.keys()]});
