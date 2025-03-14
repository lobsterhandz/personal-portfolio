import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  3000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- OrbitControls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 2000;
controls.minDistance = 10;

// --- Background ---
const textureLoader = new THREE.TextureLoader();
textureLoader.load('assets/space_bg.jpg', (texture) => { 
    scene.background = texture;
}, undefined, (error) => { 
    console.error('Error loading background:', error);
    scene.background = new THREE.Color(0x000011);
});

// --- Load Planets & Sun ---
const loader = new GLTFLoader();
const planets = [];
const planetData = [
  { name: 'Sun', file: 'sun.glb', distance: 0, scale: 10 },
  { name: 'Mercury', file: 'mercury.glb', distance: 20, scale: 0.5 },
  { name: 'Venus', file: 'venus.glb', distance: 30, scale: 0.9 },
  { name: 'Earth', file: 'earth.glb', distance: 40, scale: 1 },
  { name: 'Moon', file: 'moon.glb', distance: 45, scale: 0.3, orbitAround: 'Earth' },
  { name: 'Mars', file: 'mars.glb', distance: 55, scale: 0.8 },
  { name: 'Jupiter', file: 'jupiter.glb', distance: 80, scale: 3 },
  { name: 'Saturn', file: 'saturn.glb', distance: 110, scale: 2.5 },
  { name: 'Uranus', file: 'uranus.glb', distance: 140, scale: 2 },
  { name: 'Neptune', file: 'neptune.glb', distance: 170, scale: 2 },
  { name: 'Pluto', file: 'pluto.glb', distance: 190, scale: 0.5 } // Optional
];

// --- Load Models & Position Them ---
const sun = new THREE.Object3D();
scene.add(sun);

planetData.forEach((data) => {
  loader.load(`assets/${data.file}`, (gltf) => {
    const planet = gltf.scene;
    planet.scale.set(data.scale, data.scale, data.scale);
    
    if (data.distance !== 0) {
      planet.position.set(data.distance, 0, 0);
    }
    
    planet.userData = data;
    scene.add(planet);
    planets.push(planet);

    if (data.orbitAround === 'Earth') {
      const earth = planets.find(p => p.userData.name === 'Earth');
      if (earth) {
        earth.add(planet);
        planet.position.set(5, 0, 0);
      }
    }
  });
});

// --- Hover Effect ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
document.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(planets, true);
  planets.forEach(planet => planet.scale.set(planet.userData.scale, planet.userData.scale, planet.userData.scale));

  if (intersects.length > 0) {
    const hoveredPlanet = intersects[0].object;
    hoveredPlanet.scale.multiplyScalar(1.2);
  }
});

// --- Click Event (Zoom to Planet) ---
document.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(planets, true);
  if (intersects.length > 0) {
    const selectedPlanet = intersects[0].object;
    flyToPlanet(selectedPlanet);
  }
});

// --- Fly to Planet Function ---
function flyToPlanet(planet) {
  controls.target.copy(planet.position);
  controls.update();

  const direction = planet.position.clone().sub(camera.position).normalize();
  const desiredDistance = planet.userData.scale * 5;
  const newCameraPos = planet.position.clone().sub(direction.multiplyScalar(desiredDistance));

  new TWEEN.Tween(camera.position)
    .to(newCameraPos, 2000)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      controls.target.copy(planet.position);
      controls.update();
    })
    .start();
}

// --- Animate Orbits ---
function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();

  planets.forEach((planet) => {
    if (planet.userData.distance > 0) {
      const speed = 0.0005 / planet.userData.distance;
      planet.position.x = Math.cos(Date.now() * speed) * planet.userData.distance;
      planet.position.z = Math.sin(Date.now() * speed) * planet.userData.distance;
    }
  });

  renderer.render(scene, camera);
}
animate();

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
