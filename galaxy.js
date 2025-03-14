// galaxy.js

// === Imports ===
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';
import { OrbitControls } from './OrbitControls.js';
import { EffectComposer } from './EffectComposer.js';
import { RenderPass } from './RenderPass.js';
import { UnrealBloomPass } from './UnrealBloomPass.js';


// === Scene Setup ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 2000
);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// === Mobile Friendly Toggle ===
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);

// === Post-Processing Setup (Subtle Bloom) ===
let composer;
if (!isMobile) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // Adjusted bloom parameters for a more realistic, subtle glow
  const bloomParams = {
    exposure: 1,
    bloomStrength: 0.3,
    bloomThreshold: 0.7,
    bloomRadius: 0.0
  };
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    bloomParams.bloomStrength,
    bloomParams.bloomRadius,
    bloomParams.bloomThreshold
  );
  composer.addPass(bloomPass);
}

// === OrbitControls Setup ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.5; // Slightly slower rotation for realism

// === Sky Sphere (Dynamic Nebula Background) ===
const textureLoader = new THREE.TextureLoader();
const skyTexture = textureLoader.load('assets/nebula.jpg', () => {
  // Optionally adjust texture settings if needed
});
const skyGeometry = new THREE.SphereGeometry(1000, 32, 32);
const skyMaterial = new THREE.MeshBasicMaterial({
  map: skyTexture,
  side: THREE.BackSide,
  transparent: true,
  opacity: 0.9  // A bit faded so stars show through
});
const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(skyMesh);

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
      backgroundSound.setVolume(0.25);
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

// === Create Stars with a Subtle Halo (No Overbearing Orb) ===
const stars = [];
const starGeometry = new THREE.SphereGeometry(0.3, 16, 16); // smaller star mesh
starsData.forEach(data => {
  // Dimmer star material for the central orb
  const starMaterial = new THREE.MeshBasicMaterial({ color: 0x333300 });
  
  // Glow material adjusted for a subtle halo effect
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.2, // Lower opacity for a soft halo
    blending: THREE.AdditiveBlending
  });
  
  const starGroup = new THREE.Group();
  const starMesh = new THREE.Mesh(starGeometry, starMaterial);
  
  // Slightly larger sphere for the halo effect
  const glowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 24), glowMaterial);
  
  // Optional: If you want the halo to be the only effect, you could add only glowMesh.
  starGroup.add(starMesh);
  starGroup.add(glowMesh);
  starGroup.position.set(...data.position);
  starGroup.userData = data;
  
  scene.add(starGroup);
  stars.push(starGroup);
});


// === Particle System for Cosmic Dust / Nebula ===
const particleCount = isMobile ? 2000 : 5000; // Fewer particles on mobile for performance
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 300;
}
const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// Use a soft round particle texture for a more subtle look
const particleTexture = textureLoader.load('https://threejs.org/examples/textures/sprites/disc.png');
const particleMaterial = new THREE.PointsMaterial({
  map: particleTexture,
  color: 0xffffff,
  size: isMobile ? 0.15 : 0.2,
  transparent: true,
  opacity: 0.35,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  sizeAttenuation: true
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
  
  // Center the sky sphere on the camera and rotate it slightly for parallax
  skyMesh.position.copy(camera.position);
  skyMesh.rotation.y += 0.0002;
  
  // Render: Use composer if not mobile; otherwise use the regular renderer for performance
  if (composer && !isMobile) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}
animate();

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);
});
