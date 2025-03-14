import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';
import { OrbitControls } from './OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.140.2/examples/jsm/loaders/GLTFLoader.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Ensure canvas is behind UI elements
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.zIndex = '-1';

// --- OrbitControls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// --- Background (Curved Skybox) ---
const textureLoader = new THREE.TextureLoader();
const backgroundGeometry = new THREE.SphereGeometry(100, 32, 32);
const backgroundMaterial = new THREE.MeshBasicMaterial({
  map: textureLoader.load('assets/space_bg.jpg'),
  side: THREE.BackSide // Render the texture inside the sphere
});
const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
scene.add(backgroundMesh);

// --- Background Music ---
const audioListener = new THREE.AudioListener();
camera.add(audioListener);
const backgroundSound = new THREE.Audio(audioListener);
const audioLoader = new THREE.AudioLoader();
document.addEventListener('pointerdown', () => {
  if (!backgroundSound.isPlaying) {
    audioLoader.load('assets/space_ambience.mp3', (buffer) => {
      backgroundSound.setBuffer(buffer);
      backgroundSound.setLoop(true);
      backgroundSound.setVolume(0.3);
      backgroundSound.play();
    });
  }
}, { once: true });

// --- Solar System Data ---
const planetsData = [
  { name: 'Sun', file: 'sun.glb', position: [0, 0, -20], scale: 2 },
  { name: 'Mercury', file: 'mercury.glb', position: [2, 1, -18], scale: 0.5 },
  { name: 'Venus', file: 'venus.glb', position: [4, 1.5, -25], scale: 0.7 },
  { name: 'Earth', file: 'earth.glb', position: [6, 2, -30], scale: 0.9 },
  { name: 'Mars', file: 'mars.glb', position: [8, 2.5, -35], scale: 0.6 },
  { name: 'Jupiter', file: 'jupiter.glb', position: [12, 3, -50], scale: 1.8 },
  { name: 'Saturn', file: 'saturn.glb', position: [16, 3.5, -60], scale: 1.5 },
  { name: 'Uranus', file: 'uranus.glb', position: [20, 4, -70], scale: 1.3 },
  { name: 'Neptune', file: 'neptune.glb', position: [24, 4.5, -80], scale: 1.2 },
  { name: 'Pluto', file: 'pluto.glb', position: [28, 5, -90], scale: 0.5 }
];

// --- Load 3D Planet Models ---
const loader = new GLTFLoader();
const planets = {};
planetsData.forEach((data) => {
  loader.load(`./assets/${data.file}`, (gltf) => {
    const planet = gltf.scene;
    planet.position.set(...data.position);
    planet.scale.set(data.scale, data.scale, data.scale);
    scene.add(planet);
    planets[data.name] = planet;
  });
});

// --- Raycaster Setup ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
const projectDetails = document.getElementById('project-details');

// --- Hover Effect: Highlight Individual Planet ---
document.addEventListener('pointermove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(Object.values(planets), true);
  if (intersects.length > 0) {
    const hoveredPlanet = intersects[0].object;
    hoveredPlanet.scale.set(hoveredPlanet.scale.x * 1.1, hoveredPlanet.scale.y * 1.1, hoveredPlanet.scale.z * 1.1);
    
    tooltip.style.opacity = 1;
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
    tooltip.innerHTML = `<strong>${hoveredPlanet.parent.userData.name}</strong>`;
  } else {
    tooltip.style.opacity = 0;
    Object.values(planets).forEach((planet) => planet.scale.set(planetsData.find(p => p.name === planet.name).scale, 
                                                               planetsData.find(p => p.name === planet.name).scale, 
                                                               planetsData.find(p => p.name === planet.name).scale));
  }
});

// --- Click to Zoom & Show Details ---
document.addEventListener('pointerdown', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(Object.values(planets), true);
  if (intersects.length > 0) {
    const selectedPlanet = intersects[0].object.parent;
    flyToPlanet(selectedPlanet);
  } else {
    projectDetails.style.display = 'none';
  }
});

// --- Fly to Planet ---
function flyToPlanet(planet) {
  controls.target.copy(planet.position);
  controls.update();

  const direction = planet.position.clone().sub(camera.position).normalize();
  const newCameraPos = planet.position.clone().sub(direction.multiplyScalar(4));

  new TWEEN.Tween(camera.position)
    .to(newCameraPos, 2000)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      controls.target.copy(planet.position);
      controls.update();
    })
    .onComplete(() => {
      showPlanetDetails(planet.userData);
    })
    .start();
}

// --- Show Planet Info ---
function showPlanetDetails(data) {
  projectDetails.style.top = '80px';
  projectDetails.innerHTML = `
    <h2>${data.name}</h2>
    <p>Location: ${data.position}</p>
  `;
  projectDetails.style.display = 'block';
}

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();

  // Rotate planets slowly
  Object.values(planets).forEach((planet) => {
    planet.rotation.y += 0.002;
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
