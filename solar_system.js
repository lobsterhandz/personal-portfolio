import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { GLTFLoader } from './GLTFLoader.js';

// ============ Scene, Camera, Renderer ============
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(0, 100, 500);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.zIndex = '-1';

// ============ Sky Dome (Background) ============
const skyTexture = new THREE.TextureLoader().load('./assets/space_bg.jpg');
const skyGeometry = new THREE.SphereGeometry(5000, 32, 32);
const skyMaterial = new THREE.MeshBasicMaterial({
  map: skyTexture,
  side: THREE.BackSide,
  depthWrite: false,   // Prevent writing to the z-buffer
  depthTest: false     // Prevent the sky from interfering with other objects
});
const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(skyDome);

// ============ Lighting ============
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(100, 100, 50);
scene.add(directionalLight);

// ============ Orbit Controls ============
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.minDistance = 100;
controls.maxDistance = 2000;

// ============ Solar System Data ============
const solarSystemData = [
  { name: "Sun",     file: "sun.glb",     radius: 696340, orbitAU: 0,    period: 0,    url: 'https://example.com/sun' },
  { name: "Mercury", file: "mercury.glb", radius: 2439,   orbitAU: 0.39, period: 88,   url: 'https://example.com/mercury' },
  { name: "Venus",   file: "venus.glb",   radius: 6052,   orbitAU: 0.72, period: 225,  url: 'https://example.com/venus' },
  { name: "Earth",   file: "earth.glb",   radius: 6371,   orbitAU: 1,    period: 365,  url: 'https://example.com/earth' },
  { name: "Mars",    file: "mars.glb",    radius: 3390,   orbitAU: 1.52, period: 687,  url: 'https://example.com/mars' },
  { name: "Jupiter", file: "jupiter.glb", radius: 69911,  orbitAU: 5.2,  period: 4333, url: 'https://example.com/jupiter' },
  { name: "Saturn",  file: "saturn.glb",  radius: 58232,  orbitAU: 9.54, period: 10759,url: 'https://example.com/saturn' },
  { name: "Uranus",  file: "uranus.glb",  radius: 25362,  orbitAU: 19.2, period: 30687,url: 'https://example.com/uranus' },
  { name: "Neptune", file: "neptune.glb", radius: 24622,  orbitAU: 30.1, period: 60190,url: 'https://example.com/neptune' },
  { name: "Pluto",   file: "pluto.glb",   radius: 1188,   orbitAU: 39.5, period: 90560,url: 'https://example.com/pluto' }
];

const moonData = {
  name: "Moon",
  file: "moon.glb",
  radius: 1737, // km
  orbitDistanceKm: 384400, // average distance from Earth in km
  period: 27 // days
};

// ============ Scaling Factors ============
const sunDesiredRadius = 10;
const radiusScaleFactor = sunDesiredRadius / solarSystemData[0].radius;
// Adjusted factors to make planets relatively smaller and orbits more spread out.
const planetSizeExaggeration = 3;
const orbitDistanceScale = 150;
function computeOrbitDistance(orbitAU) {
  return Math.log(1 + orbitAU) * orbitDistanceScale;
}
const moonOrbitScale = 0.05;

// ============ Loaders and Containers ============
const loader = new GLTFLoader();
const solarSystemGroup = new THREE.Group();
scene.add(solarSystemGroup);
const planetPivots = {};

// Helper to recenter a model so its pivot is at its geometric center.
function recenterModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  box.getCenter(center);
  model.position.sub(center);
  return model;
}

// Optional: Draw orbit path circles
function drawOrbitPath(distance) {
  const segments = 64;
  const material = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true });
  const geometry = new THREE.BufferGeometry();
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(distance * Math.cos(theta), 0, distance * Math.sin(theta)));
  }
  geometry.setFromPoints(points);
  const orbitLine = new THREE.Line(geometry, material);
  scene.add(orbitLine);
}

// ============ Load Sun and Planets ============
solarSystemData.forEach((data) => {
  const pivot = new THREE.Group();
  // For non-Sun planets, set an initial random rotation to distribute them around the Sun.
  if (data.name !== "Sun") {
    pivot.rotation.y = Math.random() * Math.PI * 2;
  }
  solarSystemGroup.add(pivot);
  planetPivots[data.name] = pivot;
  
  loader.load(`./assets/${data.file}`, (gltf) => {
    let model = gltf.scene;
    model = recenterModel(model);
    
    if (data.name === "Sun") {
      const scaleFactor = sunDesiredRadius / data.radius;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);
      model.position.set(0, 0, 0);
      pivot.add(model);
      const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
      sunLight.position.copy(model.position);
      pivot.add(sunLight);
    } else {
      const scaleFactor = (data.radius * radiusScaleFactor) * planetSizeExaggeration;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);
      const orbitDistance = computeOrbitDistance(data.orbitAU);
      model.position.set(orbitDistance, 0, 0);
      pivot.add(model);
      pivot.userData = {
        orbitDistance: orbitDistance,
        period: data.period
      };
      drawOrbitPath(orbitDistance);
      
      // If the planet is Earth, load and attach the Moon.
      if (data.name === "Earth") {
        const earthPivot = pivot;
        const moonPivot = new THREE.Group();
        earthPivot.add(moonPivot);
        moonPivot.position.copy(model.position);
        
        loader.load(`./assets/${moonData.file}`, (gltfMoon) => {
          let moonModel = gltfMoon.scene;
          moonModel = recenterModel(moonModel);
          const moonScale = ((moonData.radius * radiusScaleFactor) * planetSizeExaggeration);
          moonModel.scale.set(moonScale, moonScale, moonScale);
          const moonOrbitDistance = moonData.orbitDistanceKm * moonOrbitScale;
          moonModel.position.set(moonOrbitDistance, 0, 0);
          moonPivot.add(moonModel);
          moonPivot.userData = { period: moonData.period };
          planetPivots["Moon"] = moonPivot;
        });
      }
    }
    console.log(`${data.name} loaded.`);
  }, undefined, (error) => {
    console.error(`Error loading ${data.name}:`, error);
  });
});

// ============ Animation Loop ============
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();
  
  // Update each planet's pivot rotation for orbiting
  for (const name in planetPivots) {
    const pivot = planetPivots[name];
    if (pivot.userData.period && pivot.userData.orbitDistance !== undefined) {
      const angularSpeed = (delta * 0.05) / pivot.userData.period;
      pivot.rotation.y += angularSpeed;
    }
  }
  
  // Move the sky dome to follow the camera
  skyDome.position.copy(camera.position);
  
  controls.update();
  renderer.render(scene, camera);
}
animate();

// ============ Window Resize Handler ============
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
