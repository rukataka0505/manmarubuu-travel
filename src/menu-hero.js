import * as THREE from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';

// One small renderer, used only while a character panel is visible. Geometry,
// textures and materials remain owned by the real character; only bones are cloned.
export class MenuHero{
 constructor(){
  this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  this.renderer.setClearColor(0,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;
  this.canvas=this.renderer.domElement;this.canvas.className='menu-hero-canvas';this.canvas.setAttribute('aria-label','まんまるぶうの全身。ドラッグで回転');
  this.scene=new THREE.Scene();this.scene.add(new THREE.HemisphereLight('#fff5df','#73898b',2.25));
  for(const [color,intensity,x,y,z]of [['#ffeacb',2.8,-3,4,5],['#b8e4f0',1.2,3,2,-2]]){const light=new THREE.DirectionalLight(color,intensity);light.position.set(x,y,z);this.scene.add(light);}
  this.camera=new THREE.PerspectiveCamera(32,1,.05,20);this.target=new THREE.Vector3(0,.85,0);
  this.angle=-.25;this.clock=0;
  this.canvas.addEventListener('pointerdown',e=>{this.drag=e.clientX;this.canvas.setPointerCapture(e.pointerId);});
  this.canvas.addEventListener('pointermove',e=>{if(this.drag===undefined)return;this.angle+=(e.clientX-this.drag)*.012;this.drag=e.clientX;});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])this.canvas.addEventListener(event,()=>this.drag=undefined);
 }
 mount(element){if(element&&this.canvas.parentElement!==element)element.prepend(this.canvas);}
 release(){if(!this.model)return;this.mixer?.stopAllAction();this.mixer?.uncacheRoot(this.rig);const skeletons=new Set();this.model.traverse(o=>{if(o.isSkinnedMesh&&!skeletons.has(o.skeleton)){skeletons.add(o.skeleton);o.skeleton.dispose();}});this.model.removeFromParent();this.model=null;this.rig=null;}
 update(dt,hero,state,settings){
  if(!this.canvas.isConnected)return;this.clock+=dt;if(this.clock<1/30)return;const step=this.clock;this.clock=0;
  const signature=hero.equipment.map(e=>e.uuid).join('|')+':'+settings.fur;
  if(signature!==this.signature){
   this.signature=signature;this.release();this.model=clone(hero.root);this.model.position.set(0,0,0);this.model.rotation.set(0,this.angle,0);
   this.model.children[0].rotation.set(0,0,0);this.model.children[0].position.set(0,0,0);this.model.children[0].scale.setScalar(1);
   this.model.traverse(o=>{if(o.isMesh){o.frustumCulled=false;const lod=hero.lods.get(o.name);if(lod)o.geometry=lod.geometries[settings.fur?0:1]||lod.geometries[0];if(o.name.startsWith('FurLOD_'))o.visible=settings.fur>0;}});
   this.scene.add(this.model);this.rig=this.model.children[0].children[0];this.mixer=new THREE.AnimationMixer(this.rig);this.mixer.clipAction(hero.actions.get('Idle').getClip()).play();this.mixer.update(0);
  }
  const r=this.canvas.parentElement.getBoundingClientRect(),w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height)),ratio=Math.min(devicePixelRatio,settings.fur?1.5:1);
  if(this.w!==w||this.h!==h||this.ratio!==ratio){this.w=w;this.h=h;this.ratio=ratio;this.renderer.setPixelRatio(ratio);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;const distance=Math.max(3.65,2.25/this.camera.aspect);this.camera.position.set(0,this.target.y+distance*.3,distance);this.camera.lookAt(this.target);this.camera.updateProjectionMatrix();}
  this.model.rotation.y=this.angle;this.mixer.update(step);this.renderer.render(this.scene,this.camera);this.canvas.dataset.ready='true';this.canvas.dataset.appearance=JSON.stringify(state.appearance);
 }
}
