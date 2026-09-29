// Bounded checks for the revised opening, map controls, destination scenery and victory receipt.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
const mode=m=>page.waitForFunction(m=>window.__shrine?.game.mode===m,m,{timeout:60000});
const click=a=>page.locator(`[data-action="${a}"]:visible`).last().click();
const check=(name,details)=>{checks.push({name,details});console.log('PASS',name,details?JSON.stringify(details):'');};
try{
 await page.goto('http://127.0.0.1:5173/?smoke=1');await page.locator('[data-setting="preset"]').selectOption('low');await click('new');await mode('explore');
 assert.equal(await page.evaluate(()=>window.__shrine.game.world.npcs.some(n=>n.id==='lily')),false);
 await page.waitForFunction(()=>!document.querySelector('#minimap').hidden);
 await page.keyboard.down('KeyD');await page.waitForTimeout(300);await page.keyboard.up('KeyD');
 await page.waitForFunction(()=>{const g=window.__shrine.game,m=document.querySelector('#minimap canvas');return Math.abs(Number(m.dataset.x)-g.hero.root.position.x)<.05&&Math.abs(Number(m.dataset.yaw)-g.hero.root.rotation.y)<.01;});
 await page.keyboard.press('KeyM');await mode('menu');assert.equal(await page.evaluate(()=>window.__shrine.game.ui.tab),'map');assert.equal(await page.locator('#atlas-canvas').isVisible(),true);assert.equal(await page.locator('#minimap').isVisible(),false);
 assert.ok((await page.locator('.atlas').innerText()).includes('リリィの消息を聞こう'));
 if(process.env.UI_SHOTS==='1')await page.screenshot({path:'artifacts/atlas-review.png'});
 await page.keyboard.press('KeyM');await mode('explore');await click('menu:status');await page.keyboard.press('KeyM');assert.equal(await page.evaluate(()=>window.__shrine.game.ui.tab),'map');await page.keyboard.press('Escape');await mode('explore');check('M atlas, Tab to M, Escape, live position and facing on minimap');
 await page.evaluate(()=>{const g=window.__shrine.game,i=g.world.interactions.find(i=>i.id==='mori');g.hero.root.position.set(i.x,g.world.height(i.x,i.z),i.z);});await page.keyboard.press('KeyE');await mode('dialogue');assert.ok((await page.locator('#dialog').innerText()).includes('10日前'));
 for(let i=0;i<12;i++){if(await page.evaluate(()=>window.__shrine.game.mode==='explore'))break;await click('dialog-next');}
 await mode('explore');assert.equal(await page.evaluate(()=>window.__shrine.game.state.story.requestAccepted),true);check('past disappearance dialogue accepts the rescue request without an abduction scene');
 const vistas=await page.evaluate(()=>{const g=window.__shrine.game,a={zone:g.world.zone,...g.world.destinationVista};g.changeZone('forest');g.encounterGrace=999;return [a,{zone:g.world.zone,...g.world.destinationVista,walkable:g.world.walkable(0,94)}];});assert.equal(vistas[0].destination,'forest');assert.equal(vistas[1].destination,'village');assert.ok(vistas[1].buildings>=8&&vistas[1].walkable);check('forest has village gate, houses and tower; village has a forest grove',vistas);
 await page.keyboard.press('KeyM');assert.ok((await page.locator('.atlas').innerText()).includes('こもれび村へ'));await page.keyboard.press('KeyM');
 await page.evaluate(()=>{const g=window.__shrine.game;g.startBattle({id:'journey-receipt',formation:['sprout'],xp:100,reward:'horn1'});});await mode('battle');await click('fight:drill');await mode('results');
 const result=await page.locator('#result-screen').innerText();for(const text of ['獲得経験値','獲得ゴールド','LEVEL UP!','最大HP','スキルポイント','手に入れたもの','次の目的'])assert.ok(result.includes(text),text);
 const reward=await page.evaluate(()=>{const g=window.__shrine.game,s=g.saves.load();return {xp:g.state.xp,level:g.state.level,sp:g.state.sp,gold:g.state.gold,gear:g.state.owned.includes('horn1'),savedXP:s.xp,savedZone:s.location.zone,resultXP:g.combat.result.xp};});assert.equal(reward.resultXP,100);assert.equal(reward.gear,true);assert.equal(reward.savedXP,reward.xp);assert.equal(reward.savedZone,'forest');
 await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>window.__shrine.game.mode),'results');
 if(process.env.UI_SHOTS==='1')await page.screenshot({path:'artifacts/results-review.png'});
 await page.keyboard.press('Enter');await mode('explore');assert.equal(await page.evaluate(()=>window.__shrine.game.state.xp),reward.xp);assert.equal(await page.evaluate(()=>window.__shrine.game.state.gold),reward.gold);assert.equal(await page.evaluate(()=>window.__shrine.game.state.owned.filter(id=>id==='horn1').length),1);check('victory receipt includes growth and loot, saves actual rewards, waits for Enter, pays once',reward);
 // Layout check at the smaller end of ordinary laptop screens; no screenshot iteration.
 await page.setViewportSize({width:1024,height:640});await page.keyboard.press('KeyM');await page.waitForTimeout(150);const layout=await page.locator('.atlas').evaluate(e=>{const r=e.getBoundingClientRect(),c=e.querySelector('canvas').getBoundingClientRect(),b=e.querySelector('button').getBoundingClientRect();return {w:r.width,h:r.height,canvasW:c.width,canvasH:c.height,buttonRight:b.right,buttonTop:b.top};});assert.ok(layout.w<=1024&&layout.h<=640&&layout.canvasW>300&&layout.canvasH>300&&layout.buttonRight<1024&&layout.buttonTop>=0);await page.keyboard.press('Escape');check('atlas remains readable within a 1024 by 640 viewport',layout);
 assert.deepEqual(errors,[]);check('no browser errors');
}finally{await fs.writeFile('artifacts/journey-results.json',JSON.stringify({checks,errors},null,2));await browser.close();}
