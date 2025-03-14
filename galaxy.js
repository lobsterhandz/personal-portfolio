// galaxy.js

// === Imports ===
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';
import { OrbitControls } from './OrbitControls.js';

// === Scene Setup ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 2000
);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// === OrbitControls Setup ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
camera.position.set(0, 0, 5);

// === Texture Loader ===
const textureLoader = new THREE.TextureLoader();

// === Helper Function: Create Layered Star ===
function createLayeredStar({
  coreRadius = 0.5,
  coreTexture = 'assets/star_surface.jpg',
  atmosphereRadius = 0.55,
  atmosphereTexture = 'assets/star_atmosphere.png',
  coronaRadius = 0.6,
  coronaTexture = 'assets/star_corona.png',
  emissiveColor = 0xffdd00,
  emissiveIntensity = 0.8
} = {}) {
  const starGroup = new THREE.Group();

  // Core Sphere: Use MeshPhongMaterial for a lit, emissive look
  const coreGeom = new THREE.SphereGeometry(coreRadius, 32, 32);
  const coreMat = new THREE.MeshPhongMaterial({
    map: textureLoader.load(coreTexture),
    emissive: emissiveColor,
    emissiveIntensity: emissiveIntensity,
    shininess: 50
  });
  const coreMesh = new THREE.Mesh(coreGeom, coreMat);

  // Atmosphere Sphere: Slightly larger, semi-transparent, additive
  const atmGeom = new THREE.SphereGeometry(atmosphereRadius, 32, 32);
  const atmMat = new THREE.MeshBasicMaterial({
    map: textureLoader.load(atmosphereTexture),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide
  });
  const atmMesh = new THREE.Mesh(atmGeom, atmMat);

  // Corona Sphere: Even larger, for a faint outer glow
  const coronaGeom = new THREE.SphereGeometry(coronaRadius, 32, 32);
  const coronaMat = new THREE.MeshBasicMaterial({
    map: textureLoader.load(coronaTexture),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide
  });
  const coronaMesh = new THREE.Mesh(coronaGeom, coronaMat);

  // Optional: Add a point light to simulate star light (affects nearby objects)
  const starLight = new THREE.PointLight(emissiveColor, 1.0, 10);
  starLight.position.set(0, 0, 0);

  // Group all layers together
  starGroup.add(coreMesh);
  starGroup.add(atmMesh);
  starGroup.add(coronaMesh);
  starGroup.add(starLight);

  return starGroup;
}

// === Create a Layered Star and Add It to the Scene ===
const layeredStar = createLayeredStar({
  coreRadius: 0.5,
  atmosphereRadius: 0.55,
  coronaRadius: 0.6,
  coreTexture: 'assets/star_surface.jpg',
  atmosphereTexture: 'assets/star_atmosphere.png',
  coronaTexture: 'assets/star_corona.png',
  emissiveColor: 0xffdd00,
  emissiveIntensity: 0.8
});
layeredStar.position.set(0, 0, 0);
scene.add(layeredStar);

// === Lighting (Ambient + Directional) ===
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// === Optional: Sky Sphere for Background (Nebula) ===
const skyTexture = textureLoader.load('assets/nebula.jpg');
const skyGeometry = new THREE.SphereGeometry(1000, 32, 32);
const skyMaterial = new THREE.MeshBasicMaterial({
  map: skyTexture,
  side: THREE.BackSide,
  transparent: true,
  opacity: 0.9
});
const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(skyMesh);

// === Animation Loop ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Optional rotation animations for atmosphere and corona for dynamic effect
  // Assuming children order: [coreMesh, atmMesh, coronaMesh, starLight]
  layeredStar.children[1].rotation.y += 0.0005;
  layeredStar.children[2].rotation.y -= 0.0005;

  // Center sky sphere on camera and rotate slowly for parallax effect
  skyMesh.position.copy(camera.position);
  skyMesh.rotation.y += 0.0002;

  renderer.render(scene, camera);
}
animate();

// === Handle Window Resize ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
