/**
 * Miniature / tilt-shift realtime bedroom demo
 * Soft warm studio light + dual-band blur DoF (tilt-shift)
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const L = {
  room: { w: 4.47, d: 3.40, h: 2.65 },
  bed: { x: 0, z: 1.60, w: 2.00, d: 1.80, h: 0.49, surfaceHeight: 0.62 },
  desk: { x: 0, z: 0, w: 1.98, d: 0.70, h: 0.75 },
  vanity: { x: 2.0, z: 0, w: 0.48, d: 0.40, h: 0.75 },
  lowCabinet: { x: 2.49, z: 0, w: 1.34, d: 0.40, h: 0.43 },
  catHouse: { x: 2.02, z: 1.60, w: 0.38, d: 0.64, h: 0.84 },
  sofa: { x: 2.41, z: 2.76, w: 1.15, d: 0.64, h: 0.79 },
  rug: { x: 2.42, z: 1.62, w: 1.11, d: 1.12, h: 0.015 },
  wardrobe: { x: 4.10, z: 1.6, w: 0.37, d: 1.80, h: 2.25 },
  curtain: { x: 2.00, z: 1.60, length: 1.80, bottom: 0.62, top: 2.48 },
  window: { wall: 'west', z: 0.73, width: 1.77, bottom: 0.92, top: 2.21 },
};

const ROOM_CX = L.room.w * 0.5;
const ROOM_CZ = L.room.d * 0.5;

const state = {
  tiltShift: true,
  preset: 'day',
  autoOrbit: false,
  blurStrength: 1.8,
  focusCenter: 0.48,
  focusBand: 0.18,
};

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.setClearColor(0xf5efe4, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf3ebe0);
scene.fog = new THREE.Fog(0xf3ebe0, 14, 28);

const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 80);
// High / angled "diorama" view
const DEFAULT_CAM = {
  pos: new THREE.Vector3(6.4, 5.2, 6.0),
  target: new THREE.Vector3(ROOM_CX, 0.55, ROOM_CZ * 0.9),
};
camera.position.copy(DEFAULT_CAM.pos);

const controls = new OrbitControls(camera, canvas);
controls.target.copy(DEFAULT_CAM.target);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 4.0;
controls.maxDistance = 14;
controls.maxPolarAngle = Math.PI * 0.42;
controls.minPolarAngle = Math.PI * 0.08;
controls.update();
const BASE_MAX_DIST = controls.maxDistance;
let camScale = 1;

// Soft warm studio lighting
const hemi = new THREE.HemisphereLight(0xfff5e8, 0xd4c4a8, 0.85);
scene.add(hemi);

const ambient = new THREE.AmbientLight(0xfff8f0, 0.45);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff0d8, 1.55);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 30;
sun.shadow.camera.left = -7;
sun.shadow.camera.right = 7;
sun.shadow.camera.top = 7;
sun.shadow.camera.bottom = -7;
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.03;
sun.shadow.radius = 3.5;
scene.add(sun);
scene.add(sun.target);

const fill = new THREE.DirectionalLight(0xffe8d0, 0.55);
fill.position.set(5, 4, 3);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xd8e8ff, 0.25);
rim.position.set(-4, 3, -2);
scene.add(rim);

function applyLightPreset(name) {
  state.preset = name;
  if (name === 'day') {
    scene.background.set(0xf3ebe0);
    if (scene.fog) scene.fog.color.set(0xf3ebe0);
    hemi.intensity = 0.85;
    ambient.intensity = 0.45;
    sun.color.set(0xfff0d8);
    sun.intensity = 1.55;
    sun.position.set(-2.8, 8.0, 4.0);
    sun.target.position.set(ROOM_CX, 0.3, ROOM_CZ);
    fill.intensity = 0.55;
    fill.color.set(0xffe8d0);
    rim.intensity = 0.25;
    renderer.toneMappingExposure = 1.15;
  } else {
    scene.background.set(0xd8dce8);
    if (scene.fog) scene.fog.color.set(0xd8dce8);
    hemi.intensity = 0.55;
    ambient.intensity = 0.35;
    sun.color.set(0xc8d4f0);
    sun.intensity = 1.15;
    sun.position.set(4.0, 6.5, 1.5);
    sun.target.position.set(ROOM_CX, 0.4, ROOM_CZ);
    fill.intensity = 0.45;
    fill.color.set(0xb0c0e8);
    rim.intensity = 0.35;
    renderer.toneMappingExposure = 1.05;
  }
  sun.target.updateMatrixWorld();
}
applyLightPreset('day');

function mat(hex, opts = {}) {
  // Lambert is much cheaper on SwiftShader; keep bright readable colors
  const { roughness, metalness, emissive, emissiveIntensity, ...rest } = opts;
  const m = new THREE.MeshLambertMaterial({ color: hex, ...rest });
  if (emissive != null) {
    m.emissive = new THREE.Color(emissive);
    m.emissiveIntensity = emissiveIntensity ?? 1;
  }
  return m;
}

const mats = {
  wall: mat(0xfff8f0, { roughness: 0.92 }),
  wallInner: mat(0xf5eee4, { roughness: 0.9 }),
  floor: mat(0xe8d4b0, { roughness: 0.7 }),
  floorStripe: mat(0xd0ba92, { roughness: 0.75 }),
  bedFrame: mat(0xc4a882, { roughness: 0.65 }),
  mattress: mat(0xf0e8dc, { roughness: 0.88 }),
  quiltA: mat(0xf2c4c8, { roughness: 0.9 }),
  quiltB: mat(0xc8dce8, { roughness: 0.9 }),
  quiltC: mat(0xe8e0a8, { roughness: 0.9 }),
  quiltD: mat(0xb8d8c0, { roughness: 0.9 }),
  pillow: mat(0xfff8f0, { roughness: 0.9 }),
  desk: mat(0xd4b896, { roughness: 0.6 }),
  deskTop: mat(0xe0c8a4, { roughness: 0.55 }),
  monitor: mat(0xf0f0f2, { roughness: 0.4, metalness: 0.15 }),
  screen: mat(0xa8c8d8, { roughness: 0.35, emissive: 0x304050, emissiveIntensity: 0.15 }),
  cabinet: mat(0xfaf4ea, { roughness: 0.7 }),
  appliance: mat(0xe8e4dc, { roughness: 0.45 }),
  applianceDark: mat(0x9a968c, { roughness: 0.5 }),
  sofa: mat(0xf0e4d4, { roughness: 0.88 }),
  sofaDark: mat(0xd4c4b0, { roughness: 0.88 }),
  catHouse: mat(0xd4b090, { roughness: 0.75 }),
  wardrobe: mat(0xf2e8d8, { roughness: 0.68 }),
  rug: mat(0xf0b8c0, { roughness: 0.95 }),
  trim: mat(0xb89870, { roughness: 0.55 }),
  black: mat(0x4a4440, { roughness: 0.6 }),
  plant: mat(0x6a9a68, { roughness: 0.85 }),
  pot: mat(0xc87858, { roughness: 0.7 }),
};

function box(w, h, d, material, x, y, z, parent = scene, scale = 1.06) {
  // Slightly chunky "toy" proportions
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w * scale, h * scale, d * scale),
    material
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addFloorPlanks() {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(L.room.w, L.room.d), mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(ROOM_CX, 0.001, ROOM_CZ);
  floor.receiveShadow = true;
  g.add(floor);
  const plankW = 0.18;
  const n = Math.floor(L.room.w / plankW);
  for (let i = 1; i < n; i++) {
    const groove = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.003, L.room.d * 0.995),
      mats.floorStripe
    );
    groove.position.set(i * plankW, 0.003, ROOM_CZ);
    groove.receiveShadow = true;
    g.add(groove);
  }
  scene.add(g);
}

function addWalls() {
  const t = 0.07;
  const H = L.room.h;
  const W = L.room.w;
  const D = L.room.d;
  box(W + t, H, t, mats.wall, ROOM_CX, H / 2, -t / 2, scene, 1);

  const win = L.window;
  const winW = Math.min(win.width, D - win.z - 0.15);
  const winZ0 = win.z;
  const winZ1 = win.z + winW;
  const winBot = win.bottom;
  const winTop = win.top;

  box(t, winBot, winW, mats.wall, -t / 2, winBot / 2, (winZ0 + winZ1) / 2, scene, 1);
  const aboveH = H - winTop;
  box(t, aboveH, winW, mats.wall, -t / 2, winTop + aboveH / 2, (winZ0 + winZ1) / 2, scene, 1);
  if (winZ0 > 0.02) box(t, H, winZ0, mats.wall, -t / 2, H / 2, winZ0 / 2, scene, 1);
  const southD = D - winZ1;
  if (southD > 0.02) box(t, H, southD, mats.wall, -t / 2, H / 2, winZ1 + southD / 2, scene, 1);

  const frame = mats.trim;
  const fw = 0.045;
  box(fw, winTop - winBot, fw, frame, 0.01, (winBot + winTop) / 2, winZ0, scene, 1);
  box(fw, winTop - winBot, fw, frame, 0.01, (winBot + winTop) / 2, winZ1, scene, 1);
  box(fw, fw, winW, frame, 0.01, winBot, (winZ0 + winZ1) / 2, scene, 1);
  box(fw, fw, winW, frame, 0.01, winTop, (winZ0 + winZ1) / 2, scene, 1);
  box(fw * 0.7, winTop - winBot, fw * 0.7, frame, 0.015, (winBot + winTop) / 2, (winZ0 + winZ1) / 2, scene, 1);

  // Soft sky beyond window
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(winW * 0.95, (winTop - winBot) * 0.95),
    new THREE.MeshBasicMaterial({ color: 0xb8d4e8 })
  );
  sky.rotation.y = Math.PI / 2;
  sky.position.set(-0.04, (winBot + winTop) / 2, (winZ0 + winZ1) / 2);
  scene.add(sky);

  box(t, H * 0.35, D * 0.15, mats.wallInner, W + t / 2, H * 0.175, D * 0.08, scene, 1);
}

function makeCatCurtainTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f2e8d8';
  ctx.fillRect(0, 0, 256, 512);
  ctx.fillStyle = '#e8dcc8';
  for (let x = 0; x < 256; x += 28) ctx.fillRect(x, 0, 8, 512);
  // soft hearts
  ctx.fillStyle = '#e89090';
  for (let i = 0; i < 12; i++) {
    const hx = 30 + (i % 4) * 55;
    const hy = 60 + Math.floor(i / 4) * 140;
    ctx.beginPath();
    ctx.arc(hx - 6, hy, 7, 0, Math.PI * 2);
    ctx.arc(hx + 6, hy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx - 13, hy + 2);
    ctx.lineTo(hx, hy + 16);
    ctx.lineTo(hx + 13, hy + 2);
    ctx.fill();
  }
  // cat face
  const cx = 128, cy = 280;
  ctx.fillStyle = '#2a2418';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 48, 42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 38, cy - 28); ctx.lineTo(cx - 52, cy - 70); ctx.lineTo(cx - 12, cy - 38); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 38, cy - 28); ctx.lineTo(cx + 52, cy - 70); ctx.lineTo(cx + 12, cy - 38); ctx.fill();
  ctx.fillStyle = '#f5a030';
  ctx.beginPath(); ctx.ellipse(cx - 18, cy - 4, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 18, cy - 4, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(cx - 18, cy - 2, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 18, cy - 2, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e87878';
  ctx.beginPath(); ctx.ellipse(cx, cy + 14, 6, 4, 0, 0, Math.PI * 2); ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function plant(x, y, z, s = 1) {
  box(0.08 * s, 0.1 * s, 0.08 * s, mats.pot, x, y + 0.05 * s, z, scene, 1);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.1 * s, 10, 8), mats.plant);
  leaf.position.set(x, y + 0.18 * s, z);
  leaf.scale.set(1, 1.3, 1);
  leaf.castShadow = true;
  scene.add(leaf);
}

function addFurniture() {
  const b = L.bed;
  box(b.w, b.h * 0.55, b.d, mats.bedFrame, b.x + b.w / 2, (b.h * 0.55) / 2, b.z + b.d / 2);
  // quilt patches
  const qw = b.w * 0.94, qd = b.d * 0.9;
  const patches = [mats.quiltA, mats.quiltB, mats.quiltC, mats.quiltD];
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      box(qw / 2 - 0.02, 0.08, qd / 2 - 0.02, patches[i * 2 + j],
        b.x + b.w / 2 - qw / 4 + i * (qw / 2),
        b.surfaceHeight - 0.02,
        b.z + b.d / 2 - qd / 4 + j * (qd / 2), scene, 1);
    }
  }
  box(0.5, 0.14, 0.36, mats.pillow, b.x + 0.5, b.surfaceHeight + 0.08, b.z + 0.38, scene, 1.02);
  box(0.5, 0.14, 0.36, mats.pillow, b.x + 1.2, b.surfaceHeight + 0.08, b.z + 0.38, scene, 1.02);

  const d = L.desk;
  box(d.w, d.h * 0.08, d.d, mats.deskTop, d.x + d.w / 2, d.h, d.z + d.d / 2);
  const leg = 0.07;
  const ly = d.h * 0.46;
  [[0.1, 0.1], [d.w - 0.1, 0.1], [0.1, d.d - 0.1], [d.w - 0.1, d.d - 0.1]].forEach(([lx, lz]) => {
    box(leg, d.h * 0.9, leg, mats.desk, d.x + lx, ly, d.z + lz);
  });
  box(0.52, 0.34, 0.05, mats.monitor, d.x + 0.7, d.h + 0.28, d.z + 0.25);
  box(0.44, 0.26, 0.02, mats.screen, d.x + 0.7, d.h + 0.28, d.z + 0.285, scene, 1);
  box(0.14, 0.1, 0.08, mats.monitor, d.x + 0.7, d.h + 0.06, d.z + 0.22);
  plant(d.x + 1.5, d.h, d.z + 0.35, 0.9);

  const v = L.vanity;
  box(v.w, v.h, v.d, mats.cabinet, v.x + v.w / 2, v.h / 2, v.z + v.d / 2);

  const lc = L.lowCabinet;
  box(lc.w, lc.h, lc.d, mats.cabinet, lc.x + lc.w / 2, lc.h / 2, lc.z + lc.d / 2);
  [
    { w: 0.28, h: 0.3, d: 0.28, ox: 0.2, mat: mats.appliance },
    { w: 0.3, h: 0.26, d: 0.28, ox: 0.58, mat: mats.applianceDark },
    { w: 0.22, h: 0.34, d: 0.22, ox: 0.98, mat: mats.appliance },
  ].forEach((a) => {
    box(a.w, a.h, a.d, a.mat, lc.x + a.ox + a.w / 2, lc.h + a.h / 2, lc.z + lc.d / 2);
  });

  const curtainTex = makeCatCurtainTexture();
  const curtainMat = new THREE.MeshLambertMaterial({
    map: curtainTex, side: THREE.DoubleSide,
  });
  const ch = L.curtain.top - L.curtain.bottom;
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(L.curtain.length, ch), curtainMat);
  curtain.rotation.y = Math.PI / 2;
  curtain.position.set(L.curtain.x + 0.02, L.curtain.bottom + ch / 2, L.curtain.z + L.curtain.length / 2);
  curtain.castShadow = true;
  curtain.receiveShadow = true;
  scene.add(curtain);
  box(0.05, 0.05, L.curtain.length + 0.12, mats.trim, L.curtain.x + 0.02, L.curtain.top + 0.02, L.curtain.z + L.curtain.length / 2, scene, 1);

  const chouse = L.catHouse;
  box(chouse.w, chouse.h, chouse.d, mats.catHouse, chouse.x + chouse.w / 2, chouse.h / 2, chouse.z + chouse.d / 2);
  box(0.02, chouse.h * 0.35, chouse.d * 0.4, mats.black, chouse.x + chouse.w - 0.01, chouse.h * 0.35, chouse.z + chouse.d / 2, scene, 1);

  const s = L.sofa;
  box(s.w, s.h * 0.42, s.d, mats.sofa, s.x + s.w / 2, (s.h * 0.42) / 2, s.z + s.d / 2);
  box(s.w, s.h * 0.38, 0.14, mats.sofaDark, s.x + s.w / 2, s.h * 0.42 + (s.h * 0.38) / 2, s.z + s.d - 0.07);
  box(0.14, s.h * 0.35, s.d * 0.9, mats.sofaDark, s.x + 0.07, s.h * 0.42 + (s.h * 0.35) / 2, s.z + s.d / 2);
  box(0.14, s.h * 0.35, s.d * 0.9, mats.sofaDark, s.x + s.w - 0.07, s.h * 0.42 + (s.h * 0.35) / 2, s.z + s.d / 2);

  const r = L.rug;
  const rugMesh = new THREE.Mesh(new THREE.CylinderGeometry(r.w * 0.52, r.w * 0.52, r.h * 2, 32), mats.rug);
  rugMesh.position.set(r.x + r.w / 2, r.h, r.z + r.d / 2);
  rugMesh.receiveShadow = true;
  scene.add(rugMesh);

  const w = L.wardrobe;
  box(w.w, w.h, w.d, mats.wardrobe, w.x + w.w / 2, w.h / 2, w.z + w.d / 2);
  box(0.012, w.h * 0.88, 0.012, mats.trim, w.x + 0.02, w.h / 2, w.z + w.d / 2, scene, 1);

  box(0.9, 0.05, 0.22, mats.trim, 1.0, 1.55, 0.14, scene, 1);
  for (let i = 0; i < 7; i++) {
    const bh = 0.16 + (i % 3) * 0.04;
    const cols = [0xc87868, 0x6898b8, 0xd8c060, 0x78a878];
    box(0.09, bh, 0.16, mat(cols[i % 4]), 0.65 + i * 0.11, 1.55 + bh / 2 + 0.02, 0.14, scene, 1);
  }
  plant(0.35, 0, 0.35, 1.1);
  plant(3.6, 0, 2.9, 0.85);
}

addFloorPlanks();
addWalls();
addFurniture();

// --- Tilt-shift post: dual-band separable blur ---
const rtScene = new THREE.WebGLRenderTarget(1, 1, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.UnsignedByteType,
  depthBuffer: true,
});
rtScene.texture.colorSpace = THREE.SRGBColorSpace;

const rtBlurH = new THREE.WebGLRenderTarget(1, 1, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
});
rtBlurH.texture.colorSpace = THREE.SRGBColorSpace;

const rtBlurV = new THREE.WebGLRenderTarget(1, 1, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
});
rtBlurV.texture.colorSpace = THREE.SRGBColorSpace;

const blurFrag = /* glsl */ `
precision highp float;
uniform sampler2D tDiffuse;
uniform vec2 direction;
uniform float strength;
varying vec2 vUv;
void main() {
  vec2 px = direction * strength;
  vec4 c = texture2D(tDiffuse, vUv) * 0.2941176;
  c += texture2D(tDiffuse, vUv + px * 1.0) * 0.2352941;
  c += texture2D(tDiffuse, vUv - px * 1.0) * 0.2352941;
  c += texture2D(tDiffuse, vUv + px * 2.0) * 0.1176470;
  c += texture2D(tDiffuse, vUv - px * 2.0) * 0.1176470;
  gl_FragColor = c;
}
`;

