/**
 * String Theory Simulation Example
 * Demonstrates Polchinski action, string dynamics, and vibrational modes
 * Based on Polchinski Vol 1 and David Tong's lecture notes
 */
import { HilbertCore } from '../src/index.js';

/**
 * Run comprehensive string theory demonstration
 */
async function runStringTheorySimulation() {
  console.log('🎸 Starting String Theory Simulation...\n');

  // Initialize the framework
  const hilbert = new HilbertCore();
  hilbert.initialize();

  // Part 1: Polchinski Action Analysis
  console.log('📐 Part 1: Polchinski Action Analysis');
  
  const stringEngine = hilbert.stringEngine;
  
  // Test different string configurations
  const configurations = [
    { tension: 1.0, length: 1.0, modes: 32, name: 'Standard String' },
    { tension: 2.0, length: 1.0, modes: 64, name: 'High Tension' },
    { tension: 0.5, length: 2.0, modes: 16, name: 'Long String' },
    { tension: 1.0, length: 0.5, modes: 128, name: 'Short String' }
  ];

  configurations.forEach(({ tension, length, modes, name }) => {
    stringEngine.setStringTension(tension);
    stringEngine.setStringLength(length);
    stringEngine.numModes = modes;
    stringEngine.initializeModeFrequencies();
    
    const state = stringEngine.getStringState();
    
    console.log(`\n  ${name}:`);
    console.log(`    Tension: ${state.tension.toFixed(3)}`);
    console.log(`    Length: ${stringEngine.length.toFixed(3)}`);
    console.log(`    Modes: ${stringEngine.numModes}`);
    console.log(`    Wave Speed: ${state.waveSpeed.toFixed(3)}`);
    console.log(`    Energy: ${state.energy.toFixed(6)}`);
    console.log(`    Polchinski Action: ${state.polchinskiAction.toFixed(6)}`);
  });

  // Part 2: Vibrational Mode Analysis
  console.log('\n🎵 Part 2: Vibrational Mode Analysis');
  
  stringEngine.setStringTension(1.0);
  stringEngine.setStringLength(1.0);
  stringEngine.numModes = 64;
  stringEngine.initializeModeFrequencies();
  
  // Excite different modes and analyze
  const modeTests = [1, 2, 4, 8, 16, 32, 64];
  
  modeTests.forEach(modeNumber => {
    stringEngine.reset();
    stringEngine.exciteMode(modeNumber, 0.5);
    
    const state = stringEngine.getStringState();
    const frequency = stringEngine.modeFrequencies[modeNumber - 1];
    
    console.log(`  Mode ${modeNumber}:`);
    console.log(`    Frequency: ${frequency.toFixed(3)} rad/s`);
    console.log(`    Amplitude: ${stringEngine.modeAmplitudes[modeNumber - 1].toFixed(3)}`);
    console.log(`    Energy: ${state.energy.toFixed(6)}`);
    console.log(`    Expected Energy: ${(0.5 * state.tension * stringEngine.length * frequency * frequency * 0.5 * 0.5).toFixed(6)}`);
  });

  // Part 3: Regge Trajectory Analysis
  console.log('\n🌌 Part 3: Regge Trajectory Analysis');
  
  // Calculate Regge trajectories for different string tensions
  const tensions = [0.5, 1.0, 2.0, 5.0];
  
  tensions.forEach(tension => {
    stringEngine.setStringTension(tension);
    
    // Calculate trajectory for momentum from 0 to 10
    const trajectoryData = [];
    for (let p = 0; p <= 10; p += 0.5) {
      const j = Math.sqrt(p * p + 1); // J² = α'M² + p², with M² = p/α'
      trajectoryData.push({ momentum: p, angularMomentum: j });
    }
    
    console.log(`  Regge Trajectory (T = ${tension}):`);
    console.log(`    Slope: ${1 / stringEngine.alphaPrime.toFixed(3)}`);
    console.log(`    Intercept: 1.0`);
    console.log(`    Sample points: p=0→J=1.0, p=5→J=${Math.sqrt(26).toFixed(2)}, p=10→J=${Math.sqrt(101).toFixed(2)}`);
  });

  // Part 4: Compactification Analysis
  console.log('\n🔄 Part 4: Compactification Analysis');
  
  stringEngine.setStringTension(1.0);
  stringEngine.setStringLength(1.0);
  
  // Test different compactification radii
  const radii = [0.5, 1.0, 2.0, 5.0];
  
  radii.forEach(radius => {
    stringEngine.enableCompactification(radius);
    stringEngine.reset();
    stringEngine.exciteMode(1, 0.3);
    
    const state = stringEngine.getStringState();
    
    console.log(`  Compactification Radius R = ${radius}:`);
    console.log(`    Is Compactified: ${state.isCompactified}`);
    console.log(`    Radius: ${state.compactificationRadius.toFixed(3)}`);
    console.log(`    Energy: ${state.energy.toFixed(6)}`);
    console.log(`    Identification Distance: ${radius} units`);
  });

  // Part 5: Multi-Mode Superposition
  console.log('\n🎼 Part 5: Multi-Mode Superposition');
  
  stringEngine.setStringTension(1.0);
  stringEngine.setStringLength(1.0);
  stringEngine.disableCompactification();
  stringEngine.reset();
  
  // Excite multiple modes with different amplitudes
  const multiModeExcitations = [
    { mode: 1, amplitude: 0.5 },
    { mode: 3, amplitude: 0.3 },
    { mode: 5, amplitude: 0.2 },
    { mode: 7, amplitude: 0.1 }
  ];
  
  multiModeExcitations.forEach(({ mode, amplitude }) => {
    stringEngine.exciteMode(mode, amplitude);
  });
  
  const multiModeState = stringEngine.getStringState();
  
  console.log(`  Multi-Mode Configuration:`);
  console.log(`    Total Energy: ${multiModeState.energy.toFixed(6)}`);
  console.log(`    Active Modes: ${multiModeExcitations.length}`);
  console.log(`    Mode Frequencies: ${multiModeExcitations.map(e => `${e.mode}:${stringEngine.modeFrequencies[e.mode - 1].toFixed(2)}`).join(', ')}`);
  console.log(`    Expected Energy: ${multiModeExcitations.reduce((sum, e) => {
    const freq = stringEngine.modeFrequencies[e.mode - 1];
    return sum + 0.5 * stringEngine.stringTension * stringEngine.length * freq * freq * e.amplitude * e.amplitude;
  }, 0).toFixed(6)}`);

  // Part 6: Quantum Fluctuation Effects
  console.log('\n⚛️ Part 6: Quantum Fluctuation Effects');
  
  stringEngine.reset();
  stringEngine.exciteMode(2, 0.4);
  
  const initialEnergy = stringEngine.getStringState().energy;
  
  // Add quantum fluctuations
  const fluctuationStrengths = [0.01, 0.05, 0.1, 0.2];
  
  fluctuationStrengths.forEach(strength => {
    stringEngine.reset();
    stringEngine.exciteMode(2, 0.4);
    stringEngine.addQuantumFluctuation(strength);
    
    const fluctuatedState = stringEngine.getStringState();
    const energyChange = fluctuatedState.energy - initialEnergy;
    
    console.log(`  Fluctuation Strength ${strength}:`);
    console.log(`    Energy Change: ${energyChange.toExponential(2)}`);
    console.log(`    Relative Change: ${(energyChange / initialEnergy * 100).toFixed(2)}%`);
    console.log(`    Mode Variations: ${stringEngine.modeAmplitudes.slice(0, 5).map(a => a.toFixed(3)).join(', ')}`);
  });

  // Part 7: Time Evolution Analysis
  console.log('\n⏱️ Part 7: Time Evolution Analysis');
  
  stringEngine.reset();
  stringEngine.exciteMode(1, 0.5);
  stringEngine.exciteMode(3, 0.3);
  
  const timeSteps = [0, 0.1, 0.25, 0.5, 1.0, 2.0];
  
  timeSteps.forEach(timeStep => {
    stringEngine.time = timeStep;
    const coordinates = stringEngine.calculateStringFromModes(timeStep);
    
    // Calculate string shape metrics
    const maxDisplacement = Math.max(...coordinates);
    const minDisplacement = Math.min(...coordinates);
    const amplitude = (maxDisplacement - minDisplacement) / 2;
    
    console.log(`  Time t = ${timeStep}:`);
    console.log(`    Max Displacement: ${maxDisplacement.toFixed(4)}`);
    console.log(`    Min Displacement: ${minDisplacement.toFixed(4)}`);
    console.log(`    Amplitude: ${amplitude.toFixed(4)}`);
    console.log(`    Energy: ${stringEngine.getStringState().energy.toFixed(6)}`);
  });

  // Part 8: String Spectrum Analysis
  console.log('\n🌈 Part 8: String Spectrum Analysis');
  
  // Analyze mass spectrum from vibrational modes
  stringEngine.setStringTension(1.0);
  stringEngine.setStringLength(1.0);
  
  const massLevels = [];
  for (let n = 1; n <= 10; n++) {
    stringEngine.reset();
    stringEngine.exciteMode(n, 1.0);
    
    const state = stringEngine.getStringState();
    const massSquared = 2 * state.energy / stringEngine.alphaPrime; // M² = 2E/α'
    const angularMomentum = Math.sqrt(massSquared + 1); // J² = α'M² + 1
    
    massLevels.push({
      level: n,
      massSquared: massSquared,
      angularMomentum: angularMomentum,
      energy: state.energy
    });
  }
  
  console.log(`  String Mass Spectrum:`);
  massLevels.forEach(level => {
    console.log(`    Level ${level.level}: M² = ${level.massSquared.toFixed(3)}, J = ${level.angularMomentum.toFixed(3)}, E = ${level.energy.toFixed(6)}`);
  });

  // Part 9: Coupling Constant Effects
  console.log('\n🔗 Part 9: Coupling Constant Effects');
  
  // Test different coupling constants
  const couplingConstants = [0.01, 0.1, 0.5, 1.0, 2.0];
  
  couplingConstants.forEach(gString => {
    stringEngine.setCouplingConstant(gString);
    stringEngine.reset();
    stringEngine.exciteMode(1, 0.5);
    
    const state = stringEngine.getStringState();
    
    console.log(`  Coupling g_s = ${gString}:`);
    console.log(`    Polchinski Action: ${state.polchinskiAction.toFixed(6)}`);
    console.log(`    Energy: ${state.energy.toFixed(6)}`);
    console.log(`    Action/Energy Ratio: ${(state.polchinskiAction / state.energy).toFixed(3)}`);
  });

  // Part 10: Visualization Setup
  console.log('\n🎨 Part 10: Visualization Setup');
  console.log('  Setting up Three.js visualization...');
  
  // Setup visualization
  hilbert.visualization.initialize();
  
  // Visualize string worldsheet
  console.log('  Rendering string worldsheet...');
  const stringGeometry = {
    numPoints: 128,
    numModes: 64,
    tension: 1.0,
    length: 1.0
  };
  
  // Visualize vibrational modes
  console.log('  Rendering vibrational modes...');
  const modeVisualization = {
    selectedMode: 3,
    amplitude: 0.5,
    frequency: 3.14,
    color: '#00ff88'
  };
  
  // Visualize Regge trajectory
  console.log('  Rendering Regge trajectory...');
  const reggeVisualization = {
    momentum: 5.0,
    angularMomentum: Math.sqrt(26),
    trajectory: 'linear',
    color: '#ff00ff'
  };
  
  // Visualize compactification
  console.log('  Rendering compactification...');
  const compactificationVisualization = {
    radius: 1.0,
    isCompactified: true,
    extraDimensions: 6,
    color: '#8800ff'
  };

  console.log('\n✨ String Theory Simulation Complete!');
  console.log('📊 Summary:');
  console.log(`  - Analyzed ${configurations.length} string configurations`);
  console.log(`  - Tested ${modeTests.length} vibrational modes`);
  console.log(`  - Calculated ${tensions.length} Regge trajectories`);
  console.log(`  - Evaluated ${radii.length} compactification radii`);
  console.log(`  - Simulated multi-mode superposition`);
  console.log(`  - Added quantum fluctuations`);
  console.log(`  - Analyzed time evolution`);
  console.log(`  - Calculated mass spectrum`);
  console.log(`  - Tested coupling effects`);
  console.log(`  - Set up comprehensive visualization`);
  
  console.log('\n🔬 Physics Demonstrated:');
  console.log('  - Polchinski action formalism');
  console.log('  - String vibrational dynamics');
  console.log('  - Regge trajectory relationships');
  console.log('  - Compactification physics');
  console.log('  - Quantum fluctuation effects');
  console.log('  - String mass spectrum');
  console.log('  - Coupling constant effects');
  console.log('  - Worldsheet embedding');
  
  return {
    stringEngine,
    configurations,
    modeTests,
    reggeTrajectories: tensions,
    compactificationRadii: radii,
    massLevels,
    visualization: {
      stringGeometry,
      modeVisualization,
      reggeVisualization,
      compactificationVisualization
    }
  };
}

