// galaxy.js
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';
import { OrbitControls } from './OrbitControls.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- OrbitControls Setup ---
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

// --- Background Music ---
const audioListener = new THREE.AudioListener();
camera.add(audioListener);
const backgroundSound = new THREE.Audio(audioListener);
const audioLoader = new THREE.AudioLoader();
document.addEventListener(
  'click',
  () => {
    if (!backgroundSound.isPlaying) {
      audioLoader.load('assets/space_ambience.mp3', (buffer) => {
        backgroundSound.setBuffer(buffer);
        backgroundSound.setLoop(true);
        backgroundSound.setVolume(0.3);
        backgroundSound.play();
      });
    }
  },
  { once: true }
);

// --- Star Data (Projects & Skills) ---
const starsData = [
  {
    name: 'AI Projects',
    position: [5, 2, -10],
    url: 'projects.html',
    skills: ['Machine Learning', 'Python']
  },
  {
    name: 'Web Dev',
    position: [-7, 3, -15],
    url: 'skills.html',
    skills: ['HTML', 'CSS', 'JavaScript']
  },
  {
    name: 'Game Dev',
    position: [3, -4, -8],
    url: 'projects.html',
    skills: ['Unity', 'C#', 'Pygame']
  },
  {
    name: 'Cybersecurity',
    position: [-4, -2, -12],
    url: 'skills.html',
    skills: ['Penetration Testing', 'Linux']
  }
];

// --- Create Stars ---
const stars = [];
const starGeometry = new THREE.SphereGeometry(0.5, 24, 24);
starsData.forEach((data) => {
  // Create unique materials so each star can be highlighted independently
  const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.5
  });

  const starGroup = new THREE.Group();
  const star = new THREE.Mesh(starGeometry, starMaterial);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 24, 24),
    glowMaterial
  );

  starGroup.add(star);
  starGroup.add(glow);
  starGroup.position.set(...data.position);
  starGroup.userData = data;

  scene.add(starGroup);
  stars.push(starGroup);
});

// --- Set Initial Camera Position ---
camera.position.z = 5;

// --- Raycaster Setup for Hover & Click ---
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
    tooltip.style.left = event.clientX + 10 + 'px';
    tooltip.style.top = event.clientY + 10 + 'px';
    tooltip.innerHTML = `<strong>${hoveredStar.userData.name}</strong><br>${hoveredStar.userData.skills.join(
      ', '
    )}`;

    // Highlight the hovered star.
    hoveredStar.children.forEach((child) => {
      if (child.material && child.material.color) {
        child.material.color.set(0xff0000);
      }
    });
  } else {
    tooltip.style.opacity = 0;
    // Reset all stars to their default color.
    stars.forEach((star) => {
      star.children.forEach((child) => {
        if (child.material && child.material.color) {
          child.material.color.set(0xffdd00);
        }
      });
    });
  }
});

// --- Click Event: Fly to Star & Display Project Details ---
document.addEventListener('click', (event) => {
  // Update mouse coordinates for raycasting.
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

// --- Fly to Selected Star (Locking the Camera on the Star) ---
function flyToStar(star) {
  // Lock the OrbitControls target to the star.
  controls.target.copy(star.position);
  controls.update();

  // Compute a normalized direction from the camera toward the star.
  const direction = star.position.clone().sub(camera.position).normalize();
  // Set your desired distance from the star (adjust as needed).
  const desiredDistance = 2;
  // Position the camera so the star is centered and at the desired distance.
  const newCameraPos = star.position.clone().sub(direction.multiplyScalar(desiredDistance));

  new TWEEN.Tween(camera.position)
    .to(newCameraPos, 2000)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      // Continually lock the target on the star during the tween.
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

  // Optional: Slight drifting of stars for extra immersion.
  stars.forEach((star) => {
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
