/**
 * Vacuum Shader for Quantum Fluctuations
 * Implements noise-based visualization of vacuum energy near event horizon
 * Based on quantum field theory near black holes
 */

// Vertex shader for vacuum field with gravitational effects
export const vacuumVertexShader = `
  // Uniforms
  uniform float time;
  uniform float schwarzschildRadius;
  uniform float hawkingTemperature;
  uniform vec3 blackHolePosition;
  
  // Varyings
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDistanceToHorizon;
  varying float vRedshiftFactor;
  varying vec2 vUv;
  
  // Simple noise function for quantum fluctuations
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    // First corner
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    // Permutations
    i = mod289(i);
    vec4 p = i + vec4(0.0, i1.x, i1.y, i1.z);
    p = mod289(p + vec4(0.0, i2.x, i2.y, i2.z));
    p = mod289(p + vec4(0.0, 0.0, i2.x, i2.z));
    p = mod289(p + vec4(0.0, 0.0, 0.0, i2.x));
    
    // Gradients
    float n_ = 0.142857142857; // 1/7
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    // Normalise gradients
    vec4 norm = inversesqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    // Mix contributions
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  // Helper function for modulo 289
  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    // Transform to world coordinates
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    // Calculate distance to black hole
    vec3 toBlackHole = vWorldPosition - blackHolePosition;
    float distance = length(toBlackHole);
    vDistanceToHorizon = distance - schwarzschildRadius;
    
    // Calculate gravitational redshift factor
    vRedshiftFactor = 1.0 - schwarzschildRadius / distance;
    vRedshiftFactor = max(0.0, vRedshiftFactor);
    
    // Apply quantum fluctuations near horizon
    float fluctuationIntensity = 1.0 - smoothstep(schwarzschildRadius * 1.5, schwarzschildRadius * 5.0, distance);
    
    // Noise-based quantum fluctuations
    vec3 noiseCoord = vWorldPosition * 2.0 + time * 0.5;
    float noise1 = snoise(noiseCoord);
    float noise2 = snoise(noiseCoord * 2.0 + time * 0.3);
    float noise3 = snoise(noiseCoord * 4.0 + time * 0.1);
    
    float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
    
    // Apply fluctuations to vertex position
    vec3 displacedPosition = position;
    displacedPosition += normal * combinedNoise * fluctuationIntensity * 0.5;
    
    // Apply time dilation effect
    float timeDilation = sqrt(vRedshiftFactor);
    displacedPosition *= (1.0 + 0.1 * sin(time * timeDilation) * fluctuationIntensity);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
  }
`;

