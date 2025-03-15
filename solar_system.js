import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { GLTFLoader } from './GLTFLoader.js';

// If you're using a modern module system for TWEEN, you might do:
// import TWEEN from './tween.umd.js';
// Otherwise, TWEEN might be available globally if loaded via a script tag.

// ============ Scene, Camera, Renderer ============
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000000
);
camera.position.set(0, 500, 50000);

// We’ll ensure the camera starts by looking at (0,0,0) where the Sun is.
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Full-screen style
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

// ============ Solar System Data ============
// Approximate real orbital periods (days) & rotation periods (hours or negative if retrograde).
// For demonstration, these are simplified.
const solarSystemData = [
  {
    name: "Sun",
    file: "sun.glb",
    radius: 696340,
    orbitAU: 0,
    orbitPeriodDays: 0,
    rotationPeriodHours: 648, // not physically accurate, just for demonstration
    url: 'https://example.com/sun'
  },
  {
    name: "Mercury",
    file: "mercury.glb",
    radius: 2439,
    orbitAU: 0.39,
    orbitPeriodDays: 88,
    rotationPeriodHours: 1408, // ~58.6 days
    url: 'https://example.com/mercury'
  },
  {
    name: "Venus",
    file: "venus.glb",
    radius: 6052,
    orbitAU: 0.72,
    orbitPeriodDays: 225,
    rotationPeriodHours: -5832, // ~243 days (negative for retrograde)
    url: 'https://example.com/venus'
  },
  {
    name: "Earth",
    file: "earth.glb",
    radius: 6371,
    orbitAU: 1,
    orbitPeriodDays: 365,
    rotationPeriodHours: 24,
    url: 'https://example.com/earth'
  },
  {
    name: "Mars",
    file: "mars.glb",
    radius: 3390,
    orbitAU: 1.52,
    orbitPeriodDays: 687,
    rotationPeriodHours: 24.6,
    url: 'https://example.com/mars'
  },
  {
    name: "Jupiter",
    file: "jupiter.glb",
    radius: 69911,
    orbitAU: 5.2,
    orbitPeriodDays: 4333,
    rotationPeriodHours: 10, // ~9.9 hours
    url: 'https://example.com/jupiter'
  },
  {
    name: "Saturn",
    file: "saturn.glb",
    radius: 58232,
    orbitAU: 9.54,
    orbitPeriodDays: 10759,
    rotationPeriodHours: 10.7,
    url: 'https://example.com/saturn'
  },
  {
    name: "Uranus",
    file: "uranus.glb",
    radius: 25362,
    orbitAU: 19.2,
    orbitPeriodDays: 30687,
    rotationPeriodHours: -17, // negative for retrograde
    url: 'https://example.com/uranus'
  },
  {
    name: "Neptune",
    file: "neptune.glb",
    radius: 24622,
    orbitAU: 30.1,
    orbitPeriodDays: 60190,
    rotationPeriodHours: 16,
    url: 'https://example.com/neptune'
  },
  {
    name: "Pluto",
    file: "pluto.glb",
    radius: 1188,
    orbitAU: 39.5,
    orbitPeriodDays: 90560,
    rotationPeriodHours: 153.3,
    url: 'https://example.com/pluto'
  }
];

// Moon data for Earth
const moonData = {
  name: "Moon",
  file: "moon.glb",
  radius: 1737,
  orbitDistanceKm: 384400,
  orbitPeriodDays: 27,  // ~27 days
  rotationPeriodHours: 655, // also ~27 days
  url: 'https://example.com/moon'
};

// ============ Scaling Factors ============
// Make the Sun large enough to see.
const sunDesiredRadius = 100;
const radiusScaleFactor = sunDesiredRadius / solarSystemData[0].radius;
const planetSizeExaggeration = 3;

// We use an exponential function to spread out outer planets more.
const orbitDistanceScale = 12000;
const orbitExponent = 1.3;
function computeOrbitDistance(orbitAU) {
  return Math.pow(orbitAU, orbitExponent) * orbitDistanceScale;
}

// For the Moon, we use a simpler scale factor.
const moonOrbitScale = 0.02;

// ============ Loaders and Containers ============
const loader = new GLTFLoader();
const solarSystemGroup = new THREE.Group();
scene.add(solarSystemGroup);

