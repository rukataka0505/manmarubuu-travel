// One bounded run for imported actors, animated water and every map connection.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}}),checks=[],errors=[];
page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
const check=(name,details)=>{checks.push({name,details});console.log('PASS',name,details?JSON.stringify(details):'');};
const shoot=async name=>{if(process.env.ASSET_SCREENSHOTS!=='1')return;const path=`artifacts/${name}.png`;try{await fs.access(path);}catch{await page.screenshot({path});}};
try{
 await page.goto('http://127.0.0.1:5173/?smoke=1');await page.locator('[data-setting="preset"]').selectOption('low');await page.locator('[data-action="new"]').click();await page.waitForFunction(()=>window.__shrine?.game.mode==='explore');
 const water=await page.evaluate(()=>{const f=window.__shrine.game.world.fountain;return {vase:!!f.root.getObjectByName('Vase_4'),chalice:!!f.root.getObjectByName('Chalice'),before:Array.from(f.positions.slice(0,12)),count:f.mist.geometry.drawRange.count};});
 await page.waitForTimeout(220);const after=await page.evaluate(()=>Array.from(window.__shrine.game.world.fountain.positions.slice(0,12)));assert.notDeepEqual(after,water.before);assert.ok(water.vase&&water.chalice&&water.count>0);check('supplied ZIP props form the fountain and the water droplets animate',water);
 await page.evaluate(()=>{const g=window.__shrine.game;g.mode='cinematic';g.hero.root.visible=false;g.ui.elements.hud.hidden=true;g.ui.elements.navigation.hidden=true;g.ui.hint(null);g.ui.elements.toasts.replaceChildren();g.view.camera.position.set(7,6,15);g.view.camera.lookAt(0,1.7,7);});await page.waitForTimeout(100);await shoot('fountain-20260928');
 const models=await page.evaluate(async()=>{
  const g=window.__shrine.game,a=await import('/src/actors.js'),{MONSTER_CATALOG}=await import('/src/monster-catalog.js');await a.loadMonsters();g.world.setVisible(false);const gallery=new g.world.root.constructor();g.view.scene.add(gallery);g.monsterReview=gallery;
  const stats=[];let i=0;const Box=g.assets.models.values().next().value.bounds.constructor;
  for(const id of Object.keys(MONSTER_CATALOG)){
   const m=a.monster(id);m.position.set((i%6-2.5)*4.8,0,(Math.floor(i/6)-1)*7);m.rotation.y=.25;gallery.add(m);let skinned=0;m.traverse(o=>{if(o.isSkinnedMesh)skinned++;});
   a.animateMonster(m,.3);const box=new Box().setFromObject(m),size=box.getSize(g.hero.root.position.clone());
   for(const motion of ['walk','run','attack','hit','death']){a.playMonster(m,motion,{duration:.5,force:true});a.animateMonster(m,.15);if(m.userData.monster.state!==motion)throw Error(id+' failed '+motion);}
   stats.push({id,asset:m.userData.monster.asset,skinned,height:size.y,finite:size.toArray().every(Number.isFinite)});a.disposeMonster(m);m.removeFromParent();
   const display=a.monster(id);display.position.copy(m.position);display.rotation.y=.25;a.animateMonster(display,.3);gallery.add(display);i++;
  }
  g.view.camera.position.set(2,17,32);g.view.camera.lookAt(0,1.3,0);return stats;
 });
 assert.equal(models.length,18);assert.ok(models.every(m=>m.skinned>0&&m.finite&&m.height>.5&&m.height<6));await page.waitForTimeout(200);await shoot('monsters-20260928');check('all 18 enemies use real skinned models and all five action transitions',models);
 await page.evaluate(async()=>{const g=window.__shrine.game,{disposeMonster}=await import('/src/actors.js');for(const m of g.monsterReview.children)disposeMonster(m);g.monsterReview.removeFromParent();g.hero.root.visible=true;g.world.setVisible(true);g.mode='explore';g.state.story.requestAccepted=true;});
 // Test a story-locked doorway by walking, without triggering any dialogue/key-E path.
 await page.evaluate(async()=>{const g=window.__shrine.game,{passageGeometry,passageApproach}=await import('/src/passages.js');g.changeZone('forest');g.encounterGrace=999;const it=g.world.interactions.find(i=>i.id==='forest-cave'),p=passageGeometry(it),s=passageApproach(it,.6);g.hero.root.position.set(s.x,g.world.height(s.x,s.z),s.z);g.passageCooldown=0;g.yaw=Math.atan2(-p.nx,-p.nz);});
 await page.keyboard.down('KeyW');await page.waitForTimeout(550);await page.keyboard.up('KeyW');assert.equal(await page.evaluate(()=>window.__shrine.game.world.zone),'forest');assert.match(await page.locator('#toasts').innerText(),/古塔/);check('walking into a sealed entrance respects the story lock');
 const routes=await page.evaluate(()=>{const g=window.__shrine.game;for(const id of ['requestAccepted','towerActivated','caveBossDefeated','crestRestored','altarLit','shrineBossDefeated','lilyRescued','homecomingCompleted'])g.state.story[id]=true;const all=[];for(const zone of ['village','forest','tower','cave','ruins','shrine-court','shrine-upper','shrine-lower','shrine-core']){g.changeZone(zone);for(const p of g.world.interactions.filter(p=>p.type==='portal'))all.push({zone,id:p.id,to:p.to});}return all;});
 for(const route of routes){
  await page.evaluate(async route=>{const g=window.__shrine.game,{passageGeometry,passageApproach}=await import('/src/passages.js');g.changeZone(route.zone);g.mode='explore';g.encounterGrace=999;const it=g.world.interactions.find(i=>i.id===route.id),p=passageGeometry(it),s=passageApproach(it,.85);if(!g.world.walkable(s.x,s.z))throw Error('Blocked approach '+route.zone+':'+route.id);g.hero.root.position.set(s.x,g.world.height(s.x,s.z),s.z);g.yaw=Math.atan2(-p.nx,-p.nz);g.passageCooldown=0;g.camera(true);},route);
  await page.keyboard.down('KeyW');await page.waitForFunction(to=>{const g=window.__shrine.game;if(g.fatal)throw Error(g.fatal);return g.world.zone===to&&g.mode==='explore';},route.to,{timeout:12000});await page.keyboard.up('KeyW');
  const safe=await page.evaluate(async()=>{const g=window.__shrine.game,{crossedPassage}=await import('/src/passages.js');return !g.world.interactions.some(p=>p.type==='portal'&&crossedPassage(p,g.hero.root.position));});assert.equal(safe,true,route.id+' safe arrival');
  console.log('CROSSED',route.zone,route.id,route.to);
 }
 check('every one-way map connection is crossed by walking alone with no reverse-trigger arrival',routes);
 assert.deepEqual(errors,[]);check('no browser, missing-asset or shader errors');
}finally{await fs.writeFile('artifacts/monsters-passages-results.json',JSON.stringify({date:new Date().toISOString(),checks,errors},null,2));await browser.close();}
