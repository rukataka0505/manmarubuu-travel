import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,equip,unequip,stats,serialize,deserialize} from '../src/rpg.js';
import {createEnemyAI,decideEnemy} from '../src/field-ai.js';
import {Terrain} from '../src/terrain.js';
import {BUILDINGS} from '../src/zone-data.js';
import {guidance} from '../src/navigation.js';

test('removal and hidden appearance persist independently from equipment stats',()=>{
 const s=createState(),base=stats(s);s.owned.push('body3');equip(s,'body3');const armored=stats(s);assert.ok(armored.def>base.def);
 unequip(s,'body',true);assert.equal(s.appearance.body,'hidden');assert.deepEqual(stats(s),armored);const saved=deserialize(serialize(s));assert.equal(saved.appearance.body,'hidden');assert.equal(saved.equipment.body,'body3');
 unequip(saved,'body');assert.equal(saved.equipment.body,undefined);assert.equal(saved.appearance.body,undefined);assert.ok(stats(saved).def<armored.def);saved.owned.push('body0');equip(saved,'body0',true);assert.equal(saved.equipment.body,undefined);assert.equal(saved.appearance.body,'body0');assert.equal(deserialize(serialize(saved)).appearance.body,'body0');assert.equal(unequip(s,'invalid'),false);
});
test('enemies notice before chasing, flee stronger heroes, and stop at their leash',()=>{
 const ai=createEnemyAI({formation:['sprout'],phase:1});const input={distance:8,fromHome:0,visible:true,heroLevel:1};assert.equal(decideEnemy(ai,input,.1),'notice');assert.equal(decideEnemy(ai,input,.3),'notice');assert.equal(decideEnemy(ai,input,.3),'chase');assert.equal(decideEnemy(ai,{...input,heroLevel:10},.1),'flee');assert.equal(decideEnemy(ai,{...input,fromHome:25},.1),'return');assert.equal(decideEnemy(ai,{...input,fromHome:0},.1),'roam');assert.equal(decideEnemy(ai,input,.1),'roam');
 const elite=createEnemyAI({formation:['crownmoth'],elite:true});decideEnemy(elite,{...input,heroLevel:30},.1);assert.equal(decideEnemy(elite,{...input,heroLevel:30},.7),'chase');const unseen=createEnemyAI({formation:['sprout']});assert.equal(decideEnemy(unseen,{...input,visible:false},2),'roam');
});
test('outdoor terrain has real relief while every house has a level walk-in foundation',()=>{
 const v=new Terrain('village'),f=new Terrain('forest');assert.ok(v.height(-28,-32)-v.height(0,7)>3);assert.ok(f.height(-38,-94)-f.height(0,85)>8);
 for(const b of BUILDINGS){const center=v.height(b.x,b.z);for(const [x,z]of [[b.x-b.w*.4,b.z],[b.x,b.z+b.d*.4],[b.x+b.w*.4,b.z-b.d*.4]])assert.ok(Math.abs(v.height(x,z)-center)<.01,b.id);}
 for(const path of f.paths)for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]));let last=f.height(...a);for(let j=1;j<=n;j++){const y=f.height(a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n);assert.ok(Math.abs(y-last)<.9,'authored paths remain walkable slopes');last=y;}}
});
test('guidance follows the story gate and selects the next local mechanism',()=>{
 const s=createState();s.story.abductionKnown=s.story.requestAccepted=true;const forest={zone:'forest',interactions:[{id:'west',type:'portal',to:'tower',x:-70,z:0},{id:'east',type:'portal',to:'cave',x:70,z:0}]};assert.equal(guidance(s,forest).id,'west');s.story.towerActivated=true;assert.equal(guidance(s,forest).id,'east');s.story.caveBossDefeated=s.story.crestRestored=true;const ruins={zone:'ruins',interactions:[{id:'waterA'},{id:'waterB'},{id:'altar'}]};assert.equal(guidance(s,ruins).id,'waterA');s.puzzles.waterA=true;assert.equal(guidance(s,ruins).id,'waterB');s.puzzles.waterB=true;assert.equal(guidance(s,ruins).id,'altar');
});
