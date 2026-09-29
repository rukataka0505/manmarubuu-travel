import * as THREE from 'three';
import {canvasTexture} from './graphics.js';
let emblem;
export function createQuestBeacon(parent){
 if(!emblem)emblem=canvasTexture(256,(c,s)=>{
  c.shadowColor='#fceba8';c.shadowBlur=21;c.fillStyle='#dca93e';c.strokeStyle='#fff4c4';c.lineWidth=8;
  c.beginPath();c.moveTo(128,242);c.lineTo(46,162);c.quadraticCurveTo(4,111,49,60);c.quadraticCurveTo(128,-12,207,60);c.quadraticCurveTo(252,111,210,162);c.closePath();c.fill();c.stroke();
  c.shadowBlur=0;c.fillStyle='#31543e';c.beginPath();c.arc(128,109,66,0,Math.PI*2);c.fill();c.strokeStyle='#f5e3a0';c.lineWidth=3;c.stroke();c.fillStyle='#fff6ce';c.font='bold 96px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText('!',128,112);
 });
 const root=new THREE.Group();root.name='Next objective beacon';root.userData.dynamic=true;parent.add(root);
 const icon=new THREE.Sprite(new THREE.SpriteMaterial({map:emblem,transparent:true,depthWrite:false,depthTest:false}));icon.renderOrder=20;root.add(icon);root.userData.icon=icon;
 const ground=new THREE.Mesh(new THREE.RingGeometry(1.05,1.26,64),new THREE.MeshBasicMaterial({color:'#ffe39b',transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false}));ground.rotation.x=-Math.PI/2;ground.position.y=.1;root.add(ground);
 const outer=ground.clone();outer.material=ground.material.clone();outer.scale.setScalar(1.3);root.add(outer);root.userData.rings=[ground,outer];
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(.45,.9,4.4,24,1,true),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float time;varying vec2 vUv;void main(){float a=(1.-vUv.y)*(.075+.035*sin(time*2.));gl_FragColor=vec4(1.,.75,.22,a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));beam.position.y=2.2;root.add(beam);root.userData.beam=beam;
 root.addEventListener('removed',()=>root.traverse(o=>o.material?.dispose()));
 return root;
}
export function updateQuestBeacon(root,world,goal,position,time){
 root.visible=!!goal&&world.quality.markers!==false;if(!root.visible)return;
 root.position.set(goal.x,world.height(goal.x,goal.z),goal.z);
 const distance=Math.hypot(position.x-goal.x,position.z-goal.z),size=THREE.MathUtils.clamp(1.8+distance*.023,1.8,4.2);
 root.userData.icon.scale.set(size,size,1);root.userData.icon.position.y=(goal.type==='npc'?3.7:3.25)+Math.sin(time*2.4)*.14;
 root.userData.beam.material.uniforms.time.value=time;
 root.userData.rings.forEach((r,i)=>{r.scale.setScalar(1+i*.3+Math.sin(time*2.4+i)*.09);r.material.opacity=.55+Math.sin(time*2.4+i)*.18;});
}