// We'll store references to each planet's pivot and mesh for orbit, rotation, and raycasting.
const planetPivots = {};
const planetMeshes = [];

// Create or retrieve a DOM element for the HUD.
let planetDetails = document.getElementById('planet-details');
if (!planetDetails) {
  planetDetails = document.createElement('div');
  planetDetails.id = 'planet-details';
  // Basic styling; customize as you like
  planetDetails.style.position = 'absolute';
  planetDetails.style.top = '100px';
  planetDetails.style.left = '50px';
  planetDetails.style.color = '#fff';
  planetDetails.style.background = 'rgba(0,0,0,0.7)';
  planetDetails.style.padding = '10px';
  planetDetails.style.display = 'none';
  document.body.appendChild(planetDetails);
}

// Create or retrieve a tooltip element for hover.
let tooltip = document.getElementById('tooltip');
if (!tooltip) {
  tooltip = document.createElement('div');
  tooltip.id = 'tooltip';
  tooltip.style.position = 'absolute';
  tooltip.style.color = '#fff';
  tooltip.style.background = 'rgba(0,0,0,0.7)';
  tooltip.style.padding = '5px';
  tooltip.style.opacity = 0;
  tooltip.style.pointerEvents = 'none';
  document.body.appendChild(tooltip);
}

// ============ Helper Functions ============

// Recenter a model so its pivot is at its geometric center
function recenterModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  box.getCenter(center);
  model.position.sub(center);
  return model;
}

// Draw orbit path circles for visual reference
function drawOrbitPath(distance) {
  const segments = 128;
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

// Create a pivot for each planet to revolve around the Sun
// and store the planet's revolve/rotation speeds.
function loadPlanet(data) {
  const pivot = new THREE.Group();
  planetPivots[data.name] = pivot;

  // Random initial rotation so the planet doesn't start at the same angle each time.
  if (data.name !== 'Sun') {
    pivot.rotation.y = Math.random() * Math.PI * 2;
  }
  solarSystemGroup.add(pivot);

  loader.load(`./assets/${data.file}`, (gltf) => {
    let model = gltf.scene;
    model = recenterModel(model);

    // Scale the planet
    if (data.name === "Sun") {
      const scaleFactor = sunDesiredRadius / data.radius;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);
      model.position.set(0, 0, 0);
      pivot.add(model);

      // Make the Sun bright
      model.traverse((child) => {
        if (child.isMesh) {
          child.material.emissive = new THREE.Color(0xffff00);
          child.material.emissiveIntensity = 2.0;
        }
      });

      // Add a bright point light at the Sun
      const sunLight = new THREE.PointLight(0xffffff, 3, 1000000);
      sunLight.position.set(0, 0, 0);
      pivot.add(sunLight);

    } else {
      const scaleFactor = (data.radius * radiusScaleFactor) * planetSizeExaggeration;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);
      const orbitDistance = computeOrbitDistance(data.orbitAU);
      model.position.set(orbitDistance, 0, 0);
      pivot.add(model);

      // Store orbit/rotation data on the pivot
      pivot.userData = {
        orbitDistance: orbitDistance,
        orbitPeriodDays: data.orbitPeriodDays
      };

      // Store rotation period on the mesh
      model.userData = {
        name: data.name,
        rotationPeriodHours: data.rotationPeriodHours,
        url: data.url
      };

      // Keep references for raycasting
      planetMeshes.push(model);

      // Draw orbit path
      if (data.orbitAU > 0) {
        drawOrbitPath(orbitDistance);
      }

      // If Earth, attach the Moon
      if (data.name === "Earth") {
        loadMoon(pivot, model.position);
      }
    }
    console.log(`${data.name} loaded.`);
  }, undefined, (error) => {
    console.error(`Error loading ${data.name}:`, error);
  });
}

function loadMoon(earthPivot, earthPosition) {
  const moonPivot = new THREE.Group();
  earthPivot.add(moonPivot);
  moonPivot.position.copy(earthPosition);

  loader.load(`./assets/${moonData.file}`, (gltfMoon) => {
    let moonModel = gltfMoon.scene;
    moonModel = recenterModel(moonModel);

    // Scale the Moon relative to the Sun
    const moonScale = ((moonData.radius * radiusScaleFactor) * planetSizeExaggeration);
    moonModel.scale.set(moonScale, moonScale, moonScale);

    // Position the Moon
    const moonOrbitDistance = moonData.orbitDistanceKm * moonOrbitScale;
    moonModel.position.set(moonOrbitDistance, 0, 0);
    moonPivot.add(moonModel);

    moonPivot.userData = {
      orbitPeriodDays: moonData.orbitPeriodDays
    };

    // Store rotation period for the Moon
    moonModel.userData = {
      name: moonData.name,
      rotationPeriodHours: moonData.rotationPeriodHours,
      url: moonData.url
    };

    planetMeshes.push(moonModel);

    console.log("Moon loaded.");
  });
}

