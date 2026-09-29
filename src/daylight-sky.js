import * as THREE from 'three';

export function daylightSky(){
 const material=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,toneMapped:false,
  uniforms:{time:{value:0},sun:{value:new THREE.Vector3(-22,42,25).normalize()}},
  vertexShader:`varying vec3 skyDirection;void main(){skyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform float time;uniform vec3 sun;varying vec3 skyDirection;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
  float fbm(vec2 p){return noise(p)*.54+noise(p*2.03+4.7)*.27+noise(p*4.09+8.2)*.13+noise(p*8.1)*.06;}
  void main(){
   vec3 d=normalize(skyDirection);float h=pow(max(d.y,0.),.45);
   vec3 color=mix(vec3(.77,.91,.91),vec3(.12,.47,.89),h);
   float s=max(dot(d,sun),0.);color+=vec3(1.,.87,.58)*pow(s,1100.)*1.3+vec3(.22,.16,.06)*pow(s,22.);
   vec2 p=d.xz/max(.10,d.y+.15)*1.8+vec2(time*.007,time*.002);
   float density=fbm(p),cloud=smoothstep(.49,.68,density)*smoothstep(.025,.20,d.y);
   float rim=smoothstep(.49,.59,density)*(1.-smoothstep(.59,.68,density));
   vec3 white=mix(vec3(.72,.82,.88),vec3(1.,.985,.93),smoothstep(.49,.64,density));
   color=mix(color,white+rim*pow(s,7.)*.15,cloud*.96);
   gl_FragColor=vec4(color,1.);
   #include <colorspace_fragment>
  }`,
 });
 const sky=new THREE.Mesh(new THREE.SphereGeometry(550,32,16),material);sky.name='Bright moving cloud sky';sky.frustumCulled=false;return sky;
}
