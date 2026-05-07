import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getFilmById, checkAnswer } from './api.js';
import { films } from './films.js';

// ─── SCENE ───────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a0c08);
scene.fog = new THREE.FogExp2(0x1a0c08, 0.012);

// ─── CAMERA ──────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 150);
camera.position.set(0, 1.65, 6);

// ─── RENDERER ────────────────────────────────────────────
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ReinhardToneMapping;
// FIX #1 : exposition réduite de 2.8 → 1.4 pour éviter la saturation Reinhard
// qui causait les "trous noirs" clignotants chaque seconde
renderer.toneMappingExposure = 1.4;

// ─── POINTER LOCK ────────────────────────────────────────
const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());

canvas.addEventListener('click', () => {
  const overlay = document.getElementById('tuto-overlay');
  if (!overlay) return controls.lock();
  if (overlay.style.display === 'none' || overlay.classList.contains('hidden')) {
    controls.lock();
  }
});

controls.addEventListener('lock',   () => { renderer.domElement.style.cursor = 'none'; });
controls.addEventListener('unlock', () => { renderer.domElement.style.cursor = 'grab'; });

// ─── MATERIALS ───────────────────────────────────────────
const make = (color, rough = 0.8, metal = 0, emissive = 0, emInt = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, emissive, emissiveIntensity: emInt });

const floorMat   = make(0x5a3520, 0.85);
const wallMat    = make(0x3d2418, 0.88);
const ceilMat    = make(0x2a1810, 0.92);
const woodDark   = make(0x5c2e10, 0.8);
const woodMed    = make(0x7a4018, 0.75);
const woodLight  = make(0x9a5520, 0.7);
const cabinetMat = make(0x6a3818, 0.75);
const redCloth   = make(0x9b1020, 0.85);
const goldMat    = make(0xb88020, 0.25, 0.9);
const blackMat   = make(0x1a0d0a, 0.95);
const stoneMat   = make(0x4a2830, 0.88);
const creamMat   = make(0xe8d5b0, 0.85);
const steelMat   = make(0x404045, 0.35, 0.75);
const glassMat   = make(0x1a1a30, 0.05, 0.2);
glassMat.transparent = true; glassMat.opacity = 0.55;
const curtainMat = make(0x2a0a18, 0.95);
const rugRedMat  = make(0x8a1020, 0.88);
const couchMat   = make(0x7a1020, 0.88);
const cushionMat = make(0x5a0a18, 0.85);
const skullMat   = make(0xc8b89a, 0.82);

// ─── HELPERS ─────────────────────────────────────────────
function box(w, h, d, mat, x, y, z, rx=0, ry=0, rz=0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m); return m;
}
function cyl(rt, rb, h, seg, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  scene.add(m); return m;
}
function sphere(r, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), mat);
  m.position.set(x, y, z); m.castShadow = true; scene.add(m); return m;
}
function plight(color, intensity, distance, x, y, z, shadows=false) {
  const l = new THREE.PointLight(color, intensity, distance);
  l.position.set(x, y, z);
  if (shadows) { l.castShadow=true; l.shadow.mapSize.set(512,512); l.shadow.radius=6; }
  scene.add(l); return l;
}

// ─── ROOM ────────────────────────────────────────────────
const RW = 22, RH = 3.2, RD = 18;

// Sol parquet
const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), floorMat);
floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
for (let i = -RW/2; i < RW/2; i += 0.36) {
  const plk = new THREE.Mesh(new THREE.PlaneGeometry(0.33, RD),
    make(0x5a3520 + (Math.random()>0.5?0x080400:0), 0.82));
  plk.rotation.x = -Math.PI/2; plk.position.set(i, 0.002, 0);
  plk.receiveShadow = true; scene.add(plk);
}

// Plafond & murs
box(RW, 0.2, RD, ceilMat, 0, RH, 0);
box(RW, RH, 0.3, wallMat,  0,    RH/2, -RD/2);
box(RW, RH, 0.3, wallMat,  0,    RH/2,  RD/2);
box(0.3, RH, RD, wallMat, -RW/2, RH/2,  0);
box(0.3, RH, RD, wallMat,  RW/2, RH/2,  0);
for (let pz = -RD/2+1; pz < RD/2; pz += 2.2) {
  box(0.06,1.1,1.8,woodDark, RW/2-0.22,0.55,pz);
  box(0.06,1.1,1.8,woodDark,-RW/2+0.22,0.55,pz);
}

