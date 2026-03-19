/**
 * Horizon Visualizer Component
 * Three.js rendering for Black Hole Physics and Hawking Radiation
 */
import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { BlackHoleEngine } from '../modules/cosmos/BlackHoleEngine.js';

export const HorizonVisualizer = ({ 
  mass = 1.989e30, 
  onMassChange,
  enableEvaporation = false,
  showVacuumFluctuations = true,
  showPhotonRing = true,
  showLightBending = true,
  simulationSpeed = 1e50,
  onExplosion = null
}) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const frameRef = useRef(null);
  
  const blackHoleRef = useRef(null);
  const particlesRef = useRef([]);
  const vacuumFieldRef = useRef(null);
  const photonRingRef = useRef(null);
  const lightRaysRef = useRef([]);
  
  const [blackHoleState, setBlackHoleState] = useState(null);
  const [isEvaporating, setIsEvaporating] = useState(false);
  const [explosion, setExplosion] = useState(null);
  const [evaporationProgress, setEvaporationProgress] = useState(0);

  // Initialize Black Hole Engine
  const blackHoleEngine = useMemo(() => new BlackHoleEngine(), []);

  // Vertex shader for gravitational redshift effect
  const redshiftVertexShader = `
    varying vec3 vPosition;
    varying float vDistance;
    uniform float schwarzschildRadius;
    uniform float time;
    
    void main() {
      vPosition = position;
      vDistance = length(position);
      
      // Apply gravitational time dilation near horizon
      float redshiftFactor = 1.0 - schwarzschildRadius / vDistance;
      vec3 newPosition = position * (1.0 + 0.1 * sin(time * 2.0) / redshiftFactor);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `;

  // Fragment shader for vacuum fluctuations
  const vacuumFragmentShader = `
    varying vec3 vPosition;
    varying float vDistance;
    uniform float schwarzschildRadius;
    uniform float hawkingTemperature;
    uniform float time;
    
    // Simple noise function for vacuum fluctuations
    float noise(vec3 p) {
      return sin(p.x * 10.0 + time) * sin(p.y * 10.0 + time) * sin(p.z * 10.0 + time);
    }
    
    void main() {
      // Calculate vacuum fluctuation intensity near horizon
      float horizonProximity = 1.0 - smoothstep(schwarzschildRadius, schwarzschildRadius * 3.0, vDistance);
      float fluctuation = noise(vPosition * 5.0 + time) * horizonProximity;
      
      // Color based on temperature and fluctuations
      vec3 baseColor = vec3(0.1, 0.0, 0.2); // Deep purple
      vec3 hotColor = vec3(1.0, 0.5, 0.0); // Orange for Hawking radiation
      
      vec3 finalColor = mix(baseColor, hotColor, horizonProximity * hawkingTemperature * 1e30);
      finalColor += fluctuation * 0.2;
      
      gl_FragColor = vec4(finalColor, 0.8);
    }
  `;

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize Three.js scene
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
    camera.position.set(30, 20, 30);
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
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

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

  // Update black hole mass and properties
  useEffect(() => {
    blackHoleEngine.setMass(mass);
    blackHoleEngine.setSimulationSpeed(simulationSpeed);
    const state = blackHoleEngine.getSimulationState();
    setBlackHoleState(state);
    setEvaporationProgress(state.evaporationProgress);
  }, [mass, simulationSpeed, blackHoleEngine]);

  // Create black hole horizon
  useEffect(() => {
    if (!sceneRef.current || !blackHoleState) return;

    // Remove existing black hole
    if (blackHoleRef.current) {
      sceneRef.current.remove(blackHoleRef.current);
    }

    // Create event horizon sphere with dynamic scaling
    const horizonGeometry = new THREE.SphereGeometry(
      1, // Unit radius for scaling
      32,
      32
    );
    const horizonMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000,
      transparent: true,
      opacity: 1.0
    });

    const blackHole = new THREE.Mesh(horizonGeometry, horizonMaterial);
    
    // Scale based on current Schwarzschild radius
    const scaleFactor = blackHoleState.schwarzschildRadius * 1e10;
    blackHole.scale.set(scaleFactor, scaleFactor, scaleFactor);
    
    blackHole.castShadow = true;
    blackHole.receiveShadow = true;
    sceneRef.current.add(blackHole);
    blackHoleRef.current = blackHole;

  }, [blackHoleState]);

  // Create vacuum fluctuation field
  useEffect(() => {
    if (!sceneRef.current || !blackHoleState || !showVacuumFluctuations) return;

    // Remove existing vacuum field
    if (vacuumFieldRef.current) {
      sceneRef.current.remove(vacuumFieldRef.current);
    }

    // Create vacuum field with shader
    const fieldGeometry = new THREE.SphereGeometry(
      blackHoleState.schwarzschildRadius * 3e10, // Larger sphere for vacuum field
      32,
      32
    );

    const fieldMaterial = new THREE.ShaderMaterial({
      vertexShader: redshiftVertexShader,
      fragmentShader: vacuumFragmentShader,
      uniforms: {
        schwarzschildRadius: { value: blackHoleState.schwarzschildRadius * 1e10 },
        hawkingTemperature: { value: blackHoleState.hawkingTemperature },
        time: { value: 0 },
        mass: { value: blackHoleState.mass },
        isEvaporating: { value: blackHoleState.isEvaporating },
        evaporationProgress: { value: blackHoleState.evaporationProgress }
      },
      transparent: true,
      side: THREE.DoubleSide
    });

    const vacuumField = new THREE.Mesh(fieldGeometry, fieldMaterial);
    sceneRef.current.add(vacuumField);
    vacuumFieldRef.current = vacuumField;

  }, [blackHoleState, showVacuumFluctuations]);

  // Create photon ring
  useEffect(() => {
    if (!sceneRef.current || !blackHoleState || !showPhotonRing) return;

    // Remove existing photon ring
    if (photonRingRef.current) {
      sceneRef.current.remove(photonRingRef.current);
    }

    const photonData = blackHoleEngine.generatePhotonRing();
    const ringGeometry = new THREE.BufferGeometry().setFromPoints(
      photonData.ringPoints.map(point => new THREE.Vector3(
        point[0] * 1e10,
        point[1] * 1e10,
        point[2] * 1e10
      ))
    );

    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0xffaa00,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });

    const photonRing = new THREE.Line(ringGeometry, ringMaterial);
    sceneRef.current.add(photonRing);
    photonRingRef.current = photonRing;

  }, [blackHoleState, showPhotonRing]);

  // Create Hawking radiation particles
  const createHawkingParticles = () => {
    if (!sceneRef.current || !blackHoleState) return;

    // Clear existing particles
    particlesRef.current.forEach(particle => {
      sceneRef.current.remove(particle.mesh);
    });
    particlesRef.current = [];

    // Create new particles based on emission rate
    const numParticles = Math.min(Math.floor(blackHoleState.particleEmissionRate * 0.001), 50);
    const virtualPairs = blackHoleEngine.createVirtualPairs(numParticles);

    virtualPairs.forEach(particleData => {
      if (particleData.type === 'positive') { // Only visualize escaping particles
        const particleGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(
            0.1 - particleData.energy * 1e28, // Color based on energy
            1.0,
            0.5
          ),
          transparent: true,
          opacity: particleData.probability
        });

        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.set(
          particleData.position[0] * 1e10,
          particleData.position[1] * 1e10,
          particleData.position[2] * 1e10
        );

        // Set escape velocity
        particle.velocity = new THREE.Vector3(
          particleData.escapeDirection[0] * 5,
          particleData.escapeDirection[1] * 5,
          particleData.escapeDirection[2] * 5
        );

        sceneRef.current.add(particle);
        particlesRef.current.push({
          mesh: particle,
          lifetime: 100,
          data: particleData
        });
      }
    });
  };

  // Create light bending rays
  const createLightRays = () => {
    if (!sceneRef.current || !blackHoleState || !showLightBending) return;

    // Clear existing light rays
    lightRaysRef.current.forEach(ray => {
      sceneRef.current.remove(ray);
    });
    lightRaysRef.current = [];

    // Create light rays passing near black hole
    const numRays = 20;
    for (let i = 0; i < numRays; i++) {
      const impactParameter = blackHoleState.schwarzschildRadius * (1.5 + i * 0.5) * 1e10;
      const startPosition = new THREE.Vector3(-50, impactParameter, 0);
      const initialDirection = new THREE.Vector3(1, 0, 0).normalize();

      const trajectory = blackHoleEngine.calculateNullGeodesic(
        [startPosition.x, startPosition.y, startPosition.z],
        [initialDirection.x, initialDirection.y, initialDirection.z],
        500,
        0.2
      );

      const rayGeometry = new THREE.BufferGeometry().setFromPoints(
        trajectory.map(point => new THREE.Vector3(
          point[0] * 1e10,
          point[1] * 1e10,
          point[2] * 1e10
        ))
      );

      const rayMaterial = new THREE.LineBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.3
      });

      const ray = new THREE.Line(rayGeometry, rayMaterial);
      sceneRef.current.add(ray);
      lightRaysRef.current.push(ray);
    }
  };

  // Update particles and effects
  useEffect(() => {
    createHawkingParticles();
    createLightRays();
  }, [blackHoleState, showVacuumFluctuations, showPhotonRing, showLightBending]);

  // Animation loop with dynamic evaporation
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      // Update vacuum field shader time
      if (vacuumFieldRef.current && vacuumFieldRef.current.material.uniforms) {
        vacuumFieldRef.current.material.uniforms.time.value += 0.01;
        
        // Update mass-dependent uniforms
        if (blackHoleState) {
          vacuumFieldRef.current.material.uniforms.mass.value = blackHoleState.mass;
          vacuumFieldRef.current.material.uniforms.isEvaporating.value = blackHoleState.isEvaporating;
          vacuumFieldRef.current.material.uniforms.evaporationProgress.value = blackHoleState.evaporationProgress;
        }
      }

      // Dynamic evaporation
      if (enableEvaporation && isEvaporating && blackHoleState) {
        const massLoss = blackHoleEngine.calculateEvaporation(0.016); // ~60fps timestep
        const newState = blackHoleEngine.getSimulationState();
        setBlackHoleState(newState);
        setEvaporationProgress(newState.evaporationProgress);

        // Check for explosion
        if (blackHoleEngine.shouldExplode()) {
          const explosionData = blackHoleEngine.triggerExplosion();
          setExplosion(explosionData);
          setIsEvaporating(false);
          if (onExplosion) onExplosion(explosionData);
        }

        // Update black hole scale
        if (blackHoleRef.current) {
          const scaleFactor = newState.schwarzschildRadius * 1e10;
          blackHoleRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }
      }

      // Update particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.mesh.position.add(particle.mesh.velocity);
        particle.lifetime--;

        // Remove old particles
        if (particle.lifetime <= 0) {
          sceneRef.current.remove(particle.mesh);
          return false;
        }
        return true;
      });

      // Render explosion effect
      if (explosion) {
        // Create explosion particles
        explosion.particleCount = Math.min(explosion.particleCount, 500); // Limit for performance
        
        for (let i = 0; i < explosion.particleCount; i++) {
          const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
          const colorIndex = i % explosion.colors.length;
          const particleMaterial = new THREE.MeshBasicMaterial({
            color: explosion.colors[colorIndex],
            transparent: true,
            opacity: 1.0
          });

          const particle = new THREE.Mesh(particleGeometry, particleMaterial);
          
          // Random explosion direction
          const theta = Math.random() * 2 * Math.PI;
          const phi = Math.acos(2 * Math.random() - 1);
          const speed = 5 + Math.random() * 10;
          
          particle.position.set(
            explosion.position[0],
            explosion.position[1],
            explosion.position[2]
          );
          
          particle.velocity = new THREE.Vector3(
            speed * Math.sin(phi) * Math.cos(theta),
            speed * Math.sin(phi) * Math.sin(theta),
            speed * Math.cos(phi)
          );
          
          sceneRef.current.add(particle);
          particlesRef.current.push({
            mesh: particle,
            lifetime: 100 + Math.random() * 100,
            isExplosion: true
          });
        }

        // Create shockwave
        const shockwaveGeometry = new THREE.RingGeometry(
          explosion.shockwaveRadius * 1e10,
          0.1,
          32
        );
        const shockwaveMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        });
        
        const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
        shockwave.position.set(...explosion.position);
        sceneRef.current.add(shockwave);
        
        // Animate shockwave expansion
        const animateShockwave = () => {
          shockwave.geometry.scale.x += 0.5;
          shockwave.geometry.scale.y += 0.5;
          shockwave.material.opacity -= 0.02;
          
          if (shockwave.material.opacity > 0) {
            sceneRef.current.remove(shockwave);
          } else {
            requestAnimationFrame(animateShockwave);
          }
        };
        animateShockwave();
        
        setExplosion(null);
      }

      // Camera rotation
      const time = Date.now() * 0.0005;
      cameraRef.current.position.x = Math.cos(time) * 50;
      cameraRef.current.position.z = Math.sin(time) * 50;
      cameraRef.current.lookAt(0, 0, 0);

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [enableEvaporation, isEvaporating, blackHoleState, explosion, onExplosion]);

  return (
    <div className="horizon-visualizer" style={{ width: '100%', height: '100vh', position: 'relative' }}>
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
        minWidth: '300px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#00ff88' }}>Black Hole Physics</h3>
        
        {blackHoleState && (
          <div style={{ marginBottom: '15px' }}>
            <div>Mass: {(blackHoleState.mass / 1.989e30).toFixed(2)} M☉</div>
            <div>Schwarzschild Radius: {(blackHoleState.schwarzschildRadius / 1000).toFixed(2)} km</div>
            <div>Hawking Temperature: {blackHoleState.hawkingTemperature.toExponential(2)} K</div>
            <div>Evaporation Time: {(blackHoleState.evaporationTime / (365.25 * 24 * 3600)).toExponential(2)} years</div>
            <div>Surface Gravity: {blackHoleState.surfaceGravity.toFixed(2)} m/s²</div>
            <div>Emission Rate: {blackHoleState.particleEmissionRate.toExponential(2)} particles/s</div>
            <div>Evaporation Progress: {(evaporationProgress * 100).toFixed(1)}%</div>
            {blackHoleState.isEvaporating && (
              <div style={{ color: '#ff6666', fontWeight: 'bold' }}>
                ⚠️ EVAPORATING - Temperature rising exponentially!
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Black Hole Mass (Solar Masses):
          </label>
          <input
            type="range"
            min="0.1"
            max="100"
            step="0.1"
            value={mass / 1.989e30}
            onChange={(e) => onMassChange && onMassChange(parseFloat(e.target.value) * 1.989e30)}
            style={{ width: '100%' }}
          />
          <div style={{ textAlign: 'center', marginTop: '5px' }}>
            {(mass / 1.989e30).toFixed(1)} M☉
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Simulation Speed (Evaporation Rate):
          </label>
          <input
            type="range"
            min="1"
            max="1e60"
            step="1e50"
            value={simulationSpeed}
            onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '10px' }}>
            {simulationSpeed.toExponential(0)}x normal speed
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={() => {
              if (isEvaporating) {
                blackHoleEngine.stopEvaporation();
                setIsEvaporating(false);
              } else {
                blackHoleEngine.startEvaporation();
                setIsEvaporating(true);
              }
            }}
            disabled={!enableEvaporation}
            style={{
              padding: '8px 16px',
              backgroundColor: isEvaporating ? '#ff4444' : '#44ff44',
              border: 'none',
              borderRadius: '5px',
              color: 'white',
              cursor: enableEvaporation ? 'pointer' : 'not-allowed',
              width: '100%'
            }}
          >
            {isEvaporating ? '⏸️ Stop Evaporation' : '▶️ Start Evaporation'}
          </button>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={() => {
              blackHoleEngine.resetSimulation(mass);
              setIsEvaporating(false);
              setExplosion(null);
              setEvaporationProgress(0);
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
            🔄 Reset Simulation
          </button>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            <input
              type="checkbox"
              checked={showVacuumFluctuations}
              onChange={(e) => setShowVacuumFluctuations(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Show Vacuum Fluctuations
          </label>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            <input
              type="checkbox"
              checked={showPhotonRing}
              onChange={(e) => setShowPhotonRing(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Show Photon Ring
          </label>
          <label style={{ display: 'block' }}>
            <input
              type="checkbox"
              checked={showLightBending}
              onChange={(e) => setShowLightBending(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Show Light Bending
          </label>
        </div>
      </div>
    </div>
  );
};
