import {heroChoreography,HERO_CONTACT} from './hero-choreography.js';
import {BattleFX} from './battle-effects.js';
import {commandShot,actionShot} from './battle-camera.js';
import * as THREE from 'three';
import {BattleRules} from './battle-rules.js';
import {SKILLS} from './content.js';
import {monster,animateMonster,playMonster,disposeMonster} from './actors.js';
import {buildBattleEnvironment,disposeBattleEnvironment} from './battle-environment.js';
import {settleVictory,defeat} from './rpg.js';

const V=(x,y,z)=>new THREE.Vector3(x,y,z),ease=t=>t*t*(3-2*t),mix=(a,b,t)=>a.clone().lerp(b,ease(Math.max(0,Math.min(1,t))));
export class Combat{
 constructor(game,encounter){this.game=game;this.encounter=encounter;this.rules=new BattleRules(game.state,encounter.formation);if(encounter.scale)for(const e of this.rules.enemies){e.maxHP=Math.round(e.maxHP*encounter.scale);e.hp=e.maxHP;e.atk*=1+(encounter.scale-1)*.35;e.spirit*=1+(encounter.scale-1)*.35;}this.rules.reward.xp=encounter.xp||this.rules.reward.xp;this.root=new THREE.Group();game.view.scene.add(this.root);this.actors=new Map();this.homes=new Map();this.motionPhase='command';this.fx=new BattleFX(game.view.scene);this.fx.density=game.settings.particles;this.busy=false;this.elapsed=0;this.hitStop=0;this.savedPosition=game.hero.root.position.clone();this.savedRotation=game.hero.root.rotation.y;this.theme=game.world.config.theme;this.buildArena();game.world.setVisible(false);game.hero.root.position.set(-4,0,1.4);this.homes.set('hero',game.hero.root.position.clone());game.hero.face(3,0);game.hero.resetPose();game.hero.play('Battle_Idle');for(const e of this.rules.enemies)this.addActor(e);this.target=this.rules.target;game.audio.music(encounter.boss==='velga'||encounter.trial?'boss':'battle').catch(e=>game.reportAudio(e));game.audio.cue('encounter');game.audio.footsteps(false,this.theme);this.overview(true);}
 buildArena(){buildBattleEnvironment(this);}

 addActor(e){const m=monster(e.id),i=this.actors.size;m.position.set(3.4+(i%2)*1.1,0,(i-1)*3.5);m.rotation.y=-Math.PI/2;this.root.add(m);this.actors.set(e.actorId,m);this.homes.set(e.actorId,m.position.clone());}
 model(id){return id==='hero'?this.game.hero.root:this.actors.get(id);}
 overview(immediate=false){const pose=commandShot(this.homes.get('hero')||this.game.hero.root.position,[...this.actors.values()].filter(m=>m.visible).map(m=>m.position));this.restCamera=pose;this.cameraShake??=V(0,0,0);if(immediate){const camera=this.game.view.camera;camera.position.copy(pose.position);camera.lookAt(pose.target);camera.fov=pose.fov;camera.updateProjectionMatrix();this.cameraLook=pose.target.clone();}}
 moveCamera(pose,dt,response=7,shake=0){if(dt<=0)return;const c=this.game.view.camera,sm=1-Math.exp(-dt*response);c.position.sub(this.cameraShake);c.position.lerp(pose.position,sm);this.cameraLook.lerp(pose.target,sm);this.cameraShake.set(Math.sin(this.elapsed*121)*shake,Math.cos(this.elapsed*133)*shake*.5,0).multiplyScalar(this.game.settings.shake);c.position.add(this.cameraShake);c.lookAt(this.cameraLook);c.fov=THREE.MathUtils.lerp(c.fov,pose.fov??51,sm);c.updateProjectionMatrix();}

