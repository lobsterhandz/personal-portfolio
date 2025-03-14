// galaxy.js1

// === Imports ===
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';
import { OrbitControls } from './OrbitControls.js';

import { EffectComposer } from './EffectComposer.js';
import { RenderPass } from './RenderPass.js';
import { UnrealBloomPass } from './UnrealBloomPass.js';
import { Lensflare, LensflareElement } from './Lensflare.js';

// === Scene Setup ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// === Post-Processing Setup (Bloom) ===
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomParams = {
  exposure: 1,
  bloomStrength: 1.5,
  bloomThreshold: 0,
  bloomRadius: 0
};
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  bloomParams.bloomStrength,
  bloomParams.bloomRadius,
  bloomParams.bloomThreshold
);
composer.addPass(bloomPass);

// === OrbitControls Setup ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// === Background Setup ===
const textureLoader = new THREE.TextureLoader();
textureLoader.load(
  'assets/nebula.jpg',
  (texture) => { scene.background = texture; },
  undefined,
  (error) => {
    console.error('Error loading background texture:', error);
    scene.background = new THREE.Color(0x000011);
  }
);

// === Background Music ===
const audioListener = new THREE.AudioListener();
camera.add(audioListener);
const backgroundSound = new THREE.Audio(audioListener);
const audioLoader = new THREE.AudioLoader();
document.addEventListener('click', () => {
  if (!backgroundSound.isPlaying) {
    audioLoader.load('assets/space_ambience.mp3', (buffer) => {
      backgroundSound.setBuffer(buffer);
      backgroundSound.setLoop(true);
      backgroundSound.setVolume(0.3);
      backgroundSound.play();
    });
  }
}, { once: true });

// === Star Data (Projects & Skills) ===
const starsData = [
  { name: 'AI Projects', position: [5, 2, -10], url: 'projects.html', skills: ['Machine Learning', 'Python'] },
  { name: 'Web Dev', position: [-7, 3, -15], url: 'skills.html', skills: ['HTML', 'CSS', 'JavaScript'] },
  { name: 'Game Dev', position: [3, -4, -8], url: 'projects.html', skills: ['Unity', 'C#', 'Pygame'] },
  { name: 'Cybersecurity', position: [-4, -2, -12], url: 'skills.html', skills: ['Penetration Testing', 'Linux'] }
];

// === Create Stars ===
const stars = [];
const starGeometry = new THREE.SphereGeometry(0.5, 24, 24);
starsData.forEach(data => {
  // Create unique materials so each star can be highlighted independently
  const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.5
  });
  
  const starGroup = new THREE.Group();
  const starMesh = new THREE.Mesh(starGeometry, starMaterial);
  const glowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 24), glowMaterial);
  
  starGroup.add(starMesh);
  starGroup.add(glowMesh);
  starGroup.position.set(...data.position);
  starGroup.userData = data;
  
  scene.add(starGroup);
  stars.push(starGroup);
});

// === Add Lens Flares to Each Star ===
stars.forEach(star => {
  const flareTexture = textureLoader.load('https://threejs.org/examples/textures/lensflare/lensflare0.png');
  const lensflare = new Lensflare();
  lensflare.addElement(new LensflareElement(flareTexture, 700, 0));
  lensflare.position.copy(star.position);
  scene.add(lensflare);
});

// === Particle System for Cosmic Dust / Nebula ===
const particleCount = 10000;
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount * 3; i++) {
  // Spread particles over a large area
  positions[i] = (Math.random() - 0.5) * 200;
}
const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particleMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.3,
  transparent: true,
  opacity: 0.7,
  blending: THREE.AdditiveBlending
});
const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleSystem);

// === Set Initial Camera Position ===
camera.position.z = 5;

// === Raycaster Setup for Hover & Click ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
const projectDetails = document.getElementById('project-details');

// --- Hover Effect: Show Tooltip & Highlight Star ---
document.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(stars, true);
  if (intersects.length > 0) {
    const hoveredStar = intersects[0].object.parent;
    tooltip.style.opacity = 1;
    tooltip.style.left = (event.clientX + 10) + 'px';
    tooltip.style.top = (event.clientY + 10) + 'px';
    tooltip.innerHTML = `<strong>${hoveredStar.userData.name}</strong><br>${hoveredStar.userData.skills.join(', ')}`;
    
    // Highlight the hovered star
    hoveredStar.children.forEach(child => {
      if (child.material && child.material.color) {
        child.material.color.set(0xff0000);
      }
    });
  } else {
    tooltip.style.opacity = 0;
    // Reset all stars to their default color
    stars.forEach(star => {
      star.children.forEach(child => {
        if (child.material && child.material.color) {
          child.material.color.set(0xffdd00);
        }
      });
    });
  }
});

// --- Click Event: Fly to Star & Display Project Details ---
document.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(stars, true);
  if (intersects.length > 0) {
    const selectedStar = intersects[0].object.parent;
    flyToStar(selectedStar);
  } else {
    projectDetails.style.display = 'none';
  }
});

// --- Fly to Star Function (Camera Tween) ---
function flyToStar(star) {
  // Lock the OrbitControls target to the star's position.
  controls.target.copy(star.position);
  controls.update();

  // Calculate a direction vector from the star to the current camera position.
  const direction = camera.position.clone().sub(star.position).normalize();
  // Set your desired distance from the star (adjust as needed)
  const desiredDistance = 2;
  // Compute the new camera position so it sits desiredDistance away from the star.
  const newCameraPos = star.position.clone().add(direction.multiplyScalar(desiredDistance));

  new TWEEN.Tween(camera.position)
    .to(newCameraPos, 2000)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      // Ensure the controls target remains locked on the star.
      controls.target.copy(star.position);
      controls.update();
    })
    .onComplete(() => {
      showProjectDetails(star.userData);
    })
    .start();
}

// --- Display Project Details ---
function showProjectDetails(data) {
  projectDetails.innerHTML = `
    <h2>${data.name}</h2>
    <p>Skills Used: ${data.skills.join(', ')}</p>
    <a href="${data.url}" target="_blank">View Project</a>
  `;
  projectDetails.style.display = 'block';
}

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();
  
  // Optional: Slight drifting of stars for additional immersion
  stars.forEach(star => {
    star.position.x += Math.sin(Date.now() * 0.0001 + star.position.y) * 0.002;
    star.position.y += Math.cos(Date.now() * 0.0001 + star.position.x) * 0.002;
  });
  
  // Render using the composer for bloom effect
  composer.render();
}
animate();

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