// Fragment shader for vacuum field with Hawking radiation
export const vacuumFragmentShader = `
  // Uniforms
  uniform float time;
  uniform float schwarzschildRadius;
  uniform float hawkingTemperature;
  uniform vec3 blackHolePosition;
  uniform float mass;
  uniform bool isEvaporating;
  uniform float evaporationProgress;
  uniform sampler2D noiseTexture;
  
  // Varyings from vertex shader
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDistanceToHorizon;
  varying float vRedshiftFactor;
  varying vec2 vUv;
  
  // Constants
  const float PLANCK_LENGTH = 6.626e-34;
  const float BOLTZMANN_CONSTANT = 1.381e-23;
  
  // Improved noise function
  float noise(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }
  
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 6; i++) {
      value += amplitude * noise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
      p += time * 0.1;
    }
    
    return value;
  }
  
  // Calculate Hawking radiation intensity
  float hawkingIntensity(float distance, float temperature) {
    // Planck distribution for black body radiation
    float frequency = temperature / PLANCK_LENGTH;
    float planckFactor = 1.0 / (exp(PLANCK_LENGTH * frequency / (BOLTZMANN_CONSTANT * temperature)) - 1.0);
    
    // Geometric falloff from horizon
    float geometricFactor = 1.0 / (1.0 + pow(distance / schwarzschildRadius, 2.0));
    
    // Combine factors
    return planckFactor * geometricFactor * temperature * 1e30; // Scaled for visualization
  }
  
  // Simulate virtual particle pair creation
  vec3 virtualParticleEffect(vec3 position, float time) {
    float particleDensity = fbm(position * 3.0 + time * 0.5);
    
    // Create particle pairs near horizon
    float pairCreationRate = exp(-abs(vDistanceToHorizon) / schwarzschildRadius);
    
    // Animate particle separation
    float separation = sin(time * 10.0) * pairCreationRate;
    
    // Color effect from particle creation
    vec3 particleColor = vec3(0.1, 0.5, 1.0) * particleDensity * pairCreationRate;
    
    return particleColor * (1.0 + separation);
  }
  
  void main() {
    // Base vacuum color
    vec3 vacuumColor = vec3(0.05, 0.0, 0.1);
    
    // Calculate distance-based effects
    float distance = length(vWorldPosition - blackHolePosition);
    float horizonProximity = 1.0 - smoothstep(schwarzschildRadius, schwarzschildRadius * 4.0, distance);
    
    // Quantum vacuum fluctuations
    vec3 fluctuationColor = virtualParticleEffect(vWorldPosition, time);
    
    // Hawking radiation with evaporation effects
    float hawking = hawkingIntensity(vDistanceToHorizon, hawkingTemperature);
    vec3 hawkingColor = vec3(1.0, 0.7, 0.2) * hawking; // Orange-white for hot radiation
    
    // Enhanced brightness during evaporation
    if (isEvaporating) {
      // Bloom effect intensifies as mass decreases
      float bloomIntensity = 1.0 + evaporationProgress * 3.0; // Up to 4x brightness
      hawkingColor *= bloomIntensity;
      
      // Add violent flickering near end
      if (evaporationProgress > 0.8) {
        float flicker = sin(time * 50.0) * 0.5 + 0.5;
        hawkingColor *= (0.5 + flicker);
      }
    }
    
    // Gravitational redshift effect on color
    vec3 redshiftedColor = mix(vacuumColor, hawkingColor, horizonProximity);
    redshiftedColor = mix(redshiftedColor, fluctuationColor, horizonProximity * 0.5);
    
    // Apply redshift to frequency (color shift)
    redshiftedColor *= vRedshiftFactor;
    
    // Add time-varying component for animation
    float pulse = sin(time * 2.0) * 0.1 + 0.9;
    redshiftedColor *= pulse;
    
    // Add noise texture for additional detail
    vec2 noiseUV = vUv * 4.0 + time * 0.1;
    vec4 noiseColor = texture2D(noiseTexture, noiseUV);
    redshiftedColor += noiseColor.rgb * 0.1 * horizonProximity;
    
    // Alpha based on distance and effects
    float alpha = 0.3 + horizonProximity * 0.5;
    alpha *= vRedshiftFactor; // Fade out near horizon
    
    // Enhanced alpha during evaporation
    if (isEvaporating) {
      alpha *= (1.0 + evaporationProgress * 2.0); // Up to 3x opacity
    }
    
    gl_FragColor = vec4(redshiftedColor, alpha);
  }
`;

// Simplified version for better performance
export const simpleVacuumVertexShader = `
  uniform float time;
  uniform float schwarzschildRadius;
  
  varying vec3 vPosition;
  varying float vDistance;
  
  void main() {
    vPosition = position;
    vDistance = length(position);
    
    // Simple fluctuation
    float fluctuation = sin(position.x * 10.0 + time) * 
                      sin(position.y * 10.0 + time) * 
                      sin(position.z * 10.0 + time);
    
    float horizonEffect = 1.0 - smoothstep(schwarzschildRadius, schwarzschildRadius * 3.0, vDistance);
    vec3 displacedPosition = position + normal * fluctuation * horizonEffect * 0.2;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
  }
`;

export const simpleVacuumFragmentShader = `
  uniform float time;
  uniform float schwarzschildRadius;
  uniform float hawkingTemperature;
  
  varying vec3 vPosition;
  varying float vDistance;
  
  void main() {
    // Distance-based color
    float horizonProximity = 1.0 - smoothstep(schwarzschildRadius, schwarzschildRadius * 3.0, vDistance);
    
    // Base vacuum color
    vec3 vacuumColor = vec3(0.1, 0.0, 0.2);
    
    // Hawking radiation color
    vec3 hawkingColor = vec3(1.0, 0.5, 0.0) * horizonProximity * hawkingTemperature * 1e28;
    
    // Mix colors
    vec3 finalColor = mix(vacuumColor, hawkingColor, horizonProximity);
    
    // Add time variation
    finalColor *= (sin(time * 3.0) * 0.2 + 0.8);
    
    gl_FragColor = vec4(finalColor, 0.6);
  }
`;

// Create noise texture for shader
export const createNoiseTexture = (renderer) => {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const index = (i * size + j) * 4;
      const value = Math.random() * 255;
      
      data[index] = value;     // R
      data[index + 1] = value; // G
      data[index + 2] = value; // B
      data[index + 3] = 255;   // A
    }
  }
  
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  return texture;
};

export default {
  vacuumVertexShader,
  vacuumFragmentShader,
  simpleVacuumVertexShader,
  simpleVacuumFragmentShader,
  createNoiseTexture
};