// Tapis
const rb2 = new THREE.Mesh(new THREE.PlaneGeometry(6.4,4.4), make(0x500008,0.9));
rb2.rotation.x=-Math.PI/2; rb2.position.set(0,0.004,1.5); scene.add(rb2);
const rg2 = new THREE.Mesh(new THREE.PlaneGeometry(6.0,4.0), rugRedMat);
rg2.rotation.x=-Math.PI/2; rg2.position.set(0,0.005,1.5); scene.add(rg2);

// Table
const TZ = 1.5;
box(3.0,0.09,1.25,woodDark,0,0.79,TZ);
box(2.86,0.1,0.06,woodDark,0,0.70,TZ-0.5); box(2.86,0.1,0.06,woodDark,0,0.70,TZ+0.5);
box(0.06,0.1,1.1,woodDark,-1.3,0.70,TZ);   box(0.06,0.1,1.1,woodDark,1.3,0.70,TZ);
[[-1.3,-0.5],[1.3,-0.5],[-1.3,0.5],[1.3,0.5]].forEach(([tx,tz])=>box(0.09,0.79,0.09,woodDark,tx,0.395,TZ+tz));

// Bougies table
const candleLights = [];
[-0.85,-0.28,0.35,0.95].forEach(cx=>{
  cyl(0.026,0.026,0.22,8,creamMat,cx,0.905,TZ);
  cyl(0.062,0.062,0.012,8,creamMat,cx,0.798,TZ);
  sphere(0.032,make(0xffcc44,0.1,0,0xffcc44,12),cx,1.02,TZ);
  candleLights.push(plight(0xff9944,5,3.5,cx,1.0,TZ));
});

// Chaises
[-0.85,0.15,1.1].forEach(cx=>{
  [TZ-0.86, TZ+0.86].forEach((tz,side)=>{
    box(0.52,0.07,0.48,woodDark,cx,0.49,tz);
    box(0.52,0.07,0.48,redCloth,cx,0.535,tz);
    box(0.52,0.72,0.06,woodDark,cx,0.84,tz+(side===0?-0.24:0.24));
    [[-0.22,-0.22],[0.22,-0.22],[-0.22,0.22],[0.22,0.22]].forEach(([lx,lz])=>
      box(0.055,0.49,0.055,woodDark,cx+lx,0.245,tz+lz));
  });
});

// Lustre principal
const CX=0, CZ=TZ;
cyl(0.022,0.022,0.7,8,goldMat,CX,RH-0.35,CZ);
cyl(0.58,0.58,0.07,18,goldMat,CX,RH-0.72,CZ);
cyl(0.28,0.28,0.045,12,goldMat,CX,RH-0.745,CZ);
const chanLights=[];
for(let i=0;i<5;i++){
  const ang=(i/5)*Math.PI*2;
  const ax=CX+Math.cos(ang)*0.52, az=CZ+Math.sin(ang)*0.52;
  cyl(0.016,0.016,0.55,6,goldMat,ax,RH-0.72,az);
  cyl(0.027,0.027,0.21,8,make(0xbb1015,0.85),ax,RH-0.6,az);
  sphere(0.03,make(0xffdd55,0.1,0,0xffcc00,14),ax,RH-0.48,az);
  chanLights.push(plight(0xffaa55,6,6,ax,RH-0.5,az));
}
// FIX #2 : intensité du lustre principal réduite (35→16) pour éviter la saturation
const chanMain=plight(0xffcc88,16,20,CX,RH-0.85,CZ,true);

// Second lustre
const C2X=0,C2Z=-5;
cyl(0.02,0.02,0.55,8,goldMat,C2X,RH-0.28,C2Z);
cyl(0.48,0.48,0.06,14,goldMat,C2X,RH-0.58,C2Z);
const chanLights2=[];
for(let i=0;i<4;i++){
  const ang=(i/4)*Math.PI*2;
  const ax=C2X+Math.cos(ang)*0.42, az=C2Z+Math.sin(ang)*0.42;
  cyl(0.027,0.027,0.19,8,make(0xbb1015,0.85),ax,RH-0.52,az);
  sphere(0.028,make(0xffdd55,0.1,0,0xffcc00,14),ax,RH-0.42,az);
  chanLights2.push(plight(0xffaa55,5,5,ax,RH-0.44,az));
}
const chanMain2=plight(0xffcc88,14,18,C2X,RH-0.75,C2Z);

