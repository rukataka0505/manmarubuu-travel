// Blender appends .006 to unrelated duplicates: only the leading slot is semantic.
export function characterMaterialRole(name){
 const slot=/^(\d{2})(?:\s|$)/.exec(name)?.[1];
 return slot==='06'||/cocoa|closed eyes/i.test(name)?'eyes':slot==='02'?'pink':/^(01|03)\s/.test(name)||/ivory|cotton/i.test(name)?'cloth':'detail';
}
