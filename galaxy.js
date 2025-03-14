// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Background Scaling & Curving Effect
const textureLoader = new THREE.TextureLoader();
textureLoader.load('assets/nebula.jpg', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
});

// --- OrbitControls ---
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// --- Load GLTF Planets ---
const loader = new THREE.GLTFLoader();
const planets = [
  { name: 'Sun', file: 'sun.glb', distance: 0, scale: 10 },
  { name: 'Mercury', file: 'mercury.glb', distance: 15, scale: 0.5 },
  { name: 'Venus', file: 'venus.glb', distance: 25, scale: 0.8 },
  { name: 'Earth', file: 'earth.glb', distance: 40, scale: 1 },
  { name: 'Moon', file: 'moon.glb', distance: 45, scale: 0.3, orbitAround: 'Earth' },
  { name: 'Mars', file: 'mars.glb', distance: 60, scale: 0.9 },
  { name: 'Jupiter', file: 'jupiter.glb', distance: 120, scale: 5 },
  { name: 'Saturn', file: 'saturn.glb', distance: 180, scale: 4 },
  { name: 'Uranus', file: 'uranus.glb', distance: 250, scale: 3 },
  { name: 'Neptune', file: 'neptune.glb', distance: 300, scale: 3 },
  //{ name: 'Pluto', file: 'pluto.glb', distance: 330, scale: 0.4 }
];

const planetObjects = {};
planets.forEach((data) => {
  loader.load(`./assets/${data.file}`, (gltf) => { 
    const planet = gltf.scene;
    planet.scale.set(data.scale, data.scale, data.scale);
    planet.position.set(data.distance, 0, 0);
    scene.add(planet);
    planetObjects[data.name] = planet;
  });
});

// --- Raycaster Setup for Hover & Click ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
const projectDetails = document.getElementById('project-details');

// --- Mobile Tap Support ---
document.addEventListener('touchstart', onPointer, false);
document.addEventListener('click', onPointer, false);

function onPointer(event) {
  const x = event.clientX || event.touches[0].clientX;
  const y = event.clientY || event.touches[0].clientY;
  
  mouse.x = (x / window.innerWidth) * 2 - 1;
  mouse.y = -(y / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(Object.values(planetObjects), true);
  if (intersects.length > 0) {
    const selectedPlanet = intersects[0].object.parent;
    flyToPlanet(selectedPlanet);
  } else {
    projectDetails.style.display = 'none';
  }
}

// --- Fly to Selected Planet ---
function flyToPlanet(planet) {
  controls.target.copy(planet.position);
  controls.update();

  const direction = planet.position.clone().sub(camera.position).normalize();
  const newCameraPos = planet.position.clone().sub(direction.multiplyScalar(10));

  new TWEEN.Tween(camera.position)
    .to(newCameraPos, 2000)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => { controls.target.copy(planet.position); controls.update(); })
    .onComplete(() => { showProjectDetails(planet.name); })
    .start();
}

// --- Show Project Details ---
function showProjectDetails(planetName) {
  projectDetails.innerHTML = `<h2>${planetName}</h2><p>Click to explore this planet.</p>`;
  projectDetails.style.display = 'block';
}

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();
  
  // Make planets rotate for realism
  Object.values(planetObjects).forEach((planet) => {
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
