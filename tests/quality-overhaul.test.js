import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EQUIPMENT} from '../src/content.js';
import {heroChoreography,HERO_CONTACT} from '../src/hero-choreography.js';
import {roadCenterline} from '../src/roads.js';
import {Terrain} from '../src/terrain.js';

const glb=path=>{const b=fs.readFileSync(new URL(path,import.meta.url));return JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());};
test('all 36 fitted equipment assets exist as offline meshes with distinct named roots',()=>{
 const g=glb('../public/models/manmarubuu-equipment.glb');
 for(const id of Object.keys(EQUIPMENT)){
  const node=g.nodes.find(n=>n.name===id);assert.ok(node?.children?.length,id+' has authored mesh children');
  const mesh=g.nodes.find(n=>n.name==='Fitted_'+id);assert.ok(g.meshes[mesh.mesh].primitives.length>=2,id+' preserves cloth, seams and metal materials');
 }
 assert.ok(g.materials.some(m=>m.name==='Ivory embroidery'));
});
test('original hero attack clip contact is synchronized regardless of approach distance',()=>{
 const g=glb('../public/models/manmarubuu-shrine.glb');
 for(const move of ['attack','rush','roll','break','drill'])for(const distance of [0,2,6,11]){
  const name=move==='drill'?'HornDrill':'BodyBlow',a=g.animations.find(a=>a.name===name),duration=Math.max(...a.samplers.map(s=>g.accessors[s.input].max[0]));
  const c=heroChoreography(move,distance,duration);assert.equal(c.phase(0),0);assert.ok(Math.abs(c.phase(1)-1)<1e-8);assert.ok(Math.abs(c.phase(c.impact)-HERO_CONTACT[name])<1e-8);assert.ok(c.duration>=duration+.18);assert.equal(c.clip,name);
 }
});
test('forest vegetation and relief use the same curved route as the road mesh',()=>{
 const t=new Terrain('forest');for(const path of t.config.paths){const curve=roadCenterline(path);for(const [x,z]of curve)assert.ok(t.pathDistance(x,z)<.001);}
 const curved=roadCenterline([[0,20],[0,0],[20,0]]);assert.ok(curved.some(([x,z])=>x<-.1||z<-.1),'a bend is smoothly eased, not two disconnected rectangles');
});
