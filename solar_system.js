import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { GLTFLoader } from './GLTFLoader.js';

// ============ Scene, Camera, Renderer ============
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  200000
);
// Position the camera closer so the Sun fills the view.
camera.position.set(0, 100, 1000);
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

// ============ Orbit Controls ============
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.minDistance = 200;
controls.maxDistance = 200000;

// ============ GLTF Loader & Helper ============
const loader = new GLTFLoader();

// Helper: recenter a model so its pivot is at its geometric center.
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
  // Real-life radius is 696340 km but we ignore that here.
  url: 'https://example.com/sun'
};

// Instead of computing a scale from real numbers, use a fixed scale value.
const fixedSunScale = 50;

loader.load(`./assets/${sunData.file}`, (gltf) => {
  let sunModel = gltf.scene;
  sunModel = recenterModel(sunModel);
  
  // Apply a fixed scale so the Sun is clearly visible.
  sunModel.scale.set(fixedSunScale, fixedSunScale, fixedSunScale);
  sunModel.position.set(0, 0, 0);
  
  // Override the material to be unlit and bright.
  sunModel.traverse((child) => {
    if (child.isMesh) {
      child.material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    }
  });
  
  scene.add(sunModel);
  
  // Add a point light at the Sun's location for effect.
  const sunLight = new THREE.PointLight(0xffffff, 3, 1000000);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);
  
  console.log("Sun loaded and should be visible.");
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

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
