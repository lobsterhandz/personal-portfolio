import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';
import { OrbitControls } from './OrbitControls.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Ensure canvas is behind UI elements
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.zIndex = '-1';

// --- OrbitControls Setup ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enablePan = false; // Prevent accidental movement on mobile

// --- Curved Background (Sky Sphere) ---
const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load('assets/nebula.jpg');

// Create a large sphere to act as a curved background
const skySphereGeometry = new THREE.SphereGeometry(100, 32, 32);
const skyMaterial = new THREE.MeshBasicMaterial({
  map: backgroundTexture,
  side: THREE.BackSide, // Ensures the texture is visible from the inside
});
const skySphere = new THREE.Mesh(skySphereGeometry, skyMaterial);
scene.add(skySphere);

// --- Background Music (Mobile & Desktop) ---
const audioListener = new THREE.AudioListener();
camera.add(audioListener);
const backgroundSound = new THREE.Audio(audioListener);
const audioLoader = new THREE.AudioLoader();

function playBackgroundMusic() {
  if (!backgroundSound.isPlaying) {
    audioLoader.load('assets/space_ambience.mp3', (buffer) => {
      backgroundSound.setBuffer(buffer);
      backgroundSound.setLoop(true);
      backgroundSound.setVolume(0.3);
      backgroundSound.play();
    });
  }
}

// Fix for Mobile: Music starts on first interaction
document.addEventListener('click', playBackgroundMusic, { once: true });
document.addEventListener('touchstart', playBackgroundMusic, { once: true });

// --- Star Data (Projects & Skills) ---
const starsData = [
  { name: 'AI Projects', position: [5, 2, -10], url: 'projects.html', skills: ['Machine Learning', 'Python'] },
  { name: 'Web Dev', position: [-7, 3, -15], url: 'skills.html', skills: ['HTML', 'CSS', 'JavaScript'] },
  { name: 'Game Dev', position: [3, -4, -8], url: 'projects.html', skills: ['Unity', 'C#', 'Pygame'] },
  { name: 'Cybersecurity', position: [-4, -2, -12], url: 'skills.html', skills: ['Penetration Testing', 'Linux'] }
];

// --- Create Realistic Stars ---
const stars = [];
const starGeometry = new THREE.SphereGeometry(0.5, 64, 64);

