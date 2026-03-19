/**
 * Quantum Path Integral Simulation Example
 * Demonstrates Monte Carlo sampling and Fourier space rendering
 */
import { HilbertCore } from '../src/index.js';

/**
 * Run quantum path integral demonstration
 */
async function runQuantumSimulation() {
  console.log('⚛️ Starting Quantum Path Integral Simulation...\n');

  // Initialize the framework
  const hilbert = new HilbertCore();
  hilbert.initialize();

  // Part 1: Monte Carlo Path Sampling
  console.log('🎲 Part 1: Monte Carlo Path Sampling');
  
  const start = [-10, 0, 0]; // Starting point [x, y, t]
  const end = [10, 0, 1];     // Ending point [x, y, t]
  
  console.log(`  Start: [${start.join(', ')}]`);
  console.log(`  End: [${end.join(', ')}]`);
  
  // Generate Monte Carlo paths
  const paths = hilbert.pathIntegral.generateMonteCarloPaths(start, end, 500);
  console.log(`  Generated ${paths.length} Monte Carlo paths`);
  
  // Calculate actions and weights
  const pathData = paths.map((path, index) => {
    const action = hilbert.pathIntegral.calculateAction(path);
    const weight = hilbert.pathIntegral.pathWeight(action);
    return { path, action, weight };
  });
  
  // Sort by action (most probable paths first)
  pathData.sort((a, b) => Math.abs(a.action) - Math.abs(b.action));
  
  console.log(`  Most probable path action: ${pathData[0].action.toFixed(3)}`);
  console.log(`  Average action: ${(pathData.reduce((sum, p) => sum + Math.abs(p.action), 0) / pathData.length).toFixed(3)}`);

  // Part 2: Fourier Space Wavefunction Evolution
  console.log('\n🌊 Part 2: Fourier Space Wavefunction Evolution');
  
  // Create initial Gaussian wave packet
  const initialWavefunction = hilbert.pathIntegral.createGaussianWavepacket(
    0,    // x0 (center)
    0,    // y0 (center)
    5,    // sigma (width)
    1e-22, // px0 (initial momentum x)
    0      // py0 (initial momentum y)
  );
  
  console.log(`  Initial wavefunction: ${hilbert.pathIntegral.latticeSize}×${hilbert.pathIntegral.latticeSize} grid`);
  
  // Evolve wavefunction using Fourier space method
  const evolutionTimes = [0, 0.1, 0.5, 1.0];
  const evolvedWavefunctions = [];
  
  evolutionTimes.forEach(time => {
    console.log(`  Evolving to t = ${time}...`);
    const evolved = hilbert.pathIntegral.evolveWavefunction(initialWavefunction, time);
    evolvedWavefunctions.push(evolved);
    
    // Calculate probability density
    const density = hilbert.pathIntegral.probabilityDensity(evolved);
    const totalProbability = density.flat().reduce((sum, val) => sum + val, 0);
    console.log(`    Total probability: ${totalProbability.toFixed(6)} (should be ~1.0)`);
  });

  // Part 3: Visualization Setup
  console.log('\n🎨 Part 3: Quantum Visualization');
  
  // Setup visualization
  hilbert.visualization.initialize();
  
  // Visualize Monte Carlo paths
  console.log('  Rendering Monte Carlo paths...');
  hilbert.visualization.visualizeQuantumPaths(paths.slice(0, 50)); // Show first 50 paths
  
  // Visualize wavefunction evolution
  console.log('  Rendering wavefunction evolution...');
  evolvedWavefunctions.forEach((wavefunction, index) => {
    const density = hilbert.pathIntegral.probabilityDensity(wavefunction);
    hilbert.visualization.visualizeWavefunction(wavefunction, 0.5);
    
    // Add probability density particles
    if (index === evolutionTimes.length - 1) { // Only for final state
      hilbert.visualization.visualizeProbabilityDensity(density, 3000);
    }
  });
  
  // Start rendering
  hilbert.visualization.start();
  
  console.log('\n✨ Quantum simulation complete!');
  console.log('📊 Summary:');
  console.log(`  - ${paths.length} Monte Carlo paths sampled`);
  console.log(`  - ${evolutionTimes.length} time evolution steps`);
  console.log(`  - Real-time visualization active`);
  console.log('\n💡 Physics demonstrated:');
  console.log('  - Sum-over-histories path integral formulation');
  console.log('  - Quantum superposition via Monte Carlo sampling');
  console.log('  - Wavefunction evolution in momentum space');
  console.log('  - Probability density visualization');
  console.log('  - Quantum interference patterns');
  
  // Keep the simulation running
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('\n🛑 Stopping quantum simulation after 30 seconds...');
      hilbert.visualization.dispose();
      resolve();
    }, 30000);
  });
}

