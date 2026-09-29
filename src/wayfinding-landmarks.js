import {kitColumn,kitTower} from './kit-architecture.js';
import * as THREE from 'three';
import {box,beam,group,shape,material} from './graphics.js';

// Scenic continuity across the two maps. These have no NPCs or duplicate quests.
function cottage(world,{x,z,w,d,floors=1,roof='Roof_RoundTiles_6x8',rotation=Math.PI}){
 const y=world.height(x,z),g=group(world.root,x,y,z);g.rotation.y=rotation;
 const a=world.assets,h=floors*3.1,put=(name,px,py,pz,opts={})=>a.place(g,name,px,py,pz,opts);
 box(g,world.stone,0,-1,0,w+.7,2.1,d+.7);
 for(let floor=0;floor<floors;floor++)for(const side of [-1,1]){
  for(let i=0;i<3;i++){
   const px=(i-1)*w/3,door=i===1&&floor===0&&side===1;
   put(door?'Wall_Plaster_Door_Round':'Wall_Plaster_Window_Wide_Round',px,floor*3.1,side*d/2,{width:w/3,height:3.1,depth:.33,rotation:side<0?Math.PI:0});
   if(door)put('Door_1_Round',px,0,d/2+.06,{width:1.6,height:2.6,depth:.16});
   else {put('Window_Wide_Round1',px,floor*3.1+.65,side*(d/2+.1),{width:1.35,height:1.55,depth:.17,rotation:side<0?Math.PI:0});put('WindowShutters_Wide_Round_Open',px,floor*3.1+.65,side*(d/2+.24),{width:1.85,height:1.55,depth:.18,rotation:side<0?Math.PI:0});}
  }
  for(let i=0;i<3;i++)put('Wall_Plaster_Straight',side*w/2,floor*3.1,(i-1)*d/3,{width:d/3,height:3.1,depth:.33,rotation:side*Math.PI/2});
 }
 put(roof,0,h-.05,0,{width:w+1.7,height:w*.48,depth:d+1.65});
 for(const side of [-1,1])put('Roof_Front_Brick4',0,h-.04,side*d/2,{width:w,height:w*.45,depth:.33,rotation:side<0?Math.PI:0});
 put('Prop_Chimney',w*.24,h+w*.2,-d*.2,{height:2.4,width:1,depth:1});
 put('Prop_Vine1',-w*.42,.1,d/2+.22,{height:h*.85,width:1.6,depth:.2});
 for(const side of [-1,1]){put('Pot_1',side*w*.39,0,d/2+.6,{height:.7});put('Bush_Common_Flowers',side*w*.39,.55,d/2+.6,{height:.8,width:1.3,depth:1.1});}
 world.collision(x,z,w+.6,d+.6,h+w*.45);world.scenicBuildings.push({x,z,w,d,rotation});
 return {g,y,h};
}
export function destinationLandmarks(world){
 if(world.zone==='forest'){
  world.scenicReserves.push({x:0,z:132,w:85,d:106});
  world.road([[0,94],[0,117],[0,155],[0,176]],6);
  // The same paired round gate towers seen at the north edge of the village.
  for(const side of [-1,1]){
   const x=side*5.4,z=108,y=world.height(x,z),g=group(world.root,x,y,z);
   kitColumn(g,world.assets,0,0,0,1.3,5.5);
   world.assets.place(g,'Roof_Tower_RoundTiles',0,5.5,0,{width:4,height:3.8,depth:4});
   world.collision(x,z,2.8,2.8,9);world.scenicBuildings.push({x,z,w:3,d:3});
   for(let i=0;i<7;i++)world.prop('Prop_WoodenFence_Single',side*(9+i*4),109,{width:4,height:1.25});
  }
  world.sign(-8,101,'こもれび村');
  for(const b of [
   {x:-16,z:123,w:11,d:10,floors:2,roof:'Roof_RoundTiles_8x10'},
   {x:16,z:120,w:8,d:8},{x:-30,z:141,w:8,d:8,floors:2},
   {x:30,z:140,w:9,d:8},{x:-14,z:157,w:10,d:12,floors:2},
   {x:15,z:149,w:9,d:8,floors:2},
  ])cottage(world,b);
  const ty=world.height(-17,166),tower=group(world.root,-17,ty,166);
  kitColumn(tower,world.assets,0,0,0,2,16.6,true);for(const side of [-1,1])for(const x of [-1.85,1.85])box(tower,'#705340',x,8.3,side*2.02,.2,16.6,.23);
  world.assets.place(tower,'Roof_Tower_RoundTiles',0,16.5,0,{width:6.6,height:6.4,depth:6.6});world.collision(-17,166,4,4,23);world.scenicBuildings.push({x:-17,z:166,w:4,d:4});
  for(const [x,z]of [[-8,119],[8,136],[-7,151]]){world.prop('Lantern_Wall',x,z,{y:world.height(x,z)+2.5,height:.8});beam(world.root,'#796044',[x,world.height(x,z),z],[x,world.height(x,z)+3.5,z],.14);}
  for(let i=0;i<30;i++){const side=i%2?1:-1,x=side*(9+(i%4)*1.9),z=84+Math.floor(i/2)*1.15;world.prop(i%3?'Flower_4_Group':'Bush_Common_Flowers',x,z,{height:i%3?.45:1,width:i%3?.7:1.5,rotation:i*1.9});}
  world.destinationVista={destination:'village',buildings:world.scenicBuildings.length,gate:[0,108]};
 }else if(world.zone==='village'){
  world.road([[0,-47],[0,-60],[-5,-77],[-4,-96]],5);
  for(const side of [-1,1])for(let i=0;i<7;i++){
   const x=side*(9+i%3*4),z=-57-i*5.5,h=12+i%3*2;
   world.prop(['CommonTree_4','CommonTree_5','CommonTree_3'][i%3],x,z,{height:h,rotation:i*1.8});world.collision(x,z,.8,.8,8);
   for(let j=0;j<3;j++)world.prop(j?'Fern_1':'Bush_Common_Flowers',x+side*j*1.3,z+j,{height:.8+j*.1,rotation:i+j});
  }
  const arch=group(world.root,0,world.height(0,-55),-55);
  for(const side of [-1,1])beam(arch,'#776344',[side*4.4,0,0],[side*4.4,4.4,0],.19);
  beam(arch,'#776344',[-4.4,4.3,0],[4.4,4.3,0],.21);
  for(let i=0;i<7;i++)world.assets.place(arch,'Bush_Common_Flowers',-3.6+i*1.2,4.05,0,{width:1.8,height:.8,depth:1.1});
  world.destinationVista={destination:'forest',groveTrees:14,gate:[0,-55]};
 }
}
