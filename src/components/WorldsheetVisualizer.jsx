/**
 * String Worldsheet Visualizer
 * Interactive 3D visualization of string theory with vibrational modes
 * Based on Polchinski Vol 1 and David Tong's lecture notes
 */
import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { StringEngine } from '../modules/strings/StringEngine.js';

export const WorldsheetVisualizer = ({ 
  stringTension = 1,
  stringLength = 1,
  couplingConstant = 0.1,
  numModes = 32,
  numPoints = 64,
  showCompactification = false,
  compactificationRadius = 1,
  showReggeTrajectory = false,
  vibrationFrequency = 1,
  excitationMode = 1,
  excitationAmplitude = 0.1,
  onStringStateChange
}) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const frameRef = useRef(null);
  
  const stringRef = useRef(null);
  const worldsheetRef = useRef(null);
  const trajectoryRef = useRef(null);
  const modeIndicatorsRef = useRef([]);
  
  const [stringState, setStringState] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedMode, setSelectedMode] = useState(1);

  // Initialize String Engine
  const stringEngine = useMemo(() => new StringEngine(), []);

  // Vertex shader for string vibration
  const stringVertexShader = `
    uniform float time;
    uniform float numModes;
    uniform float numPoints;
    uniform float stringLength;
    uniform sampler2D modeTexture;
    uniform bool isCompactified;
    uniform float compactificationRadius;
    
    attribute vec3 position;
    attribute vec2 uv;
    
    varying vec3 vPosition;
    varying vec2 vUv;
    varying float vModeAmplitude;
    
    void main() {
      vPosition = position;
      vUv = uv;
      
      // Calculate string displacement from modes
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
  const stringFragmentShader = `
    uniform float time;
    uniform float numModes;
    uniform float vibrationFrequency;
    uniform sampler2D modeTexture;
    uniform vec3 baseColor;
    
    varying vec3 vPosition;
    varying vec2 vUv;
    varying float vModeAmplitude;
    
    // Simple noise function
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    void main() {
      // Calculate mode intensity based on position
      float modeIntensity = 0.0;
      for (int n = 1; n <= int(numModes); n++) {
        vec2 modeData = texture2D(modeTexture, vec2(
          float(n-1) / float(numModes),
          0.5
        )).rg;
        
        float amplitude = modeData.r;
        float phase = modeData.g;
        
        // Mode contribution at this position
        float sigma = vUv.x;
        float modeShape = sin(float(n) * 3.14159265 * sigma + phase + time * vibrationFrequency);
        modeIntensity += abs(amplitude * modeShape);
      }
      
      // Color based on mode intensity
      vec3 color = mix(baseColor, vec3(1.0, 0.5, 0.2), modeIntensity);
      
      // Add shimmer effect
      float shimmer = noise(vUv * 10.0 + time * 2.0);
      color += shimmer * 0.1;
      
      gl_FragColor = vec4(color, 0.9);
    }
  `;

  // Worldsheet vertex shader
  const worldsheetVertexShader = `
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

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000814);
    scene.fog = new THREE.Fog(0x000814, 50, 200);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 3, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x00ffff, 0.5);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update string engine parameters
  useEffect(() => {
    stringEngine.setStringTension(stringTension);
    stringEngine.setStringLength(stringLength);
    stringEngine.setCouplingConstant(couplingConstant);
    
    if (showCompactification) {
      stringEngine.enableCompactification(compactificationRadius);
    } else {
      stringEngine.disableCompactification();
    }
    
    stringEngine.numModes = numModes;
    stringEngine.numPoints = numPoints;
    stringEngine.initializeModeFrequencies();
  }, [stringTension, stringLength, couplingConstant, showCompactification, compactificationRadius, numModes, numPoints]);

  // Create mode texture for shader
  const createModeTexture = () => {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const index = (i * size + j) * 4;
        
        // Store amplitude in red channel, phase in green channel
        if (i < numModes && j === 0) {
          const amplitude = stringEngine.modeAmplitudes[i] || 0.1;
          const phase = stringEngine.modePhases[i] || 0;
          
          data[index] = Math.floor(amplitude * 255);
          data[index + 1] = Math.floor((phase / (2 * Math.PI)) * 255);
          data[index + 2] = 0;
          data[index + 3] = 255;
        } else {
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          data[index + 3] = 255;
        }
      }
    }
    
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.needsUpdate = true;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    
    return texture;
  };

  // Create string geometry
  const createStringGeometry = () => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const uvs = [];
    
    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * stringLength - stringLength / 2;
      vertices.push(x, 0, 0);
      uvs.push(i / (numModes - 1), 0.5);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    
    return geometry;
  };

  // Create worldsheet geometry
  const createWorldsheetGeometry = () => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const uvs = [];
    const gridSize = 32;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = (i / (gridSize - 1)) * stringLength - stringLength / 2;
        const y = (j / (gridSize - 1)) * stringLength - stringLength / 2;
        vertices.push(x, y, 0);
        uvs.push(i / (numModes - 1), j / (numModes - 1));
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    
    return geometry;
  };

  // Create string mesh
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing objects
    if (stringRef.current) {
      sceneRef.current.remove(stringRef.current);
    }
    if (worldsheetRef.current) {
      sceneRef.current.remove(worldsheetRef.current);
    }
    if (trajectoryRef.current) {
      sceneRef.current.remove(trajectoryRef.current);
    }
    modeIndicatorsRef.current.forEach(indicator => {
      if (indicator) sceneRef.current.remove(indicator);
    });

    // Create mode texture
    const modeTexture = createModeTexture();

    // String material with shader
    const stringMaterial = new THREE.ShaderMaterial({
      vertexShader: stringVertexShader,
      fragmentShader: stringFragmentShader,
      uniforms: {
        time: { value: 0 },
        numModes: { value: numModes },
        numPoints: { value: numPoints },
        stringLength: { value: stringLength },
        modeTexture: { value: modeTexture },
        isCompactified: { value: showCompactification },
        compactificationRadius: { value: compactificationRadius },
        vibrationFrequency: { value: vibrationFrequency },
        baseColor: { value: new THREE.Color(0x00ff88) }
      },
      transparent: true,
      side: THREE.DoubleSide
    });

    const stringGeometry = createStringGeometry();
    const string = new THREE.Line(stringGeometry, stringMaterial);
    sceneRef.current.add(string);
    stringRef.current = string;

    // Worldsheet material
    const worldsheetMaterial = new THREE.ShaderMaterial({
      vertexShader: worldsheetVertexShader,
      fragmentShader: stringFragmentShader,
      uniforms: {
        time: { value: 0 },
        numModes: { value: numModes },
        stringLength: { value: stringLength },
        modeTexture: { value: modeTexture },
        showExtraDimensions: { value: true },
        vibrationFrequency: { value: vibrationFrequency },
        baseColor: { value: new THREE.Color(0x8800ff) }
      },
      transparent: true,
      side: THREE.DoubleSide
    });

    const worldsheetGeometry = createWorldsheetGeometry();
    const worldsheet = new THREE.Mesh(worldsheetGeometry, worldsheetMaterial);
    worldsheet.position.z = -2;
    sceneRef.current.add(worldsheet);
    worldsheetRef.current = worldsheet;

    // Create mode indicators
    const modeIndicators = [];
    for (let n = 1; n <= Math.min(numModes, 8); n++) {
      const geometry = new THREE.SphereGeometry(0.1, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL((n - 1) / numModes, 1, 0.5),
        transparent: true,
        opacity: n === selectedMode ? 1.0 : 0.3
      });
      
      const indicator = new THREE.Mesh(geometry, material);
      indicator.position.set(
        -3 + n * 0.3,
        2 + Math.sin(n) * 0.5,
        0
      );
      
      sceneRef.current.add(indicator);
      modeIndicators.push(indicator);
    }
    modeIndicatorsRef.current = modeIndicators;

    // Create Regge trajectory visualization
    if (showReggeTrajectory) {
      const trajectoryGeometry = new THREE.BufferGeometry();
      const trajectoryPoints = [];
      
      for (let i = 0; i < 100; i++) {
        const j = i / 100 * 10; // Angular momentum from 0 to 10
        const m2 = j * j + 1; // Mass squared from 1 to 101
        trajectoryPoints.push(new THREE.Vector3(j, Math.sqrt(m2), 0));
      }
      
      trajectoryGeometry.setFromPoints(trajectoryPoints);
      
      const trajectoryMaterial = new THREE.LineBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.6
      });
      
      const trajectory = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
      sceneRef.current.add(trajectory);
      trajectoryRef.current = trajectory;
    }

  }, [stringTension, stringLength, numModes, numPoints, showCompactification, compactificationRadius, vibrationFrequency, selectedMode, showReggeTrajectory]);

  // Update string state
  useEffect(() => {
    const state = stringEngine.getStringState();
    setStringState(state);
    
    if (onStringStateChange) {
      onStringStateChange(state);
    }
  }, [stringEngine]);

  // Excite specific mode
  useEffect(() => {
    stringEngine.exciteMode(excitationMode, excitationAmplitude);
  }, [excitationMode, excitationAmplitude]);

  // Animation loop
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      // Update string simulation
      if (isPlaying) {
        stringEngine.updateSimulation();
      }

      // Update shader uniforms
      if (stringRef.current && stringRef.current.material.uniforms) {
        stringRef.current.material.uniforms.time.value = stringEngine.time;
        
        // Update mode texture periodically
        if (Math.floor(stringEngine.time * 10) % 10 === 0) {
          const modeTexture = createModeTexture();
          stringRef.current.material.uniforms.modeTexture.value = modeTexture;
        }
      }

      if (worldsheetRef.current && worldsheetRef.current.material.uniforms) {
        worldsheetRef.current.material.uniforms.time.value = stringEngine.time;
      }

      // Update mode indicators
      modeIndicatorsRef.current.forEach((indicator, index) => {
        const modeIndex = index + 1;
        const amplitude = stringEngine.modeAmplitudes[modeIndex - 1] || 0;
        
        indicator.scale.setScalar(1 + amplitude * 2);
        
        // Highlight selected mode
        if (modeIndex === selectedMode) {
          indicator.material.opacity = 1.0;
          indicator.material.emissive = new THREE.Color(0x00ff88);
        } else {
          indicator.material.opacity = 0.3;
          indicator.material.emissive = new THREE.Color(0x000000);
        }
      });

      // Camera rotation
      const time = Date.now() * 0.0005;
      cameraRef.current.position.x = Math.cos(time) * 8;
      cameraRef.current.position.z = Math.sin(time) * 8;
      cameraRef.current.lookAt(0, 0, 0);

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isPlaying, stringEngine, selectedMode]);

  return (
    <div className="worldsheet-visualizer" style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Control Panel */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '20px',
        borderRadius: '10px',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '12px',
        minWidth: '350px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#00ff88' }}>String Theory</h3>
        
        {stringState && (
          <div style={{ marginBottom: '15px' }}>
            <div>String Energy: {stringState.energy.toFixed(6)}</div>
            <div>String Tension: {stringState.tension.toFixed(3)}</div>
            <div>Wave Speed: {stringState.waveSpeed.toFixed(3)}</div>
            <div>Polchinski Action: {stringState.polchinskiAction.toFixed(6)}</div>
            <div>Compactified: {stringState.isCompactified ? 'Yes' : 'No'}</div>
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            String Tension:
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={stringTension}
            onChange={(e) => onStringStateChange && onStringStateChange({
              ...stringState,
              tension: parseFloat(e.target.value)
            })}
            style={{ width: '100%' }}
          />
          <div style={{ textAlign: 'center', marginTop: '5px' }}>
            {stringTension.toFixed(2)}
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Vibration Frequency:
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={vibrationFrequency}
            onChange={(e) => setVibrationFrequency(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ textAlign: 'center', marginTop: '5px' }}>
            {vibrationFrequency.toFixed(2)}
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Number of Modes:
          </label>
          <input
            type="range"
            min="1"
            max="64"
            step="1"
            value={numModes}
            onChange={(e) => onStringStateChange && onStringStateChange({
              ...stringState,
              numModes: parseInt(e.target.value)
            })}
            style={{ width: '100%' }}
          />
          <div style={{ textAlign: 'center', marginTop: '5px' }}>
            {numModes}
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Excitation Mode:
          </label>
          <input
            type="range"
            min="1"
            max={Math.min(numModes, 16)}
            step="1"
            value={excitationMode}
            onChange={(e) => setExcitationMode(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ textAlign: 'center', marginTop: '5px' }}>
            Mode {excitationMode}
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Excitation Amplitude:
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={excitationAmplitude}
            onChange={(e) => setExcitationAmplitude(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ textAlign: 'center', marginTop: '5px' }}>
            {excitationAmplitude.toFixed(3)}
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <input
              type="checkbox"
              checked={showCompactification}
              onChange={(e) => onStringStateChange && onStringStateChange({
                ...stringState,
                isCompactified: e.target.checked
              })}
              style={{ marginRight: '8px' }}
            />
            Compactification
          </label>
          {showCompactification && (
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={compactificationRadius}
              onChange={(e) => onStringStateChange && onStringStateChange({
                ...stringState,
                compactificationRadius: parseFloat(e.target.value)
              })}
              style={{ marginLeft: '10px', width: '100px' }}
            />
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <input
              type="checkbox"
              checked={showReggeTrajectory}
              onChange={(e) => onStringStateChange && onStringStateChange({
                ...stringState,
                showReggeTrajectory: e.target.checked
              })}
              style={{ marginRight: '8px' }}
            />
            Show Regge Trajectory
          </label>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              padding: '10px 20px',
              backgroundColor: isPlaying ? '#ff4444' : '#44ff44',
              border: 'none',
              borderRadius: '5px',
              color: 'white',
              cursor: 'pointer',
              width: '100%',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
        </div>

        <div style={{ marginTop: '10px' }}>
          <button
            onClick={() => {
              stringEngine.reset();
              if (onStringStateChange) {
                onStringStateChange(stringEngine.getStringState());
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4444ff',
              border: 'none',
              borderRadius: '5px',
              color: 'white',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            🔄 Reset String
          </button>
        </div>

        <div style={{ marginTop: '10px' }}>
          <button
            onClick={() => {
              stringEngine.addQuantumFluctuation(0.05);
              if (onStringStateChange) {
                onStringStateChange(stringEngine.getStringState());
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ff44ff',
              border: 'none',
              borderRadius: '5px',
              color: 'white',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            ⚛️ Add Quantum Fluctuation
          </button>
        </div>
      </div>
    </div>
  );
};
