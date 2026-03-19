/**
 * Black Hole Physics Simulation Example
 * Demonstrates Hawking Radiation and Event Horizon Physics
 * Based on Black Hole Lectures 2016, Section 4
 */
import { HilbertCore } from '../src/index.js';

/**
 * Run comprehensive black hole physics demonstration
 */
async function runBlackHoleSimulation() {
  console.log('⚫ Starting Black Hole Physics Simulation...\n');

  // Initialize the framework
  const hilbert = new HilbertCore();
  hilbert.initialize();

  // Part 1: Schwarzschild Metric Analysis
  console.log('📐 Part 1: Schwarzschild Metric Analysis');
  
  const blackHoleEngine = hilbert.blackHoleEngine;
  
  // Test different black hole masses
  const masses = [
    { mass: 1.989e30, name: 'Solar Mass' },
    { mass: 7.342e22, name: 'Lunar Mass' },
    { mass: 5.972e24, name: 'Earth Mass' },
    { mass: 1e10, name: 'Primordial Black Hole' }
  ];

  masses.forEach(({ mass, name }) => {
    blackHoleEngine.setMass(mass);
    const state = blackHoleEngine.getBlackHoleState();
    
    console.log(`\n  ${name}:`);
    console.log(`    Mass: ${(mass / 1.989e30).toFixed(6)} M☉`);
    console.log(`    Schwarzschild Radius: ${(state.schwarzschildRadius / 1000).toFixed(3)} km`);
    console.log(`    Hawking Temperature: ${state.hawkingTemperature.toExponential(2)} K`);
    console.log(`    Evaporation Time: ${state.evaporationTime.toExponential(2)} s`);
    console.log(`    Surface Gravity: ${state.surfaceGravity.toFixed(2)} m/s²`);
    console.log(`    Emission Rate: ${state.particleEmissionRate.toExponential(2)} particles/s`);
  });

  // Part 2: Hawking Radiation Demonstration
  console.log('\n🔥 Part 2: Hawking Radiation Demonstration');
  
  // Use solar mass black hole for detailed analysis
  blackHoleEngine.setMass(1.989e30);
  const solarMassState = blackHoleEngine.getBlackHoleState();
  
  console.log(`  Solar Mass Black Hole Analysis:`);
  console.log(`    Temperature: ${solarMassState.hawkingTemperature.toExponential(2)} K`);
  console.log(`    Power Output: ${solarMassState.hawkingPower.toExponential(2)} W`);
  console.log(`    This is ${(solarMassState.hawkingPower / 3.828e26).toExponential(2)} times the Sun's luminosity`);
  
  // Part 3: Gravitational Redshift Effects
  console.log('\n🌈 Part 3: Gravitational Redshift Effects');
  
  const testRadii = [
    solarMassState.schwarzschildRadius * 1.1,
    solarMassState.schwarzschildRadius * 2,
    solarMassState.schwarzschildRadius * 5,
    solarMassState.schwarzschildRadius * 10
  ];

  testRadii.forEach(radius => {
    const redshift = blackHoleEngine.gravitationalRedshift(radius);
    const frequencyShift = blackHoleEngine.frequencyShift(1e14, radius); // Visible light
    
    console.log(`    At r = ${(radius / solarMassState.schwarzschildRadius).toFixed(1)} Rs:`);
    console.log(`      Redshift z = ${redshift.toFixed(3)}`);
    console.log(`      Frequency shift factor = ${frequencyShift.toFixed(6)}`);
  });

  // Part 4: Light Bending and Photon Ring
  console.log('\n💫 Part 4: Light Bending and Photon Ring');
  
  const photonData = blackHoleEngine.generatePhotonRing();
  console.log(`  Photon Sphere Analysis:`);
  console.log(`    Photon Sphere Radius: ${(photonData.photonSphereRadius / 1000).toFixed(3)} km`);
  console.log(`    Critical Impact Parameter: ${(photonData.criticalImpactParameter / 1000).toFixed(3)} km`);
  console.log(`    This is ${(photonData.criticalImpactParameter / solarMassState.schwarzschildRadius).toFixed(3)} Rs`);

  // Calculate null geodesics
  console.log('  Calculating null geodesics...');
  const lightRays = [
    { impact: 2.0, angle: 0 },
    { impact: 2.5, angle: Math.PI / 4 },
    { impact: 3.0, angle: Math.PI / 2 },
    { impact: 4.0, angle: Math.PI }
  ];

  lightRays.forEach(({ impact, angle }) => {
    const startPosition = [impact * solarMassState.schwarzschildRadius * 1e10, 0, 0];
    const initialDirection = [-Math.cos(angle), Math.sin(angle), 0];
    
    const trajectory = blackHoleEngine.calculateNullGeodesic(
      startPosition,
      initialDirection,
      200,
      0.5
    );
    
    console.log(`    Light ray with impact parameter ${impact} Rs: ${trajectory.length} points calculated`);
  });

  // Part 5: Virtual Particle Pair Creation
  console.log('\n⚛️ Part 5: Virtual Particle Pair Creation');
  
  const virtualPairs = blackHoleEngine.createVirtualPairs(20);
  let positiveParticles = 0;
  let negativeParticles = 0;
  let totalEnergy = 0;

  virtualPairs.forEach(particle => {
    if (particle.type === 'positive') {
      positiveParticles++;
      totalEnergy += Math.abs(particle.energy);
    } else {
      negativeParticles++;
    }
  });

  console.log(`  Virtual Pair Analysis:`);
  console.log(`    Positive particles (escaping): ${positiveParticles}`);
  console.log(`    Negative particles (falling in): ${negativeParticles}`);
  console.log(`    Total energy radiated: ${totalEnergy.toExponential(2)} J`);
  console.log(`    Average particle energy: ${(totalEnergy / positiveParticles).toExponential(2)} J`);

  // Part 6: Evaporation Dynamics
  console.log('\n💨 Part 6: Evaporation Dynamics');
  
  // Test with small black hole for faster evaporation
  blackHoleEngine.setMass(1e10); // Small primordial black hole
  const initialState = blackHoleEngine.getBlackHoleState();
  
  console.log(`  Small Black Hole Evaporation:`);
  console.log(`    Initial mass: ${(initialState.mass / 1e10).toFixed(2)} × 10¹⁰ kg`);
  console.log(`    Initial temperature: ${initialState.hawkingTemperature.toFixed(2)} K`);
  console.log(`    Evaporation time: ${(initialState.evaporationTime / 3600).toFixed(2)} hours`);
  
  // Simulate evaporation
  let massLoss = 0;
  const steps = 100;
  
  for (let i = 0; i < steps; i++) {
    const stepLoss = blackHoleEngine.evaporateOneTimeStep();
    massLoss += stepLoss;
    
    if (i % 20 === 0) {
      const currentState = blackHoleEngine.getBlackHoleState();
      console.log(`    Step ${i}: Mass = ${(currentState.mass / 1e10).toFixed(4)} × 10¹⁰ kg, T = ${currentState.hawkingTemperature.toFixed(1)} K`);
    }
  }
  
  const finalState = blackHoleEngine.getBlackHoleState();
  console.log(`    Final mass: ${(finalState.mass / 1e10).toFixed(4)} × 10¹⁰ kg`);
  console.log(`    Total mass lost: ${(massLoss / 1e10).toFixed(4)} × 10¹⁰ kg`);
  console.log(`    Temperature increase: ${((finalState.hawkingTemperature - initialState.hawkingTemperature) / initialState.hawkingTemperature * 100).toFixed(1)}%`);

  // Part 7: Visualization Setup
  console.log('\n🎨 Part 7: Visualization Setup');
  console.log('  Setting up Three.js visualization...');
  
  // Setup visualization
  hilbert.visualization.initialize();
  
  // Visualize black hole horizon
  console.log('  Rendering event horizon...');
  const horizonGeometry = {
    radius: solarMassState.schwarzschildRadius * 1e10, // Scale for visualization
    color: 0x000000,
    segments: 32
  };
  
  // Visualize photon ring
  console.log('  Rendering photon ring...');
  photonData.ringPoints.forEach((point, index) => {
    const scaledPoint = [
      point[0] * 1e10,
      point[1] * 1e10,
      point[2] * 1e10
    ];
    console.log(`    Ring point ${index}: [${scaledPoint.map(p => p.toFixed(2)).join(', ')}]`);
  });
  
  // Visualize Hawking radiation particles
  console.log('  Rendering Hawking radiation...');
  const hawkingParticles = blackHoleEngine.createVirtualPairs(50);
  console.log(`    Generated ${hawkingParticles.length} virtual particles`);
  
  // Visualize light bending
  console.log('  Rendering light bending rays...');
  lightRays.forEach((ray, index) => {
    console.log(`    Light ray ${index + 1}: Impact parameter = ${ray.impact} Rs`);
  });

  console.log('\n✨ Black Hole Physics Simulation Complete!');
  console.log('📊 Summary:');
  console.log(`  - Analyzed ${masses.length} different black hole masses`);
  console.log(`  - Calculated Hawking radiation properties`);
  console.log(`  - Simulated gravitational redshift effects`);
  console.log(`  - Computed photon ring geometry`);
  console.log(`  - Generated ${virtualPairs.length} virtual particle pairs`);
  console.log(`  - Simulated evaporation dynamics`);
  console.log(`  - Set up comprehensive visualization`);
  
  console.log('\n🔬 Physics Demonstrated:');
  console.log('  - Schwarzschild metric and event horizon');
  console.log('  - Hawking temperature and radiation');
  console.log('  - Gravitational redshift');
  console.log('  - Light bending and photon sphere');
  console.log('  - Quantum vacuum fluctuations');
  console.log('  - Black hole evaporation');
  console.log('  - Virtual particle pair creation');
  
  return {
    blackHoleEngine,
    photonData,
    virtualPairs,
    lightRays,
    masses,
    redshiftData: testRadii.map(radius => ({
      radius,
      redshift: blackHoleEngine.gravitationalRedshift(radius)
    }))
  };
}

