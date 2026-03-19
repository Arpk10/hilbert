/**
 * Black Hole Physics Engine
 * Implements Hawking Radiation and Event Horizon Physics
 * Based on Black Hole Lectures 2016, Section 4
 */
export class BlackHoleEngine {
  constructor() {
    this.precision = Float64Array;
    
    // Physical Constants (SI units)
    this.G = 6.67430e-11;           // Gravitational constant (m³/kg·s²)
    this.c = 299792458;               // Speed of light (m/s)
    this.hbar = 1.054571817e-34;      // Reduced Planck constant (J·s)
    this.kB = 1.380649e-23;          // Boltzmann constant (J/K)
    this.sigma = 5.670374419e-8;      // Stefan-Boltzmann constant (W/m²·K⁴)
    
    // Black Hole Parameters
    this.mass = 1.989e30;             // Default: Solar mass (kg)
    this.schwarzschildRadius = 0;
    this.hawkingTemperature = 0;
    this.evaporationTime = 0;
    this.surfaceGravity = 0;
    
    // Simulation Parameters
    this.timeStep = 0.01;              // Time step for evaporation simulation
    this.particleEmissionRate = 0;
    this.simulationSpeed = 1e50;        // Speed multiplier for visualization
    this.criticalMass = 1e10;           // Critical mass threshold for explosion
    this.isEvaporating = false;
    this.evaporationConstant = 0;          // Will be calculated based on physics
    
    this.updateBlackHoleProperties();
    this.calculateEvaporationConstant();
  }

  /**
   * Initialize Black Hole Engine
   */
  initialize() {
    console.log('Black Hole Physics Engine initialized');
    console.log(`  Default mass: ${(this.mass / 1.989e30).toFixed(2)} solar masses`);
    console.log(`  Schwarzschild radius: ${(this.schwarzschildRadius / 1000).toFixed(2)} km`);
    console.log(`  Hawking temperature: ${this.hawkingTemperature.toExponential(2)} K`);
    console.log(`  Critical mass: ${(this.criticalMass / 1e10).toFixed(2)} × 10¹⁰ kg`);
  }

  /**
   * Calculate evaporation constant from Hawking power formula
   * Uses dM/dt ≈ -k/M² where k is derived from P = -dMc²/dt
   */
  calculateEvaporationConstant() {
    // From Hawking power: P = ℏc⁶/(15360πG²M²)
    // And energy-mass relation: P = -dMc²/dt
    // Therefore: dM/dt = -ℏc³/(15360πG²M²)
    this.evaporationConstant = this.hbar * Math.pow(this.c, 3) / 
                           (15360 * Math.PI * Math.pow(this.G, 2));
  }

  /**
   * Dynamic evaporation calculation using differential equation
   * dM/dt ≈ -k/M² where k is the evaporation constant
   * Reference: Derived from Hawking radiation power formula
   * 
   * @param {number} dt - Time step in seconds
   * @returns {number} Mass loss during this time step
   */
  calculateEvaporation(dt) {
    if (this.mass <= 0 || !this.isEvaporating) return 0;
    
    // Apply simulation speed multiplier for visualization
    const scaledDt = dt * this.simulationSpeed;
    
    // Differential equation: dM/dt = -k/M²
    const massLoss = this.evaporationConstant / (this.mass * this.mass) * scaledDt;
    
    // Ensure we don't lose more mass than available
    const actualMassLoss = Math.min(massLoss, this.mass);
    
    // Update mass
    this.mass -= actualMassLoss;
    
    // Update all dependent properties
    this.updateBlackHoleProperties();
    
    return actualMassLoss;
  }

  /**
   * Check if black hole has reached critical mass for explosion
   * @returns {boolean} True if explosion should trigger
   */
  shouldExplode() {
    return this.mass <= this.criticalMass;
  }

