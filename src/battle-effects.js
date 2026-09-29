import * as THREE from 'three';
import {canvasTexture,TAU} from './graphics.js';

const V=(x,y,z)=>new THREE.Vector3(x,y,z);
export const EFFECT_COLORS={physical:'#ffd997',fire:'#ff914f',wind:'#a5ffe1',light:'#fff0a0',shadow:'#ac83f8',heal:'#adffcd',guard:'#92dfff',buff:'#ffdfa0',phase:'#aa87ec',status:'#cfaf79'};
export function effectFamily(e){
 if(['drill','meteor','break','roll','rock','poison','sleep','spores','dust','seal','drain'].includes(e.move))return e.move;
 if(['shell','cover','reflect','burrow'].includes(e.move))return 'guard';
 return e.kind||'physical';
}
let glow,star,rune;
function textures(){
 if(glow)return;
 glow=canvasTexture(256,(c,s)=>{const g=c.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'#ffffffff');g.addColorStop(.13,'#ffffffeb');g.addColorStop(.4,'#ffffff64');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(0,0,s,s);});
 star=canvasTexture(256,(c,s)=>{c.clearRect(0,0,s,s);c.translate(s/2,s/2);for(let j=0;j<2;j++){c.save();c.rotate(j*Math.PI/4);c.fillStyle=j?'#ffffff99':'#ffffffff';c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?12:j?78:125;c.lineTo(Math.sin(a)*r,Math.cos(a)*r);}c.closePath();c.fill();c.restore();}});
 rune=canvasTexture(512,(c,s)=>{c.clearRect(0,0,s,s);c.translate(s/2,s/2);c.strokeStyle='#ffffff';c.lineWidth=4;for(const r of [160,181,225]){c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();}c.lineWidth=3;for(let i=0;i<12;i++){c.save();c.rotate(i*TAU/12);c.beginPath();c.moveTo(-9,-203);c.lineTo(0,-220);c.lineTo(9,-203);c.lineTo(0,-191);c.closePath();c.stroke();c.restore();}for(let start=0;start<2;start++){c.beginPath();for(let i=0;i<3;i++){const a=i*TAU/3+start*Math.PI/3;c.lineTo(Math.sin(a)*155,Math.cos(a)*155);}c.closePath();c.stroke();}});
}
function additive(color,opacity=1,extra={}){return new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,...extra});}