// ============ Load All Celestial Bodies ============
solarSystemData.forEach((planetInfo) => {
  loadPlanet(planetInfo);
});

// ============ Raycaster Setup ============

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Show a tooltip on hover
document.addEventListener('pointermove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planetMeshes, true);

  if (intersects.length > 0) {
    const hovered = intersects[0].object;
    tooltip.style.opacity = 1;
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
    tooltip.innerHTML = `<strong>${hovered.userData.name}</strong>`;
  } else {
    tooltip.style.opacity = 0;
  }
});

// Click to fly to planet and show HUD
document.addEventListener('pointerdown', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planetMeshes, true);
  
  if (intersects.length > 0) {
    const selected = intersects[0].object;
    flyToPlanet(selected);
  } else {
    planetDetails.style.display = 'none';
  }
});

// ============ Fly-To and HUD ============

function flyToPlanet(planetMesh) {
  // Focus the camera on the planet
  const planetPos = planetMesh.getWorldPosition(new THREE.Vector3());
  
  // Compute a direction from camera to planet
  const direction = planetPos.clone().sub(camera.position).normalize();
  // Choose a distance to stop in front of the planet
  const distance = 2000; // adjust as needed
  const newCameraPos = planetPos.clone().sub(direction.multiplyScalar(distance));

  new TWEEN.Tween(camera.position)
    .to({ x: newCameraPos.x, y: newCameraPos.y, z: newCameraPos.z }, 2000)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      // Keep looking at the planet during the animation
      camera.lookAt(planetPos);
    })
    .onComplete(() => {
      showPlanetDetails(planetMesh.userData);
    })
    .start();
}

// Show the HUD with planet info
function showPlanetDetails(data) {
  planetDetails.innerHTML = `
    <h2>${data.name}</h2>
    <p>Rotation Period (approx): ${Math.abs(data.rotationPeriodHours)} hour${Math.abs(data.rotationPeriodHours) !== 1 ? 's' : ''}${data.rotationPeriodHours < 0 ? ' (retrograde)' : ''}</p>
    <p>Learn more about ${data.name}:</p>
    <a href="${data.url}" target="_blank" style="color:#00fffc; text-decoration:underline;">Open Link</a>
  `;
  planetDetails.style.display = 'block';
}

// ============ Animation Loop ============

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();

  // 1) Revolve each planet pivot
  // We do a simple approach: revolve speed ~ 0.05 * (delta / orbitPeriodDays).
  for (const name in planetPivots) {
    const pivot = planetPivots[name];
    if (pivot.userData.orbitPeriodDays && pivot.userData.orbitPeriodDays > 0) {
      const revolveSpeed = (delta * 0.05) / pivot.userData.orbitPeriodDays;
      pivot.rotation.y += revolveSpeed;
    }
  }

  // 2) Rotate each planet (and the Moon) on its axis
  // If rotationPeriodHours is negative, it's retrograde.
  planetMeshes.forEach((mesh) => {
    const { rotationPeriodHours } = mesh.userData;
    if (rotationPeriodHours && rotationPeriodHours !== 0) {
      // Let's pick an arbitrary spin factor, e.g., 0.5. 
      // So a planet with a 24h period will spin 0.5 * (2π/24h) per real-time second (ish).
      // We scale by delta to keep it framerate-independent.
      const spinFactor = 0.5;
      const spinSpeed = (spinFactor * delta * (2 * Math.PI)) / Math.abs(rotationPeriodHours);
      
      // If it's negative, rotate the opposite direction
      mesh.rotation.y += rotationPeriodHours > 0 ? spinSpeed : -spinSpeed;
    }
  });

  // 3) Keep sky dome centered on camera
  skyDome.position.copy(camera.position);

  // 4) Update TWEEN
  TWEEN.update();

  // 5) Render
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
