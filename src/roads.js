import * as THREE from 'three';
import {random} from './graphics.js';

export function roadCurve(points){
 return new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal',.5);
}
export function roadCenterline(points){const curve=roadCurve(points);return curve.getSpacedPoints(Math.max(2,Math.ceil(curve.getLength()/1.5))).map(p=>[p.x,p.z]);}

// A single continuous ribbon, sampled across its width as well as its length.
// The feather follows the same terrain as the verge: no gaps at bends or slopes.
export function buildRoad(world,points,width){
 const curve=roadCurve(points),length=curve.getLength(),steps=Math.max(2,Math.ceil(length/.8)),across=10,vertices=[],uv=[],indices=[];
 const woodland=world.zone==='forest',mat=world.roadMaterial();
 for(let i=0;i<=steps;i++){
  const t=i/steps,p=curve.getPointAt(t),d=curve.getTangentAt(t),w=width*(1+(woodland?.065:0)*Math.sin(t*length*.27));
  for(let j=0;j<=across;j++){
   const side=j/across*2-1,x=p.x-d.z*w*.5*side,z=p.z+d.x*w*.5*side;
   vertices.push(x,world.height(x,z)+.045,z);uv.push(j/across,t*length);
   if(i<steps&&j<across){const n=i*(across+1)+j;indices.push(n,n+1,n+across+1,n+1,n+across+2,n+across+1);}
  }
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 const mesh=new THREE.Mesh(geo,mat);mesh.name='Road';mesh.receiveShadow=true;mesh.userData.road={curved:true,length,width};world.root.add(mesh);
 if(!woodland||length<18)return mesh;
 const rng=random(Math.round(length*117+points[0][0]*7+points[0][1]*13));
 for(let distance=3;distance<length-3;distance+=2.6+rng()*1.7){
  const t=distance/length,p=curve.getPointAt(t),d=curve.getTangentAt(t),side=rng()>.5?1:-1;
  for(let k=0;k<3;k++){
   const verge=width*.5+.4+rng()*1.8,x=p.x-d.z*verge*side+(rng()-.5),z=p.z+d.x*verge*side+(rng()-.5);
   const name=k===0?'Pebble_Round_'+(1+Math.floor(rng()*3)):k===1?'Fern_1':rng()>.4?'Flower_4_Group':'Clover_2';
   world.prop(name,x,z,{height:k===0?.13+rng()*.18:.22+rng()*.27,width:k===0?.35+rng()*.4:undefined,scale:.45+rng()*.3,rotation:rng()*6.28});
  }
  if(distance%17<4){const x=p.x+(rng()-.5)*width*.55,z=p.z+(rng()-.5);world.prop('RockPath_Round_Small_2',x,z,{height:.085,width:.65+rng()*.6,depth:.55+rng()*.4,rotation:rng()*6.28});}
 }
 return mesh;
}
