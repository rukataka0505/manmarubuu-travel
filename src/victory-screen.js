import {itemArt,menuIcon} from './menu-art.js';
import {xpToLevel,xpNext} from './rpg.js';
const labels={hp:'最大HP',mp:'最大MP',atk:'攻撃力',def:'守備力',speed:'すばやさ',spirit:'魔力'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function victoryScreen(r){
 const leveled=r.after.level>r.before.level,progress=(r.after.xp-xpToLevel(r.after.level))/xpNext(r.after.level);
 const enemies=[...new Set(r.enemies)].map(name=>`${esc(name)}${r.enemies.filter(n=>n===name).length>1?' ×'+r.enemies.filter(n=>n===name).length:''}`).join(' ・ ');
 return `<div class="victory-scene-caption"><span>THE SEALED SHRINE</span><h2>また一歩、<br>あの笑顔へ。</h2><i></i><p>まんまるぶうの冒険</p></div><section class="result-card" role="dialog" aria-modal="true" aria-labelledby="result-heading">
  <header class="result-header"><div><span class="eyebrow">BATTLE REWARDS</span><h2 id="result-heading">勝利！<small>VICTORY</small></h2></div><span class="result-seal">${menuIcon('status')}</span></header>
  <div class="result-scroll"><p class="result-enemies">${enemies}<small>${r.rounds}ターンで撃破</small></p>
  <div class="result-rewards"><div>${menuIcon('skills')}<span>獲得経験値</span><strong>+${r.xp.toLocaleString()} <small>EXP</small></strong>${r.storyXP?`<small>うち物語の達成 ${r.storyXP.toLocaleString()} EXP</small>`:''}</div><div>${menuIcon('coin')}<span>獲得ゴールド</span><strong>+${r.gold.toLocaleString()} <small>G</small></strong><small>所持金 ${r.after.gold.toLocaleString()} G</small></div></div>
  <section class="result-growth ${leveled?'level-up':''}"><div class="result-level"><b>${leveled?'LEVEL UP!':'まんまるぶう'}</b><span>Lv. ${leveled?r.before.level+' <i>→</i> ':''}<strong>${r.after.level}</strong></span></div>
  <div class="result-xp"><i style="width:${progress*100}%"></i></div><p class="result-next">次のレベルまで <b>${(xpToLevel(r.after.level+1)-r.after.xp).toLocaleString()}</b> EXP</p>
  ${leveled?`<div class="result-stats">${Object.entries(labels).map(([key,name])=>`<div><span>${name}</span><b>${r.before.stats[key]} <i>→</i> ${r.after.stats[key]}</b><em>+${r.after.stats[key]-r.before.stats[key]}</em></div>`).join('')}</div><div class="result-sp"><b>スキルポイント +${r.sp} SP</b><span>未使用 ${r.after.sp} SP · 手帳の「スキル」で配分</span></div>`:r.after.sp?`<p class="result-sp">未使用 ${r.after.sp} SP · 手帳で新しい特技を覚えよう</p>`:''}</section>
  <section class="result-loot"><h3><span>手に入れたもの</span><small>TREASURES</small></h3>${r.loot.length?r.loot.map(it=>`<div>${itemArt(it.id)}<span><b>${esc(it.name)}</b><small>${it.kind}</small></span><strong>×${it.count}</strong></div>`).join(''):'<p>今回は経験とゴールドを手に入れた。</p>'}</section>
  </div><footer><p><span>次の目的</span>${esc(r.objective[0])}</p><button class="primary" data-action="result-continue">冒険を続ける ${menuIcon('arrow')} <kbd>Enter</kbd></button></footer>
 </section>`;
}
