/**
 * Quantum Path Integral Tests
 * Tests Monte Carlo sampling and Fourier space calculations
 */
import { HilbertCore } from '../src/index.js';
import { strict as assert } from 'node:assert';

// Test suite for quantum functionality
async function runQuantumTests() {
  console.log('Running Quantum Path Integral Tests...\n');

  try {
    await testMonteCarloPaths();
    await testActionCalculations();
    await testFourierPropagator();
    await testWavefunctionEvolution();
    await testFFTImplementation();
    
    console.log('\n✅ All quantum tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

/**
 * Test Monte Carlo path generation
 */
async function testMonteCarloPaths() {
  console.log('Testing Monte Carlo path generation...');
  
  const hilbert = new HilbertCore();
  const { pathIntegral } = hilbert;
  
  const start = [0, 0, 0];
  const end = [10, 0, 1];
  const numPaths = 100;
  
  const paths = pathIntegral.generateMonteCarloPaths(start, end, numPaths);
  
  assert(paths.length === numPaths, `Expected ${numPaths} paths, got ${paths.length}`);
  
  // Check that all paths start and end correctly
  paths.forEach((path, index) => {
    const [startX, startY, startT] = path[0];
    const [endX, endY, endT] = path[path.length - 1];
    
    assert(Math.abs(startX - start[0]) < 1e-10, `Path ${index} start x incorrect`);
    assert(Math.abs(startY - start[1]) < 1e-10, `Path ${index} start y incorrect`);
    assert(Math.abs(startT - start[2]) < 1e-10, `Path ${index} start t incorrect`);
    
    assert(Math.abs(endX - end[0]) < 1e-10, `Path ${index} end x incorrect`);
    assert(Math.abs(endY - end[1]) < 1e-10, `Path ${index} end y incorrect`);
    assert(Math.abs(endT - end[2]) < 1e-10, `Path ${index} end t incorrect`);
  });
  
  // Check that paths have reasonable length
  paths.forEach(path => {
    assert(path.length > 10, 'Path too short');
    assert(path.length < 1000, 'Path too long');
  });
  
  console.log('  ✓ Monte Carlo path generation works correctly');
}

/**
 * Test action calculations
 */
async function testActionCalculations() {
  console.log('Testing action calculations...');
  
  const hilbert = new HilbertCore();
  const { pathIntegral } = hilbert;
  
  // Simple straight-line path
  const straightPath = [
    [0, 0, 0],
    [1, 0, 0.1],
    [2, 0, 0.2],
    [3, 0, 0.3]
  ];
  
  const action = pathIntegral.calculateAction(straightPath);
  assert(typeof action === 'number', 'Action should be a number');
  assert(!isNaN(action), 'Action should not be NaN');
  assert(isFinite(action), 'Action should be finite');
  
  // Test with custom potential
  const harmonicPotential = (x, y, t) => 0.5 * (x*x + y*y);
  const actionWithPotential = pathIntegral.calculateAction(straightPath, harmonicPotential);
  
  assert(actionWithPotential > action, 'Potential should increase action');
  
  // Test path weight calculation
  const weight = pathIntegral.pathWeight(action);
  assert(typeof weight === 'object', 'Weight should be an object');
  assert(typeof weight.real === 'number', 'Weight real part should be number');
  assert(typeof weight.imag === 'number', 'Weight imaginary part should be number');
  assert(Math.abs(weight.real * weight.real + weight.imag * weight.imag - 1) < 1e-10, 
         'Weight should have unit magnitude');
  
  console.log('  ✓ Action calculations work correctly');
}

/**
 * Test Fourier space propagator
 */
async function testFourierPropagator() {
  console.log('Testing Fourier space propagator...');
  
  const hilbert = new HilbertCore();
  const { pathIntegral } = hilbert;
  
  // Create momentum grid
  const momentumGrid = pathIntegral.createMomentumGrid(16, 1e-20);
  assert(momentumGrid.length === 16, 'Momentum grid size incorrect');
  assert(momentumGrid[0].length === 16, 'Momentum grid dimensions incorrect');
  
  // Check momentum values
  const [px, py] = momentumGrid[0][0];
  assert(px < 0, 'Negative momentum should exist');
  assert(py < 0, 'Negative momentum should exist');
  
  const [pxMax, pyMax] = momentumGrid[15][15];
  assert(pxMax > 0, 'Positive momentum should exist');
  assert(pyMax > 0, 'Positive momentum should exist');
  
  // Test propagator calculation
  const time = 0.1;
  const propagator = pathIntegral.momentumSpacePropagator(momentumGrid, time);
  
  assert(propagator.length === 16, 'Propagator grid size incorrect');
  assert(propagator[0].length === 16, 'Propagator grid dimensions incorrect');
  
  // Check propagator properties
  propagator.forEach(row => {
    row.forEach(value => {
      assert(typeof value === 'object', 'Propagator value should be object');
      assert(typeof value.real === 'number', 'Propagator real part should be number');
      assert(typeof value.imag === 'number', 'Propagator imaginary part should be number');
      assert(Math.abs(value.real * value.real + value.imag * value.imag - 1) < 1e-10,
             'Propagator should have unit magnitude');
    });
  });
  
  console.log('  ✓ Fourier space propagator works correctly');
}

/**
 * Test wavefunction evolution
 */
async function testWavefunctionEvolution() {
  console.log('Testing wavefunction evolution...');
  
  const hilbert = new HilbertCore();
  const { pathIntegral } = hilbert;
  
  // Create initial wavefunction
  const initialWavefunction = pathIntegral.createGaussianWavepacket(0, 0, 5, 0, 0);
  
  assert(initialWavefunction.length === pathIntegral.latticeSize, 'Wavefunction size incorrect');
  assert(initialWavefunction[0].length === pathIntegral.latticeSize, 'Wavefunction dimensions incorrect');
  
  // Check normalization
  let totalProbability = 0;
  initialWavefunction.forEach(row => {
    row.forEach(value => {
      totalProbability += value * value;
    });
  });
  
  assert(totalProbability > 0, 'Wavefunction should have non-zero probability');
  
  // Evolve wavefunction
  const evolvedWavefunction = pathIntegral.evolveWavefunction(initialWavefunction, 0.1);
  
  assert(evolvedWavefunction.length === pathIntegral.latticeSize, 'Evolved wavefunction size incorrect');
  assert(evolvedWavefunction[0].length === pathIntegral.latticeSize, 'Evolved wavefunction dimensions incorrect');
  
  // Check probability density
  const density = pathIntegral.probabilityDensity(evolvedWavefunction);
  assert(density.length === pathIntegral.latticeSize, 'Density grid size incorrect');
  assert(density[0].length === pathIntegral.latticeSize, 'Density grid dimensions incorrect');
  
  // Check that density is non-negative
  density.forEach(row => {
    row.forEach(value => {
      assert(value >= 0, 'Probability density should be non-negative');
    });
  });
  
  console.log('  ✓ Wavefunction evolution works correctly');
}

/**
 * Test FFT implementation
 */
async function testFFTImplementation() {
  console.log('Testing FFT implementation...');
  
  const hilbert = new HilbertCore();
  const { pathIntegral } = hilbert;
  
  // Create simple test signal
  const size = 16;
  const testSignal = Array(size).fill().map((_, i) => 
    Array(size).fill().map((_, j) => Math.cos(2 * Math.PI * i / size))
  );
  
  // Forward FFT
  const fftResult = pathIntegral.simpleFFT2D(testSignal);
  assert(fftResult.length === size, 'FFT result size incorrect');
  assert(fftResult[0].length === size, 'FFT result dimensions incorrect');
  
  // Check FFT properties
  fftResult.forEach(row => {
    row.forEach(value => {
      assert(typeof value === 'object', 'FFT value should be object');
      assert(typeof value.real === 'number', 'FFT real part should be number');
      assert(typeof value.imag === 'number', 'FFT imaginary part should be number');
    });
  });
  
  // Inverse FFT
  const inverseResult = pathIntegral.inverseFFT2D(fftResult);
  assert(inverseResult.length === size, 'Inverse FFT result size incorrect');
  assert(inverseResult[0].length === size, 'Inverse FFT result dimensions incorrect');
  
  // Check that inverse FFT recovers original signal (approximately)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const error = Math.abs(inverseResult[i][j] - testSignal[i][j]);
      assert(error < 1e-10, `Inverse FFT error too large at [${i},${j}]: ${error}`);
    }
  }
  
  console.log('  ✓ FFT implementation works correctly');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runQuantumTests();
}

export { runQuantumTests };
