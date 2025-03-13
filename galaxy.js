// galaxy.js
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Orbit Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// --- Background Setup ---
const textureLoader = new THREE.TextureLoader();
textureLoader.load(
  'assets/nebula.jpg',
  (texture) => {
    scene.background = texture;
  },
  undefined,
  (error) => {
    console.error('Error loading background texture:', error);
    scene.background = new THREE.Color(0x000011);
  }
);

// --- Audio Setup ---
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

// --- Star Data (Projects & Skills) ---
const starsData = [
  { name: 'AI Projects', position: [5, 2, -10], url: 'projects.html', skills: ['Machine Learning', 'Python'] },
  { name: 'Web Dev', position: [-7, 3, -15], url: 'skills.html', skills: ['HTML', 'CSS', 'JavaScript'] },
  { name: 'Game Dev', position: [3, -4, -8], url: 'projects.html', skills: ['Unity', 'C#', 'Pygame'] },
  { name: 'Cybersecurity', position: [-4, -2, -12], url: 'skills.html', skills: ['Penetration Testing', 'Linux'] }
];

// --- Create Stars ---
const stars = [];
const starGeometry = new THREE.SphereGeometry(0.5, 24, 24);
// We'll create new material instances so we can change colors individually.
starsData.forEach(data => {
  const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
  const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 });
  
  const starGroup = new THREE.Group();
  const star = new THREE.Mesh(starGeometry, starMaterial);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 24), glowMaterial);
  
  starGroup.add(star);
  starGroup.add(glow);
  starGroup.position.set(...data.position);
  starGroup.userData = data;
  
  scene.add(starGroup);
  stars.push(starGroup);
});

// --- Initial Camera Position ---
camera.position.z = 5;

// --- Raycaster Setup ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
const projectInfo = document.getElementById('project-info');

// --- Hover Effect: Show Tooltip & Highlight Star ---
document.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(stars, true);
  if (intersects.length > 0) {
    const hoveredStar = intersects[0].object.parent;
    // Position tooltip near the cursor.
    tooltip.style.opacity = 1;
    tooltip.style.left = (event.clientX + 10) + 'px';
    tooltip.style.top = (event.clientY + 10) + 'px';
    tooltip.innerHTML = `<strong>${hoveredStar.userData.name}</strong><br>${hoveredStar.userData.skills.join(', ')}`;
    
    // Highlight the hovered star.
    hoveredStar.children.forEach(child => {
      if (child.material && child.material.color) {
        child.material.color.set(0xff0000);
      }
    });
  } else {
    tooltip.style.opacity = 0;
    // Reset colors for all stars.
    stars.forEach(star => {
      star.children.forEach(child => {
        if (child.material && child.material.color) {
          child.material.color.set(0xffdd00);
        }
      });
    });
  }
});

// --- Click Event: Fly to Star & Display Info ---
document.addEventListener('click', (event) => {
  // Prevent conflict with the audio initialization (which already runs on click).
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(stars, true);
  if (intersects.length > 0) {
    const selectedStar = intersects[0].object.parent;
    flyToStar(selectedStar);
  } else {
    // Hide info if clicking away from stars.
    projectInfo.style.display = 'none';
  }
});

// --- Fly to Selected Star (Using TWEEN for Smooth Animation) ---
function flyToStar(star) {
  // Create a target vector a bit in front of the star.
  const target = new THREE.Vector3(...star.position.toArray());
  target.z += 2;
  
  new TWEEN.Tween(camera.position)
    .to(target, 2000)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      // Optionally update controls if needed.
      controls.update();
    })
    .onComplete(() => {
      showProjectDetails(star.userData);
    })
    .start();
}

// --- Display Project Details ---
function showProjectDetails(data) {
  projectInfo.innerHTML = `
    <h2>${data.name}</h2>
    <p>Skills Used: ${data.skills.join(', ')}</p>
    <a href="${data.url}" target="_blank">View Project</a>
  `;
  projectInfo.style.display = 'block';
}

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();
  
  // Optional: Slight drifting of stars for immersion.
  stars.forEach(star => {
    star.position.x += Math.sin(Date.now() * 0.0001 + star.position.y) * 0.002;
    star.position.y += Math.cos(Date.now() * 0.0001 + star.position.x) * 0.002;
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
