import {MONSTER_CATALOG} from './monster-catalog.js';
export const TITLE='まんまるぶうの冒険 ― 封印の祠', HERO='まんまるぶう';
export const TREE_NAMES={body:'たいじゅつ',guard:'まもり',sun:'ひだまり',wind:'かぜ'}, THRESHOLDS=[4,10,18,28,40,55,75,100];
export const TREES={body:['rush','atk4','roll','crit3','break','atk6','meteor','bodyMaster'],guard:['barrier','hp20','step','def6','counter','hp30','earth','guardMaster'],sun:['heal','spirit5','cleanse','mp12','light','healing15','sunring','sunMaster'],wind:['breeze','speed5','dust','evade5','tailwind','spirit8','tornado','windMaster']};
export const SKILLS={
 attack:{name:'たたかう',mp:0,power:1,kind:'physical'},
 rush:{name:'ころころ突進',mp:3,power:1.3,kind:'physical',description:'勢いをつけた体当たり。単体に1.3倍。'},
 roll:{name:'みだれころがり',mp:6,power:.55,hits:3,random:true,kind:'physical',description:'生きている敵へ3回の連続攻撃。'},
 break:{name:'かちわり体当たり',mp:7,power:1.4,kind:'physical',debuff:'defDown',description:'単体攻撃と守備20%低下。'},
 meteor:{name:'まんまる流星',mp:14,power:2.6,all:true,kind:'physical',description:'飛び上がり、敵全体へ大きな衝撃。'},
 barrier:{name:'ぽよんバリア',mp:4,kind:'guard',heal:.15,reduction:.5,priority:3,description:'HP15%回復。このターンの敵の攻撃を半減。'},
 step:{name:'身かわしステップ',mp:4,kind:'buff',status:'evade',turns:2,description:'2行動分、回避率を25%上げる。'},
 counter:{name:'まんまる返し',mp:7,kind:'guard',physical:.5,counter:true,priority:3,description:'物理を半減し、敵の行動後に一度反撃。'},
 earth:{name:'大地のまもり',mp:10,kind:'guard',physical:.6,elemental:.3,priority:3,description:'このターンの物理60%・属性30%軽減。'},
 heal:{name:'ひだまりの息',mp:4,kind:'heal',heal:.3,spiritHeal:.1,description:'最大HP30%＋魔力の10%分を回復。'},
 cleanse:{name:'きよめの息',mp:3,kind:'heal',cleanse:true,description:'毒と幻惑を治す。'},
 light:{name:'光のつぶて',mp:6,kind:'light',power:1.5,description:'魔力で放つ光の単体攻撃。'},
 sunring:{name:'ひだまりの輪',mp:12,kind:'heal',heal:.6,spiritHeal:.15,cleanse:true,description:'大きく回復し、毒と幻惑を治す。'},
 breeze:{name:'かぜの息',mp:3,kind:'wind',power:1.3,description:'風の単体攻撃。硬い殻にも有効。'},
 dust:{name:'砂けむり',mp:4,kind:'status',all:true,status:'blind',turns:5,description:'敵全体を幻惑。通常敵80%・ボス50%で成功し、5ターンのあいだ全属性の攻撃が50%で外れる。'},
 tailwind:{name:'追い風',mp:6,kind:'buff',status:'speedUp',turns:5,description:'5行動分、すばやさ50%上昇。'},
 tornado:{name:'つむじかぜ',mp:12,kind:'wind',power:2,all:true,description:'風の渦で敵全体を攻撃。'},
 drill:{name:'ツノドリル',mp:0,power:4,kind:'physical',ultimate:true,description:'ひっさつ専用。必中・守備40%無視・MP不要。'},
 guard:{name:'ぼうぎょ',mp:0,kind:'guard',reduction:.5,priority:3},
};
const passives={atk4:['攻撃の基礎','攻撃＋4'],crit3:['急所の心得','会心率＋3%'],atk6:['攻撃の熟練','攻撃＋6'],bodyMaster:['たいじゅつの極意','系統威力＋15%、物理特技MP−1'],hp20:['丈夫なからだ','最大HP＋20'],def6:['守備の心得','守備＋6'],hp30:['粘り強さ','最大HP＋30'],guardMaster:['まもりの極意','被害−10%、状態異常の確率−20%'],spirit5:['やさしいこころ','魔力＋5'],mp12:['魔力の器','最大MP＋12'],healing15:['ひだまりの心得','回復量＋15%'],sunMaster:['ひだまりの極意','光威力＋15%、系統MP−20%'],speed5:['軽い足取り','すばやさ＋5'],evade5:['風の感覚','回避率＋5%'],spirit8:['風のこころ','魔力＋8'],windMaster:['かぜの極意','風威力＋15%、回避時チャージ＋5']};
for(const [id,[name,description]] of Object.entries(passives))SKILLS[id]={name,description,passive:true};
for(const [tree,ids] of Object.entries(TREES))ids.forEach((id,i)=>Object.assign(SKILLS[id],{tree,threshold:THRESHOLDS[i]}));
export const SLOT_NAMES={horn:'ツノ飾り',head:'頭',body:'からだ',feet:'足',charm:'おまもり'};
const rows={
 horn:[['旅人のツノ輪',1,{atk:2},'copper'],['いばらのツノ輪',7,{atk:7},'thorn'],['風読みのツノ輪',7,{spirit:5,speed:4,wind:.12},'wind'],['鋼のツノ輪',13,{atk:13},'steel'],['光紋のツノ輪',19,{atk:12,spirit:9,light:.15},'sun'],['勇者のツノ輪',25,{atk:23,crit:.03},'gold'],['嵐のツノ輪',25,{spirit:18,wind:.25},'storm'],['暁のツノ輪',30,{atk:30,spirit:12},'dawn']],
 head:[['野花の髪飾り',1,{spirit:2},'flower'],['旅の小帽子',7,{mp:8,def:2},'cap'],['月草の髪飾り',13,{spirit:9,sleepResist:.5},'moon'],['灯の額飾り',19,{mp:18,sealResist:.4},'sun'],['星読みの小帽子',25,{spirit:16,mp:12},'star'],['暁の額飾り',30,{spirit:22,mp:20},'dawn']],
 body:[['旅のベスト',1,{def:3},'vest'],['守り樹の胴当て',7,{def:9,hp:12},'bark'],['風渡りのケープ',7,{def:5,speed:6},'wind'],['岩守りの胴当て',13,{def:17,hp:20},'steel'],['灯守りのケープ',19,{def:20,shadowResist:.25},'sun'],['白銀の胴当て',25,{def:31,hp:30},'silver'],['精霊のケープ',25,{def:22,fireResist:.3,shadowResist:.3},'spirit'],['暁のケープ',30,{def:38,hp:35},'dawn']],
 feet:[['旅の足巻き',1,{speed:2},'wrap'],['木もれびの靴',7,{speed:5,def:2},'leaf'],['岩道のブーツ',13,{speed:7,def:6},'steel'],['風走りの足輪',19,{speed:13,evade:.03},'wind'],['星渡りの靴',25,{speed:18,def:7},'star'],['暁の足輪',30,{speed:24,evade:.05},'dawn']],
 charm:[['木の実のおまもり',1,{hp:8},'wood'],['目覚めのおまもり',7,{sleepResist:.8},'bell'],['毒よけのおまもり',7,{poisonResist:.8},'leaf'],['勇気のおまもり',13,{charge:3,hp:10},'brave'],['火守りのおまもり',19,{fireResist:.4},'fire'],['祈りのおまもり',19,{sealResist:.8,mp:10},'moon'],['星のおまもり',25,{shadowResist:.35,blindResist:.6},'star'],['暁のおまもり',30,{hp:40,charge:3},'dawn']],
};
export const EQUIPMENT={};
for(const [slot,items] of Object.entries(rows))items.forEach(([name,level,stats,look],i)=>{const id=`${slot}${i}`;EQUIPMENT[id]={id,name,slot,level,stats,look,price:level===1?35:Math.round((level*level*1.7+30)/10)*10,color:({copper:'#b97c50',thorn:'#648756',wind:'#5caaa1',steel:'#799398',sun:'#d8ad5f',gold:'#e9c567',storm:'#817ebe',dawn:'#e7bd81',flower:'#df9aab',moon:'#afa7d7',star:'#839ab9',silver:'#bec9c4',spirit:'#7eb5ab',leaf:'#7e9f6c',fire:'#c77c58'})[look]||'#ae8764'};});
export const ITEMS={herb:{name:'やくそう',price:12,description:'HP35%＋20回復',heal:.35,flat:20},salve:{name:'上やくそう',price:45,description:'HP65%＋25回復',heal:.65,flat:25},nectar:{name:'まほうのしずく',price:35,description:'MP40%＋8回復',mp:.4,flat:8},remedy:{name:'きよめの実',price:18,description:'毒・幻惑・MP封じを治す',cure:true},bell:{name:'帰りの鈴',price:25,description:'リリィも一緒に村へ帰る',return:true}};
const enemyRows=[
 ['sprout','わかばもち',2,'もち',72,17,5,10,['attack','charge'],'fire'],['mushroom','ねむりキノコ',4,'きのこ',102,24,8,10,['attack','spores'],'wind'],['beetle','こはくコロガシ',6,'甲虫',154,30,20,12,['shell','attack','charge'],'wind'],['moth','かぜはねモス',8,'蛾',160,36,11,34,['wind','evade','charge'],'light'],['mole','石つぶてモグラ',11,'モグラ',235,47,23,24,['rock','burrow','charge'],'wind'],['bat','毒みつコウモリ',12,'コウモリ',201,42,16,39,['poison','drain','attack'],'light'],['crab','水路のカニ兵',16,'カニ',328,61,37,31,['double','shell','slow'],'wind'],['lantern','火種のランタン',17,'灯火',276,62,21,34,['fire','charge','fire'],'wind'],['sentinel','影の番兵',21,'影騎士',423,76,35,47,['double','rally','attack'],'light'],['priest','祈りを忘れた灯',22,'祈り灯',342,65,27,40,['heal','shadow','seal'],'light'],['stone','封印の石兵',23,'石兵',529,79,56,31,['cover','heavy','shell'],'wind'],['mirror','鏡面の影',24,'鏡',430,79,35,52,['reflect','shadow','weaken'],'physical'],
 ['crownmoth','風冠のモス',9,'蛾',630,44,19,39,['wind','evade','charge','double'],'light'],['blackbeetle','黒甲のコロガシ',14,'甲虫',1040,57,41,28,['shell','charge','poison'],'wind'],['firestone','火守りの石兵',19,'石兵',1570,76,43,32,['fire','charge','cover'],'wind'],['royal','影の近衛',24,'影騎士',2080,87,48,50,['rally','double','charge','weaken'],'light'],['garm','岩鎧のガルム',13,'岩獣',2150,55,34,29,['rock','shell','charge','double'],'wind'],['velga','祠の主ヴェルガ',25,'主',5800,88,48,51,['shadow','attack','seal','charge'],'light']];
