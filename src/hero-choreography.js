// Contact markers are measured on the original Blender clips, not on travel time.
export const HERO_CONTACT={BodyBlow:.45,HornDrill:.53};
export function heroChoreography(move,distance,clipDuration){
 const clip=move==='drill'?'HornDrill':'BodyBlow',approach=Math.min(.95,Math.max(.18,distance/7.4));
 const duration=approach+clipDuration;
 return {clip,approach,clipDuration,duration,impact:(approach+clipDuration*HERO_CONTACT[clip])/duration,phase:p=>Math.max(0,Math.min(1,(p*duration-approach)/clipDuration)),approachPhase:p=>Math.max(0,Math.min(1,p*duration/approach))};
}
