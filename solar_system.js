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
// Position the camera so that it sees the whole system.
// (You may adjust this value to capture more or less of the scene.)
camera.position.set(0, 100, 500);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
// Style the canvas as a full-screen background.
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.zIndex = '-1';

// ============ Sky Dome (Attached to Camera) ============
const skyTexture = new THREE.TextureLoader().load('./assets/space_bg.jpg');
const skyGeometry = new THREE.SphereGeometry(5000, 32, 32);
const skyMaterial = new THREE.MeshBasicMaterial({
  map: skyTexture,
  side: THREE.BackSide
});
const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
// Attach the sky dome to the camera so it always stays "at infinity"
camera.add(skyDome);

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
// Data for the Sun and planets (excluding the Moon) with approximate values.
// orbitAU: average orbital distance in AU (astronomical units)
// real radii: in kilometers
const solarSystemData = [
  { name: "Sun",     file: "sun.glb",     radius: 696340, orbitAU: 0,    period: 0,   url: 'https://example.com/sun' },
  { name: "Mercury", file: "mercury.glb", radius: 2439,   orbitAU: 0.39, period: 88,  url: 'https://example.com/mercury' },
  { name: "Venus",   file: "venus.glb",   radius: 6052,   orbitAU: 0.72, period: 225, url: 'https://example.com/venus' },
  { name: "Earth",   file: "earth.glb",   radius: 6371,   orbitAU: 1,    period: 365, url: 'https://example.com/earth' },
  { name: "Mars",    file: "mars.glb",    radius: 3390,   orbitAU: 1.52, period: 687, url: 'https://example.com/mars' },
  { name: "Jupiter", file: "jupiter.glb", radius: 69911,  orbitAU: 5.2,  period: 4333, url: 'https://example.com/jupiter' },
  { name: "Saturn",  file: "saturn.glb",  radius: 58232,  orbitAU: 9.54, period: 10759, url: 'https://example.com/saturn' },
  { name: "Uranus",  file: "uranus.glb",  radius: 25362,  orbitAU: 19.2, period: 30687, url: 'https://example.com/uranus' },
  { name: "Neptune", file: "neptune.glb", radius: 24622,  orbitAU: 30.1, period: 60190, url: 'https://example.com/neptune' },
  { name: "Pluto",   file: "pluto.glb",   radius: 1188,   orbitAU: 39.5, period: 90560, url: 'https://example.com/pluto' }
];

// Moon data (orbits Earth)
const moonData = {
  name: "Moon",
  file: "moon.glb",
  radius: 1737, // km
  orbitDistanceKm: 384400, // average distance from Earth in km
  period: 27 // days (for rotation speed)
};

// ============ Scaling Factors ============
// We fix the Sun’s radius to a desired value in scene units.
const sunDesiredRadius = 10;
// Conversion for sizes (km -> scene units) based on the Sun.
const radiusScaleFactor = sunDesiredRadius / solarSystemData[0].radius;
// Exaggeration factor for planet sizes (planets are tiny compared to the Sun).
const planetSizeExaggeration = 5;

// For distances, we want to compress the huge AU values into a beautiful scene.
// Instead of a linear scale, we use a logarithmic compression so that inner planets aren’t too close and outer ones aren’t too far.
const orbitDistanceScale = 100; // adjust to taste
function computeOrbitDistance(orbitAU) {
  // Use logarithmic scaling: distance = log(1 + orbitAU) * orbitDistanceScale.
  return Math.log(1 + orbitAU) * orbitDistanceScale;
}

// For the Moon, we compute its orbit distance relative to Earth in scene units.
// We choose an arbitrary scale so that the Moon’s orbit is visible relative to the Earth’s size.
const moonOrbitScale = 0.05; // tweak as needed

// ============ Loaders and Containers ============
const loader = new GLTFLoader();

// Group to hold all solar system pivots (for orbital rotations)
const solarSystemGroup = new THREE.Group();
scene.add(solarSystemGroup);

// We will store a reference to each planet’s pivot for rotation.
const planetPivots = {};

// ============ Helper: Recenter Model ============
function recenterModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  box.getCenter(center);
  model.position.sub(center);
  return model;
}

// ============ Load Sun and Planets ============
solarSystemData.forEach((data) => {
  // Create an empty pivot for this planet to orbit around the Sun.
  const pivot = new THREE.Group();
  solarSystemGroup.add(pivot);
  planetPivots[data.name] = pivot;
  
  loader.load(`./assets/${data.file}`, (gltf) => {
    let model = gltf.scene;
    model = recenterModel(model);
    
    if (data.name === "Sun") {
      // Scale and position the Sun at the center.
      const scaleFactor = sunDesiredRadius / data.radius;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);
      model.position.set(0, 0, 0);
      pivot.add(model);
      // Optionally, add a point light at the Sun.
      const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
      sunLight.position.copy(model.position);
      pivot.add(sunLight);
    } else {
      // Scale the planet relative to the Sun.
      const scaleFactor = (data.radius * radiusScaleFactor) * planetSizeExaggeration;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);
      
      // Compute the orbit distance using our logarithmic function.
      const orbitDistance = computeOrbitDistance(data.orbitAU);
      // Position the planet along the positive X axis (its pivot will handle rotation).
      model.position.set(orbitDistance, 0, 0);
      pivot.add(model);
      
      // Save the orbit distance and period on the pivot for rotation speed.
      pivot.userData = {
        orbitDistance: orbitDistance,
        period: data.period // in days (we'll scale this arbitrarily)
      };
      
      // If the planet is Earth, load and attach the Moon.
      if (data.name === "Earth") {
        const earthPivot = pivot; // planet pivot for Earth
        // Create a pivot for the Moon around the Earth.
        const moonPivot = new THREE.Group();
        earthPivot.add(moonPivot);
        moonPivot.position.copy(model.position); // center it on Earth
        
        loader.load(`./assets/${moonData.file}`, (gltfMoon) => {
          let moonModel = gltfMoon.scene;
          moonModel = recenterModel(moonModel);
          // Scale the Moon relative to the Sun (or relative to Earth)
          const moonScale = ((moonData.radius * radiusScaleFactor) * planetSizeExaggeration);
          moonModel.scale.set(moonScale, moonScale, moonScale);
          // Set the Moon’s orbit distance using its km distance scaled down.
          const moonOrbitDistance = moonData.orbitDistanceKm * moonOrbitScale;
          moonModel.position.set(moonOrbitDistance, 0, 0);
          moonPivot.add(moonModel);
          // Save data for moon rotation.
          moonPivot.userData = { period: moonData.period };
          // Store reference for animation.
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
  
  // Rotate each planet pivot around the Sun.
  // We use a simple angular speed computed from the period.
  for (const name in planetPivots) {
    const pivot = planetPivots[name];
    if (pivot.userData.period && pivot.userData.orbitDistance !== undefined) {
      // For simplicity, define a base angular speed.
      // (Adjust the divisor to control the overall speed.)
      const angularSpeed = (delta * 0.05) / pivot.userData.period;
      pivot.rotation.y += angularSpeed;
    }
  }
  
  // Render the scene.
  controls.update();
  renderer.render(scene, camera);
}
animate();

// ============ Handle Window Resize ============
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
