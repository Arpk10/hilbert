/**
 * Three.js Visualization Framework
 * Real-time rendering for physics simulations
 */
import * as THREE from 'three';

export class Visualization {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.container = null;
    this.animationId = null;
    this.particles = [];
    this.fluidMesh = null;
    this.spacetimeGeometry = null;
  }

  /**
   * Initialize Three.js visualization
   */
  initialize() {
    console.log('Three.js visualization initialized');
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupLighting();
    this.setupControls();
  }

  /**
   * Setup 3D scene
   */
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000814);
    
    // Add fog for depth
    this.scene.fog = new THREE.Fog(0x000814, 50, 200);
  }

  /**
   * Setup camera
   */
  setupCamera() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('Skipping camera setup - not in browser environment');
      return;
    }

    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      window.innerWidth / window.innerHeight, // aspect ratio
      0.1, // near plane
      1000 // far plane
    );
    this.camera.position.set(30, 30, 30);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Setup WebGL renderer
   */
  setupRenderer() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('Skipping renderer setup - not in browser environment');
      return;
    }

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add to DOM
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.zIndex = '1000';
    document.body.appendChild(this.container);
    this.container.appendChild(this.renderer.domElement);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Setup lighting
   */
  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Point light for emphasis
    const pointLight = new THREE.PointLight(0x00ffff, 1, 100);
    pointLight.position.set(0, 20, 0);
    this.scene.add(pointLight);
  }

  /**
   * Setup camera controls
   */
  setupControls() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('Skipping controls setup - not in browser environment');
      return;
    }

    // Simple mouse controls
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
      mouseX = (event.clientX - windowHalfX) / 100;
      mouseY = (event.clientY - windowHalfY) / 100;
    });

    this.updateCameraControls = () => {
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      
      this.camera.position.x = Math.cos(targetX) * 50;
      this.camera.position.z = Math.sin(targetX) * 50;
      this.camera.position.y = 30 + targetY * 20;
      this.camera.lookAt(0, 0, 0);
    };
  }

  /**
   * Visualize Schwarzschild spacetime
   * @param {number} mass - Mass of the central object
   * @param {number} scale - Visualization scale
   */
  visualizeSpacetime(mass = 1e30, scale = 1) {
    // Create spacetime grid
    const gridSize = 50;
    const divisions = 50;
    
    // Create curved grid to represent spacetime curvature
    const geometry = new THREE.PlaneGeometry(gridSize, gridSize, divisions, divisions);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });

    this.spacetimeGeometry = new THREE.Mesh(geometry, material);
    this.scene.add(this.spacetimeGeometry);

    // Add central mass (black hole)
    const blackHoleGeometry = new THREE.SphereGeometry(2, 32, 32);
    const blackHoleMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
    this.scene.add(blackHole);

    // Add accretion disk
    const diskGeometry = new THREE.RingGeometry(3, 15, 64);
    const diskMaterial = new THREE.MeshPhongMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const accretionDisk = new THREE.Mesh(diskGeometry, diskMaterial);
    accretionDisk.rotation.x = Math.PI / 2;
    this.scene.add(accretionDisk);
  }

  /**
   * Visualize geodesic trajectories
   * @param {number[][]} trajectories - Array of trajectory points
   */
  visualizeGeodesics(trajectories) {
    trajectories.forEach((trajectory, index) => {
      const points = [];
      trajectory.forEach(point => {
        points.push(new THREE.Vector3(point[1], point[2], point[3])); // x, y, z coordinates
      });

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(index / trajectories.length, 1, 0.5),
        linewidth: 2
      });

      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
    });
  }

  /**
   * Visualize Lattice Boltzmann fluid
   * @param {number[][]} densityField - Density field
   * @param {number[][]} velocityField - Velocity field
   */
  visualizeFluid(densityField, velocityField) {
    const nx = densityField.length;
    const ny = densityField[0].length;
    const nz = densityField[0][0]?.length || 1;

    // Create fluid visualization using particles or volume rendering
    const particleCount = Math.min(nx * ny * nz, 10000); // Limit particles for performance
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    let particleIndex = 0;
    for (let x = 0; x < nx && particleIndex < particleCount; x += Math.max(1, Math.floor(nx / 50))) {
      for (let y = 0; y < ny && particleIndex < particleCount; y += Math.max(1, Math.floor(ny / 50))) {
        for (let z = 0; z < nz && particleIndex < particleCount; z += Math.max(1, Math.floor(nz / 50))) {
          const density = densityField[x][y][z] || densityField[x][y];
          const velocity = velocityField[x][y][z] || velocityField[x][y];
          
          positions[particleIndex * 3] = x - nx / 2;
          positions[particleIndex * 3 + 1] = y - ny / 2;
          positions[particleIndex * 3 + 2] = z - nz / 2;

          // Color based on velocity magnitude
          const speed = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2 + (velocity[2] || 0) ** 2);
          const hue = Math.min(speed * 2, 1); // Map speed to hue
          const color = new THREE.Color().setHSL(0.7 - hue * 0.7, 1, 0.5);
          
          colors[particleIndex * 3] = color.r;
          colors[particleIndex * 3 + 1] = color.g;
          colors[particleIndex * 3 + 2] = color.b;

          particleIndex++;
        }
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    this.fluidMesh = new THREE.Points(geometry, material);
    this.scene.add(this.fluidMesh);
  }

  /**
   * Update spacetime curvature visualization
   * @param {number} time - Current simulation time
   */
  updateSpacetime(time) {
    if (this.spacetimeGeometry) {
      const positions = this.spacetimeGeometry.geometry.attributes.position.array;
      const divisions = 50;
      const gridSize = 50;
      
      for (let i = 0; i <= divisions; i++) {
        for (let j = 0; j <= divisions; j++) {
          const index = (i * (divisions + 1) + j) * 3;
          const x = (i / divisions - 0.5) * gridSize;
          const y = (j / divisions - 0.5) * gridSize;
          const r = Math.sqrt(x * x + y * y);
          
          // Simple curvature approximation
          const curvature = Math.max(0, 1 - r / 20) * 5 * Math.sin(time * 0.001);
          positions[index + 2] = curvature;
        }
      }
      
      this.spacetimeGeometry.geometry.attributes.position.needsUpdate = true;
    }
  }

  /**
   * Handle window resize
   */
  onWindowResize() {
    if (typeof window === 'undefined') {
      return;
    }

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Render loop
   */
  render() {
    if (this.updateCameraControls) {
      this.updateCameraControls();
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Start animation loop
   */
  start() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.render();
    };
    animate();
  }

  /**
   * Stop animation loop
   */
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Visualize quantum path integral using Monte Carlo paths
   * @param {Array} paths - Array of Monte Carlo paths
   */
  visualizeQuantumPaths(paths) {
    paths.forEach((path, index) => {
      const points = [];
      path.forEach(point => {
        // Scale and position for visualization
        const x = point[0] * 0.1;
        const y = point[1] * 0.1;
        const z = point[2] * 0.01; // Time as z-axis
        points.push(new THREE.Vector3(x, y, z));
      });

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
        transparent: true,
        opacity: 0.3
      });

      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
    });
  }

  /**
   * Visualize quantum wavefunction as 3D surface
   * @param {number[][]} wavefunction - Wavefunction amplitude
   * @param {number} scale - Visualization scale
   */
  visualizeWavefunction(wavefunction, scale = 1) {
    const size = wavefunction.length;
    const geometry = new THREE.PlaneGeometry(size * scale, size * scale, size - 1, size - 1);
    const vertices = geometry.attributes.position.array;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const index = (i * size + j) * 3;
        const amplitude = wavefunction[i][j];
        
        // Height represents wavefunction amplitude
        vertices[index + 2] = amplitude * scale * 5;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff88,
      wireframe: false,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });

    const wavefunctionMesh = new THREE.Mesh(geometry, material);
    this.scene.add(wavefunctionMesh);
  }

  /**
   * Visualize quantum probability density as particles
   * @param {number[][]} probabilityDensity - |ψ|² values
   * @param {number} maxParticles - Maximum number of particles to render
   */
  visualizeProbabilityDensity(probabilityDensity, maxParticles = 5000) {
    const size = probabilityDensity.length;
    const particles = [];
    const colors = [];

    // Sample particles based on probability density
    let totalSamples = 0;
    for (let i = 0; i < size && totalSamples < maxParticles; i++) {
      for (let j = 0; j < size && totalSamples < maxParticles; j++) {
        const probability = probabilityDensity[i][j];
        const numParticles = Math.floor(probability * 100); // Scale for visibility
        
        for (let p = 0; p < numParticles && totalSamples < maxParticles; p++) {
          const x = (i - size/2) * 0.1 + (Math.random() - 0.5) * 0.05;
          const y = (j - size/2) * 0.1 + (Math.random() - 0.5) * 0.05;
          const z = (Math.random() - 0.5) * 0.1;
          
          particles.push(x, y, z);
          
          // Color based on probability
          const hue = 0.7 - probability * 0.7; // Blue to red
          const color = new THREE.Color().setHSL(hue, 1, 0.5);
          colors.push(color.r, color.g, color.b);
          
          totalSamples++;
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(particles, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    const particleSystem = new THREE.Points(geometry, material);
    this.scene.add(particleSystem);
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stop();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.renderer.dispose();
  }
}