const combineFrag = /* glsl */ `
precision highp float;
uniform sampler2D tSharp;
uniform sampler2D tBlur;
uniform float focusCenter;
uniform float focusBand;
uniform float enabled;
varying vec2 vUv;
void main() {
  vec4 sharp = texture2D(tSharp, vUv);
  vec4 blur = texture2D(tBlur, vUv);
  float d = abs(vUv.y - focusCenter);
  float w = smoothstep(focusBand * 0.55, focusBand * 1.6, d);
  // slight extra blur toward edges of frame (miniature vignette)
  float edge = length(vUv - vec2(0.5));
  w = clamp(w + smoothstep(0.42, 0.72, edge) * 0.35, 0.0, 1.0);
  vec4 outc = mix(sharp, blur, w * enabled);
  // soft warm grade
  outc.rgb = mix(outc.rgb, outc.rgb * vec3(1.04, 1.0, 0.94), 0.25);
  gl_FragColor = outc;
}
`;

const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const blurMat = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: null },
    direction: { value: new THREE.Vector2(0, 0) },
    strength: { value: 1 },
  },
  vertexShader: vert,
  fragmentShader: blurFrag,
  depthTest: false,
  depthWrite: false,
});

const combineMat = new THREE.ShaderMaterial({
  uniforms: {
    tSharp: { value: null },
    tBlur: { value: null },
    focusCenter: { value: state.focusCenter },
    focusBand: { value: state.focusBand },
    enabled: { value: 1 },
  },
  vertexShader: vert,
  fragmentShader: combineFrag,
  depthTest: false,
  depthWrite: false,
});

