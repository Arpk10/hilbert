/**
 * String Theory Engine
 * Implements Polchinski action, string dynamics, and bosonic string theory
 * Based on Polchinski Vol 1, Section 1.2 and David Tong's lecture notes
 */
export class StringEngine {
  constructor() {
    this.precision = Float64Array;
    
    // Physical Constants (Natural Units: ℏ = c = 1)
    this.alphaPrime = 1 / 137.035999084; // Fine structure constant
    this.gString = 0; // String coupling constant
    this.tension = 1; // String tension (in natural units)
    this.length = 1; // String length (in natural units)
    
    // String Parameters
    this.numModes = 64; // Number of vibrational modes
    this.numPoints = 128; // Points along string
    this.time = 0;
    this.dt = 0.01; // Time step for integration
    
    // Mode Amplitudes and Phases
    this.modeAmplitudes = new Array(this.numModes);
    this.modePhases = new Array(this.numModes);
    this.modeFrequencies = new Array(this.numModes);
    
    // String Configuration
    this.stringTension = 1; // T
    this.stringLinearDensity = 1; // μ
    this.waveSpeed = Math.sqrt(this.stringTension / this.stringLinearDensity); // v = √(T/μ)
    
    // Compactification
    this.isCompactified = false;
    this.compactificationRadius = 1; // R for compactified dimension
    
    // Initialize mode frequencies
    this.initializeModeFrequencies();
    
    // Reference: Polchinski Vol 1, Eq. (1.2.15)
    // Action: S = (1/4πα') ∫ dτ (Ẋ^μ Ẋ_μ + α'² X^μ X_μ)
  }

  /**
   * Initialize vibrational mode frequencies
   * Reference: Polchinski Vol 1, Eq. (1.1.8)
   */
  initializeModeFrequencies() {
    for (let n = 1; n <= this.numModes; n++) {
      // Frequency of nth mode: ω_n = nπ/L
      this.modeFrequencies[n - 1] = n * Math.PI / this.length;
      
      // Initialize with small random amplitude
      this.modeAmplitudes[n - 1] = (Math.random() - 0.5) * 0.1;
      this.modePhases[n - 1] = Math.random() * 2 * Math.PI;
    }
  }

  /**
   * Calculate Polchinski action for a given string configuration
   * Reference: Polchinski Vol 1, Eq. (1.2.15)
   * S = (1/4πα') ∫ dτ (Ẋ^μ Ẋ_μ + α'² X^μ X_μ)
   */
  calculatePolchinskiAction(stringCoordinates, velocities) {
    let action = 0;
    
    // Kinetic term: (1/4πα') ∫ dτ Ẋ^μ Ẋ_μ
    let kineticTerm = 0;
    for (let i = 0; i < stringCoordinates.length - 1; i++) {
      const dx = stringCoordinates[i + 1] - stringCoordinates[i];
      const velocity = velocities[i];
      kineticTerm += velocity * velocity; // Ẋ^μ Ẋ_μ
    }
    
    // Potential term from background field X^μ
    let potentialTerm = 0;
    for (let i = 0; i < stringCoordinates.length; i++) {
      const x = stringCoordinates[i];
      // Simple quadratic potential: V(x) = (1/2)kx²
      potentialTerm += 0.5 * this.gString * x * x;
    }
    
    action = (1 / (4 * Math.PI * this.alphaPrime)) * (kineticTerm + this.gString * this.gString * potentialTerm);
    
    return action;
  }

