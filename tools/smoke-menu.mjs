// Bounded menu flow; optional one-pass screenshots, never a screenshot/tweak loop.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}}),checks=[],errors=[];
page.setDefaultTimeout(30000);
page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
const click=a=>page.locator(`[data-action="${a}"]:visible`).last().click();
const mode=m=>page.waitForFunction(m=>window.__shrine?.game.mode===m,m);
const check=(name,details)=>{checks.push({name,details});console.log('PASS',name,details?JSON.stringify(details):'');};
const shot=async name=>{if(process.env.MENU_SCREENSHOTS==='1'){await page.waitForTimeout(180);await page.screenshot({path:`artifacts/menu-${name}.png`});}};
try{
 await page.goto('http://127.0.0.1:5173/?smoke=1');await page.locator('[data-setting="preset"]').selectOption('low');await click('new');await mode('explore');
 const original=await page.evaluate(()=>{const g=window.__shrine.game;return {yaw:g.yaw,rotation:g.hero.root.rotation.y};});
 await page.keyboard.press('Tab');await mode('menu');assert.equal(await page.evaluate(()=>window.__shrine.game.ui.tab),'status');
 await page.locator('.menu-hero-canvas[data-ready="true"]').waitFor();assert.equal(await page.locator('#menu [data-action="menu:map"]').count(),0);await shot('status');
 const decoded=await page.evaluate(async()=>Promise.all(['supplies','horns','bodies','heads','feet','charms'].map(async name=>{const image=new Image();image.src='/ui/inventory/'+name+'.png';await image.decode();return {name,width:image.width,height:image.height};})));assert.ok(decoded.every(i=>i.width>=1500));check('new status menu, animated model preview and six original illustration atlases',decoded);
 // Keyboard moves between real controls and activates the chosen menu entry.
 await page.locator('.rpg-nav [data-action="menu:status"]').focus();await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'menu:items');await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>window.__shrine.game.ui.tab),'items');
 assert.equal(await page.locator('[data-action="item:herb"]').isDisabled(),true);
 await page.evaluate(()=>{const g=window.__shrine.game;g.state.hp=5;g.refreshMenu();});await click('item:herb');assert.equal(await page.evaluate(()=>window.__shrine.game.state.hp),43);assert.equal(await page.evaluate(()=>window.__shrine.game.state.inventory.herb),7);
 await click('item:herb');assert.equal(await page.evaluate(()=>window.__shrine.game.state.hp),50);assert.equal(await page.locator('[data-action="item:herb"]').isDisabled(),true);
 await click('select-item:nectar');await shot('items');await click('select-item:remedy');assert.equal(await page.locator('[data-action="item:remedy"]').isDisabled(),true);check('illustrated inventory, keyboard selection, accurate healing and no waste at full HP');
 await page.evaluate(()=>{const g=window.__shrine.game;g.state.owned.push('body0','body2','horn3');});await click('menu:equipment');await click('select-slot:body');await click('select-gear:body2');assert.ok((await page.locator('.gear-compare').innerText()).includes('＋6'));
 await click('equip:body2');assert.equal(await page.evaluate(()=>window.__shrine.game.state.equipment.body),'body2');
 await page.waitForFunction(()=>window.__shrine.game.ui.deck.preview.signature.includes(window.__shrine.game.hero.equipment[0].uuid));
 await shot('equipment');await click('equipment-mode:appearance');await click('select-gear:body0');await click('look:body0');assert.equal(await page.evaluate(()=>window.__shrine.game.state.equipment.body),'body2');assert.equal(await page.evaluate(()=>window.__shrine.game.state.appearance.body),'body0');
 await click('hide:body');assert.equal(await page.evaluate(()=>window.__shrine.game.state.appearance.body),'hidden');await click('look:body0');
 const angle=await page.evaluate(()=>window.__shrine.game.ui.deck.preview.angle);await click('preview:0.55');assert.ok((await page.evaluate(()=>window.__shrine.game.ui.deck.preview.angle))>angle+.5);
 await click('equipment-mode:stats');await click('unequip:body');assert.equal(await page.evaluate(()=>window.__shrine.game.state.equipment.body),undefined);await click('equip:body0');
 check('slot filtering, full stat comparison, equipping, independent appearance, removal and model rotation');
 await page.keyboard.press('Escape');await mode('explore');assert.deepEqual(await page.evaluate(()=>{const g=window.__shrine.game;return {yaw:g.yaw,rotation:g.hero.root.rotation.y};}),original);check('closing the preview preserves the actual hero and exploration camera direction');
 await page.evaluate(async()=>{const g=window.__shrine.game,{awardXP,xpToLevel}=await import('/src/rpg.js');awardXP(g.state,xpToLevel(10));});
 await page.keyboard.press('Tab');await click('menu:skills');await click('sp:body:4');assert.equal(await page.evaluate(()=>window.__shrine.game.state.trees.body),0);await click('sp-back:body:1');assert.equal(await page.evaluate(()=>window.__shrine.game.skillDraft.trees.body),3);await click('sp-next:body');assert.equal(await page.evaluate(()=>window.__shrine.game.skillDraft.trees.body),4);await shot('skills');await click('sp-confirm');assert.equal(await page.evaluate(()=>window.__shrine.game.state.trees.body),4);await click('sp:body:4');await click('sp-cancel');assert.equal(await page.evaluate(()=>window.__shrine.game.skillDraft.trees.body),4);
 for(const tree of ['guard','sun','wind']){await click('select-tree:'+tree);assert.equal(await page.locator('.skill-nodes button').count(),8);}check('four skill paths, staged unlocks, refunding only draft points and explicit confirmation');
 await click('menu:settings');await page.locator('[data-setting="preset"]').selectOption('high');await page.locator('[data-setting="preset"]').selectOption('low');await click('settings-page:sound');await page.locator('[data-setting="music"]').fill('0.4');await page.locator('[data-setting="music"]').dispatchEvent('change');assert.equal(await page.evaluate(()=>window.__shrine.game.settings.music),.4);await page.keyboard.press('Escape');await mode('explore');
 await page.evaluate(()=>{window.__shrine.game.npc('shop');});await mode('dialogue');await click('dialog-choice:shop');await mode('menu');await page.locator('[data-action="select-shop:salve"]').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'select-shop:nectar');await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'buy:nectar');const gold=await page.evaluate(()=>window.__shrine.game.state.gold);await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>window.__shrine.game.state.gold),gold-35);await page.keyboard.press('Escape');check('grouped settings persist and the illustrated shop completes a real purchase');
 await page.keyboard.press('Tab');
 for(const viewport of [{width:1440,height:900},{width:1024,height:640}]){
  await page.setViewportSize(viewport);
  for(const tab of ['status','items','equipment','skills','quest','settings']){
   await click('menu:'+tab);const fits=await page.locator('.rpg-shell').evaluate(el=>{const r=el.getBoundingClientRect(),c=el.querySelector('.rpg-content');return r.width>=Math.min(1340,innerWidth-60)-1&&r.x>=0&&r.y>=0&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5&&c.scrollWidth<=c.clientWidth+2;});assert.equal(fits,true,`${tab} fits ${viewport.width}`);
  }
 }
 await page.keyboard.press('KeyM');assert.equal(await page.evaluate(()=>window.__shrine.game.ui.tab),'map');await page.keyboard.press('KeyM');await mode('explore');await page.locator('#minimap').waitFor({state:'visible'});check('all menu sections fit desktop and 1024×640; M map and passive minimap remain independent');
 await page.keyboard.press('Tab');await click('menu:quest');assert.equal(await page.locator('[data-action^="manual-save:"]').count(),3);await click('manual-save:1');assert.ok((await page.locator('[data-action="manual-save:1"]').innerText()).includes('上書きする'));await page.keyboard.press('Escape');
 await page.reload();await click('new');const warning=await page.locator('.warning-panel').innerText();assert.ok(warning.includes('オートセーブ')&&warning.includes('冒険の書に残っているデータは消えません'));await click('title-back');
 await click('continue');assert.equal(await page.locator('.title-save-list [data-action]').count(),2);assert.ok((await page.locator('[data-action="load:auto"]').innerText()).includes('オートセーブ'));assert.ok((await page.locator('[data-action="load:manual:1"]').innerText()).includes('冒険の書 1'));await click('load:manual:1');await mode('explore');assert.equal(await page.evaluate(()=>window.__shrine.game.state.trees.body),4);assert.equal(await page.evaluate(()=>window.__shrine.game.state.equipment.body),'body0');check('three adventure books save from journey log; title warning preserves books and continue chooser loads a book');
 await page.reload();await click('new');await click('new-confirm');await mode('explore');const reset=await page.evaluate(()=>{const g=window.__shrine.game,book=g.saves.loadManual(1);return {level:g.state.level,bookTree:book?.trees.body,bookBody:book?.equipment.body};});assert.deepEqual(reset,{level:1,bookTree:4,bookBody:'body0'});check('OK starts a new adventure, replaces autosave and leaves adventure-book data intact',reset);
 assert.deepEqual(errors,[]);check('no browser, image, skeleton or shader errors');
}finally{await fs.writeFile('artifacts/menu-results.json',JSON.stringify({date:new Date().toISOString(),checks,errors},null,2));await browser.close();}