export const ENEMIES=Object.fromEntries(enemyRows.map(([id,name,level,form,hp,atk,def,speed,moves,weak],i)=>[id,{id,name:MONSTER_CATALOG[id].name,level,form,hp,atk,def,speed,moves,weak,elite:i>=12&&i<16,boss:i>=16,spirit:atk*.86,xp:Math.round(level*level*1.1+30),gold:Math.round(level*4+9),resist:form==='甲虫'?{physical:.8}:id==='mirror'?{light:.65}:id==='lantern'?{fire:.5}:{}}]));
export const ACTION_NAMES={attack:'踏み込み',charge:'大技の構え',slam:'ため体当たり',spores:'胞子の構え',sleep:'眠りの胞子',shell:'殻の構え',wind:'風刃',evade:'身かわし',rock:'石つぶて',burrow:'地中の構え',poison:'毒の牙',drain:'吸血',double:'二連撃',slow:'からみつく泡',fire:'火の弾',rally:'闘気',shadow:'影の弾',heal:'忘れられた祈り',seal:'封じの霧',cover:'仲間をかばう',heavy:'重打',reflect:'光への構え',weaken:'力を奪う影',summon:'封印の残響',phase:'封じられた力',counter:'まんまる返し'};
export const STATUS_NAMES={poison:'毒',blind:'幻惑',sleep:'眠り',seal:'MP封じ',atkDown:'攻撃↓',defDown:'守備↓',speedDown:'速度↓',speedUp:'追い風',atkUp:'攻撃↑',defUp:'守備↑',evade:'身かわし',open:'隙',cover:'かばう',reflect:'光の構え',sleepImmune:'目覚め'};
export const MILESTONES=['abductionKnown','requestAccepted','towerActivated','caveBossDefeated','crestRestored','altarLit','shrineEntered','shrineBossDefeated','lilyRescued','homecomingCompleted'];
export const MILESTONE_XP={requestAccepted:80,towerActivated:400,caveBossDefeated:650,crestRestored:450,altarLit:800,shrineEntered:250,shrineBossDefeated:4500,lilyRescued:300,homecomingCompleted:500};
export const ZONE_NAMES={village:'こもれび村',forest:'こもれびの森',tower:'森の古塔',cave:'月しずくの洞窟',ruins:'灯守りの遺跡','shrine-court':'封印の祠・前庭','shrine-upper':'封印の祠・記憶の回廊','shrine-lower':'封印の祠・影の祭室','shrine-core':'封印の祠・最深部',interior:'村の家'};
export const NPCS=[{id:'mori',name:'長老モーリ',color:'#567564',x:-5,z:9},{id:'lily',name:'リリィ',color:'#deb0bd',x:3,z:9,small:true},{id:'inn',name:'宿屋ポポ',color:'#be9970',x:-25,z:14},{id:'shop',name:'道具屋ミント',color:'#79a99a',x:15,z:7},{id:'smith',name:'鍛冶屋ガント',color:'#946e5b',x:24,z:-12},{id:'chapel',name:'世話役セラ',color:'#a1acc0',x:-24,z:-25},{id:'gate',name:'門番ルーク',color:'#8c9c77',x:5,z:-39},{id:'coco',name:'ココ',color:'#d3a86d',x:6,z:16,small:true}];
