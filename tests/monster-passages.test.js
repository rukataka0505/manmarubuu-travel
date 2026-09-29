import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MONSTER_CATALOG,MONSTER_MOTIONS} from '../src/monster-catalog.js';
import {ENEMIES} from '../src/content.js';
import {PASSAGES,passageGeometry,passageApproach,crossedPassage} from '../src/passages.js';

test('every enemy and boss resolves to a real skinned GLB with movement, attack, hit and death clips',()=>{
 assert.deepEqual(Object.keys(MONSTER_CATALOG).sort(),Object.keys(ENEMIES).sort());
 for(const [id,p]of Object.entries(MONSTER_CATALOG)){
  const raw=readFileSync(`public/monsters/${p.asset}.glb`);assert.equal(raw.readUInt32LE(0),0x46546c67);assert.equal(raw.readUInt32LE(8),raw.length);
  const gltf=JSON.parse(raw.subarray(20,20+raw.readUInt32LE(12)).toString());assert.ok(gltf.skins?.length,id+' has bones');assert.ok(gltf.meshes?.length,id+' has authored geometry');
  const names=gltf.animations.map(a=>a.name);for(const state of ['idle','walk','run','attack','hit','death'])assert.ok(MONSTER_MOTIONS[state].some(n=>names.includes(n)),id+':'+state);
  assert.ok(gltf.images.every(i=>i.bufferView!==undefined),id+' embeds its textures');
 }
 assert.notEqual(MONSTER_CATALOG.garm.asset,MONSTER_CATALOG.velga.asset);
});
test('all passage volumes are bounded, directional and leave the approach clear',()=>{
 for(const id of Object.keys(PASSAGES)){
  const portal={id,x:11,z:-22},p=passageGeometry(portal),before=passageApproach(portal,1);
  assert.equal(crossedPassage(portal,before),false,id+' approach');
  assert.equal(crossedPassage(portal,{x:p.x+p.nx*.4,z:p.z+p.nz*.4}),true,id+' enters');
  assert.equal(crossedPassage(portal,{x:p.x+p.nx*100,z:p.z+p.nz*100}),false,id+' far away');
  assert.equal(crossedPassage(portal,{x:p.x-p.nz*(p.halfWidth+1),z:p.z+p.nx*(p.halfWidth+1)}),false,id+' beside doorway');
 }
});
test('actual world portal declarations all have walking thresholds, including dungeon stairs and rescue shortcut',()=>{
 const source=readFileSync('src/world.js','utf8'),ids=[...source.matchAll(/this\.portal\('([^']+)'/g)].map(m=>m[1]);
 assert.ok(ids.length>=15);for(const id of ids)assert.ok(PASSAGES[id],id);
});
