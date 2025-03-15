import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { GLTFLoader } from './GLTFLoader.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 10000);
camera.position.set(0, 50, 200);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 50, 50);
scene.add(directionalLight);

// --- OrbitControls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- Solar System Data ---
// Radii in km and orbits in AU (approximate values)
const solarSystemData = [
  { name: "Sun",     file: "sun.glb",     radius: 696340, orbit: 0,    url: 'https://example.com/sun' },
  { name: "Mercury", file: "mercury.glb", radius: 2439,   orbit: 0.39, url: 'https://example.com/mercury' },
  { name: "Venus",   file: "venus.glb",   radius: 6052,   orbit: 0.72, url: 'https://example.com/venus' },
  { name: "Earth",   file: "earth.glb",   radius: 6371,   orbit: 1,    url: 'https://example.com/earth' },
  { name: "Mars",    file: "mars.glb",    radius: 3390,   orbit: 1.52, url: 'https://example.com/mars' },
  { name: "Jupiter", file: "jupiter.glb", radius: 69911,  orbit: 5.2,  url: 'https://example.com/jupiter' },
  { name: "Saturn",  file: "saturn.glb",  radius: 58232,  orbit: 9.54, url: 'https://example.com/saturn' },
  { name: "Uranus",  file: "uranus.glb",  radius: 25362,  orbit: 19.2, url: 'https://example.com/uranus' },
  { name: "Neptune", file: "neptune.glb", radius: 24622,  orbit: 30.1, url: 'https://example.com/neptune' },
  { name: "Pluto",   file: "pluto.glb",   radius: 1188,   orbit: 39.5, url: 'https://example.com/pluto' }
];

// --- Scaling Factors ---
// We set the Sun’s desired radius in scene units:
const sunDesiredRadius = 10; // e.g., 10 units in your scene
// Calculate a basic conversion factor for sizes (km -> scene units) based on the Sun:
const radiusScaleFactor = sunDesiredRadius / solarSystemData[0].radius;
// For visual purposes, we exaggerate planet sizes relative to the Sun:
const planetSizeExaggeration = 10;  
// Scale for orbital distances (AU -> scene units); adjust to fit your scene
const orbitScale = 50;

// --- GLTF Loader ---
const loader = new GLTFLoader();
const loadedPlanets = [];
const planetGroup = new THREE.Group();
scene.add(planetGroup);

// Helper: Get the top-level object in a model
function getRoot(object) {
  while (object.parent && object.parent.type !== "Scene") {
    object = object.parent;
  }
  return object;
}

// --- Load Models & Arrange Orbits ---
solarSystemData.forEach((data, index) => {
  loader.load(`./assets/${data.file}`, (gltf) => {
    let model = gltf.scene;
    model = getRoot(model);
    
    if (data.name === "Sun") {
      // For the Sun: set scale so its radius becomes sunDesiredRadius
      const scaleFactor = sunDesiredRadius / data.radius;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);
      model.position.set(0, 0, 0);
    } else {
      // For planets: scale relative to the Sun, then exaggerate for visibility
      const scaleFactor = (data.radius * radiusScaleFactor) * planetSizeExaggeration;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);
      
      // Arrange on a circular orbit around the Sun:
      // Compute an angle to distribute the planets evenly.
      // (Subtract 1 from index because index 0 is the Sun)
      let angle = (index - 1) * (Math.PI * 2 / (solarSystemData.length - 1));
      // Orbit distance in scene units
      let distance = data.orbit * orbitScale;
      model.position.set(distance * Math.cos(angle), 0, distance * Math.sin(angle));
    }
    
    model.userData = { name: data.name, url: data.url };
    planetGroup.add(model);
    loadedPlanets.push(model);
    
    console.log(`${data.name} loaded. Scale: ${model.scale.x.toFixed(2)}; Position: (${model.position.x.toFixed(2)}, ${model.position.y.toFixed(2)}, ${model.position.z.toFixed(2)})`);
    
    // Optionally, attach a light to the Sun to illuminate the scene
    if (data.name === "Sun") {
      const sunLight = new THREE.PointLight(0xffffff, 2, 500);
      sunLight.position.copy(model.position);
      scene.add(sunLight);
    }
  }, undefined, (error) => {
    console.error(`Error loading ${data.name}:`, error);
  });
});

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
