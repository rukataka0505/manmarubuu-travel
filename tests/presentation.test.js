import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {commandShot,actionShot} from '../src/battle-camera.js';
import {crossedPassage} from '../src/passages.js';
import {battleHelp} from '../src/battle-help.js';
import {BattleRules} from '../src/battle-rules.js';
import {createState,awardXP,xpToLevel,allocate} from '../src/rpg.js';
import {effectFamily} from '../src/battle-effects.js';

test('battle command camera remains behind the hero for single and grouped enemies',()=>{
 const h=new Vector3(-4,0,1.4);
 for(const enemies of [[new Vector3(3.4,0,-3.5)],[new Vector3(3.4,0,-3.5),new Vector3(4.5,0,0),new Vector3(3.4,0,3.5)]]){
  const c=commandShot(h,enemies);assert.ok(c.position.clone().sub(h).dot(c.forward)<-7);assert.ok(c.position.y>h.y);assert.ok(c.position.clone().sub(h).dot(c.side)>3);
 }
});
test('action camera stays on the same side and does not cut at impact or the previous .8 threshold',()=>{
 const start=new Vector3(-4,0,1.4),end=new Vector3(3.4,0,-3.5),command=commandShot(start,[end]);
 for(const type of ['attack','drill','meteor']){
  const impact=type==='drill'?.64:type==='meteor'?.62:.47;
  const shot=p=>actionShot({command,start,end,actor:start.clone().lerp(end,p),p,impact,ultimate:type==='drill',meteor:type==='meteor',self:false,reduced:false});
  for(const p of [impact,.8,.24,.46]){const a=shot(p-1e-5),b=shot(p+1e-5);assert.ok(a.position.distanceTo(b.position)<.01);assert.ok(a.target.distanceTo(b.target)<.01);}
  for(let p=0;p<=1;p+=.01)assert.ok(shot(p).position.clone().sub(start).dot(command.side)>0);
 }
});
test('walking passages activate beyond their gates, never on safe return spawns or off the road',()=>{
 const out={id:'village-forest',x:0},back={id:'forest-village',x:0};
 assert.equal(crossedPassage(out,{x:0,z:-47}),false);assert.equal(crossedPassage(out,{x:0,z:-52}),true);assert.equal(crossedPassage(out,{x:12,z:-52}),false);assert.equal(crossedPassage(out,{x:0,z:-39}),false);
 assert.equal(crossedPassage(back,{x:0,z:98}),false);assert.equal(crossedPassage(back,{x:0,z:100}),true);assert.equal(crossedPassage(back,{x:0,z:86}),false);
});
test('skill and item help explains actual MP costs, target and why a disabled action cannot be used',()=>{
 const s=createState();awardXP(s,xpToLevel(30));allocate(s,'body',100);const b=new BattleRules(s,['sprout']);
 assert.match(battleHelp('fight:rush',b).detail,/消費MP 2/);assert.match(battleHelp('fight:meteor',b).detail,/敵全体/);s.mp=0;assert.match(battleHelp('fight:rush',b).reason,/MP/);assert.match(battleHelp('fight:drill',b).detail,/MP0/);assert.match(battleHelp('fight:drill',b).reason,/チャージ/);assert.match(battleHelp('fight:item:herb',b).detail,/所持 8個/);assert.equal(battleHelp('menu:settings',b),null);
});
test('special attacks and enemy ailments have distinct presentation families',()=>{
 const keys=['drill','meteor','break','roll','rock','poison','sleep','dust','seal','drain'];assert.equal(new Set(keys.map(move=>effectFamily({move,kind:'physical'}))).size,keys.length);assert.equal(effectFamily({move:'shell',kind:'buff'}),'guard');assert.equal(effectFamily({move:'breeze',kind:'wind'}),'wind');
});
