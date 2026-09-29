import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {shape,material} from './graphics.js';

// KayKit's shared Rig_Medium binds the authored animation tracks by bone name.
const profiles={mori:['Mage',1.9,'Idle_B'],lily:['Rogue',1.28,'Idle_A'],coco:['Ranger',1.22,'Idle_B'],inn:['Ranger',1.75,'Holding_A'],shop:['Rogue',1.72,'Idle_B'],smith:['Barbarian',2.0,'Hammering'],chapel:['Mage',1.72,'Idle_A'],gate:['Knight',1.95,'Idle_A'],baker:['Ranger',1.7,'Working_A']};
const templates=new Map(),clips=new Map();
export async function loadNPCs(){
 const loader=new GLTFLoader();
 await Promise.all(['Mage','Ranger','Rogue','Knight','Barbarian'].map(async name=>{const g=await loader.loadAsync('/npcs/'+name+'.glb');g.scene.traverse(o=>{if(o.isMesh){o.geometry.userData.shared=true;o.castShadow=o.receiveShadow=true;o.frustumCulled=false;const list=Array.isArray(o.material)?o.material:[o.material];for(const m of list){m.roughness=.86;if(m.map)m.map.anisotropy=8;}}});templates.set(name,g.scene);}));
 await Promise.all(['General','MovementBasic','Simulation','Tools'].map(async name=>{const g=await loader.loadAsync('/npcs/Rig_Medium_'+name+'.glb');for(const c of g.animations)if(c.name!=='T-Pose')clips.set(c.name,c);}));
}
export function npc(data={}){
 const profile=profiles[data.id]||[['Ranger','Rogue'][Math.abs((data.id||'a').charCodeAt(7)||0)%2],1.65,'Idle_A'];
 const root=new THREE.Group(),model=clone(templates.get(profile[0]));root.add(model);
 const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());model.scale.setScalar(profile[1]/size.y);model.position.y=-box.min.y*model.scale.x;
 // Villagers carry no quivers or helmets. The guard keeps his equipment.
 model.traverse(o=>{if(!o.isMesh)return;if(/Quiver/.test(o.name)||data.id!=='gate'&&/Helmet|BearHat/.test(o.name)||data.id==='chapel'&&/Hat/.test(o.name))o.visible=false;
  if(/Body|Cape|Hat/.test(o.name)&&data.color){o.material=o.material.clone();const color=new THREE.Color(data.color);o.material.onBeforeCompile=s=>{s.uniforms.clothingColor={value:color};s.fragmentShader='uniform vec3 clothingColor;\n'+s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat clothShade=max(.45,dot(diffuseColor.rgb,vec3(.3,.58,.12)));diffuseColor.rgb=mix(diffuseColor.rgb,clothingColor*clothShade,.88);');};o.material.customProgramCacheKey=()=> 'npc-cloth';}
 });
 const mixer=new THREE.AnimationMixer(model),actions=new Map();for(const [name,clip]of clips)actions.set(name,mixer.clipAction(clip));
 root.userData.npc={id:data.id,model,mixer,actions,idle:profile[2],current:'',time:0,height:profile[1],bones:{}};model.traverse(o=>{if(o.isBone)root.userData.npc.bones[o.name]=o;});
 playNPC(root,profile[2]);mixer.update((data.id?.length||1)*.17);model.updateMatrixWorld(true);
 if(data.id==='mori'){const head=model.getObjectByName('Mage_Head'),bone=root.userData.npc.bones.head;if(head&&bone){const box=new THREE.Box3().setFromObject(head),point=box.getCenter(new THREE.Vector3()),sz=box.getSize(new THREE.Vector3());point.y-=sz.y*.3;point.z=box.max.z+.01;const beard=new THREE.Group();beard.position.copy(bone.worldToLocal(point));beard.quaternion.copy(bone.getWorldQuaternion(new THREE.Quaternion()).invert());const scale=bone.getWorldScale(new THREE.Vector3());beard.scale.set(1/scale.x,1/scale.y,1/scale.z);bone.add(beard);shape(beard,'smooth',material('#d8d3bc'),0,-.06,0,.115,.16,.075);for(const side of [-1,1])shape(beard,'smooth',material('#eeead5'),side*.067,.032,.015,.07,.025,.045);}}
 return root;
}
export function playNPC(root,name,loop=true){const n=root?.userData.npc;if(!n||n.current===name)return;const action=n.actions.get(name)||n.actions.get('Idle_A');n.action?.fadeOut(.22);action.reset().setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1).setEffectiveWeight(1).fadeIn(.22).play();action.clampWhenFinished=!loop;n.action=action;n.current=name;}
export function animateNPC(root,time,walking=false,hug=0){const n=root?.userData.npc;if(!n)return;const dt=Math.min(.05,Math.max(0,time-n.time));n.time=time;playNPC(root,hug?'Interact':walking?'Walking_A':n.greeting?'Waving':n.idle);n.mixer.update(dt);if(hug){for(const [name,sign]of [['upperarm.l',1],['upperarm.r',-1]]){const b=n.bones[name]||n.bones[name.replaceAll('.','')];if(b){b.rotation.x=THREE.MathUtils.lerp(b.rotation.x,-.9,hug);b.rotation.z=THREE.MathUtils.lerp(b.rotation.z,sign*.5,hug);}}}}
export const npcAssetInfo=()=>({models:templates.size,clips:clips.size});
