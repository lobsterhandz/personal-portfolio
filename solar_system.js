/*****************************************************************************
 *  A Very Simple Solar System-Like Demo
 *  
 *  - All bodies (Sun + Planets) have the same sphere radius (planetScale).
 *  - Distances between orbits are set by planetSpacing.
 *  - The Moon orbits Earth with its own moonSpacing & moonScale.
 *  - Everything rotates (spins) at rotateSpeed and revolves at revolveSpeed.
 *  - No real astronomy data is used; purely for demonstration & easy tweaking.
 *****************************************************************************/

// ===================== Parameters to Tweak =====================
const planetNames = [
    "Sun", "Mercury", "Venus", "Earth", "Mars", 
    "Jupiter", "Saturn", "Uranus", "Neptune"
  ];
  // If you want Pluto, just add it to the array.
  
  const planetScale = 5;     // Sphere radius for all (Sun & Planets)
  const planetSpacing = 50;  // Distance between orbits
  const revolveSpeed = 0.02; // How fast they orbit the Sun
  const rotateSpeed = 0.02;  // How fast each planet (and Sun) spins on its axis
  
  // Earth-Moon
  const moonScale = 3;       // The Moon's radius, separate from planetScale
  const moonSpacing = 10;    // Distance from Earth
  const moonRevolveSpeed = 0.05; // How fast the Moon orbits Earth
  const moonRotateSpeed = 0.03;  // How fast the Moon spins on its own axis
  
  // ===================== Basic Three.js Setup =====================
  import * as THREE from './three.module.js';
  import { OrbitControls } from './OrbitControls.js';
  
  // Scene, Camera, Renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  );
  // Position the camera so you can see everything
  camera.position.set(0, 100, 300);
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
  
  // Orbit Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 50;
  controls.maxDistance = 5000;
  
  // Simple ambient light so we can see
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  
  // Optional directional light
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(10, 10, 10);
  scene.add(dirLight);
  
  // ===================== Create Geometry & Materials =====================
  // We’ll reuse a single sphere geometry for all bodies
  const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
  
  // A single mesh material for all bodies (MeshStandardMaterial or MeshLambertMaterial etc.)
  const planetMat = new THREE.MeshStandardMaterial({ color: 0x88ccff }); 
  // ^ color can be changed or randomized. 
  // For the Sun, we might pick a different color or tweak emission, but let's keep it simple.
  
  
  // ===================== Data Structures =====================
  
  // We'll store each planet's pivot (for revolution) and the mesh (for rotation).
  // Also the Moon pivot & mesh for Earth.
  const planetPivots = {};
  const planetMeshes = {};
  let moonPivot = null;
  let moonMesh = null;
  
  // ===================== Create the Sun + Planets =====================
  function createPlanets() {
    for (let i = 0; i < planetNames.length; i++) {
      const name = planetNames[i];
      
      // A group pivot for revolve
      const pivot = new THREE.Group();
      scene.add(pivot);
      planetPivots[name] = pivot;
      
      // Create sphere mesh 
      const mesh = new THREE.Mesh(sphereGeo, planetMat.clone());
      mesh.scale.set(planetScale, planetScale, planetScale); 
      // We can differentiate the Sun with a color or scale if you like:
      if (name === "Sun") {
        mesh.material.color.set(0xffcc00); 
        // Make the Sun bigger if you want:
        // mesh.scale.multiplyScalar(2); 
        pivot.rotation.y = 0; // The Sun won't revolve around anything
        mesh.position.set(0, 0, 0);
        pivot.add(mesh);
        planetMeshes[name] = mesh;
      } else {
        // For planets, place them at an orbit radius of (i * planetSpacing)
        // The first planet after "Sun" is index 1 => orbit radius = 1 * planetSpacing
        const orbitRadius = i * planetSpacing;
        mesh.position.set(orbitRadius, 0, 0);
        pivot.add(mesh);
        planetMeshes[name] = mesh;
        
        // If this is Earth, we create the Moon pivot & mesh
        if (name === "Earth") {
          moonPivot = new THREE.Group();
          pivot.add(moonPivot);
          
          // Position the moon pivot at Earth’s position
          moonPivot.position.set(orbitRadius, 0, 0);
  
          // Create the Moon mesh
          moonMesh = new THREE.Mesh(sphereGeo, planetMat.clone());
          moonMesh.material.color.set(0xffffff);
          moonMesh.scale.set(moonScale, moonScale, moonScale);
          // Place the Moon at moonSpacing from Earth
          moonMesh.position.set(moonSpacing, 0, 0);
          moonPivot.add(moonMesh);
        }
      }
    }
  }
  
  // ===================== Initialize Everything =====================
  createPlanets();
  
  // ===================== Animation Loop =====================
  function animate() {
    requestAnimationFrame(animate);
    
    // 1) revolve each planet around the Sun
    // We'll revolve each planet pivot. The Sun pivot won't revolve, so that's fine.
    for (let i = 0; i < planetNames.length; i++) {
      const name = planetNames[i];
      if (name === "Sun") continue; // skip the Sun
      
      const pivot = planetPivots[name];
      // revolve pivot on Y axis
      pivot.rotation.y += revolveSpeed; 
    }
    
    // revolve the Moon around Earth
    if (moonPivot) {
      moonPivot.rotation.y += moonRevolveSpeed;
    }
  
    // 2) rotate each planet (and the Sun) on its axis
    for (let i = 0; i < planetNames.length; i++) {
      const name = planetNames[i];
      const mesh = planetMeshes[name];
      mesh.rotation.y += rotateSpeed;
    }
    // rotate the Moon on its axis
    if (moonMesh) {
      moonMesh.rotation.y += moonRotateSpeed;
    }
  
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
  
  // ===================== Resize Handling =====================
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  