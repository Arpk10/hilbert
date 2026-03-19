/**
 * Quantum Path Integral Visualization
 * Implements Monte Carlo sampling and Fourier space rendering for path integrals
 * Based on Peskin & Schroeder "An Introduction to Quantum Field Theory"
 */
export class PathIntegral {
  constructor() {
    this.precision = Float64Array;
    this.hbar = 1.054571817e-34; // Reduced Planck constant (J·s)
    this.c = 299792458; // Speed of light (m/s)
    this.m = 9.1093837015e-31; // Electron mass (kg)
    this.latticeSize = 64; // Grid size for FFT
    this.numPaths = 1000; // Number of Monte Carlo paths
  }

  /**
   * Initialize path integral calculations
   */
  initialize() {
    console.log('Quantum Path Integral module initialized');
    console.log(`  Grid size: ${this.latticeSize}×${this.latticeSize}`);
    console.log(`  Monte Carlo paths: ${this.numPaths}`);
  }

  /**
   * Generate random paths between two points using Monte Carlo sampling
   * @param {number[]} start - Starting point [x, y, t]
   * @param {number[]} end - Ending point [x, y, t]
   * @param {number} numPaths - Number of paths to generate
   * @returns {Array} Array of paths, each path is array of points
   */
  generateMonteCarloPaths(start, end, numPaths = this.numPaths) {
    const paths = [];
    const numSteps = 50; // Steps per path
    
    for (let pathIdx = 0; pathIdx < numPaths; pathIdx++) {
      const path = [];
      const dt = (end[2] - start[2]) / numSteps;
      
      // Generate random walk with bias toward endpoint
      let currentX = start[0];
      let currentY = start[1];
      
      path.push([currentX, currentY, start[2]]);
      
      for (let step = 1; step < numSteps; step++) {
        const t = start[2] + step * dt;
        const progress = step / numSteps;
        
        // Random walk with drift toward target
        const driftX = (end[0] - currentX) * progress * 0.1;
        const driftY = (end[1] - currentY) * progress * 0.1;
        
        // Quantum fluctuation amplitude (scaled by sqrt(ℏ/m))
        const fluctuationScale = Math.sqrt(this.hbar / (this.m * dt)) * 1e10; // Scaled for visualization
        
        currentX += driftX + (Math.random() - 0.5) * fluctuationScale;
        currentY += driftY + (Math.random() - 0.5) * fluctuationScale;
        
        path.push([currentX, currentY, t]);
      }
      
      // Ensure we reach the endpoint
      path.push([end[0], end[1], end[2]]);
      paths.push(path);
    }
    
    return paths;
  }

  /**
   * Calculate action for a given path (non-relativistic approximation)
   * S = ∫ L dt where L = T - V
   * @param {Array} path - Array of points [x, y, t]
   * @param {Function} potential - Potential function V(x, y, t)
   * @returns {number} Action value
   */
  calculateAction(path, potential = null) {
    let action = 0;
    
    for (let i = 1; i < path.length; i++) {
      const [x1, y1, t1] = path[i-1];
      const [x2, y2, t2] = path[i];
      
      const dt = t2 - t1;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const velocitySquared = (dx*dx + dy*dy) / (dt*dt);
      
      // Kinetic energy: T = (1/2)mv²
      const kineticEnergy = 0.5 * this.m * velocitySquared;
      
      // Potential energy (default: harmonic oscillator)
      let potentialEnergy = 0;
      if (potential) {
        potentialEnergy = potential(x2, y2, t2);
      } else {
        // Harmonic oscillator: V = (1/2)k(x² + y²)
        const k = 1e-20; // Spring constant (scaled)
        potentialEnergy = 0.5 * k * (x2*x2 + y2*y2);
      }
      
      // Lagrangian: L = T - V
      const lagrangian = kineticEnergy - potentialEnergy;
      action += lagrangian * dt;
    }
    
    return action / this.hbar; // Return in units of ℏ
  }

