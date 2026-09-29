import * as THREE from 'three';
import {group,shape,beam,material,TAU,random} from './graphics.js';

export function villageGardens(world){
 const rng=random(932),a=world.assets;
 // Low planted borders frame the square without hiding people or entrances.
 for(let sector=0;sector<8;sector++){
  const angle=sector*TAU/8+.2,x=Math.sin(angle)*13.7,z=10+Math.cos(angle)*13.7;
  if(world.pathDistance(x,z)<3.7||!world.walkable(x,z))continue;
  const bed=group(world.root,x,world.height(x,z),z);bed.rotation.y=angle;
  const soil=shape(bed,'smooth',material('#6c6549',{roughness:1}),0,.08,0,2.4,.12,1.25);soil.receiveShadow=true;
  for(let i=0;i<14;i++){const t=i*TAU/14;a.place(bed,'Pebble_Round_1',Math.sin(t)*2.4,.04,Math.cos(t)*1.25,{width:.65,height:.22,depth:.4,rotation:t});}
  for(let i=0;i<16;i++){const t=rng()*TAU,r=Math.sqrt(rng());a.place(bed,i%3?'Flower_4_Group':'Flower_3_Group',Math.sin(t)*1.85*r,.16,Math.cos(t)*.86*r,{width:.55,depth:.55,height:.35+rng()*.18,rotation:t});}
 }
 for(const [x,z] of [[-6,29],[6,29],[-5,-10],[5,-10],[-5,-33],[5,-33]]){
  const g=group(world.root,x,world.height(x,z),z);a.place(g,'Pot_1',0,0,0,{height:.7,width:.85,depth:.85});a.place(g,'Bush_Common_Flowers',0,.57,0,{height:.65,width:1.25,depth:1.25});
  beam(g,'#766146',[0,0,0],[0,3.3,0],.13);beam(g,'#766146',[0,3.2,0],[.64,3.2,0],.1);a.place(g,'Lantern_Wall',.55,2.45,0,{height:.7,width:.4,depth:.4,rotation:-Math.PI/2});
 }

}

export function forestGardens(world){
 const rng=random(415);
 // Group undergrowth around rock outcrops; keep every route and encounter open.
 for(const [x,z]of [[-21,69],[19,43],[-39,23],[33,4],[-22,-39],[59,-55],[-56,-67]]){
  if(!world.walkable(x,z))continue;
  world.prop('Rock_Medium_1',x,z,{width:3.2,height:1.8,depth:2.4,rotation:rng()*TAU});world.collision(x,z,2.3,1.7,1.6);
  for(let i=0;i<20;i++){const t=rng()*TAU,r=2+rng()*4.5,px=x+Math.sin(t)*r,pz=z+Math.cos(t)*r;if(world.pathDistance(px,pz)<3.3||!world.walkable(px,pz))continue;world.prop(i%4===0?'Mushroom_Common':i%3===0?'Bush_Common_Flowers':'Fern_1',px,pz,{height:i%4===0?.28:.65+rng()*.4,scale:.75,rotation:t});}
 }
}
