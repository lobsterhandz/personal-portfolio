import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { GLTFLoader } from './GLTFLoader.js';

console.log("THREE module loaded:", THREE);
console.log("OrbitControls loaded:", OrbitControls);
console.log("GLTFLoader loaded:", GLTFLoader);

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

// Place canvas behind UI elements
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.zIndex = '-1';

// --- Orbit Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
camera.position.set(0, 5, 20);

// --- Curved Background (Sky Sphere) ---
const textureLoader = new THREE.TextureLoader();
const bgGeometry = new THREE.SphereGeometry(100, 32, 32);
const bgMaterial = new THREE.MeshBasicMaterial({
  map: textureLoader.load('./assets/space_bg.jpg'),
  side: THREE.BackSide,
});
const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
scene.add(bgMesh);

// --- Background Music ---
const audioListener = new THREE.AudioListener();
camera.add(audioListener);
const backgroundSound = new THREE.Audio(audioListener);
const audioLoader = new THREE.AudioLoader();
document.addEventListener('pointerdown', () => {
  if (!backgroundSound.isPlaying) {
    audioLoader.load('./assets/space_ambience.mp3', (buffer) => {
      backgroundSound.setBuffer(buffer);
      backgroundSound.setLoop(true);
      backgroundSound.setVolume(0.3);
      backgroundSound.play();
    });
  }
}, { once: true });

// --- Solar System Data ---
// Ensure that file names and cases match your assets folder.
const planetsData = [
  { name: 'Sun', file: 'sun.glb', position: [0, 0, -20], scale: 2, url: 'https://example.com/sun' },
  { name: 'Mercury', file: 'mercury.glb', position: [2, 1, -18], scale: 0.5, url: 'https://example.com/mercury' },
  { name: 'Venus', file: 'venus.glb', position: [4, 1.5, -25], scale: 0.7, url: 'https://example.com/venus' },
  { name: 'Earth', file: 'earth.glb', position: [6, 2, -30], scale: 0.9, url: 'https://example.com/earth' },
  { name: 'Mars', file: 'mars.glb', position: [8, 2.5, -35], scale: 0.6, url: 'https://example.com/mars' },
  { name: 'Jupiter', file: 'jupiter.glb', position: [12, 3, -50], scale: 1.8, url: 'https://example.com/jupiter' },
  { name: 'Saturn', file: 'saturn.glb', position: [16, 3.5, -60], scale: 1.5, url: 'https://example.com/saturn' },
  { name: 'Uranus', file: 'uranus.glb', position: [20, 4, -70], scale: 1.3, url: 'https://example.com/uranus' },
  { name: 'Neptune', file: 'neptune.glb', position: [24, 4.5, -80], scale: 1.2, url: 'https://example.com/neptune' },
  { name: 'Pluto', file: 'pluto.glb', position: [28, 5, -90], scale: 0.5, url: 'https://example.com/pluto' }
];

const loader = new GLTFLoader();
const loadedPlanets = [];

// --- Load 3D Planet Models ---
planetsData.forEach((data) => {
  loader.load(`./assets/${data.file}`, (gltf) => {
    const model = gltf.scene;
    model.scale.set(data.scale, data.scale, data.scale);
    model.position.set(...data.position);
    // Save the planet's name and URL for the HUD
    model.userData = { name: data.name, url: data.url, scale: data.scale };
    scene.add(model);
    loadedPlanets.push(model);
  }, undefined, (error) => {
    console.error(`Error loading ${data.name}:`, error);
  });
});

// --- Raycaster Setup ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
const planetDetails = document.getElementById('planet-details');

// --- Hover Effect: Show Tooltip with Planet Name ---
document.addEventListener('pointermove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(loadedPlanets, true);
  
  if (intersects.length > 0) {
    // Get the top-level model (planet)
    const hoveredPlanet = intersects[0].object.parent;
    tooltip.style.opacity = 1;
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
    tooltip.innerHTML = `<strong>${hoveredPlanet.userData.name}</strong>`;
  } else {
    tooltip.style.opacity = 0;
  }
});

// --- Click Event: Zoom to Planet and Show Futuristic HUD ---
document.addEventListener('pointerdown', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(loadedPlanets, true);
  
  if (intersects.length > 0) {
    const selectedPlanet = intersects[0].object.parent;
    flyToPlanet(selectedPlanet);
  } else {
    planetDetails.style.display = 'none';
  }
});

// --- Fly to Planet: Animate Camera Movement ---
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

// --- Show Futuristic HUD with Planet Details and Clickable Link ---
function showPlanetDetails(data) {
  planetDetails.style.top = '80px';
  planetDetails.innerHTML = `
    <h2>${data.name}</h2>
    <p>Explore more about ${data.name} by clicking the link below.</p>
    <a href="${data.url}" target="_blank" style="color:#00fffc; text-decoration: underline;">Learn More</a>
  `;
  planetDetails.style.display = 'block';
}

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();
  
  // Slowly rotate each planet for realism
  loadedPlanets.forEach((planet) => {
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