const postScene = new THREE.Scene();
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurMat);
postScene.add(postQuad);

function resize() {
  const w = Math.max(1, window.innerWidth);
  const h = Math.max(1, window.innerHeight);
  camera.aspect = w / h;
  // 竖屏适配：放大视角，并让默认机位后退，保证整间房在手机竖屏里能看全
  const a = camera.aspect;
  camera.fov = a < 1 ? Math.min(36 * 1.45, 36 / Math.pow(a, 0.5)) : 36;
  camScale = a < 1 ? Math.min(1.6, 1 / Math.pow(a, 0.35)) : 1;
  controls.maxDistance = BASE_MAX_DIST * camScale;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  const pr = renderer.getPixelRatio();
  const rw = Math.floor(w * pr);
  const rh = Math.floor(h * pr);
  rtScene.setSize(rw, rh);
  const hw = Math.max(1, Math.floor(rw / 4)), hh = Math.max(1, Math.floor(rh / 4));
  rtBlurH.setSize(hw, hh);
  rtBlurV.setSize(hw, hh);
}
window.addEventListener('resize', resize);
resize();
resetView();


function resetView() {
  camera.position.copy(DEFAULT_CAM.pos).sub(DEFAULT_CAM.target).multiplyScalar(camScale).add(DEFAULT_CAM.target);
  controls.target.copy(DEFAULT_CAM.target);
  controls.update();
  state.autoOrbit = false;
}
function syncButtons() {
  const set = (id, on, label) => { const b = document.getElementById(id); if (!b) return; b.classList.toggle('active', !!on); if (label) b.querySelector('.lbl').textContent = label; };
  set('bTilt', state.tiltShift, state.tiltShift ? '景深 开' : '景深 关');
  set('bDayNight', state.preset === 'night', state.preset === 'day' ? '日间' : '夜间');
  set('bOrbit', state.autoOrbit, state.autoOrbit ? '绕转中' : '自动绕转');
}
function bindButtons() {
  const on = (id, fn) => { const b = document.getElementById(id); if (b) b.addEventListener('click', (e) => { e.preventDefault(); fn(); syncHud(); }); };
  on('bTilt', () => { state.tiltShift = !state.tiltShift; });
  on('bDayNight', () => applyLightPreset(state.preset === 'day' ? 'night' : 'day'));
  on('bOrbit', () => { state.autoOrbit = !state.autoOrbit; });
  on('bReset', resetView);
  // 手指触碰画布时停止自动绕转，交给手动控制
  controls.addEventListener('start', () => { if (state.autoOrbit) { state.autoOrbit = false; syncHud(); } });
}

