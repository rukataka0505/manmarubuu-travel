import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {ITEMS,EQUIPMENT} from '../src/content.js';
import {createState,awardXP,xpToLevel,allocate,stats} from '../src/rpg.js';
import {itemUseInfo,equipmentComparison,undoPoints,nextSkill} from '../src/menu-model.js';
import {MENU_ART} from '../src/menu-art.js';

test('all five consumables and 36 equipment pieces have distinct, local illustration cells',()=>{
 const cells=new Set();for(const id of [...Object.keys(ITEMS),...Object.keys(EQUIPMENT)]){const art=MENU_ART[id];assert.ok(art,id);assert.ok(existsSync(`public/ui/inventory/${art.sheet}.png`));const cell=art.sheet+':'+art.index;assert.ok(!cells.has(cell),id+' reuses another object illustration');cells.add(cell);}assert.equal(cells.size,41);
});
test('inventory recovery previews cap at missing HP/MP and refuse waste outside combat',()=>{
 const s=createState();assert.match(itemUseInfo(s,'herb').reason,/満タン/);s.hp=5;assert.equal(itemUseInfo(s,'herb').amount,38);s.hp=stats(s).hp-2;assert.equal(itemUseInfo(s,'herb').amount,2);s.mp=0;assert.equal(itemUseInfo(s,'nectar').amount,14);assert.match(itemUseInfo(s,'remedy').reason,/戦闘/);s.inventory.bell=0;assert.match(itemUseInfo(s,'bell').reason,/持って/);
});
test('equipment comparison removes the previous item and leaves actual equipment and appearance untouched',()=>{
 const s=createState();s.equipment.body='body5';s.appearance.body='body2';const before=structuredClone(s),rows=equipmentComparison(s,'body2');assert.equal(rows.find(r=>r.key==='hp').delta,-30);assert.equal(rows.find(r=>r.key==='def').delta,-26);assert.equal(rows.find(r=>r.key==='speed').delta,6);assert.deepEqual(s,before);
});
test('undoing draft skill points cannot refund previously learned skills or change saved progression',()=>{
 const s=createState();awardXP(s,xpToLevel(10));allocate(s,'body',4);const draft=structuredClone(s),sp=draft.sp;allocate(draft,'body',10);assert.equal(undoPoints(s,draft,'body',99),true);assert.equal(draft.trees.body,4);assert.equal(draft.sp,sp);assert.equal(undoPoints(s,draft,'body',1),false);assert.equal(s.trees.body,4);assert.equal(nextSkill(draft,'body').id,'atk4');
});
