// Interactive 3D Galaxy with Clickable Stars, Nebula Background & Effects (Three.js)
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';
import TWEEN from 'https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.umd.js';

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load Nebula Background
const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load('assets/nebula.jpg'); // Add a nebula image to your assets folder
scene.background = backgroundTexture;

// Star Data (Projects & Skills)
const starsData = [
    { name: 'AI Projects', position: [5, 2, -10], url: 'projects.html', skills: ['Machine Learning', 'Python'] },
    { name: 'Web Dev', position: [-7, 3, -15], url: 'skills.html', skills: ['HTML', 'CSS', 'JavaScript'] },
    { name: 'Game Dev', position: [3, -4, -8], url: 'projects.html', skills: ['Unity', 'C#', 'Pygame'] },
    { name: 'Cybersecurity', position: [-4, -2, -12], url: 'skills.html', skills: ['Penetration Testing', 'Linux'] }
];

// Create Stars with Glow & Drift Effect
const stars = [];
const starGeometry = new THREE.SphereGeometry(0.5, 24, 24);
const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 });

starsData.forEach(data => {
    const starGroup = new THREE.Group();
    const star = new THREE.Mesh(starGeometry, starMaterial);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 24), glowMaterial);
    
    star.position.set(0, 0, 0);
    starGroup.add(star);
    starGroup.add(glow);
    starGroup.position.set(...data.position);
    starGroup.userData = data;
    
    scene.add(starGroup);
    stars.push(starGroup);
});

// Camera Start Position
camera.position.z = 5;

// Background Music (Add space ambiance)
const audioListener = new THREE.AudioListener();
camera.add(audioListener);
const backgroundSound = new THREE.Audio(audioListener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load('assets/space_ambience.mp3', function(buffer) {
    backgroundSound.setBuffer(buffer);
    backgroundSound.setLoop(true);
    backgroundSound.setVolume(0.3);
    backgroundSound.play();
});

// Raycaster for Click Detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

document.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(stars);
    if (intersects.length > 0) {
        const selectedStar = intersects[0].object.parent;
        flyToStar(selectedStar);
    }
});

// Fly to Selected Star (Warp Effect)
function flyToStar(star) {
    const target = new THREE.Vector3(...star.position);
    target.z += 2; // Adjust to prevent collision
    
    new TWEEN.Tween(camera.position)
        .to(target, 2000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
            // Warp effect (scale background slightly during movement)
            scene.background.offset.x += 0.002;
            scene.background.offset.y += 0.002;
        })
        .onComplete(() => {
            showProjectDetails(star.userData);
        })
        .start();
}

// Show Project Details (On Click)
function showProjectDetails(data) {
    const detailsDiv = document.getElementById('project-details');
    detailsDiv.innerHTML = `
        <h2>${data.name}</h2>
        <p>Skills Used: ${data.skills.join(', ')}</p>
        <a href='${data.url}' target='_blank'>View Project</a>
    `;
    detailsDiv.style.display = 'block';
}

// Animation Loop with Star Drifting
function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    
    // Stars drift slightly for immersion
    stars.forEach(star => {
        star.position.x += Math.sin(Date.now() * 0.0001 + star.position.y) * 0.002;
        star.position.y += Math.cos(Date.now() * 0.0001 + star.position.x) * 0.002;
    });
    
    renderer.render(scene, camera);
}
animate();

// Add HTML for Project Details (New Page Section)
document.body.innerHTML += `
    <div id='project-details' style='display: none; position: absolute; top: 20px; left: 50%; transform: translateX(-50%); padding: 20px; background: rgba(0, 0, 0, 0.8); color: white; border-radius: 10px;'></div>
`;