function syncHud() {
  const sF = document.getElementById('sF');
  if (sF) { sF.textContent = state.tiltShift ? '开' : '关'; sF.className = state.tiltShift ? 'on' : 'off'; }
  syncButtons();
  combineMat.uniforms.enabled.value = state.tiltShift ? 1 : 0;
  combineMat.uniforms.focusCenter.value = state.focusCenter;
  combineMat.uniforms.focusBand.value = state.focusBand;
}
syncHud();

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'f') state.tiltShift = !state.tiltShift;
  else if (k === '1') applyLightPreset('day');
  else if (k === '2') applyLightPreset('night');
  else if (k === 'r') resetView(); else if (k === 'o') state.autoOrbit = !state.autoOrbit;
  else return;
  syncHud();
});

bindButtons();

const params = new URLSearchParams(location.search);
if (params.get('preset') === 'night') applyLightPreset('night');
if (params.get('orbit') === '1') state.autoOrbit = true;
syncHud();
if (params.get('tilt') === '0') { state.tiltShift = false; syncHud(); }
if (params.get('hud') === '0') { const h = document.getElementById('hud'); if (h) h.style.display = 'none'; }

window.__mini = {
  state,
  camera,
  controls,
  applyLightPreset,
  setCamera(pos, target) {
    camera.position.set(pos[0], pos[1], pos[2]);
    controls.target.set(target[0], target[1], target[2]);
    controls.update();
  },
  getFPS: () => fpsSmooth,
};

