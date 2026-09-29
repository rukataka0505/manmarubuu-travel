import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],report={};
page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text().slice(0,1200));});
try{
 await page.goto('http://127.0.0.1:5173/?smoke=1');await page.locator('[data-action="new"]').click();await page.waitForFunction(()=>window.__shrine?.snapshot().mode==='explore',null,{timeout:90000});
 await page.evaluate(()=>{const g=window.__shrine.game;g.hero.root.position.set(0,g.world.height(0,34),34);g.yaw=.18;});await page.waitForTimeout(1200);
 report.village=await page.evaluate(()=>{const g=window.__shrine.game;return {meadowClusters:g.world.meadowCount,houses:g.world.houses.length};});
 await page.screenshot({path:'artifacts/stylized-village.png'});
 await page.evaluate(async()=>{const g=window.__shrine.game,{equip}=await import('/src/rpg.js');g.state.owned.push('body3','head2');equip(g.state,'body3');equip(g.state,'head2');g.hero.equip(g.state);g.openMenu('equipment');});await page.waitForTimeout(700);await page.screenshot({path:'artifacts/pink-character.png'});
 await page.evaluate(()=>{const g=window.__shrine.game;g.closeMenu();g.changeZone('forest',[0,65]);g.yaw=.3;});await page.waitForTimeout(900);await page.screenshot({path:'artifacts/stylized-forest.png'});
 report.forest=await page.evaluate(()=>{const g=window.__shrine.game;return {meadowClusters:g.world.meadowCount};});
 report.errors=errors;console.log(JSON.stringify(report,null,2));
}finally{await fs.writeFile('artifacts/art-direction-check.json',JSON.stringify({...report,errors},null,2));await browser.close();}