 async act(id,target=this.target){if(this.busy)return;const error=this.rules.validate(id);if(error){this.game.ui.toast(error);return;}this.busy=true;this.game.ui.battle(this);try{for(const event of this.rules.events(id,target)){await this.animate(event);this.game.ui.battle(this);if(this.rules.over)break;}this.rules.check();if(this.rules.over){await this.finish();return;}this.target=this.rules.alive().find(e=>e.actorId===this.target)?.actorId||this.rules.target;this.game.hero.play('Battle_Idle');this.overview();}finally{this.busy=false;if(this.game.combat===this)this.game.ui.battle(this);}}
 async animate(event){const g=this.game,hero=event.actor==='hero',source=this.model(event.actor),target=this.model(event.target)||source;if(!source||!target){event.apply();return;}const move=event.move,physical=event.kind==='physical',self=source===target;const ultimate=move==='drill',meteor=move==='meteor',big=event.big||event.kind==='phase';let duration=ultimate?4.2:meteor?3.6:big?2.8:physical?1.45:self?1.25:1.8;if(event.hit>0)duration=1.15;if(event.all&&event.target!==this.rules.alive()[0]?.actorId)duration=.65;
  const start=source.position.clone(),end=target.position.clone(),direction=end.clone().sub(start).setY(0).normalize(),side=V(-direction.z,0,direction.x),mid=start.clone().lerp(end,.5).add(V(0,1,0));const contact=end.clone().addScaledVector(direction,-(event.target==='hero'?1.2:this.rules.actor(event.target)?.boss?2.1:1.1));const landing=contact.clone().addScaledVector(direction,-.65);landing.x=THREE.MathUtils.clamp(landing.x,-8,8);landing.z=THREE.MathUtils.clamp(landing.z,-8,8);const originScale=source.scale.clone(),targetStart=target.position.clone();let applied=false,result,trailTimer=0,shake=0,authoredCue=false;g.ui.moveTitle(event.name||'');
  const windup=contact.clone().addScaledVector(direction,ultimate?-3.3:-1.12),authored=hero&&physical&&!self&&!meteor?heroChoreography(move,start.distanceTo(windup),g.hero.actions.get(ultimate?'HornDrill':'BodyBlow').getClip().duration):null;
  if(authored)duration=authored.duration;this.heroAction=authored?{clip:authored.clip,phase:0,impact:authored.impact,contactPhase:HERO_CONTACT[authored.clip]}:null;
  // Continue the rolling combo from its current position and camera, without a command-view reset.
  const rolling=hero&&move==='roll',cameraStart=rolling&&event.hit>0?{...this.restCamera,position:g.view.camera.position.clone().sub(this.cameraShake),target:this.cameraLook.clone(),fov:g.view.camera.fov}:this.restCamera;
  this.motionPhase='approach';this.focusTarget=hero?event.target:event.actor;if(hero){if(!self)g.hero.face(end.x,end.z);g.hero.play(authored?'Run':meteor?'Jump_Start':physical?'BodyBlow':event.kind==='guard'?'Guard':event.kind==='heal'?'Victory':'Guard',false,.09);}else{source.rotation.y=Math.atan2(direction.x,direction.z);playMonster(source,physical?'run':event.kind==='phase'?'phase':event.kind==='guard'?'guard':'cast',{duration:physical?undefined:duration,force:true});}
  if(!ultimate)this.fx.cast(event,start,direction);if(event.kind==='guard')g.audio.cue('guard');
  const impact=authored?authored.impact:ultimate?.64:meteor?.62:physical?.47:.56;
  await g.animate(duration, (raw,dt)=>{
   const p=raw;
   if(authored){const u=authored.phase(p),approaching=p*duration<authored.approach;this.heroAction.phase=u;this.motionPhase=approaching?'approach':u<HERO_CONTACT[authored.clip]?'windup':'impact';
    if(approaching){g.hero.play('Run',true,.08);source.position.lerpVectors(start,windup,authored.approachPhase(p));}
    else{if(ultimate&&!authoredCue){authoredCue=true;g.audio.cue('drill');this.fx.cast(event,windup,direction);}g.hero.sample(authored.clip,u);const hit=HERO_CONTACT[authored.clip],launch=ultimate?.24:.27;
     if(u<launch)source.position.copy(windup).addScaledVector(direction,-Math.sin(u/launch*Math.PI)*.14);
     else if(u<hit)source.position.copy(mix(windup,contact,(u-launch)/(hit-launch)));
     else source.position.copy(mix(contact,landing,(u-hit)/(1-hit)));
     if(u>launch&&u<hit){trailTimer+=dt;if(trailTimer>.055){this.fx.trail(event,source.position,direction);trailTimer=0;}}
    }
   }
   if(!hero&&physical&&p>=.19&&source.userData.monster.state==='run')playMonster(source,big?'heavy':'attack',{duration:duration*.8,force:true});if(physical&&!self&&!authored){let pos;if(meteor){if(p<.46){pos=start.clone();pos.y=Math.sin(p/.46*Math.PI*.5)*6;}else if(p<impact){pos=mix(start.clone().add(V(0,6,0)),contact,(p-.46)/(impact-.46));}else pos=mix(contact,landing,(p-impact)/(1-impact));}
    else if(p<.2){pos=start.clone().addScaledVector(direction,-Math.sin(p/.2*Math.PI)*.3);source.scale.y=originScale.y*(1-Math.sin(p/.2*Math.PI)*.08);}else if(p<impact){const u=(p-.2)/(impact-.2);pos=mix(start,contact,u);pos.addScaledVector(side,Math.sin(u*Math.PI)*(ultimate?1.4:.35));pos.y=Math.sin(u*Math.PI)*(ultimate?.7:.18);}else pos=mix(contact,landing,(p-impact)/(1-impact));source.position.copy(pos);
    if(meteor&&hero){if(p<.12)g.hero.sample('Jump_Start',p/.12);else if(p<.43)g.hero.play('Jump_Air',true,.04);else g.hero.sample('BodyBlow',(p-.43)/.43);}
    trailTimer+=dt;if(trailTimer>.065&&p>.25&&p<impact){this.fx.trail(event,source.position,direction);trailTimer=0;}
   }else if(!hero&&!self){source.position.copy(start).addScaledVector(direction,Math.sin(p*Math.PI)*.45);source.scale.y=originScale.y*(1+Math.sin(p*Math.PI)*.06);}
   if(!physical&&!self&&p>.22&&p<impact){const u=(p-.22)/(impact-.22);const projectile=mix(start.clone().add(V(0,1.1,0)),end.clone().add(V(0,1,0)),u);projectile.y+=Math.sin(u*Math.PI)*.8;trailTimer+=dt;if(trailTimer>.05){this.fx.trail(event,projectile,direction);trailTimer=0;}}
   if(!applied&&p>=impact){applied=true;this.motionPhase='impact';result=event.apply()||{};const at=(result.healTarget?this.model(result.healTarget):target).position.clone();this.fx.number(at,result);this.fx.impact(event,at,direction,result);if(authored)this.heroAction.impactSample={clip:g.hero.current,phase:authored.phase(p),time:g.hero.action.time};if(result.damage){g.audio.cue(event.kind==='physical'?'hit':event.kind);if(event.target==='hero')g.hero.play(g.state.hp<=0?'KO':'Hit',false,.06);else playMonster(target,this.rules.actor(event.target)?.hp<=0?'death':'hit',{duration:this.rules.actor(event.target)?.hp<=0?1:.48,force:true});shake=ultimate?.16:big?.12:.065;this.hitStop=ultimate||big?.09:.05;}else if(['heal','guard','buff','phase'].includes(event.kind))g.audio.cue(event.kind==='buff'?'phase':event.kind);g.ui.battleLog(result.text||event.name);for(const e of this.rules.enemies){if(!this.actors.has(e.actorId))this.addActor(e);}g.ui.battle(this);}
   if(applied&&result?.damage){const decay=Math.max(0,1-(p-impact)/.25);const recoil=.45*Math.sin(Math.min(1,(p-impact)/(1-impact))*Math.PI);target.position.copy(targetStart).addScaledVector(direction,recoil);target.rotation.z=Math.sin((p-impact)*30)*decay*.12;}
   const shot=actionShot({command:g.settings.camera==='reduced'?this.restCamera:cameraStart,start,end,actor:source.position,p,impact,ultimate,meteor,self,reduced:g.settings.camera==='reduced'});
   this.moveCamera(shot,dt,7,shake);shake*=Math.exp(-dt*13);
  },true);
  if(!applied)result=event.apply();source.scale.copy(originScale);source.rotation.z=0;target.rotation.z=0;target.position.copy(targetStart);if(hero)g.hero.resetPose();
  const fallen=this.rules.enemies.filter(e=>e.hp<=0&&this.actors.get(e.actorId)?.visible).map(e=>this.actors.get(e.actorId));if(fallen.length){for(const m of fallen)playMonster(m,'death',{duration:1});await g.animate(Math.max(.2,...fallen.map(m=>1-m.userData.monster.time)),()=>{},true);for(const m of fallen){this.fx.burst(m.position.clone().add(V(0,.8,0)),'#b4c9b5',20,.6);m.visible=false;}}
  const continueRoll=rolling&&event.hit+1<SKILLS.roll.hits&&this.rules.alive().length>0;
  if(continueRoll)return;
  if(physical&&!self)await this.returnHome(event.actor);else source.position.copy(this.homes.get(event.actor)||start);
  if(!hero)playMonster(source,'idle');this.focusTarget=null;g.ui.moveTitle('');this.motionPhase='command';
 }
 async returnHome(actorId){const g=this.game,actor=this.model(actorId),home=this.homes.get(actorId);if(!actor||!home||actorId==='hero'&&g.state.hp<=0)return;
  const from=actor.position.clone(),distance=from.distanceTo(home);if(distance<.03)return;this.motionPhase='return';this.returningActor=actorId;
  const delta=home.clone().sub(from),side=V(-delta.z,0,delta.x).normalize();actor.rotation.y=Math.atan2(delta.x,delta.z);if(actorId==='hero')g.hero.play('Run',true,.08,1.15);else playMonster(actor,'run');
  await g.animate(THREE.MathUtils.clamp(distance/7.8,.3,1.3),(t,dt)=>{actor.position.lerpVectors(from,home,t);actor.position.addScaledVector(side,Math.sin(t*Math.PI)*.35);if(actorId!=='hero')actor.position.y=home.y+Math.abs(Math.sin(t*Math.PI*5))*.1;this.moveCamera(this.restCamera,dt,5);},true);
  actor.position.copy(home);this.returningActor=null;if(actorId==='hero'){g.hero.play('Battle_Idle',true,.13);const enemy=this.model(this.target)||this.model(this.rules.alive()[0]?.actorId);if(enemy)g.hero.face(enemy.position.x,enemy.position.z);}else{actor.rotation.y=Math.atan2(g.hero.root.position.x-home.x,g.hero.root.position.z-home.z);playMonster(actor,'idle');}
 }

