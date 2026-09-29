import {kitArch,kitColumn,kitWall} from './kit-architecture.js';
import * as THREE from 'three';
import {shape,box,beam,group,material,random,TAU,canvasTexture,geometries} from './graphics.js';
import {surfaceMaterial,addLandscape} from './terrain.js';
import {addDistantMeadows} from './meadows.js';

const lerp=THREE.MathUtils.lerp,clamp=THREE.MathUtils.clamp;
function floorMesh(root,height,size,kind,color){const geo=new THREE.PlaneGeometry(size,size,Math.ceil(size/2),Math.ceil(size/2));geo.rotateX(-Math.PI/2);const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,height(p.getX(i),p.getZ(i)));geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,surfaceMaterial(kind,color,kind==='grass'?4:3.5));mesh.receiveShadow=true;root.add(mesh);return mesh;}
function arch(parent,x,z,width,height,mat){
 const thickness=.72,r=width/2,y=height-r,s=new THREE.Shape();s.moveTo(-r-thickness,0);s.lineTo(-r-thickness,y);s.absarc(0,y,r+thickness,Math.PI,0,true);s.lineTo(r+thickness,0);s.lineTo(r,0);s.lineTo(r,y);s.absarc(0,y,r,0,Math.PI,false);s.lineTo(-r,0);s.closePath();
 const geo=new THREE.ExtrudeGeometry(s,{depth:.82,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.09,bevelThickness:.08,curveSegments:32});const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,0,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function column(root,x,z,height,mat){const g=group(root,x,0,z);shape(g,new THREE.CylinderGeometry(.66,.82,height,28),mat,0,height/2,0);for(const [y,r,h]of [[.22,1.15,.44],[height-.15,1.12,.3],[height-.55,.93,.2]])shape(g,new THREE.CylinderGeometry(r,r,h,28),mat,0,y,0);return g;}
function lamp(root,x,y,z,color){const light=new THREE.PointLight(color,16,23,2);light.position.set(x,y,z);root.add(light);shape(root,'smooth',material(color,{emissive:color,emissiveIntensity:2}),x,y,z,.11,.24,.11);}

export function buildBattleEnvironment(combat){
 const {root,game,theme}=combat,a=game.assets,rng=random(538),outdoor=['forest','village','ruins'].includes(theme),woodland=theme==='forest'||theme==='village';
 root.name='Battle scenery · '+theme;combat.environmentInfo={theme,clearRadius:16,treeAnchors:[],groundExtent:outdoor?590:80};
 if(outdoor){
  const height=(x,z)=>{const r=Math.hypot(x,z),t=clamp((r-17)/35,0,1);const y=t*t*(3-2*t)*(2.5+Math.sin(x*.049)*Math.cos(z*.041)*4.2+Math.sin(z*.02+.6)*3)+Math.max(0,r-85)*.025;const stream=woodland?(1-THREE.MathUtils.smoothstep(Math.abs(x+39),3,8))*(1-THREE.MathUtils.smoothstep(Math.abs(z+30),53,68)):0;return lerp(y,-.35,stream);};
  const terrain={zone:'forest',config:{size:[190,190]},height};floorMesh(root,height,190,woodland?'grass':'stone',woodland?'#ffffff':'#c2c5a4');addLandscape(root,terrain,a,{trees:false});
  for(let i=0;i<240;i++){const angle=i*2.399963,r=32+Math.sqrt(rng())*215,x=Math.sin(angle)*r,z=Math.cos(angle)*r,y=height(x,z);const tree=a.place(root,['CommonTree_4','Pine_2','CommonTree_5','CommonTree_2'][i%4],x,y-.1,z,{scale:1+rng()*.7,rotation:angle});if(r>80)tree.traverse(o=>o.castShadow=false);combat.environmentInfo.treeAnchors.push({x,z,y,ground:height(x,z)});}
  addDistantMeadows(root,terrain,a,{extent:220,count:22500,nearFade:false,exclude:(x,z)=>Math.hypot(x,z)<10||!woodland&&Math.hypot(x,z)<27});
  for(let i=0;i<180;i++){const angle=rng()*TAU,r=16+rng()*59,x=Math.sin(angle)*r,z=Math.cos(angle)*r;a.place(root,['Fern_1','Bush_Common_Flowers','Flower_4_Group','Rock_Medium_1'][i%4],x,height(x,z),z,{height:i%4===3?1.2:.4+rng()*.6,scale:.8,rotation:angle});}
  if(woodland){
   // An old, vine-covered bridge and its water give this clearing a direction.
   const bridge=group(root,-34,height(-34,-30),-30),stone=material('#a5aa8a');arch(bridge,0,0,9,6,stone);a.place(bridge,'Floor_Brick',0,6.45,0,{width:12,height:.65,depth:3.6});for(const side of [-1,1])a.place(bridge,'Prop_Vine4',side*4.8,.6,.6,{height:6,width:1.7});
   const stream=new THREE.Mesh(new THREE.PlaneGeometry(6,110),material('#78b7b0',{roughness:.3,metalness:.1}));stream.rotation.x=-Math.PI/2;stream.position.set(-39,-.03,-30);root.add(stream);
   for(let i=0;i<12;i++){const x=-40+rng()*4,z=-61+i*6;a.place(root,'Rock_Medium_1',x,height(x,z)-.35,z,{width:3.6,height:1.8,depth:3,rotation:rng()*TAU});}
  }else{
   const stone=material('#c2c1a4');for(const z of [-24,-38,-52]){kitArch(root,a,0,0,z,18,13);for(const side of [-1,1]){kitColumn(root,a,side*14,0,z,1.05,9+(z===-38?2:0));a.place(root,'Prop_Vine6',side*14,1,z,{height:7,width:2.6});}}for(const side of [-1,1])for(let i=0;i<6;i++){const x=side*(23+i*2),z=-16+i*8;a.place(root,'Rock_Medium_2',x,height(x,z)-.2,z,{height:1.4,width:3.5,rotation:rng()*TAU});}
  }
 }else if(theme==='cave'){
  floorMesh(root,()=>-.04,135,'stone','#93988e');const rock=material('#717c78',{roughness:1});
  for(let i=0;i<70;i++){const t=i*2.4,r=26+rng()*26,x=Math.sin(t)*r,z=Math.cos(t)*r;a.place(root,['Rock_Medium_1','Rock_Medium_2','Rock_Medium_3'][i%3],x,-.35,z,{width:8+rng()*6,depth:8+rng()*6,height:10+rng()*12,rotation:t});if(i%4===0)shape(root,new THREE.ConeGeometry(.7+rng()*.5,4+rng()*4,18),rock,x*.82,12,z*.82,1,-1,1);}
  for(const [x,z,color]of [[-19,-10,'#7cbcb9'],[18,-20,'#99adce'],[-12,22,'#bfc993']]){const g=group(root,x,0,z);for(let i=0;i<7;i++){const t=i*2.4,r=rng()*2.2,crystal=shape(g,new THREE.ConeGeometry(.32,1.6+rng()*2.3,6),material(color,{roughness:.36,metalness:.15,emissive:color,emissiveIntensity:.26}),Math.sin(t)*r,1.0,Math.cos(t)*r);crystal.rotation.z=(rng()-.5)*.55;}lamp(root,x,2.6,z,color);}
  const tunnel=group(root,0,0,-31);arch(tunnel,0,0,12,10,material('#545f62'));box(tunnel,'#242c36',0,5,-3,12,10,1);for(const side of [-1,1]){a.place(root,'Torch_Metal',side*8,2.0,-25,{height:2});lamp(root,side*8,4,-25,'#efc695');}
 }else{
  const deep=theme==='deep'||theme==='core',stone=material(deep?'#6d7482':'#879491',{roughness:.88}),trim=material('#c0b493',{metalness:.2,roughness:.7});floorMesh(root,()=>-.04,100,'stone',deep?'#a5a5bc':'#b1c2b8');
  for(const x of [-21,21])for(const z of [-32,-14,4,22]){kitColumn(root,a,x,0,z,.82,14);a.place(root,'Banner_1',x,6,z+.6,{width:2.3,height:5.5,depth:.3});a.place(root,'Torch_Metal',x,2.8,z+.8,{height:2.1});}
  for(const z of [-40,-23,25]){kitArch(root,a,0,0,z,38,25);box(root,stone,0,24,z,43,1.1,2);}
  for(const x of [-29,29]){kitWall(root,a,x,0,-5,88,20,1.8,Math.PI/2);for(let i=0;i<8;i++){const z=-35+i*11;box(root,trim,x-Math.sign(x)*1,6,z,.25,7,2.3);}}
  for(const [x,z]of [[-19,-12],[19,-12],[-19,21],[19,21]])lamp(root,x,4.8,z,deep?'#aaa8dc':'#e5c891');
  const pattern=canvasTexture(512,(c,s)=>{c.fillStyle='#55666b';c.fillRect(0,0,s,s);c.translate(s/2,s/2);c.strokeStyle='#bfb797';c.lineWidth=3;for(const r of [110,158,198,225]){c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();}for(let i=0;i<12;i++){c.save();c.rotate(i*TAU/12);c.strokeRect(-13,-195,26,40);c.beginPath();c.moveTo(0,-148);c.lineTo(12,-127);c.lineTo(0,-112);c.lineTo(-12,-127);c.closePath();c.stroke();c.restore();}});
  const mosaic=new THREE.Mesh(new THREE.CircleGeometry(13,96),material('#ffffff',{map:pattern,roughness:.8}));mosaic.rotation.x=-Math.PI/2;mosaic.position.y=.015;root.add(mosaic);
  const altar=group(root,0,0,-35);for(let i=0;i<4;i++)box(altar,stone,0,.22+i*.38,0,16-i*1.7,.4,7-i*.5);kitArch(altar,a,0,0,-1,8,13);const seal=shape(altar,new THREE.TorusGeometry(4,.11,10,96),material('#b9acce',{emissive:'#7a68ab',emissiveIntensity:.55}),0,8,-.4);for(let i=0;i<8;i++){const t=i*TAU/8;shape(altar,'ico',trim,Math.sin(t)*4,8+Math.cos(t)*4,-.3,.3,.48,.14);}if(theme==='core'){const light=new THREE.PointLight('#b9a1e5',28,38,2);light.position.set(0,9,-27);root.add(light);}
 }
 const fill=new THREE.PointLight(outdoor?'#fff0ce':'#afbdde',6,22,2);fill.position.set(0,5,3);root.add(fill);
 a.batch(root,48);combat.environmentBatches=root.children.filter(o=>o.isInstancedMesh);
 for(const batch of combat.environmentBatches)if(batch.userData.decor)batch.count=Math.floor(batch.userData.fullCount*Math.max(.4,game.settings.density));
}

export function disposeBattleEnvironment(root){const shared=new Set(Object.values(geometries)),seen=new Set();root.traverse(o=>{if(o.isInstancedMesh)o.dispose();const geo=o.geometry;if(geo&&!geo.userData.shared&&!shared.has(geo)&&!seen.has(geo)){geo.dispose();seen.add(geo);}});}
