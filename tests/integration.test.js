/**
 * Integration Tests for Hilbert Theoretical Core
 * Tests the interaction between different modules
 */
import { HilbertCore } from '../src/index.js';
import { strict as assert } from 'node:assert';

// Test suite for Hilbert Core integration
async function runTests() {
  console.log('Running Hilbert Core Integration Tests...\n');

  try {
    await testCoordinateSystem();
    await testTensorOperations();
    await testSchwarzschildMetric();
    await testLatticeBoltzmann();
    await testVisualization();
    
    console.log('\n✅ All integration tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

/**
 * Test coordinate system transformations
 */
async function testCoordinateSystem() {
  console.log('Testing coordinate system...');
  
  const hilbert = new HilbertCore();
  const { coordinates } = hilbert;
  
  // Test spherical to Cartesian
  const r = 10, theta = Math.PI/4, phi = Math.PI/2;
  const cartesian = coordinates.sphericalToCartesian(r, theta, phi);
  
  // Verify conversion back
  const spherical = coordinates.cartesianToSpherical(cartesian[0], cartesian[1], cartesian[2]);
  
  assert(Math.abs(spherical[0] - r) < 1e-10, 'Radius conversion failed');
  assert(Math.abs(spherical[1] - theta) < 1e-10, 'Theta conversion failed');
  assert(Math.abs(spherical[2] - phi) < 1e-10, 'Phi conversion failed');
  
  console.log('  ✓ Coordinate transformations work correctly');
}

/**
 * Test tensor operations
 */
async function testTensorOperations() {
  console.log('Testing tensor operations...');
  
  const hilbert = new HilbertCore();
  const { tensor } = hilbert;
  
  // Test identity matrix
  const identity = tensor.identity4x4();
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const expected = (i === j) ? 1 : 0;
      assert(Math.abs(identity[i * 4 + j] - expected) < 1e-10, 
             `Identity matrix element [${i},${j}] incorrect`);
    }
  }
  
  // Test Minkowski metric
  const minkowski = tensor.minkowskiMetric();
  const expectedSignature = [-1, 1, 1, 1];
  for (let i = 0; i < 4; i++) {
    assert(Math.abs(minkowski[i * 4 + i] - expectedSignature[i]) < 1e-10,
           `Minkowski metric diagonal element [${i}] incorrect`);
  }
  
  // Test matrix multiplication
  const result = tensor.multiply4x4(identity, minkowski);
  for (let i = 0; i < 16; i++) {
    assert(Math.abs(result[i] - minkowski[i]) < 1e-10,
           'Matrix multiplication with identity failed');
  }
  
  console.log('  ✓ Tensor operations work correctly');
}

/**
 * Test Schwarzschild metric calculations
 */
async function testSchwarzschildMetric() {
  console.log('Testing Schwarzschild metric...');
  
  const hilbert = new HilbertCore();
  const { schwarzschild } = hilbert;
  
  const M = 1.989e30; // Solar mass
  const rs = schwarzschild.schwarzschildRadius(M);
  
  // Verify Schwarzschild radius calculation
  const expectedRs = (2 * 6.67430e-11 * M) / (299792458 * 299792458);
  assert(Math.abs(rs - expectedRs) < 1e-10, 'Schwarzschild radius calculation incorrect');
  
  // Test metric tensor at large distance (should approach Minkowski)
  const r = rs * 1000; // Far from black hole
  const metric = schwarzschild.metricTensor(r, M);
  
  // g_tt should approach -1
  assert(Math.abs(metric[0] + 1) < 0.01, 'g_tt does not approach -1 at large r');
  
  // g_rr should approach 1
  assert(Math.abs(metric[5] - 1) < 0.01, 'g_rr does not approach 1 at large r');
  
  // Test geodesic integration
  const initialState = [0, r, Math.PI/2, 0, 1, 0, 0, 0.1];
  const trajectory = schwarzschild.integrateGeodesic(initialState, M, 0.01, 10);
  
  assert(trajectory.length === 11, 'Geodesic integration returned wrong number of points');
  assert(trajectory[0][0] === 0, 'Initial time incorrect');
  assert(trajectory[0][1] === r, 'Initial radius incorrect');
  
  console.log('  ✓ Schwarzschild metric calculations work correctly');
}

/**
 * Test Lattice Boltzmann Method
 */
async function testLatticeBoltzmann() {
  console.log('Testing Lattice Boltzmann Method...');
  
  const hilbert = new HilbertCore();
  const { lbm } = hilbert;
  
  // Test D2Q9 setup
  lbm.model = 'D2Q9';
  lbm.setupLattice();
  
  assert(lbm.e.length === 9, 'D2Q9 should have 9 velocities');
  assert(lbm.w.length === 9, 'D2Q9 should have 9 weights');
  
  // Test equilibrium distribution
  const rho = 1.0;
  const u = [0.1, 0];
  const fEq = lbm.equilibriumDistribution(rho, u);
  
  assert(fEq.length === 9, 'Equilibrium distribution should have 9 components');
  
  // Verify mass conservation
  const calculatedRho = lbm.calculateDensity(fEq);
  assert(Math.abs(calculatedRho - rho) < 1e-10, 'Mass conservation violated');
  
  // Verify momentum conservation
  const calculatedU = lbm.calculateVelocity(fEq, rho);
  assert(Math.abs(calculatedU[0] - u[0]) < 1e-10, 'Momentum conservation in x violated');
  assert(Math.abs(calculatedU[1] - u[1]) < 1e-10, 'Momentum conservation in y violated');
  
  // Test flow field initialization
  const flowField = lbm.initializeFlowField(10, 10, 1, rho, u);
  assert(flowField.f.length === 10, 'Flow field x-dimension incorrect');
  assert(flowField.f[0].length === 10, 'Flow field y-dimension incorrect');
  
  console.log('  ✓ Lattice Boltzmann Method works correctly');
}

/**
 * Test visualization components
 */
async function testVisualization() {
  console.log('Testing visualization components...');
  
  const hilbert = new HilbertCore();
  const { visualization } = hilbert;
  
  // Test initialization (without actually creating DOM elements)
  visualization.initialize();
  
  assert(visualization.scene !== null, 'Scene not created');
  assert(visualization.camera !== null, 'Camera not created');
  assert(visualization.renderer !== null, 'Renderer not created');
  
  // Test spacetime visualization setup
  const mass = 1e30;
  visualization.visualizeSpacetime(mass);
  
  assert(visualization.spacetimeGeometry !== null, 'Spacetime geometry not created');
  
  // Test geodesic visualization
  const trajectory = [
    [0, 10, 0, 0],
    [1, 9.9, 0.1, 0],
    [2, 9.8, 0.2, 0]
  ];
  visualization.visualizeGeodesics([trajectory]);
  
  // Test fluid visualization
  const densityField = Array(10).fill().map(() => 
    Array(10).fill().map(() => 1.0)
  );
  const velocityField = Array(10).fill().map(() => 
    Array(10).fill().map(() => [0.1, 0, 0])
  );
  
  visualization.visualizeFluid(densityField, velocityField);
  assert(visualization.fluidMesh !== null, 'Fluid mesh not created');
  
  // Clean up
  visualization.dispose();
  
  console.log('  ✓ Visualization components work correctly');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };
