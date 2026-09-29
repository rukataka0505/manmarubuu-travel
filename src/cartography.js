import {ZONE_NAMES} from './content.js';
import {guidance} from './navigation.js';
import {objective} from './rpg.js';

const ink='#374b42',gold='#c5983e',blue='#296e91';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Both maps are north-up: negative Z is north, positive X is east.
export function mapProjection(size,width,height,padding=28,center={x:0,z:0}){
 const scale=Math.min((width-2*padding)/size[0],(height-2*padding)/size[1]);
 return {scale,point:(x,z)=>({x:width/2+(x-center.x)*scale,y:height/2+(z-center.z)*scale})};
}
export function facingVector(yaw){return {x:Math.sin(yaw),y:Math.cos(yaw)};}
export function mapPoints(world,state){
 const points=[];
 for(const it of world.interactions){
  let symbol,label;
  if(it.type==='portal'){symbol='↗';label=it.label;}
  else if(it.type==='chest'){if(state.chests.includes(it.id))continue;symbol='▣';label='宝箱';}
  else if(it.type==='recover'){symbol='✧';label='休息の灯';}
  else if(it.type==='npc'&&['mori','inn','shop','smith','chapel','bakery','lily'].includes(it.id)){symbol=it.id==='mori'?'●':it.id==='inn'?'☾':it.id==='smith'?'⚒':it.id==='chapel'?'✧':'◈';label=it.name;}
  else if(['boss','tower','crest','altar','watergate','rescue','trial','return'].includes(it.type)){symbol=it.type==='boss'?'♜':'◇';label=it.label;}
  if(symbol)points.push({...it,symbol,mapLabel:label});
 }
 return points;
}
const routeNodes=[['village',105,157],['forest',105,101],['tower',27,88],['cave',183,90],['ruins',40,25],['shrine-court',167,29],['shrine-upper',244,26],['shrine-lower',253,85],['shrine-core',253,145]];
function routeMap(zone){return `<svg class="atlas-route" viewBox="0 0 300 184" role="img" aria-label="エリア間のつながり"><path d="M105 157L105 101 27 88M105 101L183 90M105 101L40 25M105 101L167 29 244 26 253 85 253 145"/>${routeNodes.map(([id,x,y])=>`<g class="${id===zone?'here':''}"><circle cx="${x}" cy="${y}" r="4"/><text x="${x}" y="${y+15}" text-anchor="middle">${esc(({village:'村',forest:'森',tower:'古塔',cave:'洞窟',ruins:'遺跡','shrine-court':'祠前庭','shrine-upper':'祠上層','shrine-lower':'祠地下','shrine-core':'最深部'})[id])}</text></g>`).join('')}</svg>`;}