// Cuisine
const KX=-6.5;
box(3.5,0.82,0.46,cabinetMat,KX,2.42,-RD/2+0.29);
box(2.0,0.82,0.46,cabinetMat,KX-2.5,2.42,-RD/2+0.29);
for(let i=0;i<3;i++){
  box(1.02,0.74,0.025,woodMed,KX-1.5+i*1.12,2.42,-RD/2+0.53);
  box(0.9,0.63,0.012,woodLight,KX-1.5+i*1.12,2.42,-RD/2+0.54);
}
box(4.6,0.93,0.56,cabinetMat,KX,0.465,-RD/2+0.33);
box(4.8,0.062,0.62,stoneMat,KX,0.935,-RD/2+0.31);
box(0.56,0.93,2.6,cabinetMat,-RW/2+0.43,0.465,-6.6);
box(0.62,0.062,2.8,stoneMat,-RW/2+0.43,0.935,-6.6);
box(0.86,2.02,0.76,make(0x2a1818,0.3,0.5),-RW/2+0.48,1.01,-7.6);
box(0.05,0.62,0.042,steelMat,-RW/2+0.9,1.65,-7.4);
box(0.05,0.62,0.042,steelMat,-RW/2+0.9,0.78,-7.4);
box(0.62,0.93,0.62,make(0x221210,0.4,0.35),-RW/2+0.49,0.465,-8.6);
box(0.64,0.063,0.64,make(0x303030,0.2,0.55),-RW/2+0.49,0.935,-8.6);
cyl(0.1,0.1,0.022,12,make(0x1e1015,0.3,0.65),-RW/2+0.49,0.948,-8.5);
cyl(0.1,0.1,0.022,12,make(0x1e1015,0.3,0.65),-RW/2+0.49,0.948,-8.7);
box(0.72,0.52,0.67,make(0x1e1010,0.4,0.45),-RW/2+0.49,2.02,-8.6);
box(1.52,0.92,0.42,cabinetMat,-9.55,2.42,-RD/2+0.29);
for(let wr=0;wr<6;wr++)
  cyl(0.08,0.08,0.36,8,blackMat,-9.05+(wr%3)*0.23,2.32+Math.floor(wr/3)*0.23,-RD/2+0.46);

// Fenêtres
[-5.5,5.5].forEach(wx=>{
  box(1.52,2.62,0.13,stoneMat,wx,1.92,-RD/2+0.065);
  const g=new THREE.Mesh(new THREE.PlaneGeometry(1.12,2.12),glassMat);
  g.position.set(wx,1.92,-RD/2+0.19); scene.add(g);
  box(0.052,2.12,0.042,stoneMat,wx,1.92,-RD/2+0.145);
  box(1.12,0.052,0.042,stoneMat,wx,2.22,-RD/2+0.145);
  const aGeo=new THREE.CylinderGeometry(0.56,0.56,0.085,16,1,false,0,Math.PI);
  const arch=new THREE.Mesh(aGeo,stoneMat);
  arch.position.set(wx,3.02,-RD/2+0.065); arch.rotation.z=Math.PI; scene.add(arch);
  box(0.46,2.45,0.13,curtainMat,wx-0.66,1.92,-RD/2+0.23);
  box(0.46,2.45,0.13,curtainMat,wx+0.66,1.92,-RD/2+0.23);
  cyl(0.019,0.019,1.85,8,make(0x5a3510,0.4,0.7),wx,3.07,-RD/2+0.21);
  const mgl=new THREE.PointLight(0x2020aa,3,8);
  mgl.position.set(wx,2.1,-RD/2+1.2); scene.add(mgl);
});

// Miroir + commode
box(1.85,2.85,0.09,goldMat,RW/2-0.3,1.82,-4.0);
const mm=new THREE.MeshStandardMaterial({color:0x202030,roughness:0.04,metalness:0.96});
const mp=new THREE.Mesh(new THREE.PlaneGeometry(1.55,2.45),mm);
mp.position.set(RW/2-0.25,1.82,-4.0); mp.rotation.y=Math.PI/2; scene.add(mp);
[[0,1.22],[0,-1.22],[0.72,0],[-0.72,0]].forEach(([oy,oz])=>
  sphere(0.092,goldMat,RW/2-0.25,1.82+oy,-4.0+oz));
