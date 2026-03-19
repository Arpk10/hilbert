/**
 * Lattice Boltzmann Method Implementation
 * D2Q9 and D3Q19 models for fluid dynamics simulation
 */
export class LatticeBoltzmann {
  constructor() {
    this.precision = Float64Array;
    this.model = 'D3Q19'; // Default to 3D model
    this.tau = 0.6; // Relaxation time
    this.cs2 = 1/3; // Speed of sound squared (lattice units)
  }

  /**
   * Initialize Lattice Boltzmann Method
   */
  initialize() {
    console.log(`Lattice Boltzmann Method initialized with ${this.model} model`);
    this.setupLattice();
  }

  /**
   * Setup lattice velocities and weights
   */
  setupLattice() {
    if (this.model === 'D2Q9') {
      this.setupD2Q9();
    } else if (this.model === 'D3Q19') {
      this.setupD3Q19();
    }
  }

  /**
   * Setup D2Q9 lattice (2D, 9 velocities)
   */
  setupD2Q9() {
    // Velocity vectors for D2Q9
    this.e = [
      [0, 0],   // 0: rest
      [1, 0],   // 1: east
      [0, 1],   // 2: north
      [-1, 0],  // 3: west
      [0, -1],  // 4: south
      [1, 1],   // 5: northeast
      [-1, 1],  // 6: northwest
      [-1, -1], // 7: southwest
      [1, -1]   // 8: southeast
    ];

    // Weights for D2Q9
    this.w = [
      4/9,      // 0: rest
      1/9,      // 1: east
      1/9,      // 2: north
      1/9,      // 3: west
      1/9,      // 4: south
      1/36,     // 5: northeast
      1/36,     // 6: northwest
      1/36,     // 7: southwest
      1/36      // 8: southeast
    ];
  }

  /**
   * Setup D3Q19 lattice (3D, 19 velocities)
   */
  setupD3Q19() {
    // Velocity vectors for D3Q19
    this.e = [
      [0, 0, 0],    // 0: rest
      [1, 0, 0],    // 1: east
      [-1, 0, 0],   // 2: west
      [0, 1, 0],    // 3: north
      [0, -1, 0],   // 4: south
      [0, 0, 1],    // 5: up
      [0, 0, -1],   // 6: down
      [1, 1, 0],    // 7: northeast
      [-1, 1, 0],   // 8: northwest
      [1, -1, 0],   // 9: southeast
      [-1, -1, 0],  // 10: southwest
      [1, 0, 1],    // 11: east-up
      [-1, 0, 1],   // 12: west-up
      [1, 0, -1],   // 13: east-down
      [-1, 0, -1],  // 14: west-down
      [0, 1, 1],    // 15: north-up
      [0, -1, 1],   // 16: south-up
      [0, 1, -1],   // 17: north-down
      [0, -1, -1]   // 18: south-down
    ];

    // Weights for D3Q19
    this.w = [
      1/3,          // 0: rest
      1/18,         // 1-6: face directions
      1/18,
      1/18,
      1/18,
      1/18,
      1/18,
      1/36,         // 7-18: edge directions
      1/36,
      1/36,
      1/36,
      1/36,
      1/36,
      1/36,
      1/36,
      1/36,
      1/36,
      1/36,
      1/36
    ];
  }

  /**
   * Calculate equilibrium distribution function
   * @param {number} rho - Density
   * @param {number[]} u - Velocity vector
   * @returns {number[]} Equilibrium distribution f_i^eq
   */
  equilibriumDistribution(rho, u) {
    const fEq = new this.precision(this.e.length);
    const uSqr = this.dotProduct(u, u);

    for (let i = 0; i < this.e.length; i++) {
      const eu = this.dotProduct(this.e[i], u);
      const euSqr = eu * eu;
      
      // Maxwell-Boltzmann equilibrium
      fEq[i] = rho * this.w[i] * (1 + eu/this.cs2 + euSqr/(2*this.cs2*this.cs2) - uSqr/(2*this.cs2));
    }

    return fEq;
  }

  /**
   * Calculate macroscopic density from distribution functions
   * @param {number[]} f - Distribution functions
   * @returns {number} Density ρ
   */
  calculateDensity(f) {
    let rho = 0;
    for (let i = 0; i < f.length; i++) {
      rho += f[i];
    }
    return rho;
  }

  /**
   * Calculate macroscopic velocity from distribution functions
   * @param {number[]} f - Distribution functions
   * @param {number} rho - Density
   * @returns {number[]} Velocity vector u
   */
  calculateVelocity(f, rho) {
    const dim = this.e[0].length;
    const u = new this.precision(dim);
    
    for (let i = 0; i < this.e.length; i++) {
      for (let d = 0; d < dim; d++) {
        u[d] += f[i] * this.e[i][d];
      }
    }
    
    for (let d = 0; d < dim; d++) {
      u[d] /= rho;
    }
    
    return u;
  }

