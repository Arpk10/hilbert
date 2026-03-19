/**
 * String Theory Shaders
 * Vertex and fragment shaders for string vibration and compactification
 * Based on Polchinski Vol 1 and David Tong's lecture notes
 */

// Vertex shader for string vibration modes
export const stringVertexShader = `
  uniform float time;
  uniform float numModes;
  uniform float numPoints;
  uniform float stringLength;
  uniform sampler2D modeTexture;
  uniform bool isCompactified;
  uniform float compactificationRadius;
  uniform float vibrationFrequency;
  
  attribute vec3 position;
  attribute vec2 uv;
  
  varying vec3 vPosition;
  varying vec2 vUv;
  varying float vModeAmplitude;
  
  void main() {
    vPosition = position;
    vUv = uv;
    
    // Calculate string displacement from vibrational modes
    vec3 displacement = vec3(0.0);
    
    for (int n = 1; n <= int(numModes); n++) {
      // Get mode amplitude and phase from texture
      vec2 modeData = texture2D(modeTexture, vec2(
        float(n-1) / float(numModes),
        0.5
      )).rg;
      
      float amplitude = modeData.r;
      float phase = modeData.g;
      
      // Calculate mode shape: sin(nπσ/L)
      float sigma = position.x / stringLength;
      float modeShape = sin(float(n) * 3.14159265 * sigma);
      
      // Add mode contribution
      displacement.x += amplitude * modeShape;
    }
    
    // Apply compactification if enabled
    if (isCompactified) {
      float angle = position.x / compactificationRadius;
      displacement.x += compactificationRadius * sin(angle);
      displacement.z += compactificationRadius * (1.0 - cos(angle));
    }
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + displacement, 1.0);
  }
`;

// Fragment shader for string with mode visualization
export const stringFragmentShader = `
  uniform float time;
  uniform float numModes;
  uniform float vibrationFrequency;
  uniform sampler2D modeTexture;
  uniform vec3 baseColor;
  
  varying vec3 vPosition;
  varying vec2 vUv;
  varying float vModeAmplitude;
  
  // Simple noise function for quantum effects
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  void main() {
    // Calculate mode intensity based on position
    float modeIntensity = 0.0;
    for (int n = 1; n <= int(numModes); n++) {
      vec2 modeData = texture2D(modeTexture, vUv);
      float amplitude = modeData.r;
      float phase = modeData.g;
      
      // Mode contribution at this position
      float sigma = vUv.x;
      float modeShape = sin(float(n) * 3.14159265 * sigma + phase + time * vibrationFrequency);
      modeIntensity += abs(amplitude * modeShape);
    }
    
    // Color based on mode intensity
    vec3 color = mix(baseColor, vec3(1.0, 0.5, 0.2), modeIntensity);
    
    // Add shimmer effect for quantum fluctuations
    float shimmer = noise(vUv * 10.0 + time * 2.0);
    color += shimmer * 0.1;
    
    gl_FragColor = vec4(color, 0.9);
  }
`;

// Worldsheet vertex shader for 2D embedding in 3D
export const worldsheetVertexShader = `
  uniform float time;
  uniform float numModes;
  uniform float stringLength;
  uniform sampler2D modeTexture;
  uniform bool showExtraDimensions;
  
  attribute vec3 position;
  attribute vec2 uv;
  
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec4 vModeData;
  
  void main() {
    vPosition = position;
    vUv = uv;
    
    // Get mode data for this point
    vModeData = texture2D(modeTexture, vUv);
    
    // Calculate displacement for worldsheet embedding
    vec3 displacement = vec3(0.0);
    
    // First mode: oscillation in x
    displacement.x = vModeData.r * sin(time * 2.0 + vModeData.g);
    
    // Second mode: oscillation in y
    displacement.y = texture2D(modeTexture, vec2(0.25, 0.5)).r * 
                 sin(time * 3.0 + texture2D(modeTexture, vec2(0.25, 0.5)).g);
    
    // Third mode: oscillation in z (extra dimension)
    if (showExtraDimensions) {
      displacement.z = texture2D(modeTexture, vec2(0.5, 0.5)).r * 
                   sin(time * 1.5 + texture2D(modeTexture, vec2(0.5, 0.5)).g);
    }
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + displacement * 0.1, 1.0);
  }
`;