export class Cartography{
 constructor(element){this.element=element;this.lastTime=-1;this.element.innerHTML='<div class="minimap-open" title="Mキーで大きな地図"><canvas width="400" height="400" aria-label="まんまるぶうの現在地と向き、周辺の道"></canvas><span class="minimap-caption">周辺地図 <kbd>M</kbd></span></div>';this.mini=element.querySelector('canvas');this.base=document.createElement('canvas');this.base.width=this.base.height=1024;}
 ensure(world){if(this.world===world&&this.revision===world.mapRevision)return;this.world=world;this.revision=world.mapRevision;this.drawBase(world);}
 drawBase(world){
  const c=this.base.getContext('2d'),n=1024,[w,d]=world.config.size,p=mapProjection([w,d],n,n);this.baseProjection=p;
  c.fillStyle='#ddd8b8';c.fillRect(0,0,n,n);
  const dark=!!world.rooms.length,step=8,pixel=8;
  // Relief is sampled from the same height function used by gameplay and trees.
  for(let py=0;py<n;py+=step)for(let px=0;px<n;px+=step){
   const x=(px-n/2)/p.scale,z=(py-n/2)/p.scale;
   if(Math.abs(x)>w/2||Math.abs(z)>d/2)continue;
   if(dark){c.fillStyle='#797f73';}
   else {const h=world.height(x,z),shade=Math.max(0,Math.min(14,h*.5)),band=Math.floor(h/3)%2;
    c.fillStyle=`hsl(${world.zone==='village'?77:91},${25+band*3}%,${72-shade}%)`;
   }c.fillRect(px,py,pixel,pixel);
  }
  c.strokeStyle='#707c5b20';c.lineWidth=1;for(let x=-w/2;x<w/2;x+=20){const a=p.point(x,-d/2),b=p.point(x,d/2);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}for(let z=-d/2;z<d/2;z+=20){const a=p.point(-w/2,z),b=p.point(w/2,z);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
  const rect=(x,z,rw,rd,fill,stroke)=>{const a=p.point(x-rw/2,z-rd/2);c.fillStyle=fill;c.fillRect(a.x,a.y,rw*p.scale,rd*p.scale);if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.strokeRect(a.x,a.y,rw*p.scale,rd*p.scale);}};
  if(['village','forest'].includes(world.zone)){const x=world.zone==='village'?-55:-96;rect(x,0,world.zone==='village'?8:10,world.zone==='village'?116:207,'#83afb1','#608e93');}
  for(const room of world.rooms)rect(room.x,room.z,room.w,room.d,'#d0c9af','#525f5b');
  for(const path of world.terrain.paths){for(const [color,width] of [[dark?'#a6a68d':'#928e6666',world.zone==='village'?6.6:5.4],['#eee2ba',world.zone==='village'?5.5:4.5]]){c.strokeStyle=color;c.lineWidth=width*p.scale;c.lineCap=c.lineJoin='round';c.beginPath();path.forEach(([x,z],i)=>{const a=p.point(x,z);if(i)c.lineTo(a.x,a.y);else c.moveTo(a.x,a.y);});c.stroke();}}
  for(const tree of world.colliders.filter(t=>t.w===.8&&t.d===.8)){
   const a=p.point(tree.x,tree.z),r=Math.max(2.5,2.3*p.scale);c.fillStyle='#53725577';c.beginPath();c.arc(a.x,a.y,r,0,Math.PI*2);c.fill();c.strokeStyle='#49684b99';c.lineWidth=.7;c.stroke();
  }
  for(const b of [...world.houses,...(world.scenicBuildings||[])]){
   const a=p.point(b.x,b.z);c.save();c.translate(a.x,a.y);c.rotate(-(b.rotation||0));c.fillStyle='#31483b30';c.fillRect(-b.w*p.scale/2+3,-b.d*p.scale/2+4,b.w*p.scale,b.d*p.scale);c.fillStyle='#b77b59';c.strokeStyle='#705f47';c.lineWidth=1.8;c.fillRect(-b.w*p.scale/2,-b.d*p.scale/2,b.w*p.scale,b.d*p.scale);c.strokeRect(-b.w*p.scale/2,-b.d*p.scale/2,b.w*p.scale,b.d*p.scale);c.beginPath();c.moveTo(0,-b.d*p.scale/2);c.lineTo(0,b.d*p.scale/2);c.stroke();c.restore();
  }
  if(world.zone==='village'){const a=p.point(0,7);c.beginPath();c.arc(a.x,a.y,2.5*p.scale,0,Math.PI*2);c.fillStyle='#7aafb1';c.fill();}
  c.strokeStyle='#7a755a80';c.lineWidth=2;const a=p.point(-w/2,-d/2);c.strokeRect(a.x,a.y,w*p.scale,d*p.scale);
 }
 show(world,state,menu){
  this.ensure(world);const q=objective(state),goal=guidance(state,world),pois=mapPoints(world,state);
  menu.className='atlas-menu';menu.innerHTML=`<section class="atlas" role="dialog" aria-modal="true" aria-labelledby="atlas-title"><header><div><span class="eyebrow">KOMOREBI · TRAVELLER’S ATLAS</span><h2 id="atlas-title">${ZONE_NAMES[world.zone]}</h2></div><button data-action="close-menu">地図を閉じる <kbd>M / Esc</kbd></button></header><div class="atlas-body"><div class="atlas-sheet"><canvas id="atlas-canvas" aria-label="現在地、向き、道、建物、目的地が記されたエリア地図"></canvas><div class="atlas-legend"><span class="player-key">▲ 現在地と向き</span><span>！ 次の目的地</span><span>↗ エリア移動</span><span>▣ 宝箱</span><span>✧ 休息</span></div></div><aside><span class="eyebrow">リリィを助ける</span><h3>${esc(q[0])}</h3><p>${esc(q[1])}</p>${goal?`<div class="atlas-destination"><span>!</span><div><small>このエリアで向かう場所</small><b>${esc(goal.label)}</b></div></div>`:''}<h4>主な場所</h4><ol class="atlas-places">${pois.filter(p=>p.type==='portal'||p.type==='npc').map(p=>`<li><span>${p.symbol}</span>${esc(p.mapLabel)}</li>`).join('')}</ol><h4>冒険の道のり</h4>${routeMap(world.zone)}<p class="atlas-note">地図は北が上。青い矢印が<br>まんまるぶうの向いている方向。</p></aside></div></section>`;
  this.large=menu.querySelector('canvas');this.paintLarge(world,state,this.position||{x:state.location.x,z:state.location.z},this.yaw||0);
 }
 player(c,p,yaw,size){const f=facingVector(yaw),right={x:f.y,y:-f.x};c.save();c.shadowColor='#ffffff';c.shadowBlur=7;c.beginPath();c.moveTo(p.x+f.x*size,p.y+f.y*size);c.lineTo(p.x-f.x*size*.65+right.x*size*.7,p.y-f.y*size*.65+right.y*size*.7);c.lineTo(p.x-f.x*size*.32,p.y-f.y*size*.32);c.lineTo(p.x-f.x*size*.65-right.x*size*.7,p.y-f.y*size*.65-right.y*size*.7);c.closePath();c.fillStyle=blue;c.strokeStyle='#fff9df';c.lineWidth=2.5;c.fill();c.stroke();c.restore();}
 icon(c,p,symbol,color,size){c.font=`bold ${size}px 'Segoe UI Symbol',sans-serif`;c.textAlign='center';c.textBaseline='middle';c.lineWidth=4;c.strokeStyle='#f5eed8';c.strokeText(symbol,p.x,p.y);c.fillStyle=color;c.fillText(symbol,p.x,p.y);}
 paintLarge(world,state,position,yaw){
  if(!this.large?.isConnected)return;const c=this.large.getContext('2d');this.large.width=this.large.height=1024;c.drawImage(this.base,0,0);const p=this.baseProjection,goal=guidance(state,world);
  for(const it of mapPoints(world,state)){const a=p.point(it.x,it.z);this.icon(c,a,it.symbol,it.type==='portal'?'#4c6b65':ink,20);if(it.type==='portal'){c.font='bold 15px sans-serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#eee6cb';c.strokeText(it.mapLabel.replace('へ',''),a.x,a.y+24);c.fillStyle=ink;c.fillText(it.mapLabel.replace('へ',''),a.x,a.y+24);}}
  if(goal){const a=p.point(goal.x,goal.z);this.goalPin(c,a,34);const label='目的地 · '+goal.label;c.font='bold 19px sans-serif';const width=c.measureText(label).width+28,x=Math.max(10,Math.min(1014-width,a.x-width/2)),y=Math.max(28,a.y-62);c.fillStyle='#365641';c.beginPath();c.roundRect(x,y-20,width,34,6);c.fill();c.strokeStyle='#e0b956';c.lineWidth=2;c.stroke();c.fillStyle='#fff1bd';c.textAlign='left';c.fillText(label,x+14,y+3);this.large.dataset.goal=goal.id;}

  this.player(c,p.point(position.x,position.z),yaw,18);this.compass(c,950,65,28);this.large.dataset.x=position.x.toFixed(2);this.large.dataset.z=position.z.toFixed(2);this.large.dataset.yaw=yaw.toFixed(3);
  const bar=20*p.scale;c.strokeStyle=ink;c.lineWidth=3;c.beginPath();c.moveTo(50,950);c.lineTo(50+bar,950);c.stroke();c.fillStyle=ink;c.textAlign='left';c.font='15px sans-serif';c.fillText('20 m',50,975);
 }
 goalPin(c,a,r){c.save();c.shadowColor='#f4c550';c.shadowBlur=16;c.fillStyle='#e6ba54';c.strokeStyle='#fff4c1';c.lineWidth=3;c.beginPath();c.arc(a.x,a.y,r,0,Math.PI*2);c.fill();c.stroke();c.shadowBlur=0;c.beginPath();c.arc(a.x,a.y,r*.72,0,Math.PI*2);c.fillStyle='#37553b';c.fill();c.fillStyle='#fff2b8';c.font=`bold ${r*1.35}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText('!',a.x,a.y+1);c.restore();}
 compass(c,x,y,size){c.save();c.translate(x,y);for(let i=0;i<4;i++){c.rotate(Math.PI/2);c.beginPath();c.moveTo(0,-size);c.lineTo(size*.18,0);c.lineTo(0,size*.23);c.lineTo(-size*.18,0);c.closePath();c.fillStyle=i%2?'#657565':'#bd9b58';c.fill();}c.fillStyle=ink;c.font='bold 18px serif';c.textAlign='center';c.fillText('N',0,-size-8);c.restore();}
 update(world,state,position,yaw,mode,tab,time){
  this.element.hidden=mode!=='explore';if(mode!=='explore'&&tab!=='map')return;if(time-this.lastTime<.08)return;this.lastTime=time;this.position={x:position.x,z:position.z};this.yaw=yaw;this.ensure(world);
  if(tab==='map'){this.paintLarge(world,state,position,yaw);return;}
  const c=this.mini.getContext('2d'),size=400,radius=183,p=mapProjection([100,100],size,size,17,position),center=this.baseProjection.point(position.x,position.z),scale=p.scale/this.baseProjection.scale;
  c.clearRect(0,0,size,size);c.save();c.beginPath();c.arc(200,200,radius,0,Math.PI*2);c.clip();c.fillStyle='#89977b';c.fillRect(0,0,size,size);c.drawImage(this.base,200-center.x*scale,200-center.y*scale,1024*scale,1024*scale);
  for(const it of mapPoints(world,state)){const a=p.point(it.x,it.z);if(Math.hypot(a.x-200,a.y-200)<radius-12)this.icon(c,a,it.symbol,ink,21);}
  const goal=guidance(state,world);if(goal){let a=p.point(goal.x,goal.z),dx=a.x-200,dy=a.y-200,l=Math.hypot(dx,dy);if(l>radius-24)a={x:200+dx/l*(radius-24),y:200+dy/l*(radius-24)};this.goalPin(c,a,22);this.mini.dataset.goal=goal.id;}
  this.player(c,{x:200,y:200},yaw,19);c.restore();c.beginPath();c.arc(200,200,radius+4,0,Math.PI*2);c.strokeStyle='#deca98';c.lineWidth=3;c.stroke();c.font='bold 21px serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#fff0c3';c.strokeStyle='#283d34';c.lineWidth=5;for(const [text,x,y]of [['N',200,17],['E',383,200],['S',200,383],['W',17,200]]){c.strokeText(text,x,y);c.fillText(text,x,y);}
  this.mini.dataset.x=position.x.toFixed(2);this.mini.dataset.z=position.z.toFixed(2);this.mini.dataset.yaw=yaw.toFixed(3);
 }
}
