import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { GLTFLoader } from './GLTFLoader.js';

// ============ Scene, Camera, Renderer ============
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000000
);
// Position the camera to view the entire system.
camera.position.set(0, 500, 50000);
camera.lookAt(0, 0, 0);

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
const skyGeometry = new THREE.SphereGeometry(100000, 32, 32);
const skyMaterial = new THREE.MeshBasicMaterial({
  map: skyTexture,
  side: THREE.BackSide,
  depthWrite: false,
  depthTest: false
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
controls.minDistance = 200;
controls.maxDistance = 2000000;

// ============ GLTF Loader & Helper Function ============
const loader = new GLTFLoader();

// Helper to recenter a model so its pivot is at its geometric center.
function recenterModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  box.getCenter(center);
  model.position.sub(center);
  return model;
}

// ============ Load Only the Sun ============
const sunData = {
  name: "Sun",
  file: "sun.glb",
  radius: 696340,  // real-life radius in km (used for scaling)
  url: 'https://example.com/sun'
};

// Set the desired Sun radius in scene units (make it large so it's clearly visible)
const sunDesiredRadius = 1000;
// Calculate a scaling factor for the Sun
const scaleFactor = sunDesiredRadius / sunData.radius;

loader.load(`./assets/${sunData.file}`, (gltf) => {
  let sunModel = gltf.scene;
  sunModel = recenterModel(sunModel);
  
  // Scale the Sun model
  sunModel.scale.set(scaleFactor, scaleFactor, scaleFactor);
  sunModel.position.set(0, 0, 0);
  
  // Make the Sun emissive so it appears bright
  sunModel.traverse((child) => {
    if (child.isMesh) {
      child.material.emissive = new THREE.Color(0xffff00);
      child.material.emissiveIntensity = 2.0;
    }
  });
  
  scene.add(sunModel);
  
  // Add a strong point light at the Sun's location
  const sunLight = new THREE.PointLight(0xffffff, 3, 1000000);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);
  
  console.log("Sun loaded.");
}, undefined, (error) => {
  console.error("Error loading Sun:", error);
});

// ============ Animation Loop ============
function animate() {
  requestAnimationFrame(animate);
  
  // Keep the sky dome centered on the camera.
  skyDome.position.copy(camera.position);
  
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