  /**
   * Update string dynamics using wave equation
   * Reference: Polchinski Vol 1, Eq. (1.1.1)
   * ∂²X/∂τ² = ∂²X/∂σ²
   */
  updateStringDynamics() {
    const newCoordinates = [...this.stringCoordinates];
    const newVelocities = [...this.stringVelocities];
    
    // Wave equation integration
    for (let i = 1; i < this.numPoints - 1; i++) {
      let acceleration = 0;
      
      // Second derivative approximation: ∂²X/∂σ² ≈ (X_{i+1} - 2X_i + X_{i-1})/Δσ²
      if (i > 0 && i < this.numPoints - 1) {
        acceleration = (newCoordinates[i + 1] - 2 * newCoordinates[i] + newCoordinates[i - 1]) / 
                    (this.length / (this.numPoints - 1)) ** 2;
      }
      
      // Update velocity and position
      newVelocities[i] += acceleration * this.dt;
      newCoordinates[i] += newVelocities[i] * this.dt;
    }
    
    // Boundary conditions
    this.applyBoundaryConditions(newCoordinates, newVelocities);
    
    this.stringCoordinates = newCoordinates;
    this.stringVelocities = newVelocities;
  }

  /**
   * Apply boundary conditions to string
   * Can be Dirichlet (fixed) or Neumann (free) or periodic
   */
  applyBoundaryConditions(coordinates, velocities) {
    // Dirichlet boundary conditions: fixed endpoints
    coordinates[0] = 0;
    coordinates[coordinates.length - 1] = 0;
    velocities[0] = 0;
    velocities[velocities.length - 1] = 0;
    
    // For compactified strings, apply periodic boundary
    if (this.isCompactified) {
      // Identify points that should be identified
      const identificationDistance = this.compactificationRadius;
      
      // Check if endpoints should be identified
      const dist = Math.sqrt(
        (coordinates[0] - coordinates[coordinates.length - 1]) ** 2 +
        (coordinates[1] - coordinates[coordinates.length - 2]) ** 2 +
        (coordinates[2] - coordinates[coordinates.length - 3]) ** 2
      );
      
      if (dist < identificationDistance) {
        // Apply periodic boundary conditions
        for (let i = 0; i < 3; i++) {
          coordinates[coordinates.length - 1 - i] = coordinates[i];
          velocities[coordinates.length - 1 - i] = velocities[i];
        }
      }
    }
  }

  /**
   * Calculate string coordinates from vibrational modes
   * X(σ, τ) = Σ a_n(τ) sin(nπσ/L)
   */
  calculateStringFromModes(time) {
    const coordinates = new Array(this.numPoints);
    
    for (let i = 0; i < this.numPoints; i++) {
      const sigma = (i / (this.numPoints - 1)) * this.length;
      let x = 0;
      
      // Sum over all vibrational modes
      for (let n = 1; n <= this.numModes; n++) {
        const omega = this.modeFrequencies[n - 1];
        const amplitude = this.modeAmplitudes[n - 1];
        const phase = this.modePhases[n - 1];
        
        x += amplitude * Math.sin(omega * time + phase) * Math.sin(n * Math.PI * sigma / this.length);
      }
      
      coordinates[i] = x;
    }
    
    return coordinates;
  }

  /**
   * Calculate Regge trajectory for string
   * Reference: Polchinski Vol 1, Section 2.3
   * J² = α'M² + (p/α')²
   */
  calculateReggeTrajectory(momentum, angularMomentum) {
    const alphaPrime = this.alphaPrime;
    const p = momentum;
    const j = angularMomentum;
    
    // Regge trajectory: relationship between J² and M²
    const reggeSlope = 1 / alphaPrime;
    const intercept = (p / alphaPrime) ** 2;
    
    return {
      slope: reggeSlope,
      intercept: intercept,
      trajectory: {
        description: "Regge trajectory in (J², M²) plane",
        slope: reggeSlope,
        intercept: intercept,
        isPhysical: j * j >= intercept // Physical region
      }
    };
  }

  /**
   * Calculate string tension from mode frequencies
   */
  calculateStringTension(modeFrequencies) {
    if (modeFrequencies.length < 2) return this.tension;
    
    // T = μ (ωL/π)²
    const omega1 = modeFrequencies[0];
    const omega2 = modeFrequencies[1];
    
    const tension = this.stringLinearDensity * Math.pow(omega1 * this.length / Math.PI, 2);
    
    return tension;
  }

