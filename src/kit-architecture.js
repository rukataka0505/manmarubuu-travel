import * as THREE from 'three';
import {group} from './graphics.js';

export function kitWall(parent,assets,x,y,z,width,height,depth=.8,rotation=0,plaster=false){
 const g=group(parent,x,y,z);g.rotation.y=rotation;g.name='Kit masonry wall';
 const columns=Math.ceil(width/3.6),rows=Math.ceil(height/3.3);
 for(let j=0;j<rows;j++)for(let i=0;i<columns;i++)assets.place(g,plaster?'Wall_Plaster_Straight':'Wall_UnevenBrick_Straight',-width/2+(i+.5)*width/columns,j*height/rows,0,{width:width/columns+.025,height:height/rows,depth});
 for(let i=0;i<columns;i++)assets.place(g,'Prop_ExteriorBorder_Straight1',-width/2+(i+.5)*width/columns,height-.12,0,{width:width/columns+.04,height:.25,depth:depth+.2});
 return g;
}
export function kitColumn(parent,assets,x,y,z,radius,height,plaster=false){
 const g=group(parent,x,y,z);g.name='Kit octagonal pier';const n=8,w=2*radius*Math.tan(Math.PI/n);
 for(let i=0;i<n;i++){
  const a=i*Math.PI*2/n;kitWall(g,assets,Math.sin(a)*radius,0,Math.cos(a)*radius,w,height,.22,a,plaster);
 }
 for(const h of [0,height*.5,height-.16])assets.place(g,'Floor_Brick',0,h,0,{width:radius*2.3,height:.22,depth:radius*2.3});
 return g;
}
export function kitArch(parent,assets,x,y,z,width,height){
 const g=group(parent,x,y,z);g.name='Kit carved arch';
 assets.place(g,'DoorFrame_Round_Brick',0,0,0,{width:width+2,height,depth:1.25});
 for(const s of [-1,1]){
  assets.place(g,'Corner_Exterior_Brick',s*(width/2+.5),0,0,{width:.95,height:Math.max(1,height-width*.3),depth:1.35,rotation:s<0?Math.PI:0});
  assets.place(g,'Floor_Brick',s*(width/2+.5),0,0,{width:1.75,height:.28,depth:1.9});
 }
 return g;
}
export function kitTower(world,x,z,radius=4.4,height=15,{parent=world.root,y=world.height(x,z),roof=true,plaster=false}={}){
 const g=kitColumn(parent,world.assets,x,y,z,radius,height,plaster);g.name='Kit watchtower';
 for(let j=0;j<2;j++)for(let i=0;i<4;i++){
  const a=i*Math.PI/2,r=radius+.18;world.assets.place(g,'Window_Thin_Round1',Math.sin(a)*r,height*(.26+j*.41),Math.cos(a)*r,{width:radius*.40,height:height*.14,depth:.22,rotation:a});
 }
 if(roof)world.assets.place(g,'Roof_Tower_RoundTiles',0,height-.03,0,{width:radius*2.9,height:radius*1.65,depth:radius*2.9});
 for(let i=0;i<3;i++){const a=i*2.1;world.assets.place(g,'Prop_Vine4',Math.sin(a)*(radius+.23),.2,Math.cos(a)*(radius+.23),{height:height*.52,width:radius*.55,depth:.25,rotation:a});}
 return g;
}
export function dungeonDressing(world){
 const a=world.assets,cave=world.zone==='cave';
 for(const room of world.rooms.filter(r=>r.w>20)){
  const y=world.height(room.x,room.z);
  for(const side of [-1,1]){
   const x=room.x+side*(room.w/2-1.6);
   if(!cave)for(const dz of [-room.d*.31,room.d*.31]){
    kitColumn(world.root,a,x,y,room.z+dz,.68,6.4);
    a.place(world.root,'Banner_2',x-side*.4,y+3.0,room.z+dz,{height:2.6,width:1.1,depth:.22,rotation:side*Math.PI/2});
   }
   for(let i=0;i<3;i++){
    const z=room.z+(i-1)*room.d*.25;
    a.place(world.root,cave?'Rock_Medium_1':'Vase_Rubble_Medium',x,y,z,{height:cave?1.4:.8,width:cave?2.8:1.8,depth:cave?2:1.4,rotation:i*1.6});
    if(cave)a.place(world.root,'Mushroom_Common',x-side*.8,y,z+.5,{height:.5,width:.8,depth:.8});
   }
  }
 }
}
