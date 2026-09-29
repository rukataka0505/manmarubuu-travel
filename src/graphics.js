import * as THREE from 'three';

export const TAU = Math.PI * 2;
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const lerp = (a, b, t) => a + (b - a) * t;
export function random(seed = 739) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export const geometries = {
  box: new THREE.BoxGeometry(1, 1, 1),
  ball: new THREE.SphereGeometry(1, 12, 8),
  smooth: new THREE.SphereGeometry(1, 24, 16),
  ico: new THREE.IcosahedronGeometry(1, 1),
  rock: new THREE.IcosahedronGeometry(1, 0),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 10),
  cone: new THREE.ConeGeometry(1, 1, 10),
};
const materialCache = new Map();
export function material(color, options = {}) {
  const key = color + JSON.stringify(options);
  if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...options }));
  return materialCache.get(key);
}
export function shape(parent, geometry, mat, x, y, z, sx = 1, sy = sx, sz = sx) {
  const mesh = new THREE.Mesh(typeof geometry === 'string' ? geometries[geometry] : geometry, typeof mat === 'string' || typeof mat === 'number' ? material(mat) : mat);
  mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
  mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export const box = (p, m, x, y, z, w, h, d) => shape(p, 'box', m, x, y, z, w, h, d);
export function beam(parent, mat, a, b, width = 0.12) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const obj = box(parent, mat, mid.x, mid.y, mid.z, width, start.distanceTo(end), width);
  obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
  return obj;
}
export function group(parent, x = 0, y = 0, z = 0, dynamic = false) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.userData.dynamic = dynamic; parent.add(g); return g;
}
export function canvasTexture(size, paint) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  paint(canvas.getContext('2d'), size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
export function grainTexture() {
  const rand = random(12);
  return canvasTexture(256, (c, s) => {
    c.fillStyle = '#e8e1c9'; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 22000; i++) {
      const v = 160 + Math.floor(rand() * 80); c.fillStyle = `rgba(${v},${v},${v},0.14)`;
      c.fillRect(rand() * s, rand() * s, 1 + rand() * 2, 1 + rand() * 2);
    }
  });
}
export function cobbleTexture() {
  const rand = random(9);
  const tex = canvasTexture(512, (c, s) => {
    c.fillStyle = '#787a63'; c.fillRect(0, 0, s, s);
    for (let y = -1; y < 9; y++) for (let x = -1; x < 9; x++) {
      const px = x * 64 + (y % 2) * 32, py = y * 64;
      const light = 57 + rand() * 16;
      c.fillStyle = `hsl(43,${10 + rand() * 10}%,${light}%)`;
      c.beginPath(); c.roundRect(px + 3, py + 3, 57, 56, 9); c.fill();
      c.strokeStyle = '#ffffff20'; c.lineWidth = 3; c.stroke();
      for (let j = 0; j < 24; j++) { c.fillStyle = '#49443016'; c.fillRect(px + 7 + rand() * 50, py + 7 + rand() * 48, 3, 2); }
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
export function woodTexture() {
  const rand = random(45);
  const tex = canvasTexture(256, (c, s) => {
    c.fillStyle = '#c9aa83'; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 350; i++) {
      c.strokeStyle = `rgba(74,46,32,${rand() * 0.14})`; c.lineWidth = 0.6 + rand();
      const x = rand() * s; c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 12, 80, x - 10, 150, x, s); c.stroke();
    }
    c.fillStyle = '#64483255'; for (let x = 0; x < s; x += 64) c.fillRect(x, 0, 2, s);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; return tex;
}
export function label(parent, text, x, y, z, width = 2.5, color = '#f8e6b7', background = '#263e35') {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background; ctx.beginPath(); ctx.roundRect(3, 3, 506, 154, 14); ctx.fill();
  ctx.strokeStyle = '#c7aa6e'; ctx.lineWidth = 3; ctx.strokeRect(13, 13, 486, 134);
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '600 48px "Yu Gothic", sans-serif'; ctx.fillText(text, 256, 80, 458);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 160 / 512), new THREE.MeshStandardMaterial({ map: tex, roughness: 1, side: THREE.DoubleSide }));
  mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
export function sprite(parent, text, color = '#ffdf81', size = 0.8) {
  const tex = canvasTexture(128, (c) => { c.font = 'bold 92px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color; c.shadowBlur = 10; c.shadowColor = '#172b20'; c.fillText(text, 64, 66); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false })); s.scale.setScalar(size); parent.add(s); return s;
}

// Collapse thousands of static decorative pieces into instanced draw calls.
// Anything under a dynamic group retains its object hierarchy and animation.
export function batchStatics(root) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert();
  const buckets = new Map();
  const visit = object => {
    if (object.userData.dynamic) return;
    if (object.isMesh && !object.isInstancedMesh && !Array.isArray(object.material)) {
      const key = `${object.geometry.uuid}:${object.material.uuid}:${object.castShadow}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(object);
    }
    for (const child of object.children) visit(child);
  };
  for (const child of root.children) visit(child);
  for (const meshes of buckets.values()) {
    if (meshes.length < 3) continue;
    const instance = new THREE.InstancedMesh(meshes[0].geometry, meshes[0].material, meshes.length);
    instance.castShadow = meshes[0].castShadow; instance.receiveShadow = true;
    meshes.forEach((mesh, i) => { instance.setMatrixAt(i, new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld)); mesh.removeFromParent(); });
    instance.computeBoundingSphere(); root.add(instance);
  }
}
