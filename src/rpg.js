import { TREES, SKILLS, EQUIPMENT, ITEMS, MILESTONES, MILESTONE_XP } from './content.js';
export const SAVE_KEY='manmarubuu.sealed-shrine.v2';
export const MANUAL_SAVE_SLOTS=3;
export const manualSaveKey=slot=>`${SAVE_KEY}.adventure-book.${slot}`;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const speedEvadeBonus=speed=>Math.min(.15,.15*Math.log(1+Math.max(0,speed)/20)/Math.log(9));
export const xpNext=l=>20+12*l+4*l*l;
export const xpToLevel=l=>{const n=Math.max(0,Math.floor(l)-1);return 20*n+6*n*(n+1)+2*n*(n+1)*(2*n+1)/3;};
export const skillPointsForLevel=level=>level<=1?0:Math.min(10,4+Math.floor((level-1)/5));
export const totalSkillPoints=level=>{let total=0;for(let l=2;l<=Math.floor(level);l++)total+=skillPointsForLevel(l);return total;};
export function createState(){return {version:2,level:1,xp:0,hp:50,mp:16,gold:120,sp:0,trees:{body:0,guard:0,sun:0,wind:0},inventory:{herb:8,salve:1,nectar:3,remedy:3,bell:2},owned:[],equipment:{},appearance:{},story:Object.fromEntries(MILESTONES.map(k=>[k,false])),puzzles:{tower:[0,0,0],waterA:false,waterB:false},chests:[],defeated:[],trials:[],tutorialDrill:false,location:{zone:'village',x:0,z:30},safe:{zone:'village',x:0,z:30},playTime:0};}
export function learned(s){return Object.entries(TREES).flatMap(([tree,ids])=>ids.filter(id=>s.trees[tree]>=SKILLS[id].threshold));}
export function stats(s){const l=s.level-1,r={hp:50+10*l,mp:16+3*l,atk:12+3*l,def:6+2*l,speed:9+2*l,spirit:10+3*l,crit:.04,evade:.02,charge:0,wind:0,light:0,fireResist:0,shadowResist:0,sleepResist:0,poisonResist:0,sealResist:0,blindResist:0};
 for(const id of Object.values(s.equipment))for(const [k,v]of Object.entries(EQUIPMENT[id]?.stats||{}))r[k]=(r[k]||0)+v;
 const p=learned(s);for(const [id,k,v]of [['atk4','atk',4],['atk6','atk',6],['crit3','crit',.03],['hp20','hp',20],['hp30','hp',30],['def6','def',6],['spirit5','spirit',5],['mp12','mp',12],['speed5','speed',5],['evade5','evade',.05],['spirit8','spirit',8]])if(p.includes(id))r[k]+=v;
 r.passives=p;return r;}