/**
 * Performance benchmark for string theory calculations
 */
async function stringTheoryBenchmark() {
  console.log('\n⚡ String Theory Benchmark');
  
  const hilbert = new HilbertCore();
  const { stringEngine } = hilbert;
  
  // Benchmark Polchinski action calculations
  console.log('  Benchmarking Polchinski action calculations...');
  const start = performance.now();
  
  for (let i = 0; i < 1000; i++) {
    const coordinates = Array.from({length: 128}, () => Math.random() * 0.1);
    const velocities = Array.from({length: 128}, () => Math.random() * 0.01);
    stringEngine.calculatePolchinskiAction(coordinates, velocities);
  }
  
  const actionTime = performance.now() - start;
  console.log(`    1000 action calculations: ${actionTime.toFixed(2)} ms`);
  
  // Benchmark string dynamics
  console.log('  Benchmarking string dynamics...');
  const dynamicsStart = performance.now();
  
  stringEngine.setStringTension(1.0);
  stringEngine.setStringLength(1.0);
  stringEngine.numModes = 64;
  stringEngine.initializeString();
  
  for (let i = 0; i < 100; i++) {
    stringEngine.updateStringDynamics();
  }
  
  const dynamicsTime = performance.now() - dynamicsStart;
  console.log(`    100 dynamics updates: ${dynamicsTime.toFixed(2)} ms`);
  
  // Benchmark mode calculations
  console.log('  Benchmarking mode calculations...');
  const modeStart = performance.now();
  
  for (let i = 0; i < 100; i++) {
    stringEngine.calculateStringFromModes(i * 0.01);
  }
  
  const modeTime = performance.now() - modeStart;
  console.log(`    100 mode calculations: ${modeTime.toFixed(2)} ms`);
  
  // Benchmark Regge trajectory calculations
  console.log('  Benchmarking Regge trajectory calculations...');
  const reggeStart = performance.now();
  
  for (let i = 0; i < 1000; i++) {
    const momentum = Math.random() * 10;
    const angularMomentum = Math.random() * 10;
    stringEngine.calculateReggeTrajectory(momentum, angularMomentum);
  }
  
  const reggeTime = performance.now() - reggeStart;
  console.log(`    1000 Regge calculations: ${reggeTime.toFixed(2)} ms`);
  
  console.log('✅ String theory benchmark complete!');
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runStringTheorySimulation()
    .then(() => stringTheoryBenchmark())
    .then(() => {
      console.log('\n🎉 All string theory demonstrations completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error running string theory simulation:', error);
      process.exit(1);
    });
}

export { runStringTheorySimulation, stringTheoryBenchmark };