// Fragment shader for worldsheet with extra dimensions
export const worldsheetFragmentShader = `
  uniform float time;
  uniform float numModes;
  uniform float vibrationFrequency;
  uniform sampler2D modeTexture;
  uniform vec3 baseColor;
  
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec4 vModeData;
  
  void main() {
    // Calculate mode intensity based on position
    float modeIntensity = 0.0;
    
    // First mode intensity
    modeIntensity += abs(vModeData.r * sin(time * 2.0 + vModeData.g));
    
    // Second mode intensity
    modeIntensity += abs(texture2D(modeTexture, vec2(0.25, 0.5)).r * 
                        sin(time * 3.0 + texture2D(modeTexture, vec2(0.25, 0.5)).g));
    
    // Third mode intensity (if extra dimensions shown)
    if (vModeData.a > 0.5) {
      modeIntensity += abs(vModeData.a * sin(time * 1.5 + vModeData.b));
    }
    
    // Color based on mode intensity
    vec3 color = mix(baseColor, vec3(0.5, 0.2, 0.8), modeIntensity);
    
    // Add time-varying glow
    float pulse = sin(time * 3.0) * 0.1 + 0.9;
    color *= pulse;
    
    gl_FragColor = vec4(color, 0.8);
  }
`;

// Compactification shader for showing extra dimensions
export const compactificationVertexShader = `
  uniform float time;
  uniform float numModes;
  uniform float stringLength;
  uniform sampler2D modeTexture;
  uniform float compactificationRadius;
  
  attribute vec3 position;
  attribute vec2 uv;
  
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec4 vModeData;
  varying float vCompactificationAngle;
  
  void main() {
    vPosition = position;
    vUv = uv;
    vModeData = texture2D(modeTexture, vUv);
    vCompactificationAngle = position.x / compactificationRadius;
    
    // Calculate displacement for compactified string
    vec3 displacement = vec3(0.0);
    
    // Mode 1: oscillation along string
    displacement.x = vModeData.r * sin(time * 2.0 + vModeData.g);
    
    // Mode 2: oscillation in compactified dimension
    displacement.z = compactificationRadius * sin(vCompactificationAngle + time);
    displacement.y = compactificationRadius * (1.0 - cos(vCompactificationAngle + time));
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + displacement * 0.1, 1.0);
  }
`;

// Fragment shader for compactified dimensions
export const compactificationFragmentShader = `
  uniform float time;
  uniform float numModes;
  uniform float vibrationFrequency;
  uniform sampler2D modeTexture;
  uniform vec3 baseColor;
  uniform float compactificationRadius;
  
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec4 vModeData;
  varying float vCompactificationAngle;
  
  void main() {
    // Calculate distance from compactification axis
    float compactificationDistance = abs(vPosition.x / compactificationRadius);
    
    // Mode intensity with compactification effects
    float modeIntensity = abs(vModeData.r * sin(time * 2.0 + vModeData.g));
    
    // Enhanced effects near compactification points
    if (compactificationDistance < 0.1) {
      modeIntensity *= 2.0; // Brighten near identification points
    }
    
    // Color based on compactification
    vec3 color = mix(baseColor, vec3(0.8, 0.2, 0.8), modeIntensity);
    
    // Add identification glow
    if (compactificationDistance < 0.05) {
      float glow = 1.0 / (compactificationDistance + 0.01);
      color += vec3(0.2, 0.4, 0.8) * glow * 0.5;
    }
    
    gl_FragColor = vec4(color, 0.9);
  }
`;

// Regge trajectory shader
export const reggeTrajectoryVertexShader = `
  uniform float time;
  uniform float numPoints;
  
  attribute vec3 position;
  attribute float index;
  
  varying vec3 vPosition;
  varying float vIndex;
  
  void main() {
    vPosition = position;
    vIndex = index;
    
    // Animate along trajectory
    float animationPhase = time * 0.5 + vIndex * 0.1;
    vec3 animatedPosition = position + vec3(
      cos(animationPhase) * 0.1,
      sin(animationPhase) * 0.1,
      0.0
    );
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(animatedPosition, 1.0);
    gl_PointSize = 3.0 + sin(vIndex * 3.14159) * 2.0;
  }
`;

// Regge trajectory fragment shader
export const reggeTrajectoryFragmentShader = `
  uniform float time;
  
  varying vec3 vPosition;
  varying float vIndex;
  
  void main() {
    // Color based on position in trajectory
    float normalizedIndex = vIndex / float(numPoints);
    vec3 color = mix(
      vec3(0.2, 0.4, 0.8), // Blue
      vec3(0.8, 0.2, 0.4), // Purple
      vec3(1.0, 0.4, 0.2)  // Red
    );
    
    // Add pulsing effect
    float pulse = sin(time * 3.0 + vIndex * 0.5) * 0.3 + 0.7;
    color *= pulse;
    
    gl_FragColor = vec4(color, 0.8);
  }
`;

export default {
  stringVertexShader,
  stringFragmentShader,
  worldsheetVertexShader,
  worldsheetFragmentShader,
  compactificationVertexShader,
  compactificationFragmentShader,
  reggeTrajectoryVertexShader,
  reggeTrajectoryFragmentShader
};
