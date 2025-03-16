/*****************************************************************************
 *  Simple Solar System-Like Demo with Actual Models
 *    - All bodies use GLTF models (same scale factor).
 *    - Orbits have consistent spacing.
 *    - The Moon orbits Earth.
 *    - A starry background sphere is included.
 *****************************************************************************/

// ======= USER PARAMETERS =======

const revolveSpeed = 0.003;   // how fast the planets revolve around the Sun
const rotateSpeed  = 0.005;   // how fast each planet (and Sun) rotates on its axis
const orbitSpacing = 30;      // distance between consecutive orbits

const modelScale   = 3;       // uniform scale for all planet models

// For Earth-Moon relationship
const moonOrbitDistance = 10; // how far the Moon is from Earth
const moonRevolveSpeed  = 0.005;
const moonRotateSpeed   = 0.005;

// If you want Pluto, just add it below & to planetNames array

// ======= Planet Data (Model Filenames) =======
// We'll just create an array describing each planet, plus the Sun.
const planetData = [
  { name: "Sun",     file: "sun.glb"     },
  { name: "Mercury", file: "mercury.glb" },
  { name: "Venus",   file: "venus.glb"   },
  { name: "Earth",   file: "earth.glb"   },
  { name: "Mars",    file: "mars.glb"    },
  { name: "Jupiter", file: "jupiter.glb" },
  { name: "Saturn",  file: "saturn.glb"  },
  { name: "Uranus",  file: "uranus.glb"  },
  { name: "Neptune", file: "neptune.glb" }
];

// ======= Basic Three.js Setup =======
import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { GLTFLoader } from './GLTFLoader.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(0, 100, 300);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Style as a full-screen background
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.zIndex = '-1';

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 50;
controls.maxDistance = 2000;

// Basic ambient & directional lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// ======= Starry Background Sphere =======
const textureLoader = new THREE.TextureLoader();
const bgTexture = textureLoader.load('./assets/space_bg.jpg');
const bgGeometry = new THREE.SphereGeometry(5000, 32, 32);
const bgMaterial = new THREE.MeshBasicMaterial({
  map: bgTexture,
  side: THREE.BackSide
});
const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
scene.add(bgMesh);

// Keep background sphere centered on camera
function updateBackgroundSphere() {
  bgMesh.position.copy(camera.position);
}

// ======= Data Structures for Pivots / Meshes =======
const planetPivots = {};
const planetMeshes = {};
let moonPivot, moonMesh;

// ======= Loader =======
const loader = new GLTFLoader();

// ======= Create Planets & Sun =======
function initPlanets() {
  for (let i = 0; i < planetData.length; i++) {
    const data = planetData[i];
    const name = data.name;
    
    // Create a pivot group for revolve
    const pivot = new THREE.Group();
    scene.add(pivot);
    planetPivots[name] = pivot;
    
    loader.load(`./assets/${data.file}`, (gltf) => {
      let model = gltf.scene;

      // Recenter the model so it rotates around its own center
      centerModel(model);

      // Scale the model so everything is the same size
      model.scale.set(modelScale, modelScale, modelScale);

      // If Sun, place it at center. Otherwise place it at an orbit distance
      if (name === "Sun") {
        model.position.set(0, 0, 0);
        pivot.rotation.y = 0; // The Sun won't revolve around anything
      } else {
        // Planet index starts from 1, so let's do orbit radius = i * orbitSpacing
        const orbitRadius = i * orbitSpacing;
        model.position.set(orbitRadius, 0, 0);
        
        // If Earth, we’ll set up a pivot for the Moon
        if (name === "Earth") {
          moonPivot = new THREE.Group();
          pivot.add(moonPivot);
          // Place the Moon pivot at Earth’s position
          moonPivot.position.set(orbitRadius, 0, 0);
          // Now load the Moon
          loader.load(`./assets/moon.glb`, (moonGltf) => {
            const m = moonGltf.scene;
            centerModel(m);
            m.scale.set(modelScale, modelScale, modelScale); // same scale or separate?
            // If you want a smaller Moon, do something like:
            // m.scale.multiplyScalar(0.5);
            m.position.set(moonOrbitDistance, 0, 0); 
            moonPivot.add(m);
            moonMesh = m;
          });
        }
      }
      
      pivot.add(model);
      planetMeshes[name] = model;
    });
  }
}

// Helper to recenter a loaded model so it rotates around its center
function centerModel(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  obj.position.sub(center);
}

// ======= Animation Loop =======
function animate() {
  requestAnimationFrame(animate);
  
  // revolve each planet pivot (except the Sun pivot which is index 0)
  for (let i = 1; i < planetData.length; i++) {
    const name = planetData[i].name;
    const pivot = planetPivots[name];
    pivot.rotation.y += revolveSpeed; 
  }
  // revolve the Moon pivot
  if (moonPivot) {
    moonPivot.rotation.y += moonRevolveSpeed;
  }
  
  // rotate each planet (and Sun) on its axis
  for (let i = 0; i < planetData.length; i++) {
    const name = planetData[i].name;
    const mesh = planetMeshes[name];
    if (mesh) mesh.rotation.y += rotateSpeed;
  }
  // rotate the Moon
  if (moonMesh) {
    moonMesh.rotation.y += moonRotateSpeed;
  }
  
  // keep the background sphere centered on the camera
  updateBackgroundSphere();
  
  controls.update();
  renderer.render(scene, camera);
}
animate();

// ======= Initialize =======
initPlanets();

// ======= Handle Window Resize =======
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
