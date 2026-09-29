import {kitTower,kitColumn} from './kit-architecture.js';
import * as THREE from 'three';
import {box,beam,group,shape,material,TAU} from './graphics.js';
const roofMaterials=new Map();
const STYLES={mori:{roof:'#587c77'},inn:{roof:'#b86242'},shop:{roof:'#65878a'},smith:{roof:'#626d82'},chapel:{roof:'#577495'},bakery:{roof:'#a55250'},house1:{roof:'#7b885c'},house2:{roof:'#b77345'},house3:{roof:'#627e86'},house4:{roof:'#817094'},house5:{roof:'#788456'},house6:{roof:'#825858'}};
export function tintRoof(root,id){const color=STYLES[id]?.roof||'#ae6344';root.traverse(o=>{if(!o.isMesh)return;const array=Array.isArray(o.material)?o.material:[o.material];const mapped=array.map(m=>{if(!/RoundTiles/.test(m.name))return m;const key=m.uuid+color;if(roofMaterials.has(key))return roofMaterials.get(key);const out=m.clone(),tint=new THREE.Color(color);out.onBeforeCompile=s=>{s.uniforms.roofColor={value:tint};s.fragmentShader='uniform vec3 roofColor;\n'+s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat tileShade=clamp(dot(diffuseColor.rgb,vec3(.3,.59,.11))*2.0,.45,1.4);diffuseColor.rgb=roofColor*tileShade;');};out.customProgramCacheKey=()=> 'roof-palette';roofMaterials.set(key,out);return out;});o.material=Array.isArray(o.material)?mapped:mapped[0];});}
function turret(world,parent,x,z,y,radius,height,style){
 const g=kitColumn(parent,world.assets,x,y,z,radius,height,true);
 world.assets.place(g,'Roof_Tower_RoundTiles',0,height-.2,0,{width:radius*2.8,depth:radius*2.8,height:radius*2.25});tintRoof(g,style);return g;
}
export function decorateHouse(world,b,base,roof,upper){const a=world.assets,w=b.w,d=b.d,h=b.floors*3.1;
 // Actual kit windows fill the apertures; shutters remain separate silhouettes.
 if(b.floors>1){const balcony=group(upper,0,3.14,d/2+.7);a.place(balcony,'Floor_WoodDark',0,0,0,{width:w*.55,depth:1.55,height:.2});a.place(balcony,'Balcony_Cross_Straight',0,.15,.7,{width:w*.55,height:1,depth:.16});for(const side of [-1,1])beam(base,'#806343',[side*w*.26,.1,d/2+.8],[side*w*.26,3.13,d/2+.8],.16);}
 if(['mori','inn','house3'].includes(b.id)){
  const xs=b.id==='inn'?[-w*.25,w*.25]:[0];for(const x of xs)a.place(roof,'Roof_Dormer_RoundTile',x,h+w*.15,d*.16,{width:2.6,height:2.8,depth:3.5});
 }
 if(b.id==='inn'){turret(world,roof,-w/2+1.3,-d/2+.7,0,1.75,h+2,'inn');a.place(upper,'Banner_1',w*.4,3.4,d/2+.38,{width:.85,height:2.5,depth:.15});}
 if(b.id==='mori'){turret(world,roof,-w*.39,-d*.29,1.8,1.65,h+.4,'mori');}
 if(b.id==='chapel'){
  const bell=group(roof,-w*.27,h*.4,-d*.24);kitColumn(bell,a,0,0,0,1.4,6.6,true);for(const side of [-1,1])for(const front of [-1,1])box(bell,'#947954',side*1.12,7.7,front*1.12,.25,2.4,.25);box(bell,'#b5a583',0,6.55,0,3,.2,3);a.place(bell,'Roof_Tower_RoundTiles',0,8.7,0,{width:4.4,height:4.2,depth:4.4});const brass=material('#c1a159',{metalness:.55,roughness:.5});shape(bell,new THREE.CylinderGeometry(.25,.65,.8,32,1,true),brass,0,7.3,0);beam(bell,brass,[0,7,0],[0,8.5,0],.045);
 }
 if(['shop','bakery','smith'].includes(b.id)){
  const canopy=group(base,0,2.75,d/2+1.0),shade=material(b.id==='shop'?'#668e91':b.id==='bakery'?'#c49561':'#697b88',{roughness:.9,side:THREE.DoubleSide});const geo=new THREE.PlaneGeometry(w*.74,2.5,12,6);const pos=geo.attributes.position;for(let i=0;i<pos.count;i++)pos.setZ(i,Math.sin((pos.getY(i)+1.25)/2.5*Math.PI)*.35);geo.computeVertexNormals();const cloth=new THREE.Mesh(geo,shade);cloth.rotation.x=-Math.PI*.37;canopy.add(cloth);for(const side of [-1,1]){beam(base,'#836447',[side*w*.35,0,d/2+2.15],[side*w*.35,3,d/2+2.15],.12);a.place(base,'Barrel',side*w*.4,0,d/2+.8,{height:.8,width:.7,depth:.7});}
 }
 if(b.id==='smith'){const shed=group(base,w/2+2.2,0,-.5);a.place(shed,'Roof_RoundTiles_4x4',0,2.55,0,{width:4.7,depth:6,height:2});for(const side of [-1,1])for(const front of [-1,1]){beam(shed,'#77604c',[side*1.9,0,front*2.2],[side*1.9,2.8,front*2.2],.18);world.collision(b.x+w/2+2.2+side*1.9,b.z-.5+front*2.2,.25,.25,2.8);}a.place(shed,'Workbench',0,0,-1.6,{width:3.3,height:1.05,depth:1.2});a.place(shed,'Anvil_Log',.4,0,.8,{height:.95});tintRoof(shed,'smith');}
 if(b.id==='bakery'){a.place(roof,'Prop_Chimney2',w*.31,h+w*.14-1.7,-d*.3,{height:3.4,width:1.8,depth:1.5});for(let i=0;i<3;i++){const smoke=shape(roof,'smooth',material('#e4e2d7',{transparent:true,opacity:.15-i*.035,depthWrite:false}),w*.31+i*.3,h+w*.14+2+i*.8,-d*.3,.5+i*.23);smoke.castShadow=false;}}
 if(b.id==='house6'){const wheel=group(base,-w/2-.3,2.0,0,true);for(let i=0;i<12;i++){const t=i*TAU/12;beam(wheel,'#826343',[0,0,0],[0,Math.sin(t)*1.8,Math.cos(t)*1.8],.13);}const rim=shape(wheel,new THREE.TorusGeometry(1.8,.15,10,48),material('#715742'),0,0,0);rim.rotation.y=Math.PI/2;world.animated.push({object:wheel,type:'mill'});}
 // Door clearances stay open; flowers and fences frame each frontage.
 for(const side of [-1,1]){const x=side*(w/2+1.0),z=d/2+.1;box(base,'#bdb096',x,.17,z,1.3,.36,3.2);box(base,'#685b43',x,.36,z,1.1,.08,3);for(let i=0;i<5;i++)a.place(base,i%2?'Flower_3_Group':'Flower_4_Group',x,.39,z-1.2+i*.6,{height:.38+(i%2)*.1,width:.65,depth:.62});if(b.id!=='smith')a.place(base,'Prop_WoodenFence_Single',side*(w/2+1.3),0,-d*.28,{width:d*.75,height:1.1,rotation:Math.PI/2});}
 tintRoof(roof,b.id);
}
