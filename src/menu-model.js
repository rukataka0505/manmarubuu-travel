import {EQUIPMENT,ITEMS,SKILLS,TREES} from './content.js';
import {stats} from './rpg.js';

export function itemUseInfo(state,id){
 const it=ITEMS[id],a=stats(state);if(!it)return {reason:'この道具は使えない。',amount:0};
 let amount=0,reason='';
 if(it.heal){amount=Math.min(a.hp-state.hp,Math.round(a.hp*it.heal+it.flat));if(!amount)reason='HPは満タンです。';}
 if(it.mp){amount=Math.min(a.mp-state.mp,Math.round(a.mp*it.mp+it.flat));if(!amount)reason='MPは満タンです。';}
 if(it.cure)reason='状態異常を受けた戦闘中に使えます。';
 if(!(state.inventory[id]>0))reason='この道具を持っていません。';
 return {reason,amount,kind:it.heal?'HP':it.mp?'MP':it.return?'帰還':'状態回復'};
}
export function equipmentComparison(state,id){
 const e=EQUIPMENT[id];if(!e)return [];
 const before=stats(state),after=stats({...state,equipment:{...state.equipment,[e.slot]:id}});
 return ['hp','mp','atk','def','speed','spirit'].map(key=>({key,before:before[key],after:after[key],delta:after[key]-before[key]}));
}
export function pendingPoints(state,draft,tree){return Math.max(0,(draft?.trees[tree]||0)-state.trees[tree]);}
export function undoPoints(state,draft,tree,amount){
 const n=Math.min(pendingPoints(state,draft,tree),Math.max(0,Math.floor(amount)));if(!n)return false;
 draft.trees[tree]-=n;draft.sp+=n;return true;
}
export function nextSkill(state,tree){return TREES[tree].map(id=>({id,...SKILLS[id]})).find(s=>s.threshold>state.trees[tree]);}
