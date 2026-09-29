import * as THREE from 'three';
import {box,group,label,material,canvasTexture,shape} from './graphics.js';
import {decorateHouse} from './architecture.js';
let floorTexture;
function woodFloor(){if(!floorTexture){floorTexture=canvasTexture(512,(c,s)=>{c.fillStyle='#9c7b53';c.fillRect(0,0,s,s);for(let i=0;i<16;i++){c.fillStyle=i%3?'#b09469':'#a3865e';c.fillRect(0,i*32+1,s,30);for(let k=0;k<12;k++){c.strokeStyle='#70583733';c.beginPath();c.moveTo(0,i*32+3+k*2);c.bezierCurveTo(140,i*32+k*2,300,i*32+8+k*2,512,i*32+3+k*2);c.stroke();}for(let x=(i%2)*128;x<s;x+=256){c.fillStyle='#5c503955';c.fillRect(x,i*32,1,32);}}});floorTexture.wrapS=floorTexture.wrapT=THREE.RepeatWrapping;floorTexture.repeat.set(2,2);}return material('#f0dbb1',{map:floorTexture,roughness:.9});}
export function buildHouse(world,b){
 const {root,assets}=world,y=world.height(b.x,b.z),base=group(root,b.x,y,b.z),roof=new THREE.Group(),upper=new THREE.Group(),walls=[],w=b.w,d=b.d,story=3.1,enterable=!!b.sign;
 base.add(roof,upper);box(base,world.stone,0,-.28,0,w+.55,.58,d+.55);box(base,woodFloor(),0,.035,0,w-.25,.07,d-.25);
 for(let floor=0;floor<b.floors;floor++)for(const side of ['front','back','left','right']){
  const g=new THREE.Group();(floor?upper:base).add(g);if(!floor)walls.push({side,group:g});const wide=side==='front'||side==='back',len=wide?w:d,count=Math.ceil(len/2)|1;
  for(let i=0;i<count;i++){
   const along=-len/2+(i+.5)*len/count,door=side==='front'&&floor===0&&i===Math.floor(count/2);const name=door?'Wall_Plaster_Door_Round':i%2===0?'Wall_Plaster_Window_Wide_Round':'Wall_Plaster_Straight';
   const x=wide?along:(side==='left'?-w/2:w/2),z=wide?(side==='front'?d/2:-d/2):along,rotation=side==='front'?0:side==='back'?Math.PI:side==='left'?-Math.PI/2:Math.PI/2;
   assets.place(g,name,x,.05+floor*story,z,{width:len/count,height:story,depth:.33,rotation});
   if(name.includes('Window')){assets.place(g,'Window_Wide_Round1',x+(wide?0:Math.sign(x)*.06),.65+floor*story,z+(wide?Math.sign(z)*.06:0),{width:1.38,height:1.48,depth:.18,rotation});assets.place(g,'WindowShutters_Wide_Round_Open',x+(wide?0:Math.sign(x)*.2),.65+floor*story,z+(wide?Math.sign(z)*.2:0),{width:1.8,height:1.48,depth:.18,rotation});}
  }
  assets.batch(g);g.userData.dynamic=true;
 }
 const h=b.floors*story;assets.place(roof,b.roof,0,h-.05,0,{width:w+1.55,depth:d+1.6,height:w*.48});for(const side of [-1,1])assets.place(roof,'Roof_Front_Brick4',0,h-.03,side*d/2,{width:w,depth:.36,height:w*.45,rotation:side<0?Math.PI:0});assets.place(roof,'Prop_Chimney',-w*.25,h+w*.24,-d*.2,{height:2.3,width:1,depth:1});
 decorateHouse(world,b,base,roof,upper);assets.batch(roof);assets.batch(upper);roof.userData.dynamic=upper.userData.dynamic=true;
 assets.place(base,'DoorFrame_Round_Brick',0,.03,d/2+.16,{width:2.15,height:2.8,depth:.33});const hinge=group(base,-.82,.04,d/2+.18,true);assets.place(hinge,'Door_1_Round',.82,0,0,{width:1.64,height:2.45,depth:.12});
 const doorCollider={x:b.x,z:b.z+d/2,w:1.65,d:.3,h:2.6,base:y,enabled:true,door:true};world.colliders.push(doorCollider);
 if(enterable){world.collision(b.x-w/2,b.z,.38,d,story);world.collision(b.x+w/2,b.z,.38,d,story);world.collision(b.x,b.z-d/2,w,.38,story);for(const sign of [-1,1])world.collision(b.x+sign*(w/4+.56),b.z+d/2,w/2-1.13,.38,story);}
 else world.collision(b.x,b.z,w,d,h+3);
 const house={...b,y,base,roof,upper,walls,hinge,doorCollider,open:false,angle:0,enterable};world.houses.push(house);
 if(enterable){label(base,b.sign,0,2.95,d/2+.45,3.2);world.item({id:'door-'+b.id,type:'door',automatic:true,x:b.x,z:b.z+d/2+.4,radius:3,label:b.name+'へ入る',building:b.id,house});furnish(world,house);}
 assets.place(base,'Prop_Vine1',-w*.43,.2,d/2+.25,{height:h*.8,width:1.6,depth:.2});assets.place(base,'Lantern_Wall',1.5,1.5,d/2+.4,{height:.85,width:.4,depth:.65});assets.place(base,'Pot_1',-w*.45,0,d/2+1,{height:.8,width:.65,depth:.65});assets.place(base,'Bush_Common_Flowers',-w*.45,.6,d/2+1,{height:.6,width:.85,depth:.75});
 world.road([[b.x,b.z+d/2+.9],[0,b.z+d/2+.9]],2.5);
}
function furnish(world,b){
 const {assets}=world,g=group(b.base,0,0,0),w=b.w,d=b.d;
 const put=(name,x,z,o={})=>assets.place(g,name,x,o.y||.08,z,o);
 const solid=(x,z,w,d)=>world.collision(b.x+x,b.z+z,w,d,1.3);
 const tableX=-w*.23,tableZ=-d*.10;
 put('Table_Large',tableX,tableZ,{width:2.25,height:.94,depth:1.35});solid(tableX,tableZ,2.25,1.35);put('Chair_1',tableX,-d*.1+1.25,{height:1.25});put('CandleStick_Triple',tableX,tableZ,{y:1.02,height:.5});
 put('Bookcase_2',-w*.27,-d/2+.6,{width:2.2,height:2.6,depth:.8});solid(-w*.27,-d/2+.6,2.2,.8);put('Cabinet',w*.27,-d/2+.65,{width:1.9,height:2.35,depth:.9});
 const rug=box(g,material(b.id==='mori'?'#607a78':'#967354',{roughness:1}),0,.08,.5,w*.47,.025,d*.47);box(g,'#c3ab73',0,.10,d*.23+.5,w*.47,.008,.06);
 if(['inn','mori'].includes(b.id)){put('Bed_Twin1',w*.29,-.25,{width:1.85,height:1.1,depth:2.9});solid(w*.29,-.25,1.85,2.9);}
 if(b.id==='shop'){for(let i=0;i<2;i++)put('Shelf_Small_Bottles',-w*.25+i*w*.5,-d/2+.55,{width:2,height:2.4,depth:.8});put('Chest_Wood',w*.28,1.35,{width:1.4,height:.85});}
 if(b.id==='smith'){put('Anvil_Log',w*.25,.5,{height:.95});put('WeaponStand',w*.33,-d*.28,{height:2.3});}
 if(b.id==='chapel'){for(const sign of [-1,1])put('Bench',sign*w*.26,1.25,{width:2.4,rotation:Math.PI});put('CandleStick_Stand',0,-d*.34,{height:1.8});world.item({id:'respec',type:'respec',x:b.x,z:b.z-d*.28,label:'スキルポイントを無料で振り直す'});}
 if(b.id==='bakery')for(let i=0;i<4;i++)shape(g,'smooth','#ce9a54',tableX-.7+i*.45,1.1,tableZ,.17,.1,.24);
 const light=new THREE.PointLight('#ffe0a1',8,Math.max(w,d)*1.5,2);light.position.set(0,2.4,0);g.add(light);b.roomLight=light;assets.batch(g);
}
export function updateHouses(world,position,dt){let inside=null;
 for(const b of world.houses){if(!b.enterable)continue;const here=Math.abs(position.x-b.x)<b.w/2-.2&&Math.abs(position.z-b.z)<b.d/2-.12;if(here)inside=b;
  const doorway=Math.hypot(position.x-b.x,position.z-(b.z+b.d/2));if(doorway<3){b.open=true;b.doorHold=1.4;}else{b.doorHold=Math.max(0,(b.doorHold||0)-dt);if(!b.doorHold)b.open=false;}
  b.angle=THREE.MathUtils.damp(b.angle,b.open?-Math.PI*.56:0,8,dt);b.hinge.rotation.y=b.angle;b.doorCollider.enabled=!b.open||Math.abs(b.angle)<.55;b.roof.visible=b.upper.visible=!here;
  for(const wall of b.walls)wall.group.visible=!(here&&(wall.side==='front'||wall.side==='right'));
  b.roomLight.visible=here||position.distanceTo(b.base.position)<18;
 }
 world.activeHouse=inside;
}
