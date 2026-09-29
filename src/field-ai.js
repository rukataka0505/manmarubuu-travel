import {ENEMIES} from './content.js';
export const distance2D=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function createEnemyAI(enemy){return {mode:'roam',timer:0,phase:enemy.phase||0,cooldown:0,goal:null,level:Math.max(...enemy.formation.map(id=>ENEMIES[id].level)),fearless:!!enemy.elite};}
export function decideEnemy(ai,{distance,fromHome,visible,heroLevel},dt){
 ai.timer+=dt;ai.cooldown=Math.max(0,ai.cooldown-dt);
 const threat=visible&&distance<13&&ai.cooldown<=0,afraid=!ai.fearless&&heroLevel>=ai.level+5;
 const change=mode=>{if(ai.mode!==mode){ai.mode=mode;ai.timer=0;}return ai.mode;};
 if(ai.mode==='roam'&&threat)return change('notice');
 if(ai.mode==='notice'){if(!threat)return change('roam');if(ai.timer>.58)return change(afraid?'flee':'chase');}
 if(ai.mode==='chase'||ai.mode==='flee'){
  if(fromHome>23||distance>20||(!visible&&ai.timer>3)){ai.cooldown=3;return change('return');}
  if(afraid&&ai.mode==='chase')return change('flee');
 }
 if(ai.mode==='return'&&fromHome<.8){ai.cooldown=2;return change('roam');}
 return ai.mode;
}
export function steerEnemy(enemy,hero,world,dt){
 const ai=enemy.ai||(enemy.ai=createEnemyAI(enemy)),p=enemy.model.position,dist=distance2D(p,hero),home=distance2D(p,enemy.origin);
 const forward={x:Math.sin(enemy.model.rotation.y),z:Math.cos(enemy.model.rotation.y)},dot=((hero.x-p.x)*forward.x+(hero.z-p.z)*forward.z)/Math.max(.01,dist);
 const sight=dist<6||dot>-.25;
 const visible=sight&&world.lineOfSight(p,hero);
 const previous=ai.mode,mode=decideEnemy(ai,{distance:dist,fromHome:home,visible,heroLevel:world.state.level},dt);
 let tx=p.x,tz=p.z,speed=0;
 if(mode==='notice'){enemy.model.rotation.y=Math.atan2(hero.x-p.x,hero.z-p.z);}
 else if(mode==='chase'){tx=hero.x;tz=hero.z;speed=enemy.elite?4.9:3.15+Math.min(1.1,ai.level*.035);}
 else if(mode==='flee'){tx=p.x+(p.x-hero.x);tz=p.z+(p.z-hero.z);speed=4.9;}
 else if(mode==='return'){tx=enemy.origin.x;tz=enemy.origin.z;speed=3.2;}
 else {tx=enemy.origin.x+Math.sin(world.elapsed*.23+ai.phase)*2.3;tz=enemy.origin.z+Math.cos(world.elapsed*.18+ai.phase)*1.7;speed=.75;}
 const dx=tx-p.x,dz=tz-p.z,len=Math.hypot(dx,dz);
 if(speed&&len>.12){const a=Math.atan2(dx,dz),step=Math.min(len,speed*dt);let moved=false;
  for(const turn of [0,.55,-.55,1.1,-1.1,1.7,-1.7]){const nx=p.x+Math.sin(a+turn)*step,nz=p.z+Math.cos(a+turn)*step;if(world.walkable(nx,nz)&&Math.abs(world.height(nx,nz)-p.y)<.8){p.x=nx;p.z=nz;enemy.model.rotation.y=a+turn;moved=true;break;}}
  if(!moved&&mode==='flee'){ai.cooldown=2;ai.mode='return';ai.timer=0;}
 }
 p.y=world.height(p.x,p.z);enemy.x=p.x;enemy.z=p.z;
 return {mode,changed:previous!==mode,distance:dist};
}
