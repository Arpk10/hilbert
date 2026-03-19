/**
 * Basic Hilbert Core Simulation Example
 * Demonstrates Schwarzschild geodesic and LBM fluid simulation
 */
import { HilbertCore } from '../src/index.js';

/**
 * Run a complete simulation demonstrating both GR and fluid dynamics
 */
async function runBasicSimulation() {
  console.log('🚀 Starting Hilbert Core Basic Simulation...\n');

  // Initialize the framework
  const hilbert = new HilbertCore();
  hilbert.initialize();

  // Part 1: General Relativity - Schwarzschild Geodesics
  console.log('📡 Part 1: Simulating particle geodesics around a black hole');
  
  const mass = 1.989e30; // Solar mass
  const schwarzschildRadius = hilbert.schwarzschild.schwarzschildRadius(mass);
  console.log(`  Black hole mass: ${(mass / 1.989e30).toFixed(2)} solar masses`);
  console.log(`  Schwarzschild radius: ${(schwarzschildRadius / 1000).toFixed(2)} km`);

  // Create multiple initial conditions for different orbits
  const initialConditions = [
    // [t, r, θ, φ, dt/dτ, dr/dτ, dθ/dτ, dφ/dτ]
    [0, schwarzschildRadius * 10, Math.PI/2, 0, 1, 0, 0, 0.15], // Circular orbit
    [0, schwarzschildRadius * 15, Math.PI/2, 0, 1, -0.1, 0, 0.1], // Elliptical orbit
    [0, schwarzschildRadius * 20, Math.PI/3, 0, 1, -0.2, 0.05, 0.05] // Inclined orbit
  ];

  const trajectories = [];
  const colors = [0xff0000, 0x00ff00, 0x0000ff]; // Red, Green, Blue

  initialConditions.forEach((initialState, index) => {
    console.log(`  Computing trajectory ${index + 1}...`);
    const trajectory = hilbert.schwarzschild.integrateGeodesic(
      initialState, 
      mass, 
      0.01, // step size
      2000  // steps
    );
    trajectories.push(trajectory);
    console.log(`    Trajectory ${index + 1}: ${trajectory.length} points`);
  });

  // Part 2: Fluid Dynamics - Lattice Boltzmann
  console.log('\n💧 Part 2: Simulating fluid flow with Lattice Boltzmann Method');
  
  const nx = 80, ny = 40, nz = 1;
  console.log(`  Grid size: ${nx} × ${ny} × ${nz}`);
  
  // Initialize flow field with a uniform flow
  const flowField = hilbert.lbm.initializeFlowField(
    nx, ny, nz, 
    1.0,           // density
    [0.1, 0, 0]    // initial velocity
  );

  // Add an obstacle (cylinder)
  const obstacle = flowField.boundary;
  const centerX = Math.floor(nx * 0.2);
  const centerY = Math.floor(ny / 2);
  const radius = Math.floor(ny * 0.1);

  for (let x = 0; x < nx; x++) {
    for (let y = 0; y < ny; y++) {
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (dist < radius) {
        obstacle[x][y] = 1; // Solid boundary
      }
    }
  }

  console.log('  Running LBM simulation...');
  
  // Run simulation
  const simulationSteps = 1000;
  for (let step = 0; step < simulationSteps; step++) {
    flowField.f = hilbert.lbm.timeStep(flowField.f, obstacle);
    
    if (step % 100 === 0) {
      console.log(`    Step ${step}/${simulationSteps}`);
    }
  }

  // Extract macroscopic quantities for visualization
  const densityField = Array(nx).fill().map(() => Array(ny).fill(0));
  const velocityField = Array(nx).fill().map(() => Array(ny).fill([0, 0]));

  for (let x = 0; x < nx; x++) {
    for (let y = 0; y < ny; y++) {
      const fNode = hilbert.lbm.getDistributionAtNode(flowField.f, x, y);
      densityField[x][y] = hilbert.lbm.calculateDensity(fNode);
      velocityField[x][y] = hilbert.lbm.calculateVelocity(fNode, densityField[x][y]);
    }
  }

  // Part 3: Visualization
  console.log('\n🎨 Part 3: Setting up visualization');
  
  // Setup visualization
  hilbert.visualization.initialize();
  
  // Visualize spacetime with black hole
  hilbert.visualization.visualizeSpacetime(mass);
  
  // Add geodesic trajectories
  hilbert.visualization.visualizeGeodesics(trajectories);
  
  // Add fluid visualization
  hilbert.visualization.visualizeFluid(densityField, velocityField);
  
  // Start rendering
  hilbert.visualization.start();
  
  console.log('\n✨ Simulation complete! Visualization is now running.');
  console.log('📊 Summary:');
  console.log(`  - ${trajectories.length} geodesic trajectories computed`);
  console.log(`  - ${simulationSteps} LBM time steps completed`);
  console.log(`  - Real-time visualization active`);
  console.log('\n💡 Tips:');
  console.log('  - Move your mouse to rotate the camera view');
  console.log('  - The grid represents curved spacetime');
  console.log('  - Colored lines show particle geodesics');
  console.log('  - Colored points represent fluid density and velocity');
  
  // Keep the simulation running
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('\n🛑 Stopping simulation after 30 seconds...');
      hilbert.visualization.dispose();
      resolve();
    }, 30000);
  });
}

/**
 * Run a performance benchmark
 */
async function runBenchmark() {
  console.log('\n⚡ Running performance benchmark...');
  
  const hilbert = new HilbertCore();
  hilbert.initialize();
  
  // Benchmark geodesic integration
  console.log('  Benchmarking geodesic integration...');
  const start = performance.now();
  
  const mass = 1.989e30;
  const initialState = [0, 10, Math.PI/2, 0, 1, 0, 0, 0.1];
  
  for (let i = 0; i < 100; i++) {
    hilbert.schwarzschild.integrateGeodesic(initialState, mass, 0.01, 100);
  }
  
  const geodesicTime = performance.now() - start;
  console.log(`    100 geodesic integrations: ${geodesicTime.toFixed(2)} ms`);
  
  // Benchmark LBM
  console.log('  Benchmarking LBM simulation...');
  const lbmStart = performance.now();
  
  const nx = 50, ny = 25;
  const flowField = hilbert.lbm.initializeFlowField(nx, ny, 1, 1.0, [0.1, 0, 0]);
  
  for (let step = 0; step < 100; step++) {
    flowField.f = hilbert.lbm.timeStep(flowField.f, flowField.boundary);
  }
  
  const lbmTime = performance.now() - lbmStart;
  console.log(`    100 LBM steps (50×25 grid): ${lbmTime.toFixed(2)} ms`);
  
  console.log('✅ Benchmark complete!');
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runBasicSimulation()
    .then(() => runBenchmark())
    .then(() => {
      console.log('\n🎉 All examples completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error running simulation:', error);
      process.exit(1);
    });
}

export { runBasicSimulation, runBenchmark };
