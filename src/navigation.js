import {objective} from './rpg.js';
export function guidance(state,world){
 const q=state.story,z=world.zone,find=id=>world.interactions.find(i=>i.id===id);
 let goal=objective(state)[2],local;
 if(z==='village'&&(!q.requestAccepted))local=find('mori');
 else if(q.homecomingCompleted)return null;
 else if(z==='tower'&&!q.towerActivated)local=find('tower-activate');
 else if(z==='cave'&&!q.caveBossDefeated)local=find('garm');
 else if(z==='shrine-court')local=find(q.caveBossDefeated&&!q.crestRestored?'crest':'court-in');
 else if(z==='ruins'&&!q.altarLit)local=find(!state.puzzles.waterA?'waterA':!state.puzzles.waterB?'waterB':'altar');
 else if(z==='shrine-core')local=find(!q.shrineBossDefeated?'velga':!q.lilyRescued?'rescue-lily':'rescue-shortcut');
 if(local)return {...local,goal:true};
 let to;
 if(q.lilyRescued&&!q.homecomingCompleted){if(z==='shrine-core'){local=world.interactions.find(i=>i.type==='return');if(local)return {...local,goal:true};}goal='village';}
 if(z==='village')to='forest';
 else if(z==='forest')to=goal==='shrine-core'?'shrine-court':goal;
 else if(z==='shrine-court')to=q.altarLit&&goal==='shrine-core'?'shrine-upper':'forest';
 else if(z==='shrine-upper')to=goal==='village'?'shrine-court':'shrine-lower';
 else if(z==='shrine-lower')to=goal==='village'?'shrine-upper':'shrine-core';
 else to='forest';
 local=world.interactions.find(i=>i.type==='portal'&&i.to===to);return local?{...local,goal:true}:null;
}
// Guide along the actual road graph before pointing toward a distant exit.
export function roadWaypoint(world,position,target){
 if(!target||!['forest','village'].includes(world.zone))return target;
 const paths=world.terrain.paths,nodes=[],edges=[];
 const index=p=>{let i=nodes.findIndex(n=>Math.hypot(n.x-p[0],n.z-p[1])<.1);if(i<0){i=nodes.length;nodes.push({x:p[0],z:p[1]});edges.push([]);}return i;};
 for(const p of paths)for(let j=1;j<p.length;j++){const a=index(p[j-1]),b=index(p[j]),d=Math.hypot(nodes[a].x-nodes[b].x,nodes[a].z-nodes[b].z);edges[a].push([b,d]);edges[b].push([a,d]);}
 if(!nodes.length)return target;
 const nearest=p=>nodes.reduce((best,n,i)=>Math.hypot(n.x-p.x,n.z-p.z)<Math.hypot(nodes[best].x-p.x,nodes[best].z-p.z)?i:best,0);
 const start=nearest(position),end=nearest(target),cost=nodes.map(()=>Infinity),prev=[],done=new Set();cost[start]=0;
 while(done.size<nodes.length){let a=-1;for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(a<0||cost[i]<cost[a]))a=i;if(a<0||!Number.isFinite(cost[a])||a===end)break;done.add(a);for(const [b,d]of edges[a])if(cost[a]+d<cost[b]){cost[b]=cost[a]+d;prev[b]=a;}}
 if(start===end)return target;const route=[end];while(route[0]!==start&&prev[route[0]]!==undefined)route.unshift(prev[route[0]]);if(route[0]!==start)return target;
 const first=nodes[route[0]],next=nodes[route[1]];const dist=Math.hypot(first.x-position.x,first.z-position.z),towardNext=(position.x-first.x)*(next.x-first.x)+(position.z-first.z)*(next.z-first.z);
 return {...(dist<8||towardNext>0?next:first),label:target.label};
}