  /**
   * Calculate path integral weight for visualization
   * @param {number} action - Action value
   * @returns {number} Complex weight e^(iS/ℏ)
   */
  pathWeight(action) {
    return {
      real: Math.cos(action),
      imag: Math.sin(action)
    };
  }

  /**
   * Compute propagator in momentum space (free particle)
   * K(p, t) = exp(-i p²t / 2mℏ)
   * @param {number[][]} momentumGrid - 2D momentum grid [px, py]
   * @param {number} time - Evolution time
   * @returns {number[][]} Complex propagator values
   */
  momentumSpacePropagator(momentumGrid, time) {
    const nx = momentumGrid.length;
    const ny = momentumGrid[0].length;
    const propagator = new Array(nx);
    
    for (let i = 0; i < nx; i++) {
      propagator[i] = new Array(ny);
      for (let j = 0; j < ny; j++) {
        const [px, py] = momentumGrid[i][j];
        const pSquared = px*px + py*py;
        
        // Phase factor: exp(-i p²t / 2mℏ)
        const phase = -pSquared * time / (2 * this.m * this.hbar);
        propagator[i][j] = {
          real: Math.cos(phase),
          imag: Math.sin(phase)
        };
      }
    }
    
    return propagator;
  }

  /**
   * Create momentum space grid
   * @param {number} size - Grid size
   * @param {number} maxMomentum - Maximum momentum value
   * @returns {number[][]} 2D momentum grid
   */
  createMomentumGrid(size = this.latticeSize, maxMomentum = 1e-20) {
    const grid = new Array(size);
    const dp = 2 * maxMomentum / size;
    
    for (let i = 0; i < size; i++) {
      grid[i] = new Array(size);
      for (let j = 0; j < size; j++) {
        const px = -maxMomentum + i * dp;
        const py = -maxMomentum + j * dp;
        grid[i][j] = [px, py];
      }
    }
    
    return grid;
  }

  /**
   * Simple 2D FFT implementation (real to complex)
   * Note: This is a simplified implementation for demonstration
   * In production, use a optimized FFT library
   * @param {number[][]} input - Real input array
   * @returns {Array} Complex FFT output
   */
  simpleFFT2D(input) {
    const nx = input.length;
    const ny = input[0].length;
    const output = new Array(nx);
    
    // Simplified FFT using discrete Fourier transform
    for (let kx = 0; kx < nx; kx++) {
      output[kx] = new Array(ny);
      for (let ky = 0; ky < ny; ky++) {
        let real = 0;
        let imag = 0;
        
        for (let x = 0; x < nx; x++) {
          for (let y = 0; y < ny; y++) {
            const phase = -2 * Math.PI * (kx * x / nx + ky * y / ny);
            real += input[x][y] * Math.cos(phase);
            imag += input[x][y] * Math.sin(phase);
          }
        }
        
        output[kx][ky] = { real: real / (nx * ny), imag: imag / (nx * ny) };
      }
    }
    
    return output;
  }

  /**
   * Inverse 2D FFT (complex to real)
   * @param {Array} input - Complex input array
   * @returns {number[][]} Real output array
   */
  inverseFFT2D(input) {
    const nx = input.length;
    const ny = input[0].length;
    const output = new Array(nx);
    
    for (let x = 0; x < nx; x++) {
      output[x] = new Array(ny);
      for (let y = 0; y < ny; y++) {
        let real = 0;
        
        for (let kx = 0; kx < nx; kx++) {
          for (let ky = 0; ky < ny; ky++) {
            const phase = 2 * Math.PI * (kx * x / nx + ky * y / ny);
            const value = input[kx][ky];
            real += value.real * Math.cos(phase) - value.imag * Math.sin(phase);
          }
        }
        
        output[x][y] = real;
      }
    }
    
    return output;
  }