/**
 * Demonstrate quantum tunneling effect
 */
async function demonstrateQuantumTunneling() {
  console.log('\n🔮 Quantum Tunneling Demonstration');
  
  const hilbert = new HilbertCore();
  hilbert.initialize();
  
  // Create wave packet approaching potential barrier
  const wavefunction = hilbert.pathIntegral.createGaussianWavepacket(
    -15,  // Start from left
    0,    // Center y
    3,    // Narrow packet
    5e-22, // Momentum toward barrier
    0
  );
  
  console.log('  Wave packet approaching potential barrier...');
  
  // Evolve through barrier
  const timeSteps = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
  const tunnelingResults = [];
  
  timeSteps.forEach(time => {
    const evolved = hilbert.pathIntegral.evolveWavefunction(wavefunction, time);
    const density = hilbert.pathIntegral.probabilityDensity(evolved);
    
    // Calculate transmission probability (particles on right side)
    const gridSize = density.length;
    let transmittedProbability = 0;
    let reflectedProbability = 0;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = (i - gridSize/2);
        if (x > 0) {
          transmittedProbability += density[i][j];
        } else {
          reflectedProbability += density[i][j];
        }
      }
    }
    
    tunnelingResults.push({
      time,
      transmitted: transmittedProbability,
      reflected: reflectedProbability
    });
    
    console.log(`    t=${time}: Transmitted=${transmittedProbability.toFixed(4)}, Reflected=${reflectedProbability.toFixed(4)}`);
  });
  
  return tunnelingResults;
}

/**
 * Performance benchmark for quantum calculations
 */
async function quantumBenchmark() {
  console.log('\n⚡ Quantum Performance Benchmark');
  
  const hilbert = new HilbertCore();
  hilbert.initialize();
  
  // Benchmark Monte Carlo path generation
  console.log('  Benchmarking Monte Carlo path generation...');
  const start = performance.now();
  
  for (let i = 0; i < 10; i++) {
    hilbert.pathIntegral.generateMonteCarloPaths([-10, 0, 0], [10, 0, 1], 100);
  }
  
  const pathTime = performance.now() - start;
  console.log(`    10×100 paths: ${pathTime.toFixed(2)} ms`);
  
  // Benchmark FFT evolution
  console.log('  Benchmarking FFT wavefunction evolution...');
  const fftStart = performance.now();
  
  const wavefunction = hilbert.pathIntegral.createGaussianWavepacket();
  for (let i = 0; i < 5; i++) {
    hilbert.pathIntegral.evolveWavefunction(wavefunction, 0.1);
  }
  
  const fftTime = performance.now() - fftStart;
  console.log(`    5×FFT evolutions (64×64): ${fftTime.toFixed(2)} ms`);
  
  console.log('✅ Quantum benchmark complete!');
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runQuantumSimulation()
    .then(() => demonstrateQuantumTunneling())
    .then(() => quantumBenchmark())
    .then(() => {
      console.log('\n🎉 All quantum demonstrations completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error running quantum simulation:', error);
      process.exit(1);
    });
}

export { runQuantumSimulation, demonstrateQuantumTunneling, quantumBenchmark };