box(1.85,0.92,0.56,woodDark,RW/2-1.22,0.46,-4.0);
box(1.9,0.063,0.62,woodMed,RW/2-1.22,0.935,-4.0);
[[-0.62],[0.0],[0.62]].forEach(([dx])=>{
  box(0.54,0.29,0.032,woodMed,RW/2-1.22+dx,0.46,-3.73);
  sphere(0.026,goldMat,RW/2-1.22+dx,0.46,-3.71);
});
sphere(0.125,skullMat,RW/2-1.22,1.0,-4.22);
sphere(0.092,skullMat,RW/2-1.22,0.91,-4.12);
cyl(0.025,0.025,0.21,8,creamMat,RW/2-0.7,0.975,-3.85);
sphere(0.032,make(0xffcc44,0.1,0,0xffcc44,12),RW/2-0.7,1.085,-3.85);
const miroirLight=plight(0xff9944,8,5,RW/2-0.7,1.08,-3.85);

// Canapé
const SX=5.5,SZ=2.2;
box(4.6,0.46,1.12,couchMat,SX,0.23,SZ);
box(4.6,0.72,0.21,couchMat,SX,0.68,SZ-0.46);
[-1.55,-0.52,0.5,1.53].forEach(cx=>box(0.92,0.13,0.96,cushionMat,SX+cx,0.51,SZ+0.04));
box(0.23,0.64,1.12,couchMat,SX-2.32,0.53,SZ);
box(0.23,0.64,1.12,couchMat,SX+2.32,0.53,SZ);
sphere(0.165,make(0x450008,0.9),SX-1.82,0.73,SZ-0.32);
sphere(0.145,make(0x600012,0.88),SX+1.55,0.71,SZ-0.30);

// Bibliothèque
const BSX=RW/2-0.92,BSZ=-7.5;
box(3.55,3.05,0.39,woodDark,BSX,1.525,BSZ);
[0.32,1.02,1.72,2.42].forEach(sy=>{
  box(3.35,0.057,0.34,woodMed,BSX,sy,BSZ+0.03);
  let bx=BSX-1.55;
  const bc=[0x7b1010,0x104020,0x101060,0x450060,0x600010,0x183030,0x4a1a00,0x102040];
  for(let b=0;b<13;b++){
    const bh=0.22+Math.random()*0.14;
    box(0.062,bh,0.27,make(bc[b%bc.length],0.88),bx,sy+bh/2,BSZ+0.045);
    bx+=0.068+Math.random()*0.022; if(bx>BSX+1.55)break;
  }
});

// Petite table & fauteuil
box(0.72,0.56,0.72,woodDark,3.5,0.28,-6.5);
box(0.77,0.042,0.77,woodMed,3.5,0.562,-6.5);
cyl(0.042,0.072,0.52,8,goldMat,3.5,0.845,-6.5);
cyl(0.105,0.105,0.042,8,goldMat,3.5,1.11,-6.5);
cyl(0.026,0.026,0.21,8,creamMat,3.5,1.145,-6.5);
sphere(0.032,make(0xffcc44,0.1,0,0xffcc44,12),3.5,1.255,-6.5);
const sideLight=plight(0xff9944,10,5,3.5,1.24,-6.5);
box(0.97,0.43,0.92,couchMat,5.5,0.215,-6.6);
box(0.97,0.62,0.19,couchMat,5.5,0.53,-7.07);
box(0.21,0.57,0.92,couchMat,5.08,0.49,-6.6);
box(0.21,0.57,0.92,couchMat,5.92,0.49,-6.6);

// Appliques murales
const sconcePos=[
  [ RW/2-0.26,2.12,-1.5],[ RW/2-0.26,2.12,2.5],[ RW/2-0.26,2.12,5.5],
  [-RW/2+0.26,2.12,-1.5],[-RW/2+0.26,2.12,2.5],[-RW/2+0.26,2.12,5.5],
];
const sconceLights=[];
sconcePos.forEach(([sx,sy,sz])=>{
  const isR=sx>0, ox=isR?-0.1:0.1;
  box(0.19,0.065,0.27,goldMat,sx+ox,sy-0.02,sz);
  cyl(0.026,0.026,0.21,8,creamMat,sx+ox,sy+0.055,sz);
  sphere(0.031,make(0xffdd66,0.1,0,0xffcc00,14),sx+ox,sy+0.17,sz);
  // FIX #3 : intensité des appliques réduite (18→8) pour éviter la surcharge lumineuse
  sconceLights.push(plight(0xffbb66,8,7,sx+ox*1.5,sy+0.16,sz));
});

