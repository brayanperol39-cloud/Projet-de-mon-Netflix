import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getFilmById, checkAnswer } from './api.js';
import { films } from './films.js';

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

// CAMERA
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.y = 1.6;

// RENDERER
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// CONTROLES FPS
const controls = new PointerLockControls(camera, document.body);
document.body.addEventListener('click', () => controls.lock());
scene.add(controls.getObject());

// LUMIERE
const light = new THREE.PointLight(0xff0040, 2, 20);
light.position.set(0, 3, 0);
scene.add(light);

const ambient = new THREE.AmbientLight(0x404040);
scene.add(ambient);

// SOL
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x222222 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// MURS (appartement simple)
function createWall(x, z, width, height, depth) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color: 0x550033 })
  );
  wall.position.set(x, height/2, z);
  scene.add(wall);
}

// murs extérieurs
createWall(0, -10, 20, 3, 0.5);
createWall(0, 10, 20, 3, 0.5);
createWall(-10, 0, 0.5, 3, 20);
createWall(10, 0, 0.5, 3, 20);

// séparation pièces
createWall(0, 0, 10, 3, 0.5);
createWall(-3, 3, 0.5, 3, 6);

// OBJETS (placeholder)
function createBox(x, z, color) {
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    new THREE.MeshStandardMaterial({ color })
  );
  box.position.set(x, 0.5, z);
  scene.add(box);
}

// meubles simples
createBox(2,2,0xff0000);
createBox(-2,-2,0x990000);

// MOUVEMENT (ZQSD)
const keys = {};

document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

const speed = 0.08;

function move() {
  if (keys['z']) controls.moveForward(speed);
  if (keys['s']) controls.moveForward(-speed);
  if (keys['q']) controls.moveRight(-speed);
  if (keys['d']) controls.moveRight(speed);
}

// LOOP
function animate() {
  requestAnimationFrame(animate);
  move();
  renderer.render(scene, camera);
}
animate();

// RESIZE
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
// ─── INTERACTION CLIC SUR OBJETS ─────────────────────────
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let score = 0;

window.addEventListener('click', async (e) => {
  if (!controls.isLocked) return;

  mouse.x = 0;
  mouse.y = 0;
  raycaster.setFromCamera(mouse, camera);

  const meshes = floatingObjects.map(o => o.mesh).flat();
  const hits = raycaster.intersectObjects(meshes, true);

  if (hits.length > 0) {
    // Trouver quel objet a été cliqué
    const index = floatingObjects.findIndex(o =>
      hits[0].object.parent === o.mesh ||
      hits[0].object === o.mesh
    );

    if (index !== -1) {
      const film = films[index % films.length];

      // Récupérer les infos depuis TMDB
      const tmdbData = await getFilmById(film.title);

      // Afficher la question
      controls.unlock();
      const reponse = prompt(
        `🎬 Film : ${film.title}\n` +
        `📅 Année : ${tmdbData?.year || film.release_year}\n\n` +
        `❓ En quelle année est sorti ce film ?`
      );

      if (reponse) {
        const correct = reponse.trim() === String(tmdbData?.year || film.release_year);
        if (correct) {
          score += film.points;
          alert(`✅ Bonne réponse ! +${film.points} points\n🏆 Score total : ${score}`);
        } else {
          alert(`❌ Mauvaise réponse !\nLa bonne réponse était : ${tmdbData?.year || film.release_year}`);
        }
      }
    }
  }
});