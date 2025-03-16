import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { GLTFLoader } from './GLTFLoader.js';
// Make sure TWEEN is loaded via a script tag

// ============ Scene, Camera, Renderer ============
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  3000000
);
// Position the camera to see the entire system.
camera.position.set(0, 1000, 250000);
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
const skyGeometry = new THREE.SphereGeometry(1500000, 32, 32);
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
controls.minDistance = 500;
controls.maxDistance = 3000000;

// ============ Solar System Data ============
const solarSystemData = [
  { name: "Sun",     file: "sun.glb",     radius: 696340, orbitAU: 0,    orbitPeriodDays: 0,     rotationPeriodHours: 648,   url: 'https://example.com/sun' },
  { name: "Mercury", file: "mercury.glb", radius: 2439,   orbitAU: 0.39, orbitPeriodDays: 88,    rotationPeriodHours: 1408,  url: 'https://example.com/mercury' },
  { name: "Venus",   file: "venus.glb",   radius: 6052,   orbitAU: 0.72, orbitPeriodDays: 225,   rotationPeriodHours: -5832, url: 'https://example.com/venus' },
  { name: "Earth",   file: "earth.glb",   radius: 6371,   orbitAU: 1,    orbitPeriodDays: 365,   rotationPeriodHours: 24,    url: 'https://example.com/earth' },
  { name: "Mars",    file: "mars.glb",    radius: 3390,   orbitAU: 1.52, orbitPeriodDays: 687,   rotationPeriodHours: 24.6,  url: 'https://example.com/mars' },
  { name: "Jupiter", file: "jupiter.glb", radius: 69911,  orbitAU: 5.2,  orbitPeriodDays: 4333,  rotationPeriodHours: 10,    url: 'https://example.com/jupiter' },
  { name: "Saturn",  file: "saturn.glb",  radius: 58232,  orbitAU: 9.54, orbitPeriodDays: 10759, rotationPeriodHours: 10.7,  url: 'https://example.com/saturn' },
  { name: "Uranus",  file: "uranus.glb",  radius: 25362,  orbitAU: 19.2, orbitPeriodDays: 30687, rotationPeriodHours: -17,   url: 'https://example.com/uranus' },
  { name: "Neptune", file: "neptune.glb", radius: 24622,  orbitAU: 30.1, orbitPeriodDays: 60190, rotationPeriodHours: 16,    url: 'https://example.com/neptune' },
  { name: "Pluto",   file: "pluto.glb",   radius: 1188,   orbitAU: 39.5, orbitPeriodDays: 90560, rotationPeriodHours: 153.3, url: 'https://example.com/pluto' }
];

const moonData = {
  name: "Moon",
  file: "moon.glb",
  radius: 1737,
  orbitDistanceKm: 384400,
  orbitPeriodDays: 27,
  rotationPeriodHours: 655,
  url: 'https://example.com/moon'
};

// ============ Scaling Factors ============
const sunDesiredRadius = 1000; // Make the Sun prominent.
const radiusScaleFactor = sunDesiredRadius / solarSystemData[0].radius;
const planetSizeExaggeration = 3;

// New piecewise orbit-distance function:
// For inner planets (orbitAU ≤ 2), spread them linearly.
// For outer planets, use a larger multiplier.
function computeOrbitDistance(orbitAU) {
  if (orbitAU <= 2) {
    return orbitAU * 275000; // inner scaling
  } else {
    return orbitAU * 175000; // outer scaling for gas giants, etc.
  }
}

const moonOrbitScale = 0.02;

// ============ Loaders and Containers ============
const loader = new GLTFLoader();
const solarSystemGroup = new THREE.Group();
scene.add(solarSystemGroup);

const planetPivots = {};
const planetMeshes = [];

// ============ Helper Functions ============
function recenterModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  box.getCenter(center);
  model.position.sub(center);
  return model;
}

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