// FIX #4 : lumière ambiante réduite (1.8→0.8) pour équilibrer l'éclairage global
scene.add(new THREE.AmbientLight(0xffddbb, 0.8));
scene.add(new THREE.HemisphereLight(0xffcc99, 0x2a1008, 0.8));
const fill = new THREE.DirectionalLight(0xffddbb, 0.8);
fill.position.set(0, 8, 0); scene.add(fill);
const backSpot=new THREE.SpotLight(0xffaa66,6,14,Math.PI/5.5,0.45,1.2);
backSpot.position.set(0,RH-0.18,-5.5);
backSpot.target.position.set(0,0,-5.5);
scene.add(backSpot); scene.add(backSpot.target);

// ═══════════════════════════════════════════════════════════
// ─── CHARGEMENT DES OBJETS 3D GLB FLOTTANTS ──────────────
// ═══════════════════════════════════════════════════════════

// Centre de la pièce = RH / 2 = 3.2 / 2 = 1.6
// Les y varient légèrement autour de 1.6 (±0.15) pour éviter que tout soit au même niveau
const objectConfigs = [
  { file: '19e20310_base_basic_pbr.glb', x:  0.0, y: 1.60, z: -3.0, s: 0.5, ry: 0.0,  fa: 0.12, fs: 0.80 },
  { file: '2963748f_base_basic_pbr.glb', x: -3.5, y: 1.55, z: -5.0, s: 0.5, ry: 0.5,  fa: 0.15, fs: 0.65 },
  { file: '3d06ccb6_base_basic_pbr.glb', x:  3.5, y: 1.65, z: -5.5, s: 0.5, ry: 1.0,  fa: 0.10, fs: 0.90 },
  { file: '4a72bdf2_base_basic_pbr.glb', x: -5.0, y: 1.50, z: -2.0, s: 0.5, ry: 0.3,  fa: 0.18, fs: 0.70 },
  { file: '642cf26c_base_basic_pbr.glb', x:  5.0, y: 1.60, z: -1.5, s: 0.5, ry: 0.8,  fa: 0.13, fs: 0.75 },
  { file: '68053380_base_basic_pbr.glb', x: -7.0, y: 1.70, z:  0.5, s: 0.5, ry: 1.2,  fa: 0.14, fs: 0.85 },
  { file: '8b55883e_base_basic_pbr.glb', x:  7.0, y: 1.55, z:  0.0, s: 0.5, ry: 0.6,  fa: 0.11, fs: 0.95 },
  { file: '8f5fc837_base_basic_pbr.glb', x: -2.5, y: 1.65, z: -7.0, s: 0.5, ry: 1.8,  fa: 0.16, fs: 0.60 },
  { file: '909e698a_base_basic_pbr.glb', x:  2.5, y: 1.60, z: -7.0, s: 0.5, ry: 2.1,  fa: 0.12, fs: 1.00 },
  { file: 'b573e801_base_basic_pbr.glb', x: -6.0, y: 1.50, z: -5.5, s: 0.5, ry: 0.9,  fa: 0.20, fs: 0.55 },
  { file: 'c81f3a64_base_basic_pbr.glb', x:  6.0, y: 1.70, z: -4.5, s: 0.5, ry: 1.5,  fa: 0.15, fs: 0.80 },
  { file: 'dbc31598_base_basic_pbr.glb', x:  0.0, y: 1.60, z:  4.5, s: 0.5, ry: 0.2,  fa: 0.13, fs: 0.70 },
  { file: 'e2b4c756_base_basic_pbr.glb', x: -4.0, y: 1.55, z:  3.0, s: 0.5, ry: 1.7,  fa: 0.17, fs: 0.75 },
  { file: 'fea72906_base_basic_pbr.glb', x:  4.0, y: 1.65, z:  2.5, s: 0.5, ry: 0.4,  fa: 0.11, fs: 0.85 },
  { file: '69cc5cb7_base_basic_pbr.glb', x: -8.0, y: 1.60, z: -3.0, s: 0.5, ry: 2.5,  fa: 0.14, fs: 0.65 },
  { file: '822c4617_base_basic_pbr.glb', x:  8.0, y: 1.50, z: -2.0, s: 0.5, ry: 1.1,  fa: 0.19, fs: 0.90 },
  { file: '834cb512_base_basic_pbr.glb', x: -1.5, y: 1.65, z:  6.0, s: 0.5, ry: 0.7,  fa: 0.12, fs: 0.80 },
];

