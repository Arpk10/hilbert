/**
 * Black Hole Physics Tests
 * Tests Hawking radiation, Schwarzschild metric, and event horizon physics
 */
import { HilbertCore } from '../src/index.js';
import { strict as assert } from 'node:assert';

// Test suite for black hole functionality
async function runBlackHoleTests() {
  console.log('Running Black Hole Physics Tests...\n');

  try {
    await testSchwarzschildMetric();
    await testHawkingTemperature();
    await testGravitationalRedshift();
    await testNullGeodesics();
    await testVirtualParticleCreation();
    await testEvaporationDynamics();
    await testPhotonRing();
    
    console.log('\n✅ All black hole physics tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

/**
 * Test Schwarzschild metric calculations
 */
async function testSchwarzschildMetric() {
  console.log('Testing Schwarzschild metric calculations...');
  
  const hilbert = new HilbertCore();
  const { blackHoleEngine } = hilbert;
  
  // Test Schwarzschild radius calculation
  const solarMass = 1.989e30;
  const expectedRs = (2 * 6.67430e-11 * solarMass) / (299792458 * 299792458);
  const calculatedRs = blackHoleEngine.calculateSchwarzschildRadius(solarMass);
  
  assert(Math.abs(calculatedRs - expectedRs) < 1e-10, 'Schwarzschild radius calculation incorrect');
  
  // Test with different masses
  const masses = [1e10, 1e20, 1e30];
  masses.forEach(mass => {
    const rs = blackHoleEngine.calculateSchwarzschildRadius(mass);
    assert(rs > 0, 'Schwarzschild radius should be positive');
    assert(isFinite(rs), 'Schwarzschild radius should be finite');
  });
  
  // Test surface gravity
  const surfaceGravity = blackHoleEngine.calculateSurfaceGravity(solarMass);
  const expectedGravity = Math.pow(299792458, 4) / (4 * 6.67430e-11 * solarMass);
  assert(Math.abs(surfaceGravity - expectedGravity) < 1e-10, 'Surface gravity calculation incorrect');
  
  console.log('  ✓ Schwarzschild metric calculations work correctly');
}

/**
 * Test Hawking temperature calculations
 */
async function testHawkingTemperature() {
  console.log('Testing Hawking temperature calculations...');
  
  const hilbert = new HilbertCore();
  const { blackHoleEngine } = hilbert;
  
  // Test Hawking temperature formula
  const solarMass = 1.989e30;
  const expectedTemp = (1.054571817e-34 * Math.pow(299792458, 3)) / 
                      (8 * Math.PI * 6.67430e-11 * solarMass * 1.380649e-23);
  const calculatedTemp = blackHoleEngine.calculateHawkingTemperature(solarMass);
  
  assert(Math.abs(calculatedTemp - expectedTemp) < 1e-40, 'Hawking temperature calculation incorrect');
  
  // Test temperature-mass relationship (inverse proportionality)
  const mass1 = 1e30;
  const mass2 = 2e30;
  const temp1 = blackHoleEngine.calculateHawkingTemperature(mass1);
  const temp2 = blackHoleEngine.calculateHawkingTemperature(mass2);
  
  assert(Math.abs(temp2 - temp1 / 2) < 1e-40, 'Temperature should be inversely proportional to mass');
  
  // Test evaporation time
  const evapTime = blackHoleEngine.calculateEvaporationTime(solarMass);
  assert(evapTime > 0, 'Evaporation time should be positive');
  assert(isFinite(evapTime), 'Evaporation time should be finite');
  
  // Test power emission
  const power = blackHoleEngine.calculateHawkingPower(solarMass);
  assert(power > 0, 'Hawking power should be positive');
  assert(isFinite(power), 'Hawking power should be finite');
  
  console.log('  ✓ Hawking temperature calculations work correctly');
}

/**
 * Test gravitational redshift effects
 */
async function testGravitationalRedshift() {
  console.log('Testing gravitational redshift effects...');
  
  const hilbert = new HilbertCore();
  const { blackHoleEngine } = hilbert;
  
  const solarMass = 1.989e30;
  blackHoleEngine.setMass(solarMass);
  const rs = blackHoleEngine.schwarzschildRadius;
  
  // Test redshift at different radii
  const radii = [rs * 1.1, rs * 2, rs * 5, rs * 10];
  
  radii.forEach(radius => {
    const redshift = blackHoleEngine.gravitationalRedshift(radius);
    
    assert(redshift >= 0, 'Redshift should be non-negative');
    assert(isFinite(redshift), 'Redshift should be finite');
    
    // Redshift should decrease with distance
    const nextRadius = radius * 2;
    if (nextRadius <= rs * 20) {
      const nextRedshift = blackHoleEngine.gravitationalRedshift(nextRadius);
      assert(nextRedshift <= redshift, 'Redshift should decrease with distance');
    }
  });
  
  // Test frequency shift
  const testFrequency = 1e14; // Visible light
  const shiftedFrequency = blackHoleEngine.frequencyShift(testFrequency, rs * 2);
  
  assert(shiftedFrequency > 0, 'Shifted frequency should be positive');
  assert(shiftedFrequency < testFrequency, 'Frequency should be redshifted');
  
  // Test behavior at horizon (should approach infinity)
  const horizonRedshift = blackHoleEngine.gravitationalRedshift(rs * 1.000001);
  assert(horizonRedshift > 1000, 'Redshift should be very large near horizon');
  
  console.log('  ✓ Gravitational redshift effects work correctly');
}

/**
 * Test null geodesic calculations
 */
async function testNullGeodesics() {
  console.log('Testing null geodesic calculations...');
  
  const hilbert = new HilbertCore();
  const { blackHoleEngine } = hilbert;
  
  const solarMass = 1.989e30;
  blackHoleEngine.setMass(solarMass);
  const rs = blackHoleEngine.schwarzschildRadius;
  
  // Test light ray trajectories
  const startPosition = [rs * 3 * 1e10, 0, 0];
  const initialDirection = [-1, 0, 0];
  
  const trajectory = blackHoleEngine.calculateNullGeodesic(
    startPosition,
    initialDirection,
    100,
    0.5
  );
  
  assert(trajectory.length > 0, 'Trajectory should have points');
  assert(trajectory[0].length === 3, 'Each point should have 3 coordinates');
  
  // Check that trajectory starts at correct position
  const firstPoint = trajectory[0];
  assert(Math.abs(firstPoint[0] - startPosition[0]) < 1e-10, 'Trajectory should start at correct position');
  assert(Math.abs(firstPoint[1] - startPosition[1]) < 1e-10, 'Trajectory should start at correct position');
  assert(Math.abs(firstPoint[2] - startPosition[2]) < 1e-10, 'Trajectory should start at correct position');
  
  // Test different impact parameters
  const impactParameters = [1.5, 2.0, 3.0, 5.0];
  const trajectories = [];
  
  impactParameters.forEach(impact => {
    const startPos = [impact * rs * 1e10, 0, 0];
    const traj = blackHoleEngine.calculateNullGeodesic(startPos, [-1, 0, 0], 50, 0.5);
    trajectories.push(traj);
  });
  
  // Smaller impact parameter should lead to more bending (shorter trajectory)
  assert(trajectories[0].length < trajectories[3].length, 
         'Smaller impact parameter should cause more bending');
  
  console.log('  ✓ Null geodesic calculations work correctly');
}

/**
 * Test virtual particle creation
 */
async function testVirtualParticleCreation() {
  console.log('Testing virtual particle creation...');
  
  const hilbert = new HilbertCore();
  const { blackHoleEngine } = hilbert;
  
  const solarMass = 1.989e30;
  blackHoleEngine.setMass(solarMass);
  
  // Test virtual pair creation
  const numPairs = 20;
  const virtualPairs = blackHoleEngine.createVirtualPairs(numPairs);
  
  assert(virtualPairs.length === numPairs * 2, 'Should create 2 particles per pair');
  
  // Count positive and negative particles
  let positiveCount = 0;
  let negativeCount = 0;
  
  virtualPairs.forEach(particle => {
    assert(particle.position !== undefined, 'Particle should have position');
    assert(particle.type === 'positive' || particle.type === 'negative', 
           'Particle should have valid type');
    assert(particle.energy !== undefined, 'Particle should have energy');
    assert(particle.probability !== undefined, 'Particle should have probability');
    
    if (particle.type === 'positive') {
      positiveCount++;
      assert(particle.energy > 0, 'Positive particle should have positive energy');
      assert(particle.escapeDirection !== undefined, 'Positive particle should have escape direction');
    } else {
      negativeCount++;
      assert(particle.energy < 0, 'Negative particle should have negative energy');
    }
    
    assert(particle.probability >= 0, 'Probability should be non-negative');
    assert(particle.probability <= 1, 'Probability should not exceed 1');
  });
  
  assert(positiveCount === numPairs, 'Should have equal number of positive particles');
  assert(negativeCount === numPairs, 'Should have equal number of negative particles');
  
  // Test vacuum fluctuation probability
  const rs = blackHoleEngine.schwarzschildRadius;
  const nearHorizonProb = blackHoleEngine.vacuumFluctuationProbability(rs * 1.1);
  const farProb = blackHoleEngine.vacuumFluctuationProbability(rs * 10);
  
  assert(nearHorizonProb > farProb, 'Fluctuation probability should be higher near horizon');
  assert(nearHorizonProb >= 0, 'Probability should be non-negative');
  assert(farProb >= 0, 'Probability should be non-negative');
  
  console.log('  ✓ Virtual particle creation works correctly');
}

/**
 * Test evaporation dynamics
 */
async function testEvaporationDynamics() {
  console.log('Testing evaporation dynamics...');
  
  const hilbert = new HilbertCore();
  const { blackHoleEngine } = hilbert;
  
  // Use small black hole for faster evaporation
  const smallMass = 1e10;
  blackHoleEngine.setMass(smallMass);
  
  const initialMass = blackHoleEngine.mass;
  const initialTemp = blackHoleEngine.hawkingTemperature;
  
  // Evaporate for one time step
  const massLoss = blackHoleEngine.evaporateOneTimeStep();
  
  assert(massLoss > 0, 'Should lose mass during evaporation');
  assert(blackHoleEngine.mass < initialMass, 'Mass should decrease');
  assert(blackHoleEngine.hawkingTemperature > initialTemp, 
         'Temperature should increase as mass decreases');
  
  // Test mass-energy conservation
  const power = blackHoleEngine.calculateHawkingPower(initialMass);
  const expectedMassLoss = (power * blackHoleEngine.timeStep) / (299792458 * 299792458);
  
  assert(Math.abs(massLoss - expectedMassLoss) < expectedMassLoss * 0.01, 
         'Mass loss should match power calculation');
  
  // Test evaporation time calculation
  const evapTime = blackHoleEngine.calculateEvaporationTime(smallMass);
  assert(evapTime > 0, 'Evaporation time should be positive');
  
  // Test that smaller black holes evaporate faster
  const largeMass = 1e12;
  const smallEvapTime = blackHoleEngine.calculateEvaporationTime(smallMass);
  const largeEvapTime = blackHoleEngine.calculateEvaporationTime(largeMass);
  
  assert(smallEvapTime < largeEvapTime, 'Smaller black holes should evaporate faster');
  
  console.log('  ✓ Evaporation dynamics work correctly');
}

/**
 * Test photon ring calculations
 */
async function testPhotonRing() {
  console.log('Testing photon ring calculations...');
  
  const hilbert = new HilbertCore();
  const { blackHoleEngine } = hilbert;
  
  const solarMass = 1.989e30;
  blackHoleEngine.setMass(solarMass);
  const rs = blackHoleEngine.schwarzschildRadius;
  
  // Test photon ring generation
  const photonData = blackHoleEngine.generatePhotonRing();
  
  assert(photonData.ringPoints !== undefined, 'Should generate ring points');
  assert(photonData.photonSphereRadius !== undefined, 'Should calculate photon sphere radius');
  assert(photonData.criticalImpactParameter !== undefined, 'Should calculate critical impact parameter');
  
  // Check photon sphere radius (should be 1.5 * Rs)
  const expectedPhotonSphere = 1.5 * rs;
  assert(Math.abs(photonData.photonSphereRadius - expectedPhotonSphere) < 1e-10,
         'Photon sphere radius should be 1.5 times Schwarzschild radius');
  
  // Check critical impact parameter (should be sqrt(27)/2 * Rs)
  const expectedImpactParameter = Math.sqrt(27) * rs / 2;
  assert(Math.abs(photonData.criticalImpactParameter - expectedImpactParameter) < 1e-10,
         'Critical impact parameter should be sqrt(27)/2 times Schwarzschild radius');
  
  // Check ring points
  assert(photonData.ringPoints.length > 0, 'Should generate ring points');
  assert(photonData.ringPoints.length >= 50, 'Should generate sufficient ring points');
  
  // Check that ring points form a circle
  const firstPoint = photonData.ringPoints[0];
  const radius = Math.sqrt(firstPoint[0]**2 + firstPoint[1]**2 + firstPoint[2]**2);
  
  photonData.ringPoints.forEach(point => {
    const pointRadius = Math.sqrt(point[0]**2 + point[1]**2 + point[2]**2);
    assert(Math.abs(pointRadius - radius) < radius * 0.01, 'Ring points should have consistent radius');
  });
  
  console.log('  ✓ Photon ring calculations work correctly');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBlackHoleTests();
}

export { runBlackHoleTests };
