// Produce a transparent UI asset from the actual playable Blender derivative.
import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();page.on('pageerror',e=>console.error(e.message));
 await page.goto('http://127.0.0.1:5173/');await page.locator('[data-setting="preset"]').selectOption('low');await page.locator('[data-action="new"]').click();
 await page.waitForFunction(()=>window.__shrine?.game.mode==='explore',{},{timeout:90000});
 const data=await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js'),{clone}=await import('/node_modules/three/examples/jsm/utils/SkeletonUtils.js'),g=window.__shrine.game;
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(600,760);renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  const scene=new T.Scene();scene.add(new T.HemisphereLight('#fff6de','#8aafb5',2.4));for(const [x,y,z,color,power]of [[-3,4,5,'#ffefd8',2.5],[3,2,-2,'#c4eaff',1.6]]){const l=new T.DirectionalLight(color,power);l.position.set(x,y,z);scene.add(l);}
  const model=clone(g.hero.root);model.position.set(0,0,0);model.rotation.set(0,-.22,0);model.children[0].rotation.set(0,0,0);model.children[0].position.set(0,0,0);model.children[0].scale.setScalar(1);model.children[1].visible=false;
  model.traverse(o=>{if(o.isMesh){const entry=g.hero.lods.get(o.name);if(entry)o.geometry=entry.geometries[0];if(o.name.startsWith('FurLOD_'))o.visible=true;}});scene.add(model);
  const rig=model.children[0].children[0],mixer=new T.AnimationMixer(rig);mixer.clipAction(g.hero.actions.get('Idle').getClip()).play();mixer.update(.4);
  const camera=new T.PerspectiveCamera(29,600/760,.05,15);camera.position.set(0,2.1,4.85);camera.lookAt(0,.88,0);renderer.render(scene,camera);const url=renderer.domElement.toDataURL('image/png');renderer.dispose();return url.split(',')[1];
 });
 await fs.mkdir('public/ui',{recursive:true});await fs.writeFile('public/ui/manmarubuu-portrait.png',Buffer.from(data,'base64'));console.log('PORTRAIT_EXPORTED');
}finally{await browser.close();}