  /**
   * Generate explosion effect when black hole evaporates completely
   * @returns {Object} Explosion parameters for visualization
   */
  triggerExplosion() {
    const explosion = {
      position: [0, 0, 0], // Center of black hole
      energy: this.mass * this.c * this.c, // Remaining mass-energy
      temperature: this.hawkingTemperature,
      particleCount: Math.floor(1000 * (1 + Math.random())), // Burst of particles
      colors: this.getExplosionColors(),
      shockwaveRadius: this.schwarzschildRadius * 10, // Expanding shockwave
      remnantMass: this.mass * 0.1 // Leave small remnant
    };
    
    // Set mass to remnant or zero
    this.mass = explosion.remnantMass;
    this.updateBlackHoleProperties();
    this.isEvaporating = false;
    
    return explosion;
  }

  /**
   * Get colors for explosion based on final temperature
   */
  getExplosionColors() {
    const temp = this.hawkingTemperature;
    
    if (temp > 1e10) {
      return [0xffffff, 0x00ffff, 0xffff00]; // White-hot, cyan, yellow
    } else if (temp > 1e6) {
      return [0xff8800, 0xff0000, 0xffaa00]; // Orange, red, yellow-orange
    } else {
      return [0xff0000, 0x880000, 0xff4444]; // Red, dark red, light red
    }
  }

  /**
   * Get current simulation state for shader updates
   * @returns {Object} Current black hole parameters for visualization
   */
  getSimulationState() {
    return {
      mass: this.mass,
      schwarzschildRadius: this.schwarzschildRadius,
      hawkingTemperature: this.hawkingTemperature,
      particleEmissionRate: this.particleEmissionRate,
      hawkingPower: this.calculateHawkingPower(),
      isEvaporating: this.isEvaporating,
      criticalMassRatio: this.mass / this.criticalMass,
      evaporationProgress: Math.max(0, 1 - this.mass / (1.989e30)) // Progress from solar mass
    };
  }

  /**
   * Start evaporation simulation
   */
  startEvaporation() {
    this.isEvaporating = true;
    console.log(`Starting evaporation: Initial mass = ${(this.mass / 1.989e30).toFixed(2)} M☉`);
  }

  /**
   * Stop evaporation simulation
   */
  stopEvaporation() {
    this.isEvaporating = false;
    console.log(`Stopping evaporation: Final mass = ${(this.mass / 1.989e30).toFixed(2)} M☉`);
  }

  /**
   * Set simulation speed multiplier
   * @param {number} speed - Speed multiplier (1 = normal, higher = faster)
   */
  setSimulationSpeed(speed) {
    this.simulationSpeed = Math.max(1, speed);
  }

  /**
   * Reset simulation to initial conditions
   * @param {number} initialMass - Starting mass (default: solar mass)
   */
  resetSimulation(initialMass = 1.989e30) {
    this.mass = initialMass;
    this.isEvaporating = false;
    this.updateBlackHoleProperties();
    this.calculateEvaporationConstant();
  }

  /**
   * Calculate Schwarzschild radius: r_s = 2GM/c²
   * Reference: Black Hole Lectures 2016, Eq. (2.1)
   */
  calculateSchwarzschildRadius(mass = this.mass) {
    return (2 * this.G * mass) / (this.c * this.c);
  }

  /**
   * Calculate Hawking temperature: T_H = ℏc³/(8πGMk_B)
   * Reference: Black Hole Lectures 2016, Eq. (4.12)
   */
  calculateHawkingTemperature(mass = this.mass) {
    if (mass <= 0) return 0;
    return (this.hbar * Math.pow(this.c, 3)) / (8 * Math.PI * this.G * mass * this.kB);
  }

  /**
   * Calculate surface gravity: g = c⁴/(4GM)
   * Reference: Black Hole Lectures 2016, Eq. (3.7)
   */
  calculateSurfaceGravity(mass = this.mass) {
    if (mass <= 0) return 0;
    return Math.pow(this.c, 4) / (4 * this.G * mass);
  }