// Plasma Shader (Swirling, Spiraling, and More Heat-like)
const starShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    color1: { value: new THREE.Color(0xffaa00) }, // Core
    color2: { value: new THREE.Color(0xffff00) }, // Outer glow
    noiseStrength: { value: 5.0 }, // Controls plasma turbulence
    swirlIntensity: { value: 1.0 }, // Base swirl effect
    zoomSwirl: { value: 1.0 } // Controls extra swirl when zoomed
  },
  vertexShader: `
    varying vec3 vPosition;
    void main() {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform float noiseStrength;
    uniform float swirlIntensity;
    uniform float zoomSwirl;

    varying vec3 vPosition;

    // Swirl function (adds a spiral motion effect)
    float swirl(vec3 p) {
      return sin(p.x * noiseStrength + time * swirlIntensity) * 0.5 +
             cos(p.y * noiseStrength + time * swirlIntensity * zoomSwirl) * 0.5 +
             sin(p.z * noiseStrength + time * swirlIntensity * 0.8) * 0.5;
    }

    void main() {
      float plasma = swirl(vPosition);
      plasma = smoothstep(0.3, 1.0, plasma);
      vec3 color = mix(color1, color2, plasma);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  side: THREE.DoubleSide
});

// Glow Layer (ONLY for hovered or clicked stars)
const glowMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    glowColor: { value: new THREE.Color(0xff5500) },
    intensity: { value: 0.0 } // Start invisible (only activates on hover/click)
  },
  vertexShader: `
    varying vec3 vPosition;
    void main() {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 glowColor;
    uniform float intensity;
    
    varying vec3 vPosition;

    void main() {
      float glow = 0.5 + 0.5 * sin(time * 2.0 + length(vPosition));
      gl_FragColor = vec4(glowColor * glow * intensity, 1.0);
    }
  `,
  transparent: true,
  blending: THREE.AdditiveBlending
});

starsData.forEach((data) => {
  const starGroup = new THREE.Group();

  // Main Star
  const star = new THREE.Mesh(starGeometry, starShaderMaterial);

  // Glow Effect (Initially Invisible)
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 32), glowMaterial);

  starGroup.add(star);
  starGroup.add(glow);
  starGroup.position.set(...data.position);
  starGroup.userData = data;

  scene.add(starGroup);
  stars.push(starGroup);
});

// --- Update Shader for Time Swirl & Glow ---
function animateStars() {
  starShaderMaterial.uniforms.time.value += 0.02;
  requestAnimationFrame(animateStars);
}
animateStars();

// --- Fix: Hover Effect (Highlight Only the Star You Hover Over) ---
document.addEventListener('mousemove', (event) => {
  const headerOffset = getHeaderOffset();
  const adjustedY = event.clientY - headerOffset * 0.5;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(adjustedY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(stars.map(s => s.children[0]), true);

  // Reset all stars (Turn off glow, Reset Colors)
  stars.forEach((star) => {
    star.children[0].material.uniforms.color1.value.set(0xffaa00);
    star.children[0].material.uniforms.color2.value.set(0xffff00);
    star.children[1].material.uniforms.intensity.value = 0.0; // Turn off glow
  });

  if (intersects.length > 0) {
    const hoveredStar = intersects[0].object.parent;

    // Activate Glow for this star only
    hoveredStar.children[1].material.uniforms.intensity.value = 1.2;

    // Make it a brighter highlight
    hoveredStar.children[0].material.uniforms.color1.value.set(0xff3300);
    hoveredStar.children[0].material.uniforms.color2.value.set(0xffdd00);
  }
});

// --- Click Event: Fly to Star & Add More Swirl Effect ---
document.addEventListener('click', (event) => {
  const headerOffset = getHeaderOffset();
  const adjustedY = event.clientY - headerOffset * 0.5;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(adjustedY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(stars.map(s => s.children[0]), true);
  if (intersects.length > 0) {
    const selectedStar = intersects[0].object.parent;
    flyToStar(selectedStar);
  }
});

// --- Fly to Selected Star & Intensify Swirl ---
function flyToStar(star) {
  controls.target.copy(star.position);
  controls.update();

  const direction = star.position.clone().sub(camera.position).normalize();
  const desiredDistance = 2;
  const newCameraPos = star.position.clone().sub(direction.multiplyScalar(desiredDistance));

  new TWEEN.Tween(camera.position)
    .to(newCameraPos, 2000)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      controls.target.copy(star.position);
      controls.update();
    })
    .onStart(() => {
      // Increase swirl effect on zoom
      star.children[0].material.uniforms.zoomSwirl.value = 4.0;
    })
    .onComplete(() => {
      showProjectDetails(star.userData);
      setTimeout(() => {
        star.children[0].material.uniforms.zoomSwirl.value = 1.0; // Reset swirl
      }, 5000);
    })
    .start();
}

// --- Display Project Details ---
function showProjectDetails(data) {
  const headerOffset = getHeaderOffset();
  projectDetails.style.top = `${headerOffset + 20}px`;

  projectDetails.innerHTML = `
    <h2>${data.name}</h2>
    <p>Skills Used: ${data.skills.join(', ')}</p>
    <a href="${data.url}" target="_blank">View Project</a>
  `;
  projectDetails.style.display = 'block';
}

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


// --- Set Initial Camera Position ---
camera.position.z = 5;

// --- Raycaster Setup for Hover & Click ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
const projectDetails = document.getElementById('project-details');

// Helper function to get header height dynamically
function getHeaderOffset() {
  const header = document.querySelector('header');
  return header ? header.offsetHeight : 0;
}

// --- Handle Hover & Click Adjustments ---
function updateMousePosition(x, y) {
  const headerOffset = getHeaderOffset();
  const adjustedY = y - headerOffset * 0.5;

  mouse.x = (x / window.innerWidth) * 2 - 1;
  mouse.y = -(adjustedY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(stars, true);
  if (intersects.length > 0) {
    const hoveredStar = intersects[0].object.parent;
    tooltip.style.opacity = 1;
    tooltip.style.left = `${x + 10}px`;
    tooltip.style.top = `${y + headerOffset * 0.5 + 10}px`;
    tooltip.innerHTML = `<strong>${hoveredStar.userData.name}</strong><br>${hoveredStar.userData.skills.join(', ')}`;

    hoveredStar.children.forEach((child) => {
      if (child.material && child.material.color) {
        child.material.color.set(0xff0000);
      }
    });
  } else {
    tooltip.style.opacity = 0;
    stars.forEach((star) => {
      star.children.forEach((child) => {
        if (child.material && child.material.color) {
          child.material.color.set(0xffdd00);
        }
      });
    });
  }
}

// --- Handle Mouse & Touch Interactions ---
document.addEventListener('mousemove', (event) => updateMousePosition(event.clientX, event.clientY));

// --- Fix for Mobile Clicks Not Working ---
document.addEventListener('touchstart', (event) => {
  const touch = event.touches[0];
  updateMousePosition(touch.clientX, touch.clientY);
  handleStarClick(touch.clientX, touch.clientY);
});

// --- Click Event: Fly to Star & Display Project Details ---
document.addEventListener('click', (event) => {
  handleStarClick(event.clientX, event.clientY);
});

// --- Fix Clicks on Mobile ---
function handleStarClick(x, y) {
  const headerOffset = getHeaderOffset();
  const adjustedY = y - headerOffset * 0.5;

  mouse.x = (x / window.innerWidth) * 2 - 1;
  mouse.y = -(adjustedY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(stars, true);
  if (intersects.length > 0) {
    const selectedStar = intersects[0].object.parent;
    flyToStar(selectedStar);
  } else {
    projectDetails.style.display = 'none';
  }
}

// --- Fly to Selected Star (Locking the Camera on the Star) ---
function flyToStar(star) {
  controls.target.copy(star.position);
  controls.update();

  const direction = star.position.clone().sub(camera.position).normalize();
  const desiredDistance = window.innerWidth < 768 ? 3.5 : 2.5;
  const newCameraPos = star.position.clone().sub(direction.multiplyScalar(desiredDistance));

  new TWEEN.Tween(camera.position)
    .to(newCameraPos, 1500)
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
  const headerOffset = getHeaderOffset();
  projectDetails.style.top = `${headerOffset + 20}px`;

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
  renderer.render(scene, camera);
}
animate();
