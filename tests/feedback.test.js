import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {characterMaterialRole} from '../src/character-materials.js';
import {Terrain} from '../src/terrain.js';
import {createState,defeat,stats} from '../src/rpg.js';

test('actual GLB ear and hand materials never match the cocoa eye role by a Blender duplicate suffix',()=>{
 const bytes=fs.readFileSync(new URL('../public/models/manmarubuu-shrine.glb',import.meta.url)),json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
 const parts=json.nodes.filter(n=>n.mesh!==undefined&&/^(Ear\.|Hoof.hand\.)/.test(n.name));assert.equal(parts.length,4);
 for(const part of parts)for(const primitive of json.meshes[part.mesh].primitives){const mat=json.materials[primitive.material];assert.notEqual(characterMaterialRole(mat.name),'eyes',part.name+' / '+mat.name);}
 assert.equal(characterMaterialRole('06 · Cocoa satin-stitch closed eyes'),'eyes');assert.equal(characterMaterialRole('02 · Dusty rose cotton | snout, ears, hooves.006'),'pink');
});
test('expanded playable maps join continuous countryside heights without a floating-tree height constant',()=>{
 for(const zone of ['village','forest']){const t=new Terrain(zone),[w,d]=t.config.authoredSize;assert.ok(t.config.size[0]>w*1.5);for(const [x,z]of [[w/2,0],[-w/2,20],[20,d/2],[0,-d/2]]){assert.ok(Math.abs(t.height(x-.001,z)-t.height(x+.001,z))<.01);assert.ok(Math.abs(t.height(x,z-.001)-t.height(x,z+.001))<.01);}
  const values=[];for(let x=-500;x<=500;x+=25)for(let z=-500;z<=500;z+=25){const y=t.height(x,z);assert.ok(Number.isFinite(y));values.push(y);}assert.ok(Math.max(...values)-Math.min(...values)>25);
 }
});
test('defeat returns to the village and preserves earned progress while restoring health',()=>{
 const s=createState();s.hp=0;s.mp=0;s.gold=123;s.safe={zone:'cave',x:3,z:20};s.story.towerActivated=true;s.chests=['village-gift'];const owned=[...s.owned],xp=s.xp;defeat(s);assert.deepEqual(s.location,{zone:'village',x:0,z:30});assert.equal(s.gold,110);assert.equal(s.hp,stats(s).hp);assert.equal(s.mp,stats(s).mp);assert.equal(s.story.towerActivated,true);assert.deepEqual(s.chests,['village-gift']);assert.deepEqual(s.owned,owned);assert.equal(s.xp,xp);
});
