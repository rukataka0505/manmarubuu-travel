import {EQUIPMENT,ITEMS} from './content.js';

const sheets={supplies:[3,2],horns:[4,2],heads:[3,2],bodies:[4,2],feet:[3,2],charms:[4,2]};
const slots={horn:'horns',head:'heads',body:'bodies',feet:'feet',charm:'charms'};
export const MENU_ART=Object.fromEntries(Object.keys(ITEMS).map((id,index)=>[id,{sheet:'supplies',index}]));
for(const e of Object.values(EQUIPMENT))MENU_ART[e.id]={sheet:slots[e.slot],index:Number(e.id.slice(e.slot.length))};
MENU_ART.crest={sheet:'supplies',index:5};
export function itemArt(id,extra=''){
 const entry=MENU_ART[id];if(!entry)return `<span class="inventory-art empty-art ${extra}" aria-hidden="true">${menuIcon('empty')}</span>`;
 const [cols,rows]=sheets[entry.sheet],x=entry.index%cols,y=Math.floor(entry.index/cols);
 return `<span class="inventory-art ${extra}" data-art="${id}" aria-hidden="true" style="background-image:url('/ui/inventory/${entry.sheet}.png');background-size:${cols*100}% ${rows*100}%;background-position:${x/(cols-1)*100}% ${y/(rows-1)*100}%"></span>`;
}
const paths={
 status:'<path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6l-4.9 2.6.9-5.5-4-3.9L9.5 8z"/><path d="M5 21h14"/>',
 items:'<path d="M8 3h8l-2 5c4 2 6 5 6 9 0 3-3 4-8 4s-8-1-8-4c0-4 2-7 6-9z"/><path d="M8 9h8m-4 3v6m-3-3h6"/>',
 equipment:'<path d="M8 3l-5 4 3 5 2-1v10h8V11l2 1 3-5-5-4c0 4-8 4-8 0z"/>',
 skills:'<path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/><circle cx="12" cy="12" r="2"/>',
 quest:'<path d="M6 3h14v16H6a3 3 0 010-6h14M6 3a3 3 0 00-3 3v10m6-9h7m-7 3h5"/>',
 settings:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10l2 2M5 19l2-2M17 7l2-2"/>',
 save:'<path d="M6 3h12v18H6zM9 3v7h6V3M9 17h6"/>',
 body:'<path d="M3 17l5-5 4 3 7-11m-6 0h6v6M4 21h16"/>',
 guard:'<path d="M12 2l8 4v7c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12l2 2M4 20l2-2M18 6l2-2"/>',
 wind:'<path d="M3 8h12c6 0 6-7 1-6m-13 11h15c6 0 6 8 0 8M3 18h7"/>',
 horn:'<path d="M5 19C14 20 21 12 20 3c-2 6-6 8-12 9z"/><ellipse cx="6" cy="16" rx="3" ry="5" transform="rotate(30 6 16)"/>',
 head:'<path d="M3 18c2-4 16-4 18 0-4 4-14 4-18 0zM6 15c1-9 4-10 7-13l4 13"/>',
 feet:'<path d="M5 3h8v10l7 3v5H4v-9zM4 17h13M7 6h5m-5 4h5"/>',
 charm:'<path d="M5 2l7 8 7-8m-7 7l6 6-6 7-6-7z"/>',
 empty:'<circle cx="12" cy="12" r="8"/><path d="M7 17L17 7"/>',
 check:'<path d="M4 12l5 5L20 6"/>',
 coin:'<circle cx="12" cy="12" r="9"/><path d="M15 7a5 5 0 100 10v-5h-3"/>',
 arrow:'<path d="M4 12h15m-6-6l6 6-6 6"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 018 0v4m-4 4v3"/>',
};
export function menuIcon(id,extra=''){return `<svg class="menu-icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[id]||paths.skills}</svg>`;}