/**
 * Performance benchmark for black hole calculations
 */
async function blackHoleBenchmark() {
  console.log('\n⚡ Black Hole Physics Benchmark');
  
  const hilbert = new HilbertCore();
  const { blackHoleEngine } = hilbert;
  
  // Benchmark metric calculations
  console.log('  Benchmarking Schwarzschild metric calculations...');
  const start = performance.now();
  
  for (let i = 0; i < 1000; i++) {
    const mass = 1.989e30 * (0.1 + Math.random() * 10);
    blackHoleEngine.setMass(mass);
    blackHoleEngine.getBlackHoleState();
  }
  
  const metricTime = performance.now() - start;
  console.log(`    1000 metric calculations: ${metricTime.toFixed(2)} ms`);
  
  // Benchmark geodesic calculations
  console.log('  Benchmarking null geodesic calculations...');
  const geodesicStart = performance.now();
  
  blackHoleEngine.setMass(1.989e30);
  for (let i = 0; i < 100; i++) {
    const impactParameter = 2 + Math.random() * 3;
    const startPosition = [impactParameter * blackHoleEngine.schwarzschildRadius * 1e10, 0, 0];
    const initialDirection = [-1, Math.random() - 0.5, 0];
    
    blackHoleEngine.calculateNullGeodesic(startPosition, initialDirection, 100, 0.5);
  }
  
  const geodesicTime = performance.now() - geodesicStart;
  console.log(`    100 null geodesics: ${geodesicTime.toFixed(2)} ms`);
  
  // Benchmark virtual particle creation
  console.log('  Benchmarking virtual particle creation...');
  const particleStart = performance.now();
  
  for (let i = 0; i < 100; i++) {
    blackHoleEngine.createVirtualPairs(50);
  }
  
  const particleTime = performance.now() - particleStart;
  console.log(`    100 × 50 virtual particles: ${particleTime.toFixed(2)} ms`);
  
  console.log('✅ Black hole benchmark complete!');
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runBlackHoleSimulation()
    .then(() => blackHoleBenchmark())
    .then(() => {
      console.log('\n🎉 All black hole physics demonstrations completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error running black hole simulation:', error);
      process.exit(1);
    });
}

export { runBlackHoleSimulation, blackHoleBenchmark };