  /**
   * Compute spatial wavefunction using Fourier space method
   * @param {number[][]} initialWavefunction - Initial ψ(x,y,0)
   * @param {number} time - Evolution time
   * @returns {number[][]} Evolved wavefunction ψ(x,y,t)
   */
  evolveWavefunction(initialWavefunction, time) {
    // FFT to momentum space
    const momentumWavefunction = this.simpleFFT2D(initialWavefunction);
    
    // Create momentum grid
    const momentumGrid = this.createMomentumGrid();
    
    // Apply propagator in momentum space
    const propagator = this.momentumSpacePropagator(momentumGrid, time);
    
    for (let i = 0; i < momentumWavefunction.length; i++) {
      for (let j = 0; j < momentumWavefunction[0].length; j++) {
        const psi = momentumWavefunction[i][j];
        const prop = propagator[i][j];
        
        // Complex multiplication: ψ' = ψ * K
        momentumWavefunction[i][j] = {
          real: psi.real * prop.real - psi.imag * prop.imag,
          imag: psi.real * prop.imag + psi.imag * prop.real
        };
      }
    }
    
    // Inverse FFT back to position space
    const evolvedWavefunction = this.inverseFFT2D(momentumWavefunction);
    
    return evolvedWavefunction;
  }

  /**
   * Create Gaussian wave packet
   * @param {number} x0 - Center x position
   * @param {number} y0 - Center y position
   * @param {number} sigma - Width of wave packet
   * @param {number} px0 - Initial momentum x
   * @param {number} py0 - Initial momentum y
   * @returns {number[][]} Gaussian wave packet
   */
  createGaussianWavepacket(x0 = 0, y0 = 0, sigma = 5, px0 = 0, py0 = 0) {
    const size = this.latticeSize;
    const wavefunction = new Array(size);
    const dx = 1.0; // Spatial resolution
    
    for (let i = 0; i < size; i++) {
      wavefunction[i] = new Array(size);
      for (let j = 0; j < size; j++) {
        const x = (i - size/2) * dx;
        const y = (j - size/2) * dx;
        
        // Gaussian envelope
        const gaussian = Math.exp(-((x-x0)**2 + (y-y0)**2) / (2*sigma*sigma));
        
        // Plane wave phase
        const phase = (px0 * x + py0 * y) / this.hbar;
        
        wavefunction[i][j] = gaussian * Math.cos(phase);
      }
    }
    
    return wavefunction;
  }

  /**
   * Calculate probability density |ψ|²
   * @param {number[][]} wavefunction - Complex wavefunction
   * @returns {number[][]} Probability density
   */
  probabilityDensity(wavefunction) {
    const size = wavefunction.length;
    const density = new Array(size);
    
    for (let i = 0; i < size; i++) {
      density[i] = new Array(size);
      for (let j = 0; j < size; j++) {
        const psi = wavefunction[i][j];
        if (typeof psi === 'object') {
          density[i][j] = psi.real * psi.real + psi.imag * psi.imag;
        } else {
          density[i][j] = psi * psi;
        }
      }
    }
    
    return density;
  }

  /**
   * Normalize wavefunction
   * @param {number[][]} wavefunction - Input wavefunction
   * @returns {number[][]} Normalized wavefunction
   */
  normalizeWavefunction(wavefunction) {
    const size = wavefunction.length;
    let normSquared = 0;
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const psi = wavefunction[i][j];
        if (typeof psi === 'object') {
          normSquared += psi.real * psi.real + psi.imag * psi.imag;
        } else {
          normSquared += psi * psi;
        }
      }
    }
    
    const norm = Math.sqrt(normSquared);
    const normalized = new Array(size);
    
    for (let i = 0; i < size; i++) {
      normalized[i] = new Array(size);
      for (let j = 0; j < size; j++) {
        const psi = wavefunction[i][j];
        if (typeof psi === 'object') {
          normalized[i][j] = {
            real: psi.real / norm,
            imag: psi.imag / norm
          };
        } else {
          normalized[i][j] = psi / norm;
        }
      }
    }
    
    return normalized;
  }
}