  /**
   * Perform one LBM time step (BGK collision + streaming)
   * @param {number[][]} f - Distribution functions for all lattice points
   * @param {number[][]} boundary - Boundary conditions (0: fluid, 1: solid)
   * @returns {number[][]} Updated distribution functions
   */
  timeStep(f, boundary) {
    const nx = f.length;
    const ny = f[0].length;
    const nz = this.model === 'D3Q19' ? f[0][0].length : 1;
    const ni = this.e.length;

    const fNew = this.createDistributionArray(nx, ny, nz, ni);

    // Collision step
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        for (let z = 0; z < nz; z++) {
          if (boundary[x][y][z] === 0) { // Fluid node
            const fNode = this.getDistributionAtNode(f, x, y, z);
            const rho = this.calculateDensity(fNode);
            const u = this.calculateVelocity(fNode, rho);
            const fEq = this.equilibriumDistribution(rho, u);

            // BGK collision
            for (let i = 0; i < ni; i++) {
              const fCollision = fNode[i] - (1/this.tau) * (fNode[i] - fEq[i]);
              this.setDistributionAtNode(fNew, x, y, z, i, fCollision);
            }
          }
        }
      }
    }

    // Streaming step
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        for (let z = 0; z < nz; z++) {
          for (let i = 0; i < ni; i++) {
            const xNew = x + this.e[i][0];
            const yNew = y + this.e[i][1];
            const zNew = z + (this.model === 'D3Q19' ? this.e[i][2] : 0);

            // Check boundaries
            if (xNew >= 0 && xNew < nx && yNew >= 0 && yNew < ny && zNew >= 0 && zNew < nz) {
              if (boundary[xNew][yNew][zNew] === 0) { // Fluid node
                const fValue = this.getDistributionAtNode(fNew, x, y, z, i);
                this.setDistributionAtNode(fNew, xNew, yNew, zNew, i, fValue);
              } else { // Solid boundary - bounce-back
                const fValue = this.getDistributionAtNode(fNew, x, y, z, i);
                const iOpposite = this.getOppositeDirection(i);
                this.setDistributionAtNode(fNew, x, y, z, iOpposite, fValue);
              }
            }
          }
        }
      }
    }

    return fNew;
  }

  /**
   * Get opposite direction for bounce-back boundary condition
   * @param {number} i - Direction index
   * @returns {number} Opposite direction index
   */
  getOppositeDirection(i) {
    if (this.model === 'D2Q9') {
      const opposite = [0, 3, 4, 1, 2, 7, 8, 5, 6];
      return opposite[i];
    } else if (this.model === 'D3Q19') {
      const opposite = [0, 2, 1, 4, 3, 6, 5, 10, 9, 8, 7, 14, 13, 12, 11, 18, 17, 16, 15];
      return opposite[i];
    }
    return i;
  }

  /**
   * Create distribution array
   */
  createDistributionArray(nx, ny, nz, ni) {
    if (this.model === 'D2Q9') {
      return Array(nx).fill().map(() => 
        Array(ny).fill().map(() => 
          new this.precision(ni)
        )
      );
    } else {
      return Array(nx).fill().map(() => 
        Array(ny).fill().map(() => 
          Array(nz).fill().map(() => 
            new this.precision(ni)
          )
        )
      );
    }
  }

  /**
   * Get distribution at specific node
   */
  getDistributionAtNode(f, x, y, z = 0, i = null) {
    if (i !== null) {
      return this.model === 'D2Q9' ? f[x][y][i] : f[x][y][z][i];
    }
    return this.model === 'D2Q9' ? f[x][y] : f[x][y][z];
  }

  /**
   * Set distribution at specific node
   */
  setDistributionAtNode(f, x, y, z = 0, i, value) {
    if (this.model === 'D2Q9') {
      f[x][y][i] = value;
    } else {
      f[x][y][z][i] = value;
    }
  }

  /**
   * Dot product for vectors
   */
  dotProduct(a, b) {
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result += a[i] * b[i];
    }
    return result;
  }

  /**
   * Initialize flow field with given parameters
   * @param {number} nx - Grid size in x direction
   * @param {number} ny - Grid size in y direction
   * @param {number} nz - Grid size in z direction (for 3D)
   * @param {number} rho0 - Initial density
   * @param {number[]} u0 - Initial velocity
   * @returns {Object} Initialized flow field
   */
  initializeFlowField(nx, ny, nz = 1, rho0 = 1.0, u0 = [0, 0, 0]) {
    const ni = this.e.length;
    const f = this.createDistributionArray(nx, ny, nz, ni);
    const boundary = this.createBoundaryArray(nx, ny, nz);

    // Initialize distribution functions with equilibrium
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        for (let z = 0; z < nz; z++) {
          const fEq = this.equilibriumDistribution(rho0, u0);
          for (let i = 0; i < ni; i++) {
            this.setDistributionAtNode(f, x, y, z, i, fEq[i]);
          }
        }
      }
    }

    return { f, boundary };
  }

  /**
   * Create boundary array
   */
  createBoundaryArray(nx, ny, nz) {
    if (this.model === 'D2Q9') {
      return Array(nx).fill().map(() => 
        Array(ny).fill().map(() => 0)
      );
    } else {
      return Array(nx).fill().map(() => 
        Array(ny).fill().map(() => 
          Array(nz).fill().map(() => 0)
        )
      );
    }
  }
}
