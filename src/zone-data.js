export const BUILDINGS=[
 {id:'mori',name:'モーリの家',sign:'長老の家',x:-22,z:24,w:9,d:8,floors:2,roof:'Roof_RoundTiles_6x8'},
 {id:'inn',name:'木もれび亭',sign:'宿屋',x:-25,z:2,w:12,d:10,floors:2,roof:'Roof_RoundTiles_8x10'},
 {id:'shop',name:'ミントの道具屋',sign:'道具屋',x:23,z:18,w:8,d:8,floors:1,roof:'Roof_RoundTiles_4x4'},
 {id:'smith',name:'ガントの鍛冶場',sign:'武具と装備',x:29,z:-20,w:10,d:9,floors:1,roof:'Roof_RoundTiles_6x8'},
 {id:'chapel',name:'ひだまりの礼拝堂',sign:'礼拝堂',x:-28,z:-32,w:10,d:12,floors:2,roof:'Roof_RoundTiles_6x8'},
 {id:'bakery',name:'麦穂のパン屋',sign:'焼きたてパン',x:23,z:-4,w:8,d:7,floors:1,roof:'Roof_RoundTiles_4x4'},
 {id:'house1',name:'花窓の家',x:43,z:28,w:7,d:7,floors:1,roof:'Roof_RoundTiles_4x4'},
 {id:'house2',name:'蔦の家',x:-43,z:30,w:8,d:8,floors:2,roof:'Roof_RoundTiles_4x4'},
 {id:'house3',name:'風見の家',x:42,z:3,w:7,d:8,floors:2,roof:'Roof_RoundTiles_4x4'},
 {id:'house4',name:'森番の家',x:24,z:-39,w:8,d:8,floors:1,roof:'Roof_RoundTiles_4x4'},
 {id:'house5',name:'小川の家',x:-44,z:-8,w:7,d:8,floors:1,roof:'Roof_RoundTiles_4x4'},
 {id:'house6',name:'水車小屋',x:-46,z:-34,w:7,d:8,floors:2,roof:'Roof_RoundTiles_4x4'},
];
export const ZONES={
 village:{size:[220,200],authoredSize:[140,120],spawn:[0,35],theme:'village',paths:[[[0,50],[0,-48]],[[0,16],[-48,16]],[[0,10],[47,10]],[[0,-28],[-48,-28]],[[0,-12],[44,-12]]]},
 forest:{size:[440,380],authoredSize:[260,220],spawn:[0,85],theme:'forest',paths:[[[0,96],[0,65],[-14,42],[0,18],[8,-18],[15,-49],[40,-88]],[[-14,42],[-45,26],[-72,0]],[[0,18],[37,10],[77,-12]],[[15,-49],[-27,-65],[-38,-94]]]},
 tower:{size:[62,110],spawn:[0,44],theme:'forest',paths:[[[0,49],[0,-43]]]},
 cave:{size:[80,136],spawn:[0,52],theme:'cave',paths:[[[0,56],[0,-58]]]},
 ruins:{size:[122,152],spawn:[0,63],theme:'ruins',paths:[[[0,66],[0,-63]],[[-40,24],[40,24]],[[-40,-13],[40,-13]]]},
 'shrine-court':{size:[92,94],spawn:[0,32],theme:'ruins',paths:[[[0,39],[0,-26]]]},
 'shrine-upper':{size:[74,126],spawn:[0,51],theme:'shrine',paths:[[[0,53],[0,-51]]]},
 'shrine-lower':{size:[76,134],spawn:[0,56],theme:'deep',paths:[[[0,58],[0,-59]]]},
 'shrine-core':{size:[66,90],spawn:[0,33],theme:'core',paths:[[[0,36],[0,-34]]]},
 interior:{size:[22,24],spawn:[0,8],theme:'interior',paths:[]},
};
export const GROUPS={
 forest:[[-1,68,['sprout'],70],[-14,49,['sprout','sprout'],95],[-35,29,['mushroom'],115],[-51,17,['beetle'],135],[-63,3,['moth'],180],[30,12,['mushroom','beetle'],210],[63,-7,['moth','beetle'],240]],
 tower:[[-6,33,['moth'],180],[5,21,['beetle','sprout'],200],[-6,9,['moth','mushroom'],225],[6,-3,['moth','beetle'],240],[-5,-17,['moth','moth'],280],[5,-30,['beetle','moth'],320]],
 cave:[[-7,43,['mole'],290],[7,32,['bat','bat'],340],[-8,21,['mole','beetle'],350],[8,7,['bat','mole'],370],[-7,-5,['mole','mole'],390],[7,-17,['bat','bat','mole'],450],[-7,-30,['mole','bat'],440],[7,-41,['mole','mole','bat'],490]],
 ruins:[[-6,49,['crab'],550],[8,36,['lantern','crab'],600],[-25,23,['crab','crab'],650],[25,22,['lantern','lantern'],700],[-7,1,['crab','lantern'],740],[8,-21,['crab','crab','lantern'],780],[0,-43,['lantern','crab','lantern'],830]],
 'shrine-upper':[[-6,39,['sentinel'],810],[6,23,['stone','priest'],880],[-6,6,['sentinel','priest'],920],[6,-10,['stone','sentinel'],970],[0,-32,['sentinel','priest','stone'],1030]],
 'shrine-lower':[[-6,42,['mirror','sentinel'],1050],[6,26,['priest','stone','mirror'],1120],[-6,7,['sentinel','sentinel'],1160],[6,-14,['mirror','priest','stone'],1200],[0,-38,['stone','mirror','sentinel'],1280]],
};
export const ELITES={tower:{id:'crownmoth',x:11,z:-27,reward:'horn2'},cave:{id:'blackbeetle',x:12,z:4,reward:'charm3'},ruins:{id:'firestone',x:36,z:-36,reward:'body4'},'shrine-lower':{id:'royal',x:12,z:-29,reward:'horn5'}};
export const MURALS=[
 '昔、この森には人の願いを映す灯があった。けれど、恐れと欲が集まり、灯は影の主ヴェルガへと変わった。',
 '村人たちは三つの力で主を封じた。古塔は結界を支え、紋章は帰る道を閉ざし、祭壇の火は石扉を眠らせた。',
 '長い年月に、封印の一筋がほころんだ。小さな眷属だけが影の隙間を通り抜けられる。主は外から扉を開く者を待っていた。',
 '主は誰かの大切な者を奪い、救いに来る者に封印を解かせる。だが、壁画の最後にはこう記されている――「誰かのための勇気は、影をも貫く」。',
];
export const TRIALS=[{id:'trial-stone',zone:'cave',name:'残響の試練・岩',formation:['garm','blackbeetle'],scale:1.65,xp:2400,reward:['horn7','feet5']},{id:'trial-flame',zone:'ruins',name:'残響の試練・炎',formation:['firestone','royal','lantern'],scale:1.9,xp:2800,reward:['body7','head5']},{id:'trial-shadow',zone:'shrine-core',name:'残響の試練・影',formation:['velga'],scale:1.6,xp:3600,reward:['charm7']}];