  /**
   * Calculate black hole evaporation time: τ = 5120πG²M³/(ℏc⁴)
   * Reference: Black Hole Lectures 2016, Eq. (4.18)
   */
  calculateEvaporationTime(mass = this.mass) {
    if (mass <= 0) return 0;
    return (5120 * Math.PI * Math.pow(this.G, 2) * Math.pow(mass, 3)) / 
           (this.hbar * Math.pow(this.c, 4));
  }

  /**
   * Calculate Hawking power emission: P = ℏc⁶/(15360πG²M²)
   * Reference: Black Hole Lectures 2016, Eq. (4.15)
   */
  calculateHawkingPower(mass = this.mass) {
    if (mass <= 0) return 0;
    return (this.hbar * Math.pow(this.c, 6)) / (15360 * Math.PI * Math.pow(this.G, 2) * Math.pow(mass, 2));
  }

  /**
   * Update all black hole properties based on current mass
   */
  updateBlackHoleProperties() {
    this.schwarzschildRadius = this.calculateSchwarzschildRadius();
    this.hawkingTemperature = this.calculateHawkingTemperature();
    this.evaporationTime = this.calculateEvaporationTime();
    this.surfaceGravity = this.calculateSurfaceGravity();
    this.particleEmissionRate = this.calculateEmissionRate();
  }

  /**
   * Calculate particle emission rate based on Hawking temperature
   * Uses Stefan-Boltzmann law adapted for black hole horizon
   */
  calculateEmissionRate() {
    if (this.hawkingTemperature <= 0) return 0;
    
    const horizonArea = 4 * Math.PI * Math.pow(this.schwarzschildRadius, 2);
    const power = this.sigma * Math.pow(this.hawkingTemperature, 4) * horizonArea;
    
    // Approximate number of particles per second (assuming average photon energy)
    const averagePhotonEnergy = this.kB * this.hawkingTemperature;
    return power / averagePhotonEnergy;
  }

  /**
   * Simulate black hole evaporation over one time step
   * Returns mass loss due to Hawking radiation
   */
  evaporateOneTimeStep() {
    const power = this.calculateHawkingPower(this.mass);
    const energyLoss = power * this.timeStep;
    const massLoss = energyLoss / (this.c * this.c); // E = mc²
    
    this.mass = Math.max(0, this.mass - massLoss);
    this.updateBlackHoleProperties();
    
    return massLoss;
  }

  /**
   * Calculate gravitational redshift factor at given radius
   * z = (1 - r_s/r)^(-1/2) - 1
   * Reference: Black Hole Lectures 2016, Eq. (3.12)
   */
  gravitationalRedshift(radius) {
    if (radius <= this.schwarzschildRadius) return Infinity;
    const factor = 1 - this.schwarzschildRadius / radius;
    return 1 / Math.sqrt(factor) - 1;
  }

  /**
   * Calculate frequency shift due to gravitational redshift
   * ω_observed = ω_emitted / sqrt(1 - r_s/r)
   */
  frequencyShift(emittedFrequency, radius) {
    if (radius <= this.schwarzschildRadius) return 0;
    const factor = 1 - this.schwarzschildRadius / radius;
    return emittedFrequency / Math.sqrt(factor);
  }

  /**
   * Calculate null geodesic for light bending
   * Simplified ray-marching for photon trajectories
   * Reference: Black Hole Lectures 2016, Section 5
   */
  calculateNullGeodesic(initialPosition, initialDirection, steps = 1000, stepSize = 0.1) {
    const trajectory = [initialPosition];
    let position = [...initialPosition];
    let direction = [...initialDirection];
    
    for (let i = 0; i < steps; i++) {
      const r = Math.sqrt(position[0]**2 + position[1]**2 + position[2]**2);
      
      // Check if photon falls into black hole
      if (r <= this.schwarzschildRadius * 1.1) break;
      
      // Calculate deflection using Schwarzschild metric
      const deflectionStrength = (2 * this.G * this.mass) / (this.c * this.c * r);
      
      // Apply deflection to direction
      const radialDirection = position.map(coord => coord / r);
      const tangentialComponent = direction.map((d, idx) => d - radialDirection[idx] * 
        (direction[0] * radialDirection[0] + direction[1] * radialDirection[1] + direction[2] * radialDirection[2]));
      
      // Update direction with gravitational bending
      for (let j = 0; j < 3; j++) {
        direction[j] = tangentialComponent[j] - deflectionStrength * radialDirection[j];
      }
      
      // Normalize direction
      const dirMagnitude = Math.sqrt(direction[0]**2 + direction[1]**2 + direction[2]**2);
      direction = direction.map(d => d / dirMagnitude);
      
      // Update position
      position = position.map((coord, idx) => coord + direction[idx] * stepSize);
      trajectory.push([...position]);
    }
    
    return trajectory;
  }

