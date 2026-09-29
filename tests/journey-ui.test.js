import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,deserialize,serialize,settleVictory,milestone,xpToLevel,totalSkillPoints,awardXP} from '../src/rpg.js';
import {mapProjection,facingVector,mapPoints} from '../src/cartography.js';
import {victoryScreen} from '../src/victory-screen.js';

test('old chapter saves retain rescue progress without replaying an abduction',()=>{
 const s=createState();delete s.story.abductionKnown;s.story.abductionSeen=true;s.story.requestAccepted=true;s.story.towerActivated=true;
 const loaded=deserialize(serialize(s));assert.equal(loaded.story.abductionKnown,true);assert.equal(loaded.story.towerActivated,true);assert.equal('abductionSeen' in loaded.story,false);assert.equal(createState().story.abductionKnown,false);
});
test('victory receipt accounts for boss milestone EXP, growth, SP and actual inventory together',()=>{
 const s=createState();milestone(s,'abductionKnown');milestone(s,'requestAccepted');s.puzzles.tower=[1,2,0];milestone(s,'towerActivated');
 const before=structuredClone(s),r=settleVictory(s,{boss:'garm',id:'garm'},{xp:1000,gold:200});
 assert.equal(r.xp,1650);assert.equal(r.storyXP,650);assert.equal(s.xp-before.xp,r.xp);assert.equal(r.sp,totalSkillPoints(s.level)-totalSkillPoints(before.level));assert.equal(s.inventory.salve-before.inventory.salve,3);assert.equal(s.gold-before.gold,200);assert.equal(r.loot[0].id,'crest');assert.equal(r.objective[2],'shrine-court');
 const repeat=settleVictory(s,{boss:'garm',id:'garm'},{xp:1000,gold:200});assert.equal(repeat.storyXP,0);assert.equal(repeat.loot.length,0);
 const html=victoryScreen({...r,rounds:8,enemies:['岩鎧のガルム']});for(const text of ['LEVEL UP!','スキルポイント','最大HP','封印の紋章','冒険を続ける'])assert.ok(html.includes(text));
});
test('trial equipment is only granted on first clear and Lv30 continues toward Lv31',()=>{
 const s=createState();awardXP(s,xpToLevel(30));const e={id:'test-trial',trial:true,reward:['horn7','feet5']};
 assert.equal(settleVictory(s,e,{xp:300,gold:10}).loot.length,2);const r=settleVictory(s,e,{xp:300,gold:10});assert.equal(r.loot.length,0);assert.equal(r.sp,0);assert.equal(s.trials.length,1);const html=victoryScreen({...r,rounds:2,enemies:['魔物']});assert.ok(html.includes('次のレベルまで'));assert.ok(!html.includes('レベル30に到達'));
});
test('large map and minimap use the same north-up axes and character heading',()=>{
 const p=mapProjection([100,100],400,400,0,{x:10,z:20});assert.deepEqual(p.point(10,20),{x:200,y:200});assert.ok(p.point(10,0).y<200);assert.ok(p.point(30,20).x>200);
 for(const [yaw,x,y]of [[0,0,1],[Math.PI/2,1,0],[Math.PI,0,-1],[-Math.PI/2,-1,0]]){const f=facingVector(yaw);assert.ok(Math.abs(f.x-x)<1e-8&&Math.abs(f.y-y)<1e-8);}
 const state=createState();state.chests=['opened'];const world={interactions:[{id:'opened',type:'chest'},{id:'new',type:'chest'},{id:'exit',type:'portal',label:'森へ'},{id:'ambient',type:'npc'}]};assert.deepEqual(mapPoints(world,state).map(p=>p.id),['new','exit']);
});