// FIX #5 : une seule déclaration de floatingObjects (suppression de window.floatingObjects)
// L'ancienne double déclaration (window.floatingObjects + const floatingObjects)
// causait un conflit de scope qui empêchait le raycasting de fonctionner
const floatingObjects = [];

// Fonction pour centrer et normaliser un modèle GLB automatiquement
function normalizeModel(gltf, config) {
  const model = gltf.scene;

  // Calculer la bounding box pour auto-scaler
  const bbox = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);

  // Normaliser à ~1 unité puis appliquer le scale config
  const normalScale = (1.0 / maxDim) * config.s;
  model.scale.setScalar(normalScale);

  // Re-centrer après scale
  const bbox2 = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  bbox2.getCenter(center);
  model.position.sub(center);

  // Positionner dans la scène
  model.position.set(config.x, config.y, config.z);
  model.rotation.y = config.ry;

  // Ombres
  model.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(model);

  // FIX #6 : intensité des glow lights réduite (0.8→0.3) pour ne pas surcharger le budget lumineux
  const glowLight = new THREE.PointLight(0xaa6633, 0.3, 2.0);
  glowLight.position.set(config.x, config.y - 0.3, config.z);
  scene.add(glowLight);

  floatingObjects.push({
    mesh: model,
    baseY: config.y,
    floatAmp: config.fa,
    floatSpeed: config.fs,
    floatOffset: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.004,
    glowLight,
  });

  console.log(`✓ Chargé: ${config.file}`);
}

// Charger tous les objets
const loader = new GLTFLoader();
objectConfigs.forEach(config => {
  loader.load(
    `./models/${config.file}`,
    (gltf) => normalizeModel(gltf, config),
    (progress) => {
      if (progress.total > 0) {
        const pct = Math.round((progress.loaded / progress.total) * 100);
        console.log(`Chargement ${config.file}: ${pct}%`);
      }
    },
    (error) => {
      console.warn(`Erreur chargement ${config.file}:`, error);
    }
  );
});

// ─── NAVIGATION ──────────────────────────────────────────
const views = {
  iso:   { pos: new THREE.Vector3(12,10,12), look: new THREE.Vector3(0,1,0) },
  hall:  { pos: new THREE.Vector3(0,1.65,6.5), look: new THREE.Vector3(0,1.65,-3) },
  crypt: { pos: new THREE.Vector3(4,1.65,-5.5), look: new THREE.Vector3(0,1.65,-8) },
  study: { pos: new THREE.Vector3(-5,1.65,-5), look: new THREE.Vector3(-8,1.65,-8) },
  bath:  { pos: new THREE.Vector3(0,1.65,3), look: new THREE.Vector3(0,1.65,0) },
};
let isoMode=false, targetView=null;
function flyTo(v) { controls.unlock(); isoMode=true; targetView={pos:v.pos.clone(),look:v.look.clone()}; }
document.getElementById('btn-iso')?.addEventListener('click',  ()=>flyTo(views.iso));
document.getElementById('btn-hall')?.addEventListener('click', ()=>flyTo(views.hall));
document.getElementById('btn-crypt')?.addEventListener('click',()=>flyTo(views.crypt));
document.getElementById('btn-study')?.addEventListener('click',()=>flyTo(views.study));
document.getElementById('btn-bath')?.addEventListener('click', ()=>flyTo(views.bath));

// ─── MOUVEMENT ───────────────────────────────────────────
const keys = {};
document.addEventListener('keydown', e => { keys[e.key.toLowerCase()]=true; if(e.key==='Escape') isoMode=false; });
document.addEventListener('keyup',   e => { keys[e.key.toLowerCase()]=false; });
const SPEED = 0.065;
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
function move() {
  if (!controls.isLocked) return;
  if (keys['z']||keys['arrowup'])    controls.moveForward(SPEED);
  if (keys['s']||keys['arrowdown'])  controls.moveForward(-SPEED);
  if (keys['q']||keys['arrowleft'])  controls.moveRight(-SPEED);
  if (keys['d']||keys['arrowright']) controls.moveRight(SPEED);
  const p = controls.getObject().position;
  p.x = clamp(p.x, -RW/2+0.5, RW/2-0.5);
  p.z = clamp(p.z, -RD/2+0.5, RD/2-0.5);
  p.y = 1.65;
}

