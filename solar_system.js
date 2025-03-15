import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { GLTFLoader } from './GLTFLoader.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(0, 50, 200);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Renderer Styling (Full Screen Background) ---
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.zIndex = '-1';

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 50, 50);
scene.add(directionalLight);

// --- Background (Curved Space Sphere) ---
const textureLoader = new THREE.TextureLoader();
const bgGeometry = new THREE.SphereGeometry(500, 32, 32);
const bgMaterial = new THREE.MeshBasicMaterial({
  map: textureLoader.load('./assets/space_bg.jpg'),
  side: THREE.BackSide
});
const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
scene.add(bgMesh);

// --- OrbitControls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 50;
controls.maxDistance = 1000;

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
// Radii in km and orbital distances in AU (approximate values)
// Note: In reality the size differences are enormous so we use scaling factors.
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
// Fix the Sun’s radius to a chosen scene unit (e.g., 10 units)
const sunDesiredRadius = 10;
// Basic conversion for size (km -> scene units) based on the Sun
const radiusScaleFactor = sunDesiredRadius / solarSystemData[0].radius;
// Exaggeration factor for planet sizes (since they become tiny compared to the Sun)
const planetSizeExaggeration = 10;
// Orbit scale factor to bring astronomical distances into view (AU -> scene units)
const orbitScale = 50;

// --- GLTF Loader & Container ---
const loader = new GLTFLoader();
const loadedPlanets = [];
const planetGroup = new THREE.Group();
scene.add(planetGroup);

// --- Helper: Get Root Object ---
function getRoot(object) {
  while (object.parent && object.parent.type !== "Scene") {
    object = object.parent;
  }
  return object;
}

// --- Draw Orbit Paths (Optional) ---
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

// --- Load Models & Arrange Orbits ---
solarSystemData.forEach((data, index) => {
  loader.load(`./assets/${data.file}`, (gltf) => {
    let model = gltf.scene;
    model = getRoot(model);
    
    if (data.name === "Sun") {
      // Scale the Sun so its radius equals sunDesiredRadius
      const scaleFactor = sunDesiredRadius / data.radius;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);
      model.position.set(0, 0, 0);
      
      // Attach a point light to the Sun to illuminate the scene
      const sunLight = new THREE.PointLight(0xffffff, 2, 500);
      sunLight.position.copy(model.position);
      scene.add(sunLight);
    } else {
      // Scale planets relative to the Sun and exaggerate their sizes
      const scaleFactor = (data.radius * radiusScaleFactor) * planetSizeExaggeration;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);
      
      // Calculate orbital position: place the planet on a circular orbit around the Sun.
      // Distribute the planets evenly by angle (excluding the Sun at index 0).
      const angle = (index - 1) * (Math.PI * 2 / (solarSystemData.length - 1));
      const distance = data.orbit * orbitScale;
      model.position.set(distance * Math.cos(angle), 0, distance * Math.sin(angle));
      
      // Optionally, draw the orbit path for visual guidance.
      drawOrbitPath(distance);
    }
    
    // Store metadata and add the model to the group
    model.userData = { name: data.name, url: data.url };
    planetGroup.add(model);
    loadedPlanets.push(model);
    
    console.log(`${data.name} loaded. Scale: ${model.scale.x.toFixed(2)}; Position: (${model.position.x.toFixed(2)}, ${model.position.y.toFixed(2)}, ${model.position.z.toFixed(2)})`);
  }, undefined, (error) => {
    console.error(`Error loading ${data.name}:`, error);
  });
});

// --- Raycaster Setup for Tooltip & Click Events ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
const planetDetails = document.getElementById('planet-details');

// --- Helper: Fly To Planet (Camera Animation) ---
// Ensure TWEEN.js is loaded on your page for this to work.
function flyToPlanet(planet) {
  controls.target.copy(planet.position);
  controls.update();
  
  const direction = planet.position.clone().sub(camera.position).normalize();
  const newCameraPos = planet.position.clone().sub(direction.multiplyScalar(20));
  
  new TWEEN.Tween(camera.position)
    .to({ x: newCameraPos.x, y: newCameraPos.y, z: newCameraPos.z }, 2000)
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

function showPlanetDetails(data) {
  planetDetails.style.top = '80px';
  planetDetails.innerHTML = `
    <h2>${data.name}</h2>
    <p>Explore more about ${data.name} by clicking the link below.</p>
    <a href="${data.url}" target="_blank" style="color:#00fffc; text-decoration:underline;">Learn More</a>
  `;
  planetDetails.style.display = 'block';
}

// --- Hover Effect: Show Tooltip ---
document.addEventListener('pointermove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(loadedPlanets, true);
  
  if (intersects.length > 0) {
    const hovered = getRoot(intersects[0].object);
    tooltip.style.opacity = 1;
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
    tooltip.innerHTML = `<strong>${hovered.userData.name}</strong>`;
  } else {
    tooltip.style.opacity = 0;
  }
});

// --- Click Event: Fly to Planet & Show Details ---
document.addEventListener('pointerdown', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(loadedPlanets, true);
  if (intersects.length > 0) {
    const selected = getRoot(intersects[0].object);
    flyToPlanet(selected);
  } else {
    planetDetails.style.display = 'none';
  }
});

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
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
