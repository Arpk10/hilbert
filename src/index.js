import { CoordinateSystem } from './math/coordinates.js';
import { Tensor } from './math/tensor.js';
import { SchwarzschildMetric } from './relativity/schwarzschild.js';
import { LatticeBoltzmann } from './fluid/lattice-boltzmann.js';
import { Visualization } from './visualization/renderer.js';
import { PathIntegral } from './quantum/path-integral.js';
import { BlackHoleEngine } from './modules/cosmos/BlackHoleEngine.js';
import { StringEngine } from './modules/strings/StringEngine.js';

/**
 * Hilbert Theoretical Core
 * Main entry point for the physics simulation framework
 */
export class HilbertCore {
  constructor() {
    this.coordinates = new CoordinateSystem();
    this.tensor = new Tensor();
    this.schwarzschild = new SchwarzschildMetric();
    this.lbm = new LatticeBoltzmann();
    this.visualization = new Visualization();
    this.pathIntegral = new PathIntegral();
    this.blackHoleEngine = new BlackHoleEngine();
    this.stringEngine = new StringEngine();
  }

  /**
   * Initialize the simulation framework
   */
  initialize() {
    console.log('Initializing Hilbert Theoretical Core...');
    this.coordinates.initialize();
    this.tensor.initialize();
    this.schwarzschild.initialize();
    this.lbm.initialize();
    this.visualization.initialize();
    this.pathIntegral.initialize();
    this.blackHoleEngine.initialize();
    this.stringEngine.initialize();
    console.log('Hilbert Core initialized successfully.');
  }

  /**
   * Run a complete simulation cycle
   */
  simulate() {
    console.log('Running simulation cycle...');
    // Implementation will be added as modules are developed
  }
}

// Auto-initialize when imported
const hilbert = new HilbertCore();
hilbert.initialize();

export default hilbert;