 update(dt){const target=this.model(this.focusTarget&&this.focusTarget!=='hero'?this.focusTarget:this.target)||this.model(this.rules.alive()[0]?.actorId);if(target&&!this.rules.over&&this.returningActor!=='hero')this.game.hero.face(target.position.x,target.position.z);for(const [id,m] of this.actors)if(m.visible&&id!==this.returningActor)m.rotation.y=Math.atan2(this.game.hero.root.position.x-m.position.x,this.game.hero.root.position.z-m.position.z);this.elapsed+=dt;this.game.assets.time.value+=dt;this.fx.update(dt);for(const [id,m]of this.actors)if(m.visible)animateMonster(m,this.hitStop>0?0:dt);if(!this.busy)this.moveCamera(this.restCamera,dt,5);}

 async finish(){const g=this.game,outcome=this.rules.over;if(outcome==='victory'){
   this.result??=settleVictory(g.state,this.encounter,this.rules.reward);
   const report={...this.result,rounds:this.rules.round,enemies:this.rules.enemies.map(e=>e.name)};
   g.ui.endBattle();g.keys.clear();g.audio.cue('win');g.audio.music('results').catch(e=>g.reportAudio(e));g.hero.play('Victory',true);this.motionPhase='victory';
   const p=g.hero.root.position.clone();g.hero.root.rotation.y=.35;
   await g.animate(1,(t)=>g.cinematicCamera(p.clone().add(V(1.9,1.8,5.8)),p.clone().add(V(1.8,1,0))));
   g.state.location={zone:g.world.zone,x:this.savedPosition.x,z:this.savedPosition.z};g.saves.save(g.state);
   g.mode='results';if(report.sp)g.audio.cue('level');await g.ui.showResult(report);g.mode='transition';g.ui.transition(true);await g.animate(.2,()=>{});g.ui.hideResult();
  }
  else if(outcome==='defeat'){
   this.motionPhase='defeat';g.keys.clear();g.ui.endBattle();g.audio.fadeMusic(.9);if(g.hero.current!=='KO')g.hero.play('KO',false,.08);const p=g.hero.root.position.clone();
   await g.animate(2.1,(t)=>{g.cinematicCamera(p.clone().add(V(3.3,1.9,4.4)),p.clone().add(V(0,.45,0)));});
   // The defeat screen waits for the player's acknowledgement while the fallen pose stays visible.
   g.mode='defeat';await g.ui.showDefeat(g.state.gold-Math.floor(g.state.gold*.9));g.mode='cinematic';g.ui.transition(true);await g.animate(.4,()=>{});g.ui.hideDefeat();defeat(g.state);
  }
  this.dispose();g.camera(true);g.ui.transition(false);await g.battleFinished(this.encounter,outcome);
 }

 dispose(){for(const m of this.actors.values())disposeMonster(m);this.fx.clear();disposeBattleEnvironment(this.root);this.root.removeFromParent();this.game.hero.root.position.copy(this.savedPosition);this.game.hero.root.rotation.y=this.savedRotation;this.game.hero.resetPose();this.game.hero.play('Idle');this.game.world.setVisible(true);this.game.ui.endBattle();}
}