let frames = 0;
let lastFpsT = performance.now();
let fpsSmooth = 0;
const fpsEl = document.getElementById('fps') || { textContent: '' };

function tick(now) {
  requestAnimationFrame(tick);

  if (state.autoOrbit) {
    const t = now * 0.00016;
    const r = 8.0 * camScale;
    const elev = 5.0 * camScale;
    camera.position.x = ROOM_CX + Math.cos(t) * r;
    camera.position.z = ROOM_CZ + Math.sin(t) * r * 0.85;
    camera.position.y = elev;
    controls.target.set(ROOM_CX, 0.55, ROOM_CZ * 0.9);
    controls.update();
  } else {
    controls.update();
  }

  renderer.setRenderTarget(rtScene);
  renderer.clear();
  renderer.render(scene, camera);

  const pr = renderer.getPixelRatio();
  const rw = Math.max(1, Math.floor(window.innerWidth * pr / 4));
  const rh = Math.max(1, Math.floor(window.innerHeight * pr / 4));
  const str = state.blurStrength;

  // H blur → half-res
  postQuad.material = blurMat;
  blurMat.uniforms.tDiffuse.value = rtScene.texture;
  blurMat.uniforms.direction.value.set(1 / rw, 0);
  blurMat.uniforms.strength.value = str;
  renderer.setRenderTarget(rtBlurH);
  renderer.render(postScene, postCam);

  // V blur → half-res
  blurMat.uniforms.tDiffuse.value = rtBlurH.texture;
  blurMat.uniforms.direction.value.set(0, 1 / rh);
  blurMat.uniforms.strength.value = str;
  renderer.setRenderTarget(rtBlurV);
  renderer.render(postScene, postCam);

  postQuad.material = combineMat;
  combineMat.uniforms.tSharp.value = rtScene.texture;
  combineMat.uniforms.tBlur.value = rtBlurV.texture;
  renderer.setRenderTarget(null);
  renderer.render(postScene, postCam);

  frames++;
  if (now - lastFpsT > 500) {
    fpsSmooth = Math.round((frames * 1000) / (now - lastFpsT));
    fpsEl.textContent = String(fpsSmooth);
    frames = 0;
    lastFpsT = now;
  }
}
requestAnimationFrame(tick);
