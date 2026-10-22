/**
 * American cartoon / Saturday-morning toon bedroom demo
 * MeshToonMaterial + inverted-hull outlines, saturated flat colors
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
  outlines: true,
  toonSteps: 3, // 2 or 3 or 4
  preset: 'day',
  autoOrbit: false,
};

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap; // hard 2-tone shadows
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.setClearColor(0xc8b8e0, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd4c4f0);

const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 80);
const DEFAULT_CAM = {
  pos: new THREE.Vector3(5.8, 4.2, 5.5),
  target: new THREE.Vector3(ROOM_CX, 0.9, ROOM_CZ * 0.95),
};
camera.position.copy(DEFAULT_CAM.pos);

const controls = new OrbitControls(camera, canvas);
controls.target.copy(DEFAULT_CAM.target);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 3.2;
controls.maxDistance = 12;
controls.maxPolarAngle = Math.PI * 0.46;
controls.minPolarAngle = Math.PI * 0.12;
controls.update();
const BASE_MAX_DIST = controls.maxDistance;
let camScale = 1;

// Bright cheerful lighting
const ambient = new THREE.AmbientLight(0xfff0ff, 0.72);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff5e0, 1.9);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 30;
sun.shadow.camera.left = -6;
sun.shadow.camera.right = 6;
sun.shadow.camera.top = 6;
sun.shadow.camera.bottom = -6;
sun.shadow.bias = -0.001;
scene.add(sun);
scene.add(sun.target);

const fill = new THREE.DirectionalLight(0xe0d0ff, 0.55);
fill.position.set(4, 3, 5);
scene.add(fill);

function applyLightPreset(name) {
  state.preset = name;
  if (name === 'day') {
    scene.background.set(0xd4c4f0);
    ambient.intensity = 0.72;
    ambient.color.set(0xfff0ff);
    sun.color.set(0xfff5e0);
    sun.intensity = 1.9;
    sun.position.set(-3.0, 7.5, 3.5);
    sun.target.position.set(ROOM_CX, 0.4, ROOM_CZ);
    fill.intensity = 0.55;
  } else {
    scene.background.set(0x6878a8);
    ambient.intensity = 0.5;
    ambient.color.set(0xc0d0ff);
    sun.color.set(0xb0c0e8);
    sun.intensity = 1.4;
    sun.position.set(4.2, 6.0, 1.2);
    sun.target.position.set(ROOM_CX, 0.5, ROOM_CZ);
    fill.intensity = 0.45;
  }
  sun.target.updateMatrixWorld();
}
applyLightPreset('day');

// Toon gradient maps
function makeGradientMap(steps) {
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) {
    data[i] = Math.round((i / (steps - 1)) * 255);
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

let gradientMap = makeGradientMap(state.toonSteps);
const toonMats = [];
const outlineMeshes = [];

const OUTLINE_COLOR = 0x2a1840;
const outlineMat = new THREE.MeshBasicMaterial({
  color: OUTLINE_COLOR,
  side: THREE.BackSide,
});

function toon(hex) {
  const m = new THREE.MeshToonMaterial({
    color: hex,
    gradientMap,
  });
  m.userData.baseHex = hex;
  toonMats.push(m);
  return m;
}

function setToonSteps(n) {
  state.toonSteps = n;
  gradientMap = makeGradientMap(n);
  toonMats.forEach((m) => {
    m.gradientMap = gradientMap;
    m.needsUpdate = true;
  });
}

const mats = {
  wall: toon(0xe8d8f8),
  wallInner: toon(0xddd0f0),
  floor: toon(0xf0c8a0),
  floorStripe: toon(0xe0b088),
  bedFrame: toon(0xe05050),
  mattress: toon(0x7060a0),
  blanket: toon(0xf0c040),
  sheet: toon(0xf8f4f0),
  pillow: toon(0xa8d8f0),
  desk: toon(0xe87050),
  deskTop: toon(0xf08860),
  monitor: toon(0x4050a0),
  screen: toon(0x50c8f0),
  cabinet: toon(0xf8e8d0),
  appliance: toon(0x70c8c0),
  applianceDark: toon(0x5080c0),
  sofa: toon(0xf080a0),
  sofaDark: toon(0xd06088),
  catHouse: toon(0xe09050),
  wardrobe: toon(0x40b8b0),
  wardrobeDoor: toon(0x9070c0),
  rug: toon(0x40c0c0),
  rugInner: toon(0x3080c8),
  trim: toon(0xf0a030),
  black: toon(0x3a2850),
  plant: toon(0x50c060),
  pot: toon(0xe07040),
};

function addOutline(mesh, scale = 1.06) {
  const geo = mesh.geometry;
  const outline = new THREE.Mesh(geo, outlineMat);
  outline.scale.copy(mesh.scale).multiplyScalar(scale);
  outline.position.copy(mesh.position);
  outline.rotation.copy(mesh.rotation);
  outline.castShadow = false;
  outline.receiveShadow = false;
  outline.userData.isOutline = true;
  // Parent to same parent later — attach as child so transforms follow
  mesh.add(outline);
  // Reset local transform for child
  outline.position.set(0, 0, 0);
  outline.rotation.set(0, 0, 0);
  outline.scale.set(scale, scale, scale);
  outlineMeshes.push(outline);
  return outline;
}

function box(w, h, d, material, x, y, z, parent = scene, outlineScale = 1.055) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  if (outlineScale > 0) addOutline(mesh, outlineScale);
  return mesh;
}

function addFloorPlanks() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(L.room.w, L.room.d), mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(ROOM_CX, 0.001, ROOM_CZ);
  floor.receiveShadow = true;
  scene.add(floor);
  // no outline on floor plane
  const plankW = 0.22;
  const n = Math.floor(L.room.w / plankW);
  for (let i = 1; i < n; i++) {
    box(0.02, 0.004, L.room.d * 0.995, mats.floorStripe, i * plankW, 0.004, ROOM_CZ, scene, 0);
  }
}

function addWalls() {
  const t = 0.08;
  const H = L.room.h, W = L.room.w, D = L.room.d;
  box(W + t, H, t, mats.wall, ROOM_CX, H / 2, -t / 2, scene, 1.02);

  const win = L.window;
  const winW = Math.min(win.width, D - win.z - 0.15);
  const winZ0 = win.z, winZ1 = win.z + winW;
  const winBot = win.bottom, winTop = win.top;

  box(t, winBot, winW, mats.wall, -t / 2, winBot / 2, (winZ0 + winZ1) / 2, scene, 1.02);
  const aboveH = H - winTop;
  box(t, aboveH, winW, mats.wall, -t / 2, winTop + aboveH / 2, (winZ0 + winZ1) / 2, scene, 1.02);
  if (winZ0 > 0.02) box(t, H, winZ0, mats.wall, -t / 2, H / 2, winZ0 / 2, scene, 1.02);
  const southD = D - winZ1;
  if (southD > 0.02) box(t, H, southD, mats.wall, -t / 2, H / 2, winZ1 + southD / 2, scene, 1.02);

  const fw = 0.06;
  box(fw, winTop - winBot, fw, mats.trim, 0.02, (winBot + winTop) / 2, winZ0);
  box(fw, winTop - winBot, fw, mats.trim, 0.02, (winBot + winTop) / 2, winZ1);
  box(fw, fw, winW, mats.trim, 0.02, winBot, (winZ0 + winZ1) / 2);
  box(fw, fw, winW, mats.trim, 0.02, winTop, (winZ0 + winZ1) / 2);
  box(fw * 0.8, winTop - winBot, fw * 0.8, mats.trim, 0.025, (winBot + winTop) / 2, (winZ0 + winZ1) / 2);

  // cartoon sky
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(winW * 0.92, (winTop - winBot) * 0.92),
    new THREE.MeshBasicMaterial({ color: 0x58b8f0 })
  );
  sky.rotation.y = Math.PI / 2;
  sky.position.set(-0.05, (winBot + winTop) / 2, (winZ0 + winZ1) / 2);
  scene.add(sky);
  // clouds
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [[-0.2, 0.2], [0.25, -0.15]].forEach(([oy, oz], i) => {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.18 + i * 0.05, 10, 8), cloudMat);
    c.position.set(-0.06, (winBot + winTop) / 2 + oy, (winZ0 + winZ1) / 2 + oz);
    c.scale.set(1.4, 0.7, 1);
    scene.add(c);
  });

  box(t, H * 0.35, D * 0.15, mats.wallInner, W + t / 2, H * 0.175, D * 0.08, scene, 1.02);
}

function makeCatCurtainTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f080b0';
  ctx.fillRect(0, 0, 256, 512);
  const faces = [
    { x: 70, y: 120, col: '#f09040' },
    { x: 180, y: 200, col: '#a0a0b0' },
    { x: 90, y: 320, col: '#f07090' },
    { x: 190, y: 400, col: '#f0c050' },
  ];
  faces.forEach((f) => {
    ctx.fillStyle = f.col;
    ctx.beginPath();
    ctx.ellipse(f.x, f.y, 36, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a1840';
    ctx.lineWidth = 4;
    ctx.stroke();
    // ears
    ctx.beginPath();
    ctx.moveTo(f.x - 28, f.y - 20); ctx.lineTo(f.x - 40, f.y - 55); ctx.lineTo(f.x - 8, f.y - 28);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(f.x + 28, f.y - 20); ctx.lineTo(f.x + 40, f.y - 55); ctx.lineTo(f.x + 8, f.y - 28);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a1840';
    ctx.beginPath(); ctx.arc(f.x - 12, f.y - 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(f.x + 12, f.y - 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(f.x, f.y + 12, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

function addFurniture() {
  const b = L.bed;
  // chunky friendly bed
  box(b.w * 1.02, b.h * 0.5, b.d * 1.02, mats.bedFrame, b.x + b.w / 2, (b.h * 0.5) / 2, b.z + b.d / 2, scene, 1.05);
  // posts with spheres
  [[0.12, 0.12], [b.w - 0.12, 0.12]].forEach(([lx, lz]) => {
    box(0.14, 0.95, 0.14, mats.bedFrame, b.x + lx, 0.48, b.z + lz, scene, 1.08);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), mats.bedFrame);
    knob.position.set(b.x + lx, 1.0, b.z + lz);
    knob.castShadow = true;
    scene.add(knob);
    addOutline(knob, 1.12);
  });
  box(b.w * 0.94, 0.12, b.d * 0.9, mats.mattress, b.x + b.w / 2, b.surfaceHeight - 0.12, b.z + b.d / 2);
  box(b.w * 0.9, 0.16, b.d * 0.7, mats.blanket, b.x + b.w / 2, b.surfaceHeight + 0.02, b.z + b.d / 2 + 0.15);
  box(b.w * 0.88, 0.05, b.d * 0.25, mats.sheet, b.x + b.w / 2, b.surfaceHeight + 0.05, b.z + 0.35);
  box(0.55, 0.18, 0.4, mats.pillow, b.x + 0.55, b.surfaceHeight + 0.14, b.z + 0.4, scene, 1.08);
  box(0.55, 0.18, 0.4, mats.pillow, b.x + 1.35, b.surfaceHeight + 0.14, b.z + 0.4, scene, 1.08);

  const d = L.desk;
  box(d.w, d.h * 0.1, d.d, mats.deskTop, d.x + d.w / 2, d.h, d.z + d.d / 2, scene, 1.05);
  const leg = 0.09;
  [[0.1, 0.1], [d.w - 0.1, 0.1], [0.1, d.d - 0.1], [d.w - 0.1, d.d - 0.1]].forEach(([lx, lz]) => {
    box(leg, d.h * 0.9, leg, mats.desk, d.x + lx, d.h * 0.45, d.z + lz, scene, 1.08);
  });
  // CRT-ish monitor
  box(0.58, 0.42, 0.28, mats.monitor, d.x + 0.75, d.h + 0.32, d.z + 0.28, scene, 1.06);
  box(0.46, 0.3, 0.04, mats.screen, d.x + 0.75, d.h + 0.34, d.z + 0.42, scene, 1.04);

  const v = L.vanity;
  box(v.w * 1.05, v.h, v.d * 1.05, mats.cabinet, v.x + v.w / 2, v.h / 2, v.z + v.d / 2, scene, 1.05);

  const lc = L.lowCabinet;
  box(lc.w, lc.h, lc.d, mats.cabinet, lc.x + lc.w / 2, lc.h / 2, lc.z + lc.d / 2, scene, 1.05);
  [
    { w: 0.3, h: 0.32, d: 0.3, ox: 0.2, mat: mats.appliance },
    { w: 0.32, h: 0.28, d: 0.3, ox: 0.58, mat: mats.applianceDark },
    { w: 0.24, h: 0.36, d: 0.24, ox: 0.98, mat: mats.appliance },
  ].forEach((a) => {
    box(a.w, a.h, a.d, a.mat, lc.x + a.ox + a.w / 2, lc.h + a.h / 2, lc.z + lc.d / 2, scene, 1.07);
  });

  const curtainTex = makeCatCurtainTexture();
  const curtainMat = new THREE.MeshToonMaterial({
    map: curtainTex,
    gradientMap,
    side: THREE.DoubleSide,
  });
  toonMats.push(curtainMat);
  const ch = L.curtain.top - L.curtain.bottom;
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(L.curtain.length, ch), curtainMat);
  curtain.rotation.y = Math.PI / 2;
  curtain.position.set(L.curtain.x + 0.02, L.curtain.bottom + ch / 2, L.curtain.z + L.curtain.length / 2);
  curtain.castShadow = true;
  scene.add(curtain);
  box(0.06, 0.06, L.curtain.length + 0.15, mats.trim, L.curtain.x + 0.02, L.curtain.top + 0.03, L.curtain.z + L.curtain.length / 2);

  const chouse = L.catHouse;
  box(chouse.w * 1.08, chouse.h, chouse.d * 1.05, mats.catHouse, chouse.x + chouse.w / 2, chouse.h / 2, chouse.z + chouse.d / 2, scene, 1.07);
  box(0.03, chouse.h * 0.38, chouse.d * 0.42, mats.black, chouse.x + chouse.w, chouse.h * 0.35, chouse.z + chouse.d / 2, scene, 0);

  const s = L.sofa;
  box(s.w * 1.05, s.h * 0.42, s.d * 1.05, mats.sofa, s.x + s.w / 2, (s.h * 0.42) / 2, s.z + s.d / 2, scene, 1.06);
  box(s.w, s.h * 0.4, 0.16, mats.sofaDark, s.x + s.w / 2, s.h * 0.42 + (s.h * 0.4) / 2, s.z + s.d - 0.08, scene, 1.06);
  box(0.16, s.h * 0.38, s.d * 0.9, mats.sofaDark, s.x + 0.08, s.h * 0.42 + (s.h * 0.38) / 2, s.z + s.d / 2, scene, 1.06);
  box(0.16, s.h * 0.38, s.d * 0.9, mats.sofaDark, s.x + s.w - 0.08, s.h * 0.42 + (s.h * 0.38) / 2, s.z + s.d / 2, scene, 1.06);

  const r = L.rug;
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(r.w * 0.55, r.w * 0.55, 0.04, 32), mats.rug);
  rug.position.set(r.x + r.w / 2, 0.02, r.z + r.d / 2);
  rug.receiveShadow = true;
  scene.add(rug);
  addOutline(rug, 1.04);
  const rugIn = new THREE.Mesh(new THREE.CylinderGeometry(r.w * 0.32, r.w * 0.32, 0.045, 24), mats.rugInner);
  rugIn.position.set(r.x + r.w / 2, 0.025, r.z + r.d / 2);
  scene.add(rugIn);

  const w = L.wardrobe;
  box(w.w * 1.15, w.h, w.d, mats.wardrobe, w.x + w.w / 2, w.h / 2, w.z + w.d / 2, scene, 1.04);
  // purple rounded door hint
  box(0.04, w.h * 0.7, w.d * 0.55, mats.wardrobeDoor, w.x + 0.02, w.h * 0.5, w.z + w.d / 2, scene, 1.06);
  const knob1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mats.trim);
  knob1.position.set(w.x - 0.02, w.h * 0.55, w.z + w.d / 2 - 0.25);
  scene.add(knob1);
  addOutline(knob1, 1.15);
  const knob2 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mats.trim);
  knob2.position.set(w.x - 0.02, w.h * 0.55, w.z + w.d / 2 + 0.25);
  scene.add(knob2);
  addOutline(knob2, 1.15);

  box(0.95, 0.06, 0.24, mats.trim, 1.0, 1.55, 0.14);
  const bookCols = [0xe05050, 0x50a0e0, 0xf0c040, 0x60c070, 0xc060e0];
  for (let i = 0; i < 7; i++) {
    const bh = 0.18 + (i % 3) * 0.05;
    box(0.1, bh, 0.18, toon(bookCols[i % bookCols.length]), 0.62 + i * 0.12, 1.55 + bh / 2 + 0.03, 0.14, scene, 1.08);
  }

  // cute plant
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.12, 12), mats.pot);
  pot.position.set(0.4, 0.06, 0.4);
  pot.castShadow = true;
  scene.add(pot);
  addOutline(pot, 1.1);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mats.plant);
  leaf.position.set(0.4, 0.24, 0.4);
  leaf.scale.set(1, 1.4, 1);
  leaf.castShadow = true;
  scene.add(leaf);
  addOutline(leaf, 1.08);
}

addFloorPlanks();
addWalls();
addFurniture();

function setOutlines(on) {
  state.outlines = on;
  outlineMeshes.forEach((m) => { m.visible = on; });
}


function resetView() {
  camera.position.copy(DEFAULT_CAM.pos).sub(DEFAULT_CAM.target).multiplyScalar(camScale).add(DEFAULT_CAM.target);
  controls.target.copy(DEFAULT_CAM.target);
  controls.update();
  state.autoOrbit = false;
}
function syncButtons() {
  const set = (id, on, label) => { const b = document.getElementById(id); if (!b) return; b.classList.toggle('active', !!on); if (label) b.querySelector('.lbl').textContent = label; };
  set('bOutline', state.outlines, state.outlines ? '描边 开' : '描边 关');
  set('bSteps', false, '色阶 ' + state.toonSteps);
  set('bDayNight', state.preset === 'night', state.preset === 'day' ? '日间' : '夜间');
  set('bOrbit', state.autoOrbit, state.autoOrbit ? '绕转中' : '绕转');
}
function bindButtons() {
  const on = (id, fn) => { const b = document.getElementById(id); if (b) b.addEventListener('click', (e) => { e.preventDefault(); fn(); syncHud(); }); };
  on('bOutline', () => setOutlines(!state.outlines));
  on('bSteps', () => setToonSteps(state.toonSteps >= 4 ? 2 : state.toonSteps + 1));
  on('bDayNight', () => applyLightPreset(state.preset === 'day' ? 'night' : 'day'));
  on('bOrbit', () => { state.autoOrbit = !state.autoOrbit; });
  on('bReset', resetView);
  controls.addEventListener('start', () => { if (state.autoOrbit) { state.autoOrbit = false; syncHud(); } });
}

function syncHud() {
  syncButtons();
}
syncHud();

function resize() {
  const w = Math.max(1, window.innerWidth);
  const h = Math.max(1, window.innerHeight);
  camera.aspect = w / h;
  // 竖屏适配：放大视角，并让默认机位后退，保证整间房在手机竖屏里能看全
  const a = camera.aspect;
  camera.fov = a < 1 ? Math.min(42 * 1.45, 42 / Math.pow(a, 0.5)) : 42;
  camScale = a < 1 ? Math.min(1.6, 1 / Math.pow(a, 0.35)) : 1;
  controls.maxDistance = BASE_MAX_DIST * camScale;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
window.addEventListener('resize', resize);
resize();
resetView();

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'e') setOutlines(!state.outlines);
  else if (k === 't') {
    const next = state.toonSteps >= 4 ? 2 : state.toonSteps + 1;
    setToonSteps(next);
  } else if (k === '1') applyLightPreset('day');
  else if (k === '2') applyLightPreset('night');
  else if (k === 'r') resetView(); else if (k === 'o') state.autoOrbit = !state.autoOrbit;
  else return;
  syncHud();
});

bindButtons();

const params = new URLSearchParams(location.search);
if (params.get('preset') === 'night') applyLightPreset('night');
if (params.get('orbit') === '1') state.autoOrbit = true;
if (params.get('outline') === '0') setOutlines(false);
syncHud();
if (params.get('hud') === '0') { const h = document.getElementById('hud'); if (h) h.style.display = 'none'; }

window.__cartoon = {
  state,
  camera,
  controls,
  applyLightPreset,
  setOutlines,
  setToonSteps,
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
    const t = now * 0.00018;
    const r = 7.4 * camScale;
    const elev = 4.0 * camScale;
    camera.position.x = ROOM_CX + Math.cos(t) * r;
    camera.position.z = ROOM_CZ + Math.sin(t) * r;
    camera.position.y = elev;
    controls.target.set(ROOM_CX, 0.9, ROOM_CZ * 0.95);
    controls.update();
  } else {
    controls.update();
  }
  renderer.render(scene, camera);
  frames++;
  if (now - lastFpsT > 500) {
    fpsSmooth = Math.round((frames * 1000) / (now - lastFpsT));
    fpsEl.textContent = String(fpsSmooth);
    frames = 0;
    lastFpsT = now;
  }
}
requestAnimationFrame(tick);