// ─── ANIMATION ───────────────────────────────────────────
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Vacillement lumières avec amplitudes réduites pour rester dans le budget lumineux
  chanMain.intensity  = 15 + Math.sin(t*7.3)*2 + Math.sin(t*13)*1;
  chanMain2.intensity = 13 + Math.sin(t*5.1)*1.5;
  chanLights.forEach((cl,i)  => { cl.intensity = 5  + Math.sin(t*9+i)*1.5; });
  chanLights2.forEach((cl,i) => { cl.intensity = 4  + Math.sin(t*7+i*1.4)*1; });
  candleLights.forEach((cl,i)=> { cl.intensity = 4  + Math.sin(t*11+i*2.3)*1.5; });
  sconceLights.forEach((sl,i)=> { sl.intensity = 7  + Math.sin(t*8+i*1.8)*1.5; });
  sideLight.intensity   = 9  + Math.sin(t*12)*2;
  miroirLight.intensity = 7  + Math.sin(t*10)*1.5;

  // Animation des objets GLB flottants
  floatingObjects.forEach(obj => {
    obj.mesh.position.y = obj.baseY + Math.sin(t * obj.floatSpeed + obj.floatOffset) * obj.floatAmp;
    obj.mesh.rotation.y += obj.rotSpeed;
    obj.glowLight.position.y = obj.mesh.position.y - 0.3;
    obj.glowLight.intensity = 0.2 + Math.sin(t * obj.floatSpeed * 1.5 + obj.floatOffset) * 0.1;
  });

  move();

  if (isoMode && targetView) {
    camera.position.lerp(targetView.pos, 0.04);
    const dir = new THREE.Vector3().subVectors(targetView.look, camera.position).normalize();
    camera.lookAt(new THREE.Vector3().addVectors(camera.position, dir));
  }

  renderer.render(scene, camera);
}
animate();

// ─── RESIZE ──────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── INTERACTION CLIC SUR OBJETS ─────────────────────────
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let score = 0;

// Construire la liste de tous les meshes enfants des objets GLB
function getAllMeshes() {
  const meshes = [];
  floatingObjects.forEach(obj => {
    obj.mesh.traverse(child => {
      if (child.isMesh) meshes.push(child);
    });
  });
  return meshes;
}

// Trouver quel objet flottant contient un mesh donné
function findParentObject(mesh) {
  return floatingObjects.find(obj => {
    let found = false;
    obj.mesh.traverse(child => { if (child === mesh) found = true; });
    return found;
  });
}

document.addEventListener('keydown', async (e) => {
  if (e.key.toLowerCase() !== 'e' || !controls.isLocked) return;

  mouse.set(0, 0); // Centre de l'écran
  raycaster.setFromCamera(mouse, camera);

  const allMeshes = getAllMeshes();
  const hits = raycaster.intersectObjects(allMeshes, true);

  if (hits.length > 0 && hits[0].distance < 5) {
    const parentObj = findParentObject(hits[0].object);
    if (!parentObj) return;

    // 1. Récupérer les données locales du film liées à cet objet
    const index = floatingObjects.indexOf(parentObj);
    const filmLocal = films[index % films.length];

    // 2. Déverrouiller la souris pour permettre la saisie
    controls.unlock();

    // 3. Demander le nom au joueur
    const reponseJoueur = prompt(`❓ Quel est le nom de ce film ? (Indice : Sorti en ${filmLocal.release_year})`);

    if (reponseJoueur) {
      // 4. Appeler l'API TMDB pour vérifier si le nom saisi correspond au titre officiel
      const dataAPI = await getFilmById(filmLocal.title);
      
      if (dataAPI) {
        // On compare la saisie du joueur avec le titre de la base de données
        const isCorrect = checkAnswer(dataAPI.title, reponseJoueur);

        if (isCorrect) {
          score += 10; // On peut imaginer un bonus
          alert(`✅ Bravo ! C'est bien "${dataAPI.title}".\nScore : ${score}`);
        } else {
          alert(`❌ Non ! Il s'agissait de "${dataAPI.title}".`);
        }
      }
    }
  }
});