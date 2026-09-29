// Finite doorway volumes, never infinite planes: walking elsewhere in a large
// field must not send the player through a distant doorway. Arrivals stay behind.
export const PASSAGES={
 'village-forest':{z:-51,normal:[0,-1],halfWidth:3.8,depth:7},
 'forest-village':{z:99,normal:[0,1],halfWidth:4.1,depth:7},
 'forest-tower':{normal:[-.75,-.66],offset:1,halfWidth:3},
 'forest-cave':{normal:[.88,-.48],offset:1,halfWidth:3.1},
 'forest-ruins':{normal:[0,-1],offset:1.2,halfWidth:3.4},
 'forest-shrine':{normal:[.54,-.84],offset:1,halfWidth:3.4},
 'tower-out':{normal:[0,1],offset:1.2},
 'cave-out':{normal:[0,1],offset:1},
 'ruins-out':{normal:[0,1],offset:1.2},
 'court-out':{normal:[0,1],offset:1.2},
 'court-in':{normal:[0,-1],offset:2.2,halfWidth:4.6},
 'shrine-back':{normal:[0,1],offset:1},
 'shrine-deeper':{normal:[0,-1],offset:1},
 'core-out':{normal:[0,1],offset:1},
 'rescue-shortcut':{normal:[1,0],offset:1,halfWidth:2.4},
};
export function passageGeometry(portal){
 const p=PASSAGES[portal.id];if(!p)return null;const len=Math.hypot(...p.normal),nx=p.normal[0]/len,nz=p.normal[1]/len;
 return {x:p.x??portal.x+nx*(p.offset||0),z:p.z??portal.z+nz*(p.offset||0),nx,nz,halfWidth:p.halfWidth||3.2,depth:p.depth||4};
}
export function passageApproach(portal,back=1){const p=passageGeometry(portal);return {x:p.x-p.nx*back,z:p.z-p.nz*back};}
export function crossedPassage(portal,position){const p=passageGeometry(portal);if(!p)return false;const dx=position.x-p.x,dz=position.z-p.z,depth=dx*p.nx+dz*p.nz;return Math.abs(dx*-p.nz+dz*p.nx)<p.halfWidth&&depth>=0&&depth<=p.depth;}