  /**
   * Excite specific vibrational mode
   */
  exciteMode(modeNumber, amplitude, phase = 0) {
    if (modeNumber >= 1 && modeNumber <= this.numModes) {
      this.modeAmplitudes[modeNumber - 1] = amplitude;
      this.modePhases[modeNumber - 1] = phase;
    }
  }

  /**
   * Add quantum fluctuation to string
   */
  addQuantumFluctuation(strength = 0.01) {
    for (let i = 0; i < this.numModes; i++) {
      this.modeAmplitudes[i] += (Math.random() - 0.5) * strength;
      this.modePhases[i] += (Math.random() - 0.5) * 0.1;
    }
  }

  /**
   * Calculate string energy from mode amplitudes
   * E = Σ (1/2) T L ω_n² |a_n|²
   */
  calculateStringEnergy() {
    let energy = 0;
    
    for (let n = 1; n <= this.numModes; n++) {
      const omega = this.modeFrequencies[n - 1];
      const amplitude = this.modeAmplitudes[n - 1];
      energy += 0.5 * this.stringTension * this.length * omega * omega * amplitude * amplitude;
    }
    
    return energy;
  }

  /**
   * Get current string state for visualization
   */
  getStringState() {
    return {
      coordinates: this.calculateStringFromModes(this.time),
      velocities: this.stringVelocities,
      modeAmplitudes: [...this.modeAmplitudes],
      modePhases: [...this.modePhases],
      modeFrequencies: [...this.modeFrequencies],
      energy: this.calculateStringEnergy(),
      tension: this.stringTension,
      waveSpeed: this.waveSpeed,
      isCompactified: this.isCompactified,
      compactificationRadius: this.compactificationRadius,
      time: this.time,
      numModes: this.numModes,
      numPoints: this.numPoints,
      polchinskiAction: this.calculatePolchinskiAction(
        this.calculateStringFromModes(this.time),
        this.stringVelocities
      )
    };
  }

  /**
   * Update string simulation by one time step
   */
  updateSimulation() {
    this.time += this.dt;
    this.updateStringDynamics();
  }

  /**
   * Set string parameters
   */
  setStringTension(tension) {
    this.stringTension = tension;
    this.waveSpeed = Math.sqrt(tension / this.stringLinearDensity);
  }

  setStringLength(length) {
    this.length = length;
    this.initializeModeFrequencies();
  }

  setCouplingConstant(gString) {
    this.gString = gString;
  }

  /**
   * Initialize String Engine
   */
  initialize() {
    console.log('String Theory Engine initialized');
    console.log(`  Number of modes: ${this.numModes}`);
    console.log(`  String length: ${this.length}`);
    console.log(`  String tension: ${this.tension}`);
    console.log(`  Coupling constant: ${this.gString}`);
    this.initializeString();
  }

  /**
   * Toggle compactification
   */
  enableCompactification(radius = 1) {
    this.isCompactified = true;
    this.compactificationRadius = radius;
  }

  disableCompactification() {
    this.isCompactified = false;
  }

  /**
   * Initialize string with random configuration
   */
  initializeString() {
    this.stringCoordinates = new Array(this.numPoints);
    this.stringVelocities = new Array(this.numPoints);
    
    // Initialize with small random displacement
    for (let i = 0; i < this.numPoints; i++) {
      const sigma = (i / (this.numPoints - 1)) * this.length;
      this.stringCoordinates[i] = 0.1 * Math.sin(2 * Math.PI * sigma / this.length);
      this.stringVelocities[i] = 0;
    }
    
    this.applyBoundaryConditions(this.stringCoordinates, this.stringVelocities);
  }

  /**
   * Reset simulation
   */
  reset() {
    this.time = 0;
    this.initializeString();
    this.initializeModeFrequencies();
  }
}
