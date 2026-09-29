import {daylightSky} from './daylight-sky.js';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PRESETS } from './settings.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export class View {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#c5ddd8');
    this.scene.fog = new THREE.FogExp2('#c5ddd8', 0.0025);
    this.camera = new THREE.PerspectiveCamera(53, innerWidth / innerHeight, 0.12, 620);
    this.camera.position.set(9, 7, 28);
    this.hemi = new THREE.HemisphereLight('#e6f1fa', '#83925e', 1.75); this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#fff0d3', 2.55); this.sun.position.set(-32, 55, 26);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 130 });
    this.sun.shadow.normalBias = 0.035; this.sun.shadow.bias = -0.0002;
    this.sun.shadow.radius = 3; this.scene.add(this.sun, this.sun.target);
    this.sky=daylightSky();this.scene.add(this.sky);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.ao = new GTAOPass(this.scene,this.camera,Math.round(innerWidth/2),Math.round(innerHeight/2)); this.ao.blendIntensity=.35; this.composer.addPass(this.ao);
    const pmrem=new THREE.PMREMGenerator(this.renderer), room=new RoomEnvironment(); this.environment=pmrem.fromScene(room,.06); this.scene.environment=this.environment.texture; this.scene.environmentIntensity=.32; room.dispose(); pmrem.dispose();
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.17, 0.55, 1.08); this.composer.addPass(this.bloom);
    this.vignette = new ShaderPass({ uniforms: { tDiffuse: { value: null }, strength: { value: 0.23 } }, vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'uniform sampler2D tDiffuse;uniform float strength;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);float v=length((vUv-.5)*vec2(1.,.85));c.rgb*=1.-smoothstep(.23,.73,v)*strength;gl_FragColor=c;}' });
    this.composer.addPass(this.vignette); this.composer.addPass(new OutputPass());
    this.quality = 'high'; this.settings={...PRESETS.high};
    window.addEventListener('resize', () => this.resize());
  }
  resize() {
    this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight); this.composer.setSize(innerWidth, innerHeight); if(this.ao)this.ao.setSize(Math.round(innerWidth*this.renderer.getPixelRatio()/2),Math.round(innerHeight*this.renderer.getPixelRatio()/2));
  }
  setQuality(value) {
    const q=typeof value==='string'?PRESETS[value]:value;
    this.settings=q;this.quality=q.preset||'custom';
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)*q.resolution);
    this.renderer.shadowMap.enabled=q.shadow>0;
    const size=q.shadow||1024;if(this.sun.shadow.mapSize.x!==size){this.sun.shadow.mapSize.set(size,size);this.sun.shadow.map?.dispose();this.sun.shadow.map=null;}
    this.ao.enabled=!!q.ao;this.bloom.enabled=!!q.bloom;this.camera.far=720;this.camera.updateProjectionMatrix();this.resize();
  }

  updateLight(position, theme) {
    const dark=['cave','shrine','deep','core'].includes(theme),inside=theme==='interior';
    this.sun.position.set(position.x-22,position.y+42,position.z+25);this.sun.target.position.copy(position);
    this.sky.visible=!dark&&!inside;this.sky.position.copy(position);this.sky.scale.setScalar(1);this.sky.material.uniforms.time.value=performance.now()/1000;this.vignette.uniforms.strength.value=dark?.17:.07;
    const color=dark?(theme==='core'?'#222337':theme==='deep'?'#272d38':'#38414b'):inside?'#605749':'#d8eddf';
    this.scene.background.set(color);this.scene.fog.color.set(color);this.scene.fog.density=dark?.022:inside?.014:.0025;
    this.hemi.color.set(dark?'#a7b6cc':'#eaf5ff');this.hemi.groundColor.set(dark?'#504359':'#a0a975');this.hemi.intensity=dark?1.05:inside?1.6:2.05;
    this.sun.color.set(dark?'#b1bcdb':'#fff0d3');this.sun.intensity=dark?.75:inside?1.2:2.85;
    this.renderer.toneMappingExposure=(dark?1.22:1.13)*(this.settings.brightness||1);
  }

  render() { this.settings.ao||this.settings.bloom ? this.composer.render() : this.renderer.render(this.scene, this.camera); }
}
