import * as THREE from 'three';
import {group,shape,material,TAU} from './graphics.js';

// The vessel and finial use the supplied Fantasy Props kit. Shaped stonework and
// flowing water surround them; footprint remains the approved 4.8 m square.
export function buildFountain(world){
 const root=group(world.root,0,world.height(0,7),7),flow=group(world.dynamic,0,world.height(0,7),7,true);root.name='KomorebiFountain';flow.name='FountainWater';
 const stone=material('#ded6bc',{roughness:.82}),edge=material('#b4bfa9',{roughness:.84}),bronze=material('#ba985e',{metalness:.48,roughness:.38});
 const lathe=(points,mat)=>{const mesh=new THREE.Mesh(new THREE.LatheGeometry(points.map(([x,y])=>new THREE.Vector2(x,y)),96),mat);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;};
 lathe([[0,0],[2.54,0],[2.6,.10],[2.6,.16],[2.48,.22],[2.39,.25],[2.36,.39],[2.43,.44],[2.44,.59],[2.36,.65],[2.34,.79],[2.42,.87],[2.42,.94],[2.32,1.01],[2.13,1.01],[2.04,.93],[2.09,.82],[2.07,.42],[.6,.38],[0,.38]],stone);
 for(const [r,y,t] of [[2.45,.27,.035],[2.4,.68,.035],[2.25,1.015,.026],[.76,.58,.035],[1.18,2.56,.028]])shape(root,new THREE.TorusGeometry(r,t,8,96),bronze,0,y,0).rotation.x=-Math.PI/2;
 for(let i=0;i<16;i++){const a=i*TAU/16,g=group(root,Math.sin(a)*2.405,.71,Math.cos(a)*2.405);g.rotation.y=a;const petal=shape(g,'smooth',edge,0,0,0,.12,.16,.035);petal.rotation.z=.5;shape(g,'smooth',bronze,0,0,.04,.035,.04,.016);}
 lathe([[0,.38],[.72,.38],[.79,.48],[.79,.54],[.61,.65],[.50,.76],[.43,1.07],[.42,1.13],[0,1.13]],edge);
 world.assets.place(root,'Vase_4',0,.68,0,{width:.95,depth:.95,height:1.68});
 lathe([[.29,1.92],[.48,2.05],[.67,2.13],[.83,2.20],[1.05,2.32],[1.16,2.41],[1.22,2.5],[1.22,2.57],[1.08,2.6],[1.02,2.48],[.78,2.31],[.28,2.22]],stone);
 world.assets.place(root,'Chalice',0,2.23,0,{width:.47,depth:.47,height:.87});
 const time=world.waterTime,waterMaterials=[];
 function pool(radius,y){
  const m=new THREE.MeshPhysicalMaterial({color:'#7ccfc8',roughness:.16,metalness:.1,clearcoat:1,clearcoatRoughness:.13,transparent:true,opacity:.9,depthWrite:false});
  m.onBeforeCompile=s=>{s.uniforms.fountainTime=time;s.uniforms.poolRadius={value:radius};s.vertexShader='varying vec3 waterPosition;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nwaterPosition=position;');s.fragmentShader='varying vec3 waterPosition;uniform float fountainTime;uniform float poolRadius;\n'+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 p=waterPosition.xy;float r=length(p);float wave=sin(r*27.-fountainTime*3.8)+sin(p.x*15.+fountainTime)*cos(p.y*18.-fountainTime*1.3);
   float foam=smoothstep(poolRadius-.13,poolRadius-.02,r)*(.45+.25*sin(r*48.-fountainTime*4.));
   float caustic=pow(max(0.,sin(p.x*9.+fountainTime*.8)*cos(p.y*11.-fountainTime*.65)),8.);
   diffuseColor.rgb=mix(diffuseColor.rgb*(.88+wave*.09),vec3(.83,.97,.91),foam+caustic*.36);`).replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nnormal=normalize(normal+vec3(sin(waterPosition.x*19.+fountainTime*2.)*.1,cos(waterPosition.y*23.-fountainTime)*.08,0.));');};
  m.customProgramCacheKey=()=> 'fountain-pool';waterMaterials.push(m);
  const mesh=new THREE.Mesh(new THREE.CircleGeometry(radius,96),m);mesh.rotation.x=-Math.PI/2;mesh.position.y=y;mesh.receiveShadow=true;flow.add(mesh);
 }
 pool(2.07,.85);pool(1.075,2.49);
 const stream=new THREE.MeshPhysicalMaterial({color:'#b5eeed',roughness:.13,metalness:.12,clearcoat:1,transparent:true,opacity:.64,depthWrite:false});
 stream.onBeforeCompile=s=>{s.uniforms.fountainTime=time;s.vertexShader='varying vec2 streamUV;\n'+s.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nstreamUV=uv;');s.fragmentShader='varying vec2 streamUV;uniform float fountainTime;\n'+s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat pulse=pow(max(0.,sin(streamUV.x*70.-fountainTime*11.)),5.);diffuseColor.rgb+=vec3(.24)*pulse;diffuseColor.a*=.62+.38*pulse;');};stream.customProgramCacheKey=()=> 'fountain-flow';waterMaterials.push(stream);
 const jets=[],splashes=[];
 for(let i=0;i<8;i++){const a=i*TAU/8+.2,dx=Math.sin(a),dz=Math.cos(a),high=i%2===0;
  const start=new THREE.Vector3(dx*(high?.18:1.1),high?3.08:2.5,dz*(high?.18:1.1)),end=new THREE.Vector3(dx*1.73,.87,dz*1.73),control=new THREE.Vector3(dx*(high?1.02:1.5),high?3.85:2.67,dz*(high?1.02:1.5));
  const curve=new THREE.QuadraticBezierCurve3(start,control,end),tube=new THREE.Mesh(new THREE.TubeGeometry(curve,40,high?.035:.048,8,false),stream);flow.add(tube);jets.push(curve);
  const m=new THREE.MeshBasicMaterial({color:'#e4fff4',transparent:true,opacity:.4,depthWrite:false,side:THREE.DoubleSide});waterMaterials.push(m);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.19,.22,32),m);ring.rotation.x=-Math.PI/2;ring.position.copy(end).setY(.865+i*.0002);flow.add(ring);splashes.push(ring);
 }
 const n=192,positions=new Float32Array(n*3),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const mistMaterial=new THREE.ShaderMaterial({uniforms:{pixelRatio:{value:Math.min(devicePixelRatio,1.5)}},transparent:true,depthWrite:false,vertexShader:'uniform float pixelRatio;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(80.*pixelRatio/-p.z,1.5,7.);}',fragmentShader:'void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(.8,.98,.97,(1.-r*r)*.75);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});waterMaterials.push(mistMaterial);
 const mist=new THREE.Points(geo,mistMaterial);mist.frustumCulled=false;flow.add(mist);
 world.fountain={root,flow,jets,splashes,mist,positions,materials:waterMaterials};world.collision(0,7,4.8,4.8,3.1);
}
export function updateFountain(world,t){
 const f=world.fountain;if(!f)return;
 f.splashes.forEach((ring,i)=>{const phase=(t*.7+i*.137)%1;ring.scale.setScalar(.35+phase*1.9);ring.material.opacity=(1-phase)*.42;});
 const n=Math.round(48+144*world.quality.particles),p=new THREE.Vector3();
 for(let i=0;i<n;i++){const u=(t*(.65+(i%5)*.035)+i*.071)%1,curve=f.jets[i%8];curve.getPoint(u,p);const spread=.013+u*.035;p.x+=Math.sin(i*29+t*2)*spread;p.z+=Math.cos(i*19)*spread;p.toArray(f.positions,i*3);}
 f.mist.geometry.setDrawRange(0,n);f.mist.geometry.attributes.position.needsUpdate=true;
}
export function disposeFountain(world){if(!world.fountain)return;for(const m of world.fountain.materials)m.dispose();world.fountain=null;}
