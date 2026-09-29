// Bounded regression check for rolling combos, using the real renderer and animation loop.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
page.setDefaultTimeout(30000);
try{
 await page.goto('http://127.0.0.1:5173/?smoke=1');
 await page.locator('[data-setting="preset"]').selectOption('low');
 await page.locator('[data-action="new"]').click();
 await page.waitForFunction(()=>window.__shrine?.game.mode==='explore');
 for(const fixture of [
  {name:'single target',count:1,hp:1000,expected:3,realTime:true},
  {name:'three targets',count:3,hp:1000,expected:3},
  {name:'retarget after defeat',count:3,hp:1,expected:3},
  {name:'early victory',count:1,hp:1,expected:1},
  {name:'misses',count:1,hp:1000,expected:3,miss:true,reduced:true},
 ]){
  await page.evaluate(async f=>{
   const g=window.__shrine.game,{awardXP,xpToLevel,allocate,recover}=await import('/src/rpg.js');
   if(g.combat){g.combat.dispose();g.combat=null;g.mode='explore';}
   awardXP(g.state,Math.max(0,xpToLevel(10)-g.state.xp));
   allocate(g.state,'body',Math.max(0,18-g.state.trees.body));recover(g.state);
   g.state.tutorialDrill=true;g.testing=!f.realTime;g.settings.battleSpeed=1;g.settings.camera=f.reduced?'reduced':'full';
   g.startBattle({id:'roll-regression',formation:Array(f.count).fill('sprout')});
   const c=g.combat;for(const e of c.rules.enemies){e.hp=e.maxHP=f.hp;e.speed=0;}
   c.rules.choose=()=> 'shell';if(f.miss)c.rules.hero.status.blind=2;
   c.trace={hits:[],returns:[],boundaries:[],frames:[],mpBefore:g.state.mp};
   let active=null,selection=0,randomCall=0;
   c.rules.rng=()=>{if(f.miss)return .1;return randomCall++%4===0?((selection++%f.count)+.5)/f.count:.9;};
   const animate=c.animate.bind(c),returnHome=c.returnHome.bind(c),camera=c.moveCamera.bind(c);
   c.returnHome=async id=>{c.trace.returns.push({actor:id,hits:c.trace.hits.length});return returnHome(id);};
   c.animate=async event=>{
    const roll=event.actor==='hero'&&event.move==='roll';active=roll?event.hit:null;
    if(roll){const apply=event.apply;c.trace.boundaries.push({hit:event.hit,start:g.hero.root.position.toArray()});event.apply=()=>{const result=apply();c.trace.hits.push({target:event.target,miss:!!result.miss,damage:result.damage||0,clip:g.hero.current,phase:c.heroAction.phase});return result;};}
    await animate(event);
    if(roll)c.trace.boundaries.at(-1).end=g.hero.root.position.toArray();active=null;
   };
   c.moveCamera=(pose,dt,...rest)=>{camera(pose,dt,...rest);if(active!==null)c.trace.frames.push({hit:active,phase:c.motionPhase,distance:g.hero.root.position.distanceTo(c.homes.get('hero'))});};
  },fixture);
  await page.locator('[data-action="battle-skills"]').click();
  await page.locator('[data-action="fight:roll"]').click();
  await page.waitForFunction(()=>{const g=window.__shrine.game;return g.mode==='results'||g.mode==='battle'&&!g.combat.busy;},null,{timeout:60000});
  const result=await page.evaluate(()=>{const g=window.__shrine.game,c=g.combat;return {...c.trace,mpSpent:c.trace.mpBefore-g.state.mp,home:c.homes.get('hero').toArray(),returned:g.hero.root.position.distanceTo(c.homes.get('hero'))<.001};});
  assert.equal(result.hits.length,fixture.expected,fixture.name);
  assert.deepEqual(result.returns,[{actor:'hero',hits:fixture.expected}]);
  assert.equal(result.mpSpent,6);assert.ok(result.returned);
  for(let i=1;i<result.boundaries.length;i++){
   assert.deepEqual(result.boundaries[i].start,result.boundaries[i-1].end);
   assert.ok(Math.hypot(...result.boundaries[i].start.map((v,k)=>v-result.home[k]))>2);
  }
  assert.ok(result.frames.filter(f=>f.hit>0&&f.phase!=='return').every(f=>f.distance>2));
  if(fixture.count===3)assert.equal(new Set(result.hits.map(h=>h.target)).size,3);
  if(fixture.miss)assert.ok(result.hits.every(h=>h.miss&&!h.damage));
  if(fixture.realTime){assert.ok(result.frames.length>30);assert.ok(result.hits.every(h=>h.clip==='BodyBlow'&&Math.abs(h.phase-.45)<.08));}
  const {frames,...summary}=result;checks.push({name:fixture.name,samples:frames.length,...summary});
  console.log('PASS',fixture.name,JSON.stringify({hits:result.hits.length,returns:result.returns.length,mpSpent:result.mpSpent,samples:frames.length}));
  if(await page.evaluate(()=>window.__shrine.game.mode==='results')){
   await page.locator('[data-action="result-continue"]').click();
   await page.waitForFunction(()=>window.__shrine.game.mode==='explore');
  }
 }
 assert.deepEqual(errors,[]);
}finally{
 await fs.mkdir('artifacts',{recursive:true});
 await fs.writeFile('artifacts/roll-results.json',JSON.stringify({date:new Date().toISOString(),checks,errors},null,2));
 await browser.close();
}
