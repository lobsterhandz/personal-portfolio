import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { GLTFLoader } from './GLTFLoader.js';

// --- Logging ---
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
camera.position.set(0, 20, 150);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.zIndex = '-1';

// --- Lighting ---
// Add an ambient light to illuminate all objects
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Add a directional light to simulate the sun’s light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 50, 50);
scene.add(directionalLight);

// --- Loading Manager ---
const manager = new THREE.LoadingManager();
manager.onStart = (url, itemsLoaded, itemsTotal) => {
  console.log(`Started loading: ${url} (${itemsLoaded} of ${itemsTotal})`);
};
manager.onLoad = () => {
  console.log('All assets loaded.');
};
manager.onProgress = (url, itemsLoaded, itemsTotal) => {
  console.log(`Loading: ${url} (${itemsLoaded} of ${itemsTotal})`);
};
manager.onError = (url) => {
  console.error(`Error loading: ${url}`);
};

// --- Background (Curved Sky Sphere) ---
const textureLoader = new THREE.TextureLoader(manager);
const bgGeometry = new THREE.SphereGeometry(500, 32, 32);
const bgMaterial = new THREE.MeshBasicMaterial({
  map: textureLoader.load('./assets/space_bg.jpg'),
  side: THREE.BackSide, // Render inside the sphere
});
const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
scene.add(bgMesh);

// --- OrbitControls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 50;
controls.maxDistance = 450;

// --- Background Music ---
const audioListener = new THREE.AudioListener();
camera.add(audioListener);
const backgroundSound = new THREE.Audio(audioListener);
const audioLoader = new THREE.AudioLoader(manager);
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
const planetsData = [
  { name: 'Sun',     file: 'sun.glb',     position: [0, 0, -20],   scale: 2,   url: 'https://example.com/sun' },
  { name: 'Mercury', file: 'mercury.glb', position: [2, 1, -40],   scale: 0.5, url: 'https://example.com/mercury' },
  { name: 'Venus',   file: 'venus.glb',   position: [4, 1.5, -60], scale: 0.7, url: 'https://example.com/venus' },
  { name: 'Earth',   file: 'earth.glb',   position: [6, 2, -80],   scale: 0.9, url: 'https://example.com/earth' },
  { name: 'Mars',    file: 'mars.glb',    position: [8, 2.5, -100],scale: 0.6, url: 'https://example.com/mars' },
  { name: 'Jupiter', file: 'jupiter.glb', position: [12, 3, -140], scale: 1.8, url: 'https://example.com/jupiter' },
  { name: 'Saturn',  file: 'saturn.glb',  position: [16, 3.5, -180], scale: 1.5, url: 'https://example.com/saturn' },
  { name: 'Uranus',  file: 'uranus.glb',  position: [20, 4, -220], scale: 1.3, url: 'https://example.com/uranus' },
  { name: 'Neptune', file: 'neptune.glb', position: [24, 4.5, -260], scale: 1.2, url: 'https://example.com/neptune' },
  { name: 'Pluto',   file: 'pluto.glb',   position: [28, 5, -300], scale: 0.5, url: 'https://example.com/pluto' }
];

const loader = new GLTFLoader(manager);
const loadedPlanets = [];

// --- Helper: Get Root Object ---
function getRoot(object) {
  while (object.parent && object.parent.type !== "Scene") {
    object = object.parent;
  }
  return object;
}

// --- Load 3D Planet Models ---
planetsData.forEach((data) => {
  loader.load(`./assets/${data.file}`, (gltf) => {
    let model = gltf.scene;
    model = getRoot(model);
    model.scale.set(data.scale, data.scale, data.scale);
    model.position.set(...data.position);
    model.userData = { name: data.name, url: data.url, scale: data.scale, position: data.position };
    scene.add(model);
    loadedPlanets.push(model);
    console.log(`${data.name} loaded.`);
    
    // Optionally, attach a point light to the Sun to simulate it as a light source
    if (data.name === 'Sun') {
      const sunLight = new THREE.PointLight(0xffffff, 2, 500);
      sunLight.position.copy(model.position);
      scene.add(sunLight);
    }
    
  }, undefined, (error) => {
    console.error(`Error loading ${data.name}:`, error);
  });
});

// --- Raycaster Setup ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
const planetDetails = document.getElementById('planet-details');

// --- Hover Effect: Show Tooltip ---
document.addEventListener('pointermove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(loadedPlanets, true);
  
  if (intersects.length > 0) {
    let hovered = getRoot(intersects[0].object);
    tooltip.style.opacity = 1;
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
    tooltip.innerHTML = `<strong>${hovered.userData.name}</strong>`;
  } else {
    tooltip.style.opacity = 0;
    loadedPlanets.forEach((planet) => {
      const data = planetsData.find(p => p.name.toLowerCase() === planet.userData.name.toLowerCase());
      if (data) {
        planet.scale.set(data.scale, data.scale, data.scale);
      }
    });
  }
});

// --- Click Event: Zoom to Planet & Show HUD ---
document.addEventListener('pointerdown', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(loadedPlanets, true);
  
  if (intersects.length > 0) {
    let selected = getRoot(intersects[0].object);
    flyToPlanet(selected);
  } else {
    planetDetails.style.display = 'none';
  }
});

// --- Fly to Planet: Animate Camera Movement ---
function flyToPlanet(planet) {
  controls.target.copy(planet.position);
  controls.update();
  
  const direction = planet.position.clone().sub(camera.position).normalize();
  const newCameraPos = planet.position.clone().sub(direction.multiplyScalar(20));
  
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

// --- Show Futuristic HUD with Planet Details ---
function showPlanetDetails(data) {
  planetDetails.style.top = '80px';
  planetDetails.innerHTML = `
    <h2>${data.name}</h2>
    <p>Explore more about ${data.name} by clicking the link below.</p>
    <a href="${data.url}" target="_blank" style="color:#00fffc; text-decoration:underline;">Learn More</a>
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