// ============ Load Celestial Bodies ============
function loadPlanet(data) {
  const pivot = new THREE.Group();
  planetPivots[data.name] = pivot;
  if (data.name !== 'Sun') {
    // Random initial revolution angle
    pivot.rotation.y = Math.random() * Math.PI * 2;
  }
  solarSystemGroup.add(pivot);

  loader.load(`./assets/${data.file}`, (gltf) => {
    let model = gltf.scene;
    model = recenterModel(model);

    if (data.name === "Sun") {
      const scaleFactor = sunDesiredRadius / data.radius;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);
      model.position.set(0, 0, 0);
      pivot.add(model);
      // Make the Sun emissive
      model.traverse((child) => {
        if (child.isMesh) {
          child.material.emissive = new THREE.Color(0xffff00);
          child.material.emissiveIntensity = 2.0;
        }
      });
      const sunLight = new THREE.PointLight(0xffffff, 3, 1000000);
      sunLight.position.set(0, 0, 0);
      pivot.add(sunLight);
    } else {
      const scaleFactor = (data.radius * radiusScaleFactor) * planetSizeExaggeration;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);
      const orbitDistance = computeOrbitDistance(data.orbitAU);
      model.position.set(orbitDistance, 0, 0);
      pivot.add(model);
      pivot.userData = {
        orbitDistance: orbitDistance,
        orbitPeriodDays: data.orbitPeriodDays
      };
      model.userData = {
        name: data.name,
        rotationPeriodHours: data.rotationPeriodHours,
        url: data.url
      };
      planetMeshes.push(model);
      if (data.orbitAU > 0) {
        drawOrbitPath(orbitDistance);
      }
      // For Earth, attach the Moon.
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
    const moonScale = ((moonData.radius * radiusScaleFactor) * planetSizeExaggeration);
    moonModel.scale.set(moonScale, moonScale, moonScale);
    const moonOrbitDistance = moonData.orbitDistanceKm * moonOrbitScale;
    moonModel.position.set(moonOrbitDistance, 0, 0);
    moonPivot.add(moonModel);
    moonPivot.userData = {
      orbitPeriodDays: moonData.orbitPeriodDays
    };
    moonModel.userData = {
      name: moonData.name,
      rotationPeriodHours: moonData.rotationPeriodHours,
      url: moonData.url
    };
    planetMeshes.push(moonModel);
    console.log("Moon loaded.");
  });
}

// Load all planets
solarSystemData.forEach((planetInfo) => {
  loadPlanet(planetInfo);
});

// Draw a Kuiper Belt ring as a visual reference
const kuiperMidAU = 50; // average AU value for the Kuiper Belt
const kuiperRadius = computeOrbitDistance(kuiperMidAU);
const kuiperGeometry = new THREE.RingGeometry(kuiperRadius - 50000, kuiperRadius + 50000, 256);
const kuiperMaterial = new THREE.MeshBasicMaterial({ color: 0x888888, side: THREE.DoubleSide, opacity: 0.3, transparent: true });
const kuiperRing = new THREE.Mesh(kuiperGeometry, kuiperMaterial);
kuiperRing.rotation.x = Math.PI / 2;
scene.add(kuiperRing);

// ============ Raycaster & HUD ============
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let planetDetails = document.getElementById('planet-details');
if (!planetDetails) {
  planetDetails = document.createElement('div');
  planetDetails.id = 'planet-details';
  planetDetails.style.position = 'absolute';
  planetDetails.style.top = '100px';
  planetDetails.style.left = '50px';
  planetDetails.style.color = '#fff';
  planetDetails.style.background = 'rgba(0,0,0,0.7)';
  planetDetails.style.padding = '10px';
  planetDetails.style.display = 'none';
  document.body.appendChild(planetDetails);
}

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

// ============ Click-to-Zoom & HUD ============
function flyToPlanet(planetMesh) {
  const planetPos = planetMesh.getWorldPosition(new THREE.Vector3());
  const direction = planetPos.clone().sub(camera.position).normalize();
  // Use a smaller offset so the planet is centered in view.
  const distance = 500;
  const newCameraPos = planetPos.clone().sub(direction.multiplyScalar(distance));
  
  new TWEEN.Tween(camera.position)
    .to({ x: newCameraPos.x, y: newCameraPos.y, z: newCameraPos.z }, 2000)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      camera.lookAt(planetPos);
      controls.target.copy(planetPos);
    })
    .onComplete(() => {
      showPlanetDetails(planetMesh.userData);
    })
    .start();
}

function showPlanetDetails(data) {
  planetDetails.innerHTML = `
    <h2>${data.name}</h2>
    <p>Rotation Period: ${Math.abs(data.rotationPeriodHours)} hour${Math.abs(data.rotationPeriodHours) !== 1 ? 's' : ''}${data.rotationPeriodHours < 0 ? ' (retrograde)' : ''}</p>
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
  
  // Revolution: Rotate each planet pivot (if it has an orbitPeriodDays)
  for (const name in planetPivots) {
    const pivot = planetPivots[name];
    if (pivot.userData.orbitPeriodDays && pivot.userData.orbitPeriodDays > 0) {
      const revolveSpeed = (delta * 0.5) / pivot.userData.orbitPeriodDays;
      pivot.rotation.y += revolveSpeed;
    }
  }
  
  // Rotation: Spin each planet and the Moon on its axis.
  planetMeshes.forEach((mesh) => {
    const { rotationPeriodHours } = mesh.userData;
    if (rotationPeriodHours && rotationPeriodHours !== 0) {
      const spinFactor = 2.0;
      const spinSpeed = (spinFactor * delta * (2 * Math.PI)) / Math.abs(rotationPeriodHours);
      mesh.rotation.y += (rotationPeriodHours > 0 ? spinSpeed : -spinSpeed);
    }
  });
  
  // Keep sky dome centered on the camera.
  skyDome.position.copy(camera.position);
  
  TWEEN.update();
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
