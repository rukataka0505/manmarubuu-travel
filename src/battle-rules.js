import {ENEMIES,SKILLS,ITEMS,ACTION_NAMES} from './content.js';
import {stats,learned,useItem,clamp,speedEvadeBonus} from './rpg.js';

// A packet applies its result once, at the cinematic impact. No scene objects live here.
function packet(data,apply){let done=false,result;return {...data,apply(){if(!done){result=apply();done=true;}return result;}};}
const combinedMissChance=(blind,evade)=>1-(1-clamp(blind,0,1))*(1-clamp(evade,0,1));
export class BattleRules{
 constructor(state,formation,rng=Math.random){this.state=state;this.rng=rng;this.round=0;this.serial=0;this.hero={actorId:'hero',status:{},guard:null};this.enemies=formation.map(id=>this.spawn(id));this.reward={xp:this.enemies.reduce((n,e)=>n+e.xp,0),gold:this.enemies.reduce((n,e)=>n+e.gold,0)};this.boss=this.enemies.some(e=>e.boss);this.charge=0;this.ready=0;this.over=null;this.groupCharge=0;this.log=[];if(!state.tutorialDrill&&state.story.requestAccepted){this.addCharge(100);state.tutorialDrill=true;this.tutorial=true;}}
 spawn(id,scale=1){const d=ENEMIES[id];if(!d)throw Error(`Unknown enemy ${id}`);return {...d,actorId:`enemy-${++this.serial}`,hp:Math.round(d.hp*scale),maxHP:Math.round(d.hp*scale),status:{},last:'',cooldowns:{},phase:1,pending:null};}
 alive(){return this.enemies.filter(e=>e.hp>0);}
 get target(){return this.alive()[0]?.actorId;}
 actor(id){return id==='hero'?this.hero:this.enemies.find(e=>e.actorId===id);}
 cost(id){let n=SKILLS[id]?.mp||0;const s=stats(this.state);if(SKILLS[id]?.tree==='body'&&s.passives.includes('bodyMaster'))n=Math.max(1,n-1);if(SKILLS[id]?.tree==='sun'&&s.passives.includes('sunMaster'))n=Math.max(1,Math.ceil(n*.8));return n;}
 validate(id){if(this.over)return '戦闘は終了している。';if(this.hero.status.sleep)return id==='wait'?null:'眠っている。';if(id==='escape')return this.boss?'この戦いからは逃げられない。':null;if(id.startsWith('item:')){const key=id.slice(5);return ITEMS[key]&&!ITEMS[key].return&&this.state.inventory[key]>0?null:'この道具は使えない。';}const skill=SKILLS[id];if(!skill||skill.passive)return 'その特技は使えない。';if(skill.tree&&!learned(this.state).includes(id))return 'まだ習得していない。';if(id==='drill')return this.ready>0&&this.charge===100?null:'チャージ100で使える。';if(this.cost(id)>this.state.mp)return 'MPが足りない。';if(this.cost(id)>0&&this.hero.status.seal)return 'MPを封じられている。';return null;}
 addCharge(n,enemy=false){if(enemy){n=Math.min(n,30-this.groupCharge);this.groupCharge+=n;}if(this.charge>=100)return;this.charge=Math.min(100,this.charge+n);if(this.charge===100)this.ready=3;}
 setStatus(actor,key,turns){actor.status[key]=Math.max(actor.status[key]||0,turns);}
 effective(actor,key){const n=actor===this.hero?stats(this.state)[key]:actor[key];const s=actor.status,up=s[key+'Up']?(key==='speed'?1.5:1.25):1;return n*up*(s[key+'Down']?.8:1)*(key==='def'&&s.open?.55:1)*(key==='def'&&actor.id==='garm'&&actor.phase===2?.7:1);}
 tick(actor,old){for(const [k,v]of Object.entries(old)){if(actor.status[k]===v&&--actor.status[k]<=0)delete actor.status[k];}}
 choose(e){if(e.pending){const move=e.pending;e.pending=null;return move;}if(e.id==='velga'&&e.phase===2&&this.round%3===0)return 'charge';if(e.id==='garm'&&e.phase===2&&this.round%2===0)return 'double';const hurt=this.alive().find(a=>a.hp<a.maxHP*.5);if(e.moves.includes('heal')&&hurt&&this.round-(e.cooldowns.heal||-10)>=3){e.cooldowns.heal=this.round;return 'heal';}let options=e.moves.filter(m=>m!=='heal'&&m!==e.last);options=options.filter(m=>!['charge','spores'].includes(m)||!this.majorPlanned);if(this.hero.status.sleepImmune||this.hero.status.sleep)options=options.filter(m=>m!=='spores');if(!options.length)options=['attack'];let move=options[Math.floor(this.rng()*options.length)];if(['charge','spores'].includes(move))this.majorPlanned=true;e.last=move;return move;}
 check(){if(this.state.hp<=0)this.over='defeat';else if(!this.alive().length)this.over='victory';if(this.over){this.charge=0;this.ready=0;this.hero.status={};}}
 *events(id,targetId){const error=this.validate(id);if(error)throw Error(error);this.round++;this.groupCharge=0;this.guardedBig=false;this.dodgeCharge=false;this.hitForCounter=null;this.hero.guard=null;this.majorPlanned=this.alive().some(e=>e.pending);const heroStats=stats(this.state);
  if(id==='escape'){yield packet({actor:'hero',target:'hero',move:'escape',name:'にげる',kind:'escape'},()=>{this.over='escape';this.charge=0;this.ready=0;return {text:'うまく逃げきった！'};});return;}
  const order=[{actor:this.hero,priority:SKILLS[id]?.priority||(id.startsWith('item:')?2:0),speed:this.effective(this.hero,'speed')},...this.alive().map(e=>({actor:e,priority:0,speed:this.effective(e,'speed')}))].sort((a,b)=>b.priority-a.priority||b.speed-a.speed);
  for(const {actor}of order){if(this.over)break;if(actor!==this.hero&&actor.hp<=0)continue;const old={...actor.status};
   if(actor===this.hero){
    if(actor.status.sleep){yield packet({actor:'hero',target:'hero',move:'sleep',name:'眠っている…',kind:'status'},()=>{delete actor.status.sleep;this.setStatus(actor,'sleepImmune',2);return{text:'まんまるぶうは目を覚ました。'};});}
    else {const readyBefore=this.ready;
     if(id.startsWith('item:')){const key=id.slice(5);yield packet({actor:'hero',target:'hero',move:'item',name:ITEMS[key].name,kind:'heal'},()=>{const before=this.state.hp;useItem(this.state,key,actor.status);return{heal:this.state.hp-before,text:ITEMS[key].name+'を使った。'};});}
     else {const skill=SKILLS[id];this.state.mp-=this.cost(id);if(id==='drill'){this.charge=0;this.ready=0;}yield* this.heroAction(id,skill,targetId);}
     if(id!=='drill'){if(readyBefore>0){this.ready--;if(!this.ready)this.charge=0;}else this.addCharge(8);}
    }
    if(actor.status.poison&&this.state.hp>1){yield packet({actor:'hero',target:'hero',move:'poisonTick',name:'毒の痛み',kind:'status'},()=>{const damage=Math.min(this.state.hp-1,Math.max(1,Math.floor(heroStats.hp*.05)));this.state.hp-=damage;return{damage,text:'毒がからだをむしばむ。'};});}
   } else {
    const move=this.choose(actor);yield* this.enemyAction(actor,move);
    // The second boss action is a modest strike, never another control/big move.
    if(!this.over&&actor.id==='velga'&&actor.phase===2&&actor.hp>0&&move!=='slam'&&move!=='sleep'&&move!=='seal')yield* this.enemyAction(actor,'attack',.65);
   }
   this.tick(actor,old);this.check();
   for(const e of this.alive())if(e.boss&&e.phase===1&&e.hp<=e.maxHP*.5){yield packet({actor:e.actorId,target:e.actorId,move:'phase',name:e.id==='garm'?'岩鎧が砕けた！':'封じられた力が目覚める',kind:'phase'},()=>{e.phase=2;delete e.status.defUp;const spawned=[];if(e.id==='velga'){for(const id of ['sentinel','priest'])if(this.alive().length<3){const a=this.spawn(id,.68);a.atk*=.65;a.spirit*=.65;this.enemies.push(a);spawned.push(a.actorId);}}return{spawned,text:e.id==='garm'?'守備が下がり、二連撃が増える！':'影の眷属が現れた！ 次のターンから行動する。'};});}
  }
  if(!this.over&&this.hero.guard?.counter&&this.hitForCounter){const e=this.enemies.find(e=>e.actorId===this.hitForCounter&&e.hp>0)||this.alive()[0];if(e)yield this.heroHit('counter',{power:.8,kind:'physical'},e);this.check();}
  if(!this.over&&heroStats.charge&&this.groupCharge>0)this.addCharge(heroStats.charge,true);
  this.hero.guard=null;
 }
 *heroAction(id,skill,targetId){
  if(['guard','heal','buff'].includes(skill.kind)){yield packet({actor:'hero',target:'hero',move:id,name:skill.name,kind:skill.kind},()=>{const a=stats(this.state),before=this.state.hp;if(skill.heal)this.state.hp=Math.min(a.hp,this.state.hp+Math.round((a.hp*skill.heal+a.spirit*(skill.spiritHeal||0))*(a.passives.includes('healing15')&&skill.tree==='sun'?1.15:1)));if(skill.cleanse){delete this.hero.status.poison;delete this.hero.status.blind;}if(skill.kind==='guard')this.hero.guard=skill;if(skill.status)this.setStatus(this.hero,skill.status,skill.turns);return{heal:this.state.hp-before,text:skill.name+'！'};});return;}
  if(skill.all){for(const e of this.alive()){yield this.heroHit(id,skill,e);this.check();}return;}
  for(let i=0;i<(skill.hits||1);i++){const alive=this.alive();if(!alive.length)break;let target=skill.random?alive[Math.floor(this.rng()*alive.length)]:alive.find(e=>e.actorId===targetId)||alive[0];const cover=this.alive().find(e=>e!==target&&e.status.cover);if(cover&&!skill.ultimate)target=cover;yield this.heroHit(id,skill,target,i);this.check();}
 }
 heroHit(id,skill,e,hit=0){return packet({actor:'hero',target:e.actorId,move:id,name:skill.name||ACTION_NAMES[id],kind:skill.kind,hit,all:skill.all},()=>{
  if(e.hp<=0)return {text:'対象は倒れている。'};if(skill.kind==='status'){const success=this.rng()<(e.boss?.5:.8);if(success)this.setStatus(e,skill.status,skill.turns);return{status:success?skill.status:null,text:success?`${e.name}を幻惑した！ 5ターンのあいだ、攻撃が50%で外れる！`:`${e.name}には砂けむりが効かなかった。`};}
  const a=stats(this.state),physical=skill.kind==='physical',blindChance=this.hero.status.blind?.5:0,evadeChance=physical?speedEvadeBonus(this.effective(e,'speed'))+(e.status.evade?.25:0):0;const miss=!skill.ultimate&&this.rng()<combinedMissChance(blindChance,evadeChance);if(miss)return{miss:true,text:blindChance?'まんまるぶうは幻惑され、狙いを外した！':'攻撃をかわされた！'};
  const crit=physical&&!skill.ultimate&&this.rng()<a.crit;let attack=physical?this.effective(this.hero,'atk'):a.spirit+8;let defense=this.effective(e,'def')*(skill.ultimate?.6:1);let value=Math.max(5,attack*(physical?1.25:1.35)-defense*(physical?.55:.18));value*=skill.power||1;value*=.94+this.rng()*.12;if(crit)value*=1.5;
  if(e.weak===skill.kind)value*=1.35;value*=e.resist[skill.kind]||1;if(e.status.reflect&&skill.kind==='light')value*=.45;
  if(skill.tree==='body'&&a.passives.includes('bodyMaster'))value*=1.15;if(skill.kind==='light')value*=1+a.light+(a.passives.includes('sunMaster')?.15:0);if(skill.kind==='wind')value*=1+a.wind+(a.passives.includes('windMaster')?.15:0);
  const damage=Math.max(1,Math.round(value));e.hp=Math.max(0,e.hp-damage);if(skill.debuff&&this.rng()<(e.boss?.5:.8))this.setStatus(e,skill.debuff,2);if(skill.ultimate&&!e.boss){e.pending=null;delete e.status.defUp;delete e.status.reflect;}return{damage,crit,weak:e.weak===skill.kind,text:`${e.name}に ${damage} ダメージ！`};
 });}
 *enemyAction(e,move,multiplier=1){const actor=e.actorId;const buffs={shell:['defUp',2],burrow:['defUp',2],evade:['evade',2],rally:['atkUp',3],cover:['cover',2],reflect:['reflect',2]};
  if(move==='charge'||move==='spores'||buffs[move]||move==='heal'){yield packet({actor,target:actor,move,name:ACTION_NAMES[move],kind:move==='heal'?'heal':'buff'},()=>{if(move==='charge'||move==='spores'){e.pending=move==='charge'?'slam':'sleep';return{text:move==='charge'?'次の行動で大技！ 防御の準備を。':'胞子がふくらんでいる…'};}if(move==='heal'){const target=this.alive().sort((a,b)=>a.hp/a.maxHP-b.hp/b.maxHP)[0],before=target.hp;target.hp=Math.min(target.maxHP,target.hp+Math.round(target.maxHP*.25));return{heal:target.hp-before,healTarget:target.actorId,text:`${target.name}が回復した。`};}const [k,t]=buffs[move];this.setStatus(e,k,t+1);return{status:k,text:ACTION_NAMES[move]+'！'};});return;}
  const elemental=['wind','fire','shadow','seal','slow','weaken'].includes(move),kind=elemental?(move==='wind'?'wind':move==='fire'?'fire':'shadow'):'physical';
  yield packet({actor,target:'hero',move,name:ACTION_NAMES[move],kind,big:move==='slam',hits:move==='double'?2:1},()=>{
   const a=stats(this.state);let damage=0;let dodge=false;const physical=kind==='physical',blindChance=e.status.blind?.5:0,evadeChance=physical?(a.evade+speedEvadeBonus(this.effective(this.hero,'speed'))+(this.hero.status.evade?.25:0)):0;const chance=combinedMissChance(blindChance,evadeChance);if(move!=='sleep'&&this.rng()<chance)dodge=true;
   if(!dodge&&move!=='sleep'){let value=Math.max(4,(physical?this.effective(e,'atk'):e.spirit)*.78-this.effective(this.hero,'def')*(physical?.32:.12));value*=move==='slam'?2.25:move==='double'?1.45:move==='heavy'?1.35:['seal','weaken','slow'].includes(move)?.55:1;value*=multiplier*(.94+this.rng()*.12);const g=this.hero.guard;let reduction=g?(g.reduction||(physical?g.physical:g.elemental)||0):0;if(a.passives.includes('guardMaster'))reduction=1-(1-reduction)*.9;value*=1-Math.min(.75,reduction);value*=1-(a[kind+'Resist']||0);damage=Math.max(1,Math.round(value));this.state.hp=Math.max(0,this.state.hp-damage);this.hitForCounter=actor;this.addCharge(Math.min(25,8+Math.floor(30*damage/a.hp)),true);if(g&&move==='slam'&&!this.guardedBig){this.addCharge(15,true);this.guardedBig=true;}if(move==='drain')e.hp=Math.min(e.maxHP,e.hp+Math.floor(damage*.6));}
   if(dodge&&a.passives.includes('windMaster')&&!this.dodgeCharge){this.addCharge(5,true);this.dodgeCharge=true;}
   const status=({poison:'poison',sleep:'sleep',seal:'seal',slow:'speedDown',weaken:'atkDown'})[move];let applied=null;if(status&&!dodge&&!(status==='sleep'&&this.hero.status.sleepImmune)){const chance=.65*(1-(a[status+'Resist']||0))*(a.passives.includes('guardMaster')?.8:1);if(this.rng()<chance){this.setStatus(this.hero,status,status==='sleep'?1:status==='poison'?3:2);applied=status;}}
   if(move==='slam')this.setStatus(e,'open',2);
   return {damage,miss:dodge,status:applied,text:dodge?(blindChance?`${e.name}は幻惑で狙いを外した！`:'ひらりとかわした！'):move==='sleep'?(applied?'まんまるぶうは眠ってしまった。':'眠りをこらえた！'):`まんまるぶうに ${damage} ダメージ！`};
  });this.check();
 }
}
