import {SKILLS,ITEMS} from './content.js';

export function battleHelp(action,rules){
 const commands={
  'battle-skills':{name:'とくぎ',description:'スキルポイントで覚えた特技を使う。技にカーソルを合わせると、効果・対象・消費MPを確認できる。',detail:'消費MPは特技ごとに異なる'},
  'battle-items':{name:'どうぐ',description:'持っている道具でHP・MPや状態異常を回復する。使うと1個消費し、このターンの行動になる。',detail:'MP消費なし'},
  'fight:escape':{name:'にげる',description:'戦いから離れて、フィールドの探索へ戻る。ボス戦では使えない。',detail:'MP消費なし'},
  'fight:wait':{name:'目覚めを待つ',description:'眠っているため、今はほかの行動を選べない。目覚めるまで身を守ろう。',detail:'MP消費なし'},
 };
 if(commands[action])return {...commands[action],reason:action.startsWith('fight:')?rules.validate(action.slice(6)):null};
 if(action.startsWith('fight:item:')){const id=action.slice(11),it=ITEMS[id];if(!it)return null;return {name:it.name,description:it.description+'。対象：まんまるぶう。',detail:`所持 ${rules.state.inventory[id]||0}個 · 1個消費 / MP0`,reason:rules.validate('item:'+id)};}
 if(!action.startsWith('fight:'))return null;
 const id=action.slice(6),s=SKILLS[id];if(!s)return null;
 const target=['guard','heal','buff'].includes(s.kind)?'自分':s.all?'敵全体':s.random?'敵ランダム':'敵1体';
 return {name:s.name,description:s.description||({attack:'選んだ敵へ体当たりで攻撃する。命中後は元の位置へ戻る。',guard:'このターン、敵から受けるダメージを半分にする。大技の予告に合わせよう。'})[id],detail:id==='drill'?`MP0 · ひっさつ専用 · ${rules.ready?'残り'+rules.ready+'回の行動選択中に使用':'チャージ100で発動'}`:`消費MP ${rules.cost(id)} · 対象：${target}`,reason:rules.validate(id)};
}