export function awardXP(s,amount){const before=s.level;s.xp+=Math.max(0,Math.floor(amount));while(s.xp>=xpToLevel(s.level+1)){s.level++;s.sp+=skillPointsForLevel(s.level);}if(s.level>before)recover(s);return s.level-before;}
export function recover(s){const a=stats(s);s.hp=a.hp;s.mp=a.mp;}
export function allocate(s,tree,amount){amount=Math.floor(amount);if(!(tree in s.trees)||amount<=0||amount>s.sp||s.trees[tree]+amount>100)return false;s.trees[tree]+=amount;s.sp-=amount;return true;}
export function respec(s,tree){for(const k of tree?[tree]:Object.keys(s.trees)){if(!(k in s.trees))continue;s.sp+=s.trees[k];s.trees[k]=0;}clampVitals(s);}
export function clampVitals(s){const a=stats(s);s.hp=Math.min(s.hp,a.hp);s.mp=Math.min(s.mp,a.mp);}
export function equip(s,id,appearance=false){const e=EQUIPMENT[id];if(!e||!s.owned.includes(id))return false;(appearance?s.appearance:s.equipment)[e.slot]=id;clampVitals(s);return true;}
export function unequip(s,slot,appearance=false){if(!['horn','head','body','feet','charm'].includes(slot))return false;if(appearance)s.appearance[slot]='hidden';else {delete s.equipment[slot];delete s.appearance[slot];}clampVitals(s);return true;}
export function purchase(s,id){const it=ITEMS[id]||EQUIPMENT[id];if(!it||s.gold<it.price||(EQUIPMENT[id]&&s.owned.includes(id)))return false;s.gold-=it.price;if(ITEMS[id])s.inventory[id]=(s.inventory[id]||0)+1;else s.owned.push(id);return true;}
export function shopTier(){return 30;}
export function useItem(s,id,status){const it=ITEMS[id];if(!it||it.return||!(s.inventory[id]>0))return false;const a=stats(s);if(it.heal)s.hp=clamp(s.hp+Math.round(a.hp*it.heal+it.flat),0,a.hp);if(it.mp)s.mp=clamp(s.mp+Math.round(a.mp*it.mp+it.flat),0,a.mp);if(it.cure&&status)for(const k of ['poison','blind','seal'])delete status[k];s.inventory[id]--;return true;}
export function shrineOpen(s){return s.story.towerActivated&&s.story.crestRestored&&s.story.altarLit;}
export function milestone(s,id){if(!MILESTONES.includes(id)||s.story[id])return false;const rules={requestAccepted:()=>s.story.abductionKnown,towerActivated:()=>s.story.requestAccepted&&s.puzzles.tower.join(',')==='1,2,0',caveBossDefeated:()=>s.story.towerActivated,crestRestored:()=>s.story.caveBossDefeated,altarLit:()=>s.story.crestRestored&&s.puzzles.waterA&&s.puzzles.waterB,shrineEntered:()=>shrineOpen(s),shrineBossDefeated:()=>s.story.shrineEntered,lilyRescued:()=>s.story.shrineBossDefeated,homecomingCompleted:()=>s.story.lilyRescued};if(rules[id]&&!rules[id]())return false;s.story[id]=true;awardXP(s,MILESTONE_XP[id]||0);return true;}
export function objective(s){const q=s.story;if(!q.abductionKnown)return ['リリィの消息を聞こう','娘を待つ長老モーリが、村の広場にいる。','village'];if(!q.requestAccepted)return ['リリィを助けよう','モーリから封印の解き方を聞く。','village'];if(!q.towerActivated)return ['古塔の結界を解こう','村の北門から森へ。西の古塔で「芽・太陽・月」に合わせる。','tower'];if(!q.caveBossDefeated)return ['封印の紋章を取り戻そう','森の東、洞窟の岩鎧のガルムを倒す。','cave'];if(!q.crestRestored)return ['紋章を祠へ戻そう','祠の前庭にある紋章台座を調べる。','shrine-court'];if(!q.altarLit)return ['遺跡の祭壇に火を灯そう','森の奥の遺跡で水門を操作し、火の祭壇へ。','ruins'];if(!q.shrineBossDefeated)return ['祠の奥でリリィを探そう','開いた石扉の先へ。壁画を読み、地下へ降りる。','shrine-core'];if(!q.lilyRescued)return ['リリィを迎えに行こう','最深部のリリィに近づいて話しかける。','shrine-core'];if(!q.homecomingCompleted)return ['リリィと村へ帰ろう','帰りの鈴、または祠の近道からこもれび村へ。','village'];return ['第一章クリア ― 帰ってきた笑顔','残響の試練・育成・装備を自由に楽しもう。','village'];}
export function defeat(s){s.gold=Math.floor(s.gold*.9);recover(s);s.location={zone:'village',x:0,z:30};}
// Settle all battle and story rewards together, before presenting the receipt.
export function settleVictory(s,encounter,reward){
 const before={level:s.level,xp:s.xp,sp:s.sp,gold:s.gold,stats:stats(s)},loot=[];
 awardXP(s,reward.xp);s.gold+=reward.gold;
 const gear=id=>{if(EQUIPMENT[id]&&!s.owned.includes(id)){s.owned.push(id);loot.push({id,name:EQUIPMENT[id].name,count:1,kind:'装備'});}};
 if(encounter.boss==='garm'&&milestone(s,'caveBossDefeated')){
  s.inventory.salve=(s.inventory.salve||0)+3;
  loot.push({id:'crest',name:'封印の紋章',count:1,kind:'だいじなもの'},{id:'salve',name:ITEMS.salve.name,count:3,kind:'どうぐ'});
 }else if(encounter.boss==='velga')milestone(s,'shrineBossDefeated');
 else if(encounter.trial&&!s.trials.includes(encounter.id)){
  s.trials.push(encounter.id);for(const id of encounter.reward||[])gear(id);
 }else if(!encounter.boss&&!encounter.trial){
  if(!s.defeated.includes(encounter.id))s.defeated.push(encounter.id);
  if(encounter.reward)gear(encounter.reward);
 }
 return {before,after:{level:s.level,xp:s.xp,sp:s.sp,gold:s.gold,stats:stats(s)},xp:s.xp-before.xp,battleXP:reward.xp,storyXP:s.xp-before.xp-reward.xp,gold:s.gold-before.gold,sp:s.sp-before.sp,loot,objective:objective(s)};
}
export function serialize(s){return JSON.stringify(s);}
export function deserialize(raw){const d=JSON.parse(raw);if(d.version!==2)throw Error('この章の記録ではありません');const s=createState();Object.assign(s,d);s.level=Math.max(1,Math.floor(Number(d.level)||1));const rawXP=Number(d.xp);s.xp=Math.max(0,Number.isFinite(rawXP)?Math.floor(rawXP):0);s.xp=Math.max(s.xp,xpToLevel(s.level));while(s.xp>=xpToLevel(s.level+1))s.level++;s.trees=Object.fromEntries(Object.keys(TREES).map(k=>[k,clamp(Math.floor(Number(d.trees?.[k])||0),0,100)]));const invested=Object.values(s.trees).reduce((a,b)=>a+b,0),earned=totalSkillPoints(s.level);if(invested>earned)throw Error('スキルポイントの記録が壊れています');s.sp=earned-invested;s.owned=[...new Set((d.owned||[]).filter(k=>EQUIPMENT[k]))];s.equipment={};s.appearance={};for(const source of ['equipment','appearance'])for(const [slot,id]of Object.entries(d[source]||{}))if(EQUIPMENT[id]?.slot===slot&&s.owned.includes(id)||source==='appearance'&&id==='hidden'&&['horn','head','body','feet','charm'].includes(slot))s[source][slot]=id;s.story=Object.fromEntries(MILESTONES.map(k=>[k,!!(k==='abductionKnown'?(d.story?.abductionKnown??d.story?.abductionSeen):d.story?.[k])]));s.inventory=Object.fromEntries(Object.keys(ITEMS).map(k=>[k,clamp(Math.floor(Number(d.inventory?.[k])||0),0,999)]));s.hp=clamp(Number(d.hp)||1,1,stats(s).hp);s.mp=clamp(Number(d.mp)||0,0,stats(s).mp);s.gold=clamp(Math.floor(Number(d.gold)||0),0,9999999);s.puzzles={tower:(d.puzzles?.tower||[0,0,0]).slice(0,3).map(x=>clamp(Math.floor(x)||0,0,2)),waterA:!!d.puzzles?.waterA,waterB:!!d.puzzles?.waterB};for(const k of ['chests','defeated','trials'])s[k]=Array.isArray(d[k])?d[k].filter(x=>typeof x==='string'):[];return s;}
export class SaveStore{
 constructor(storage=globalThis.localStorage){this.storage=storage;}
 save(s){try{this.storage.setItem(SAVE_KEY,serialize(s));return true;}catch{return false;}}
 load(){return this.loadKey(SAVE_KEY);}
 has(){return !!this.load();}
 clearAuto(){try{this.storage.removeItem(SAVE_KEY);return true;}catch{return false;}}
 saveManual(slot,s){const key=this.manualKey(slot);if(!key)return false;try{this.storage.setItem(key,serialize(s));return true;}catch{return false;}}
 loadManual(slot){const key=this.manualKey(slot);return key?this.loadKey(key):null;}
 manualEntries(){return Array.from({length:MANUAL_SAVE_SLOTS},(_,i)=>({slot:i+1,state:this.loadManual(i+1)}));}
 entries(){const auto=this.load();return [...(auto?[{kind:'auto',state:auto}]:[]),...this.manualEntries().filter(e=>e.state).map(e=>({kind:'manual',slot:e.slot,state:e.state}))];}
 hasAny(){return this.entries().length>0;}
 manualKey(slot){slot=Number(slot);return Number.isInteger(slot)&&slot>=1&&slot<=MANUAL_SAVE_SLOTS?manualSaveKey(slot):null;}
 loadKey(key){try{const raw=this.storage.getItem(key);return raw?deserialize(raw):null;}catch{return null;}}
}
