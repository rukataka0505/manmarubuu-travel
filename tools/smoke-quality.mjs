import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1366,height:768}}),checks=[],errors=[];
page.setDefaultTimeout(35000);page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
const check=(name,details)=>{checks.push({name,details});console.log('PASS',name,JSON.stringify(details??''));};
const shoot=async name=>{if(process.env.QUALITY_SCREENSHOTS!=='1')return;const path=`artifacts/quality-${name}.png`;try{await fs.access(path);}catch{await page.screenshot({path});}};
const mode=async m=>page.waitForFunction(m=>{const g=window.__shrine?.game;if(g?.fatal)throw Error(g.fatal);return g?.mode===m;},m);
const click=async a=>page.locator(`[data-action="${a}"]:visible`).last().click();
try{
 await page.goto('http://127.0.0.1:5173/');await page.locator('[data-setting="preset"]').selectOption('low');await click('new');await mode('explore');
 const gear=await page.evaluate(async()=>{
  const g=window.__shrine.game,{EQUIPMENT}=await import('/src/content.js'),Box=g.assets.models.values().next().value.bounds.constructor;
  const report=[];for(const e of Object.values(EQUIPMENT)){
   g.hero.equip({...g.state,equipment:{[e.slot]:e.id},appearance:{}});g.hero.model.updateMatrixWorld(true);
   const pieces=g.hero.equipment.map(anchor=>{const b=new Box().setFromObject(anchor),size=b.getSize(g.hero.root.position.clone());return {asset:anchor.userData.equipment.source,size:size.toArray()};});
   report.push({id:e.id,pieces});
  }g.hero.equip(g.state);return report;
 });
 assert.equal(gear.length,36);assert.ok(gear.every(e=>e.pieces.length>0&&e.pieces.every(p=>p.asset==='manmarubuu-equipment.glb'&&p.size.every(v=>Number.isFinite(v)&&v<2))));check('all 36 fitted equipment assets attach with bounded dimensions',gear);
 await page.evaluate(async()=>{const g=window.__shrine.game,{PRESETS}=await import('/src/settings.js'),{awardXP,xpToLevel,allocate,recover}=await import('/src/rpg.js');g.settings={...g.settings,...PRESETS.high,preset:'high'};g.applySettings();awardXP(g.state,xpToLevel(20));allocate(g.state,'body',18);allocate(g.state,'sun',4);recover(g.state);g.state.story.requestAccepted=true;g.state.tutorialDrill=true;g.state.equipment.body='body2';g.state.equipment.head='head1';g.state.owned.push('body2','head1');g.hero.equip(g.state);g.changeZone('forest',[0,65]);g.encounterGrace=999;g.yaw=.28;g.pitch=.27;g.camera(true);});
 await page.waitForTimeout(600);
 const road=await page.evaluate(()=>{const g=window.__shrine.game;return {routes:g.world.root.children.filter(o=>o.userData.road).map(o=>o.userData.road),sky:g.view.sky.visible,skyToneMapped:g.view.sky.material.toneMapped,drawCalls:g.view.renderer.info.render.calls};});
 assert.ok(road.routes.length>=4&&road.routes.every(r=>r.curved));assert.ok(road.sky&&!road.skyToneMapped);await shoot('forest');check('curved terrain-following routes and bright daytime sky render in high quality',road);
 await click('menu:status');await click('menu:equipment');await page.waitForFunction(()=>document.querySelector('.menu-hero-canvas')?.dataset.ready==='true');await shoot('equipment');await click('close-menu');
 await page.evaluate(()=>{const g=window.__shrine.game;g.startBattle({id:'quality-review',formation:['garm'],boss:'garm'});g.combat.rules.rng=()=>.9;g.combat.rules.choose=()=> 'shell';g.combat.rules.enemies[0].hp=g.combat.rules.enemies[0].maxHP=100000;g.ui.battle(g.combat);});await mode('battle');
 await click('battle-skills');await page.locator('[data-action="fight:rush"]').hover();assert.match(await page.locator('#battle-tooltip').innerText(),/ころころ突進/);await click('battle-close');await page.mouse.move(10,700);await shoot('battle');
 const dimensions=await page.evaluate(()=>{const console=document.querySelector('.battle-console').getBoundingClientRect(),commands=[...document.querySelectorAll('.command-grid button')].map(b=>b.getBoundingClientRect());return {consoleInside:console.bottom<=innerHeight&&console.left>=0,commandsInside:commands.every(b=>b.right<=console.right&&b.bottom<=console.bottom)};});assert.ok(dimensions.consoleInside&&dimensions.commandsInside);check('battle panel and skill help fit the 1366x768 laptop viewport',dimensions);
 for(const move of ['attack','drill']){
  await page.evaluate(move=>{const g=window.__shrine.game;if(move==='drill'){g.combat.rules.ready=3;g.combat.rules.charge=100;g.ui.battle(g.combat);}g.motionSamples=[];g.recordMotion=true;const tick=()=>{const c=g.combat;if(c?.heroAction&&['BodyBlow','HornDrill'].includes(g.hero.current))g.motionSamples.push({clip:g.hero.current,time:g.hero.action.time,phase:c.heroAction.phase,impact:c.heroAction.impactSample,pivot:g.hero.pivot.rotation.toArray().slice(0,3),body:g.hero.bones.Body.quaternion.toArray()});if(g.recordMotion)requestAnimationFrame(tick);};requestAnimationFrame(tick);},move);
  await click('fight:'+move);await page.waitForFunction(()=>!window.__shrine.game.combat.busy,{},{timeout:30000});
  const report=await page.evaluate(()=>{const g=window.__shrine.game;g.recordMotion=false;return {samples:g.motionSamples,returned:g.hero.root.position.distanceTo(g.combat.homes.get('hero'))};});
  const name=move==='drill'?'HornDrill':'BodyBlow';assert.ok(report.samples.length>5&&report.samples.every(s=>s.clip===name));assert.ok(report.samples.some(s=>s.phase>.9));assert.ok(report.samples.some(s=>s.impact?.clip===name&&Math.abs(s.impact.phase-(move==='drill'?.53:.45))<.12));assert.ok(report.samples.every(s=>s.pivot.every(v=>Math.abs(v)<.0001)));assert.ok(report.returned<.001);assert.notDeepEqual(report.samples[0].body,report.samples[Math.floor(report.samples.length/2)].body);check(name+' plays real changing bone poses, strikes on the authored phase and runs home',{frames:report.samples.length,contact:report.samples.find(s=>s.impact)?.impact,returned:report.returned});
 }
 await page.evaluate(async()=>{const g=window.__shrine.game,{xpToLevel}=await import('/src/rpg.js');g.state.xp=xpToLevel(g.state.level+1)-1;g.combat.rules.enemies[0].hp=1;g.ui.battle(g.combat);});await click('fight:attack');await mode('results');
 assert.match(await page.locator('#result-screen').innerText(),/LEVEL UP!/);assert.ok(await page.locator('#result-screen [data-art="crest"]').isVisible());await shoot('result');
 const result=await page.evaluate(()=>{const button=document.querySelector('[data-action="result-continue"]').getBoundingClientRect();return {continueVisible:button.top>=0&&button.bottom<=innerHeight,scrollable:document.querySelector('.result-scroll').scrollHeight>=document.querySelector('.result-scroll').clientHeight,loop:window.__shrine.game.hero.action.repetitions,clip:window.__shrine.game.hero.current};});assert.ok(result.continueVisible);assert.equal(result.clip,'Victory');check('illustrated loot, level growth and anchored continue button fit the result panel',result);
 await click('result-continue');await mode('dialogue');while(await page.locator('[data-action="dialog-next"]:visible').count())await click('dialog-next');await mode('explore');
 assert.deepEqual(errors,[]);check('no runtime, shader or missing-asset errors in high quality');
}finally{await fs.writeFile('artifacts/quality-results.json',JSON.stringify({date:new Date().toISOString(),checks,errors},null,2));await browser.close();}
