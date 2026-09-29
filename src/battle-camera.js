import {Vector3,MathUtils} from 'three';
const V=(x,y,z)=>new Vector3(x,y,z);
const smooth=(a,b,t)=>MathUtils.smoothstep(t,a,b);

export function commandShot(hero,targets){
 const center=targets.reduce((v,p)=>v.add(p),new Vector3()).divideScalar(Math.max(1,targets.length));
 const forward=center.clone().sub(hero).setY(0).normalize();
 if(forward.lengthSq()<.1)forward.set(1,0,0);
 const side=V(-forward.z,0,forward.x);
 return {position:hero.clone().addScaledVector(forward,-7.4).addScaledVector(side,4.8).add(V(0,3.8,0)),target:hero.clone().lerp(center,.66).add(V(0,1.2,0)),fov:51,forward,side};
}

// One continuous shot on the same side of the combat axis, including contact.
// Impact changes the effects and a gentle push-in, never inserts a reverse angle.
export function actionShot({command,start,end,actor,p,impact,ultimate,meteor,self,reduced}){
 if(reduced)return command;
 const entry=smooth(0,.28,p),push=smooth(.25,impact+.2,p),wide=meteor?Math.sin(Math.PI*smooth(0,.7,p)):0;
 const focus=self?start.clone():actor.clone().lerp(end,.45);
 const position=focus.clone().addScaledVector(command.side,(ultimate?6.5:6.9)-push*.65+wide*2.5).addScaledVector(command.forward,-3.7+push*.7).add(V(0,2.65+wide*3,0));
 const target=focus.clone().add(V(0,meteor?1.25:1.05,0));
 return {position:command.position.clone().lerp(position,entry),target:command.target.clone().lerp(target,entry),fov:MathUtils.lerp(command.fov,ultimate?47:49,entry)};
}