export class BattleFX{
 constructor(scene){textures();this.root=new THREE.Group();this.root.name='Layered battle effects';scene.add(this.root);this.effects=[];this.density=1;this.families=new Set();}
 add(mesh,duration,update=()=>{},opacity=1){mesh.userData.fxOpacity=opacity;this.root.add(mesh);this.effects.push({mesh,time:0,duration,update,opacity});return mesh;}
 disposeEffect(e){e.mesh.removeFromParent();const geos=new Set(),materials=new Set();e.mesh.traverse(o=>{if(o.geometry&&!o.isSprite&&!geos.has(o.geometry)){o.geometry.dispose();geos.add(o.geometry);}if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])if(!materials.has(m)){if(m.userData.ownedMap)m.map?.dispose();m.dispose();materials.add(m);}});}
 flash(position,color,size=2.4,duration=.48,spiked=false){
  const mat=new THREE.SpriteMaterial({map:spiked?star:glow,color,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,rotation:spiked?Math.PI*.13:0});
  const s=new THREE.Sprite(mat);s.position.copy(position);s.scale.setScalar(size*.45);
  return this.add(s,duration,t=>{s.scale.setScalar(size*(.45+Math.sin(Math.min(1,t*1.35)*Math.PI/2)*.9));mat.rotation+=spiked?.025:0;},spiked?.95:.75);
 }
 burst(position,color,count=42,power=1,options={}){
  count=Math.max(8,Math.round(count*Math.max(.35,this.density)));const duration=options.duration||.8,geo=new THREE.BufferGeometry(),pos=new Float32Array(count*3),vel=new Float32Array(count*3),sizes=new Float32Array(count);
  for(let i=0;i<count;i++){const a=Math.random()*TAU,up=Math.random(),r=(.5+Math.random()*3)*power;pos.set([position.x+(Math.random()-.5)*.2,position.y,position.z+(Math.random()-.5)*.2],i*3);vel.set([Math.sin(a)*r,(options.rise?1+up*3:(up-.18)*5)*power,Math.cos(a)*r],i*3);sizes[i]=(.07+Math.random()*.12)*(options.size||1)*power;}
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('velocity',new THREE.BufferAttribute(vel,3));geo.setAttribute('diameter',new THREE.BufferAttribute(sizes,1));
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{age:{value:0},duration:{value:duration},color:{value:new THREE.Color(color)},gravity:{value:options.rise?-.3:4.5}},vertexShader:`uniform float age;uniform float duration;uniform float gravity;attribute vec3 velocity;attribute float diameter;varying float life;void main(){life=clamp(age/duration,0.,1.);vec3 p=position+velocity*age;p.y-=gravity*age*age*.5;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(diameter*(1.-life*.65)*650./max(1.,-mv.z),1.,65.);}`,fragmentShader:`uniform vec3 color;varying float life;void main(){vec2 p=gl_PointCoord*2.-1.;float r=length(p);if(r>1.)discard;float halo=pow(max(0.,1.-r),2.);float core=exp(-r*r*28.);gl_FragColor=vec4(mix(color,vec3(1.),core*.7),(halo*.8+core*.65)*(1.-life));\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`});
  const mesh=new THREE.Points(geo,mat);mesh.frustumCulled=false;this.add(mesh,duration,(t,dt)=>mat.uniforms.age.value+=dt);
 }
 ring(position,color,power=1,vertical=false){
  const mesh=new THREE.Mesh(new THREE.RingGeometry(.82,1,72),additive(color,.9));mesh.position.copy(position);if(!vertical)mesh.rotation.x=-Math.PI/2;
  this.add(mesh,.68,t=>mesh.scale.setScalar(.15+t*3.5*power),.9);return mesh;
 }
 slash(position,color,size=1.8,angle=0){
  const geo=new THREE.RingGeometry(.73,1,48,1,-Math.PI*.72,Math.PI*1.45),m=new THREE.Mesh(geo,additive(color));m.position.copy(position);m.rotation.set(.35,angle,.45);m.scale.setScalar(size*.35);
  this.add(m,.48,t=>{m.scale.setScalar(size*(.35+t*.8));m.rotation.z=.45+t*.8;});this.flash(position,'#fff9db',size*.7,.25,true);
 }
 seal(position,color,size=2.4,duration=1.1){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),additive(color,.85,{map:rune}));mesh.position.copy(position).add(V(0,.09,0));mesh.rotation.x=-Math.PI/2;mesh.scale.setScalar(size*2);this.add(mesh,duration,t=>{mesh.rotation.z=t*.45;mesh.scale.setScalar(size*(1.8+t*.35));},.8);return mesh;}
 vortex(position,color,size=1.7,height=3.7,twists=2.3){
  for(let band=0;band<3;band++){
   const points=[];for(let i=0;i<=64;i++){const t=i/64,a=t*TAU*twists+band*TAU/3,r=size*(.3+t*.7);points.push(V(Math.cos(a)*r,t*height,Math.sin(a)*r));}
   const ribbon=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),96,.065,4,false),additive(color,.9));ribbon.position.copy(position);
   this.add(ribbon,1.05,t=>{ribbon.rotation.y=t*3.5;ribbon.scale.setScalar(.45+Math.sin(t*Math.PI*.7)*.7);},.9);
  }
  this.burst(position.clone().add(V(0,.5,0)),color,65,size*.65,{rise:true,duration:1.1});
 }
 shards(position,color,count=16,size=1){
  const geo=new THREE.IcosahedronGeometry(.16,0),m=new THREE.InstancedMesh(geo,additive(color,.8),Math.max(6,Math.floor(count*Math.max(.35,this.density)))),o=new THREE.Object3D(),items=[];
  for(let i=0;i<m.count;i++){const a=Math.random()*TAU,sp=(1.5+Math.random()*3)*size;items.push({v:V(Math.sin(a)*sp,1+Math.random()*4,Math.cos(a)*sp),spin:Math.random()*5,scale:(.7+Math.random())*size});}
  m.frustumCulled=false;m.userData.instances=true;this.add(m,.85,t=>{for(let i=0;i<items.length;i++){const p=items[i];o.position.copy(position).addScaledVector(p.v,t);o.position.y-=t*t*2.3;o.rotation.set(t*p.spin,t*2,p.spin);o.scale.set(p.scale*(1-t),p.scale*2.6*(1-t),p.scale*(1-t));o.updateMatrix();m.setMatrixAt(i,o.matrix);}m.instanceMatrix.needsUpdate=true;},.85);
 }
 dome(position,color,size=1.8){const m=new THREE.Mesh(new THREE.SphereGeometry(size,36,20,0,TAU,0,Math.PI*.6),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide,wireframe:false}));m.position.copy(position);this.add(m,1.2,t=>m.scale.setScalar(.85+Math.sin(t*Math.PI)*.16),.22);this.seal(position,color,size,1.2);for(let i=0;i<3;i++){const r=this.ring(position.clone().add(V(0,.8+i*.35,0)),color,.35,true);r.rotation.y=i*Math.PI/3;}}
 column(position,color,height=5){const m=new THREE.Mesh(new THREE.CylinderGeometry(.5,.85,height,32,1,true),additive(color,.25));m.position.copy(position).add(V(0,height/2,0));this.add(m,.9,t=>{m.scale.x=m.scale.z=.4+Math.sin(t*Math.PI)*1.1;},.23);this.flash(position.clone().add(V(0,1,0)),color,3.1,.85);}
 helix(position,direction,length=2.6,radius=.62){
  const pivot=new THREE.Group();pivot.position.copy(position);pivot.quaternion.setFromUnitVectors(V(0,0,1),direction);
  for(let j=0;j<3;j++){const points=[];for(let i=0;i<=48;i++){const t=i/48,a=t*TAU*2.4+j*TAU/3,r=radius*(.4+.6*Math.sin(t*Math.PI));points.push(V(Math.cos(a)*r,Math.sin(a)*r,-length*(1-t)));}const ribbon=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,.033,5,false),additive(j?'#ffdd90':'#fff7db',.8));pivot.add(ribbon);}
  this.add(pivot,.55,t=>{pivot.rotation.z+=.16;pivot.scale.setScalar(1+t*.35);},.8);
 }
 cast(event,position,direction=V(0,0,1)){const f=effectFamily(event),color=EFFECT_COLORS[event.kind]||'#f7d696';
  if(['light','wind','shadow','fire','heal','buff','phase'].includes(f)){this.seal(position,color,1.3,.85);this.burst(position.clone().add(V(0,.5,0)),color,22,.45,{rise:true});}
  if(f==='drill'){this.seal(position,'#ffdc8b',1.7,1);this.flash(position.clone().add(V(0,1.25,0)),'#fff1c4',1.4,.55,true);}
 }
 trail(event,position,direction){const f=effectFamily(event),color=EFFECT_COLORS[event.kind]||'#f5ce90';
  if(f==='drill'){const r=this.ring(position.clone().add(V(0,.8,0)),'#ffe3a3',.28,true);r.quaternion.setFromUnitVectors(V(0,0,1),direction);this.helix(position.clone().add(V(0,1,0)),direction,1.8,.44);this.burst(position.clone().add(V(0,.7,0)),color,7,.45);}
  else if(event.kind==='physical')this.burst(position.clone().add(V(0,.15,0)),'#e3ca93',7,.35,{size:1.5});
  else {this.flash(position,color,.6,.22);this.burst(position,color,7,.25,{rise:true});}
 }
 impact(event,position,direction,result={}){
  const family=effectFamily(event),color=EFFECT_COLORS[event.kind]||'#f8dfa4',at=position.clone().add(V(0,1.05,0)),floor=position.clone().add(V(0,.1,0));this.families.add(family);
  if(result.miss){this.burst(at,'#c7eaff',12,.45);return;}
  if(family==='drill'){
   this.flash(at,'#fff9d2',3.5,.42,true);this.flash(at,'#ffc269',4,.55);this.helix(at,direction,4.8,1.35);this.shards(at,'#ffefbb',36,1.3);for(let i=0;i<3;i++)this.ring(floor.clone().add(V(0,i*.22,0)),'#ffdf8e',1.3+i*.4);this.burst(at,'#ffe7aa',130,1.7);
  }else if(family==='meteor'){
   this.column(floor,'#ffe8af',8);this.flash(at,'#fff4d9',6,.5,true);for(let i=0;i<3;i++)this.ring(floor,'#ffc477',1.8+i*.6);this.shards(at,'#d8b78a',32,1.7);this.burst(at,'#ffd088',120,2);
  }else if(['physical','break','roll','rock'].includes(family)){
   const power=event.big?1.7:family==='break'?1.4:1;this.flash(at,'#ffd690',2.8*power,.42,true);this.burst(at,'#ffdc99',52,power);this.slash(at,'#fff2c8',1.65*power,Math.atan2(direction.x,direction.z));this.ring(floor,'#e8c996',.8*power);
   if(['break','rock'].includes(family)||event.big)this.shards(at,'#cba66e',20,power);if(event.hits>1||family==='roll')this.slash(at.clone().add(V(.15,.45,0)),'#ffe1a1',1.6,-.8);
  }else if(family==='wind'){
   this.vortex(floor,'#91ffcf',event.move==='tornado'?2.4:1.7,event.move==='tornado'?5:3.5);this.slash(at,'#dafff1',2.1,.8);this.ring(floor,'#a5f3cf',1.2);
  }else if(family==='light'){
   this.column(floor,'#fff4ba',5.5);this.seal(floor,'#fadc77',2.2);this.flash(at,'#fff8d8',4.2,.6,true);this.burst(at,'#fff2b4',95,1.2,{rise:true});for(let i=0;i<4;i++)this.slash(at,'#fff3c4',2,i*Math.PI/2);
  }else if(family==='fire'){
   this.flash(at,'#ffe9ac',4,.4);this.flash(at,'#ff7b35',5,1);this.column(floor,'#ffb45c',3.8);this.burst(at,'#ffb953',100,1.5,{rise:true,size:1.8,duration:1.1});this.ring(floor,'#ff9947',1.45);
  }else if(['shadow','seal','drain'].includes(family)){
   this.flash(at,'#8062d9',4.8,.95);this.vortex(floor,'#c994ff',1.5,3.1);this.seal(floor,'#a895f3',2.2);this.burst(at,'#d8a9ff',68,1.05,{rise:true});if(family==='seal')this.dome(floor,'#b89feb',1.6);
  }else if(family==='guard'){
   this.dome(floor,'#9cdffd',1.65);this.flash(at,'#ccefff',2,.65);this.burst(floor,'#bdeaff',38,.8,{rise:true});
  }else if(family==='heal'){
   this.seal(floor,'#befcd0',1.8,1.4);this.column(floor,'#b3ffd9',3.2);this.burst(floor,'#d6ffb5',65,.9,{rise:true,duration:1.5});for(let i=0;i<5;i++){const a=i*TAU/5;this.flash(at.clone().add(V(Math.sin(a)*1.1,.1+i*.23,Math.cos(a)*1.1)),'#f3ffd5',.8,1.1,true);}
  }else if(['sleep','spores','poison','dust','status'].includes(family)){
   const tint=family==='sleep'||family==='spores'?'#c6a8f0':family==='poison'?'#b293d9':'#dec08c';this.vortex(floor,tint,1.7,2.4,1.3);this.burst(at,tint,64,.7,{rise:true,size:2.2,duration:1.25});this.ring(floor,tint,.85);
  }else {
   this.seal(floor,color,2.2);this.vortex(floor,color,1.5,3.2);this.burst(at,color,58,1.05,{rise:true});this.flash(at,color,3,.65,true);
  }
  if(result.crit){this.flash(at,'#ffffff',4.8,.32,true);this.shards(at,'#fff6ba',24,1.2);}
 }
 number(position,result){
  const text=result.miss?'MISS':result.heal?'+'+result.heal:result.damage?''+result.damage:result.status?'！':'';if(!text)return;
  const texture=canvasTexture(256,c=>{c.textAlign='center';c.textBaseline='middle';c.font='bold 92px Georgia';c.lineWidth=9;c.strokeStyle='#252b37';c.strokeText(text,128,128);c.fillStyle=result.heal?'#c9ffc1':result.crit?'#ffe080':'#fff8e2';c.fillText(text,128,128);});
  const mat=new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false});mat.userData.ownedMap=true;const m=new THREE.Sprite(mat);m.position.copy(position).add(V(0,1.6,0));m.scale.setScalar(result.crit?1.9:1.6);m.renderOrder=15;this.add(m,1.2,(t,dt)=>m.position.y+=dt*.85);
 }
 update(dt){for(let i=this.effects.length-1;i>=0;i--){const e=this.effects[i];e.time+=dt;const t=Math.min(1,e.time/e.duration);e.update(t,dt);e.mesh.traverse(o=>{if(o.material)o.material.opacity=e.opacity*(1-THREE.MathUtils.smoothstep(t,.2,1));});if(t>=1){if(e.mesh.isInstancedMesh)e.mesh.dispose();this.disposeEffect(e);this.effects.splice(i,1);}}}
 clear(){for(const e of this.effects){if(e.mesh.isInstancedMesh)e.mesh.dispose();this.disposeEffect(e);}this.effects=[];this.root.removeFromParent();}
}