  /**
   * Generate photon ring visualization data
   * Calculates critical impact parameter for photon sphere
   * Reference: Black Hole Lectures 2016, Eq. (5.8)
   */
  generatePhotonRing() {
    const photonSphereRadius = 1.5 * this.schwarzschildRadius;
    const criticalImpactParameter = Math.sqrt(27) * this.schwarzschildRadius / 2;
    
    const ringPoints = [];
    const numPoints = 100;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (2 * Math.PI * i) / numPoints;
      const x = criticalImpactParameter * Math.cos(angle);
      const y = criticalImpactParameter * Math.sin(angle);
      const z = 0;
      
      ringPoints.push([x, y, z]);
    }
    
    return {
      ringPoints,
      photonSphereRadius,
      criticalImpactParameter
    };
  }

  /**
   * Calculate vacuum fluctuation probability near horizon
   * Models virtual particle pair creation probability
   * Reference: Black Hole Lectures 2016, Section 4.3
   */
  vacuumFluctuationProbability(radius) {
    if (radius <= this.schwarzschildRadius) return 0;
    
    const redshift = this.gravitationalRedshift(radius);
    const temperature = this.hawkingTemperature;
    
    // Probability increases near horizon due to tidal forces
    const tidalFactor = Math.exp(-Math.abs(radius - this.schwarzschildRadius) / this.schwarzschildRadius);
    const thermalFactor = Math.exp(-this.hbar / (this.kB * temperature));
    
    return tidalFactor * thermalFactor;
  }

  /**
   * Simulate virtual particle pair creation near horizon
   * Returns arrays of particle positions and properties
   */
  createVirtualPairs(numPairs = 10) {
    const particles = [];
    
    for (let i = 0; i < numPairs; i++) {
      // Random position near horizon
      const radius = this.schwarzschildRadius * (1 + Math.random() * 0.5);
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      // Calculate pair properties
      const probability = this.vacuumFluctuationProbability(radius);
      
      // Create particle pair (one falls in, one escapes)
      particles.push({
        position: [x, y, z],
        type: 'negative', // Falls into black hole
        energy: -this.kB * this.hawkingTemperature * Math.random(),
        probability: probability
      });
      
      particles.push({
        position: [x, y, z],
        type: 'positive', // Escapes to infinity
        energy: this.kB * this.hawkingTemperature * Math.random(),
        probability: probability,
        escapeDirection: [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]
      });
    }
    
    return particles;
  }

  /**
   * Get current black hole state for visualization
   */
  getBlackHoleState() {
    return {
      mass: this.mass,
      schwarzschildRadius: this.schwarzschildRadius,
      hawkingTemperature: this.hawkingTemperature,
      evaporationTime: this.evaporationTime,
      surfaceGravity: this.surfaceGravity,
      particleEmissionRate: this.particleEmissionRate,
      hawkingPower: this.calculateHawkingPower()
    };
  }

  /**
   * Set black hole mass and update all properties
   */
  setMass(newMass) {
    this.mass = Math.max(0, newMass);
    this.updateBlackHoleProperties();
  }

  /**
   * Reset to initial conditions
   */
  reset(initialMass = 1.989e30) {
    this.mass = initialMass;
    this.updateBlackHoleProperties();
  }
}
