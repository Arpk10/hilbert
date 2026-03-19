# Hilbert Theoretical Core

A comprehensive physics simulation framework combining General Relativity and Computational Fluid Dynamics, implementing the Hilbert specification for theoretical physics computations.

## Features

### Mathematical Framework
- **Coordinate Systems**: Spherical $(r, \theta, \phi)$ and Cartesian $(x, y, z)$ transformations
- **Metric Signature**: Lorentzian $(- + + +)$
- **Tensor Operations**: 4×4 matrix operations for General Relativity
- **Precision**: Float64 (Double) for all calculations to prevent numerical drift

### General Relativity Module
- **Schwarzschild Metric**: Complete implementation with geodesic integration
- **Christoffel Symbols**: Automatic calculation for curved spacetime
- **Geodesic Integration**: 4th-order Runge-Kutta for particle trajectories
- **Research Applications**: Spacetime singularities and D-brane cosmology

### Fluid Mechanics (Lattice Boltzmann)
- **D2Q9 Model**: 2D lattice with 9 velocity directions
- **D3Q19 Model**: 3D lattice with 19 velocity directions
- **BGK Collision**: Single relaxation time approximation
- **Boundary Conditions**: Bounce-back for solid walls

### Visualization
- **Three.js Integration**: Real-time WebGL rendering
- **Spacetime Curvature**: Visual representation of gravitational fields
- **Geodesic Trajectories**: Particle paths in curved spacetime
- **Fluid Dynamics**: Real-time LBM visualization

## Installation

```bash
npm install
```

## Usage

### Basic Simulation

```javascript
import { HilbertCore } from './src/index.js';

const hilbert = new HilbertCore();
hilbert.initialize();

// Run Schwarzschild geodesic simulation
const initialState = [0, 10, Math.PI/2, 0, 1, 0, 0, 0.1]; // [t, r, θ, φ, dt/dτ, dr/dτ, dθ/dτ, dφ/dτ]
const mass = 1.989e30; // Solar mass
const trajectory = hilbert.schwarzschild.integrateGeodesic(initialState, mass);

// Visualize results
hilbert.visualization.visualizeSpacetime(mass);
hilbert.visualization.visualizeGeodesics([trajectory]);
hilbert.visualization.start();
```

### Fluid Dynamics Simulation

```javascript
// Initialize LBM simulation
const nx = 100, ny = 50, nz = 1;
const flowField = hilbert.lbm.initializeFlowField(nx, ny, nz, 1.0, [0.1, 0, 0]);

// Run simulation steps
for (let step = 0; step < 1000; step++) {
  flowField.f = hilbert.lbm.timeStep(flowField.f, flowField.boundary);
}

// Extract macroscopic quantities
const densityField = [];
const velocityField = [];
for (let x = 0; x < nx; x++) {
  for (let y = 0; y < ny; y++) {
    const fNode = hilbert.lbm.getDistributionAtNode(flowField.f, x, y);
    const rho = hilbert.lbm.calculateDensity(fNode);
    const u = hilbert.lbm.calculateVelocity(fNode, rho);
    
    densityField[x][y] = rho;
    velocityField[x][y] = u;
  }
}

// Visualize fluid
hilbert.visualization.visualizeFluid(densityField, velocityField);
```

## Architecture

```
src/
├── index.js                 # Main entry point
├── math/
│   ├── coordinates.js       # Coordinate transformations
│   └── tensor.js           # Tensor operations
├── relativity/
│   └── schwarzschild.js    # Schwarzschild metric & geodesics
├── fluid/
│   └── lattice-boltzmann.js # LBM implementation
└── visualization/
    └── renderer.js         # Three.js visualization
```

## Mathematical Foundations

### Schwarzschild Metric
$$ds^2 = -\left(1-\frac{r_s}{r}\right)c^2dt^2 + \left(1-\frac{r_s}{r}\right)^{-1}dr^2 + r^2(d\theta^2 + \sin^2\theta d\phi^2)$$

where $r_s = \frac{2GM}{c^2}$ is the Schwarzschild radius.

### Christoffel Symbols
$$\Gamma^\sigma_{\mu\nu} = \frac{1}{2}g^{\sigma\rho}(\partial_\mu g_{\rho\nu} + \partial_\nu g_{\rho\mu} - \partial_\rho g_{\mu\nu})$$

### Lattice Boltzmann BGK Equation
$$f_i(\vec{x} + \vec{e}_i\Delta t, t + \Delta t) - f_i(\vec{x}, t) = -\frac{1}{\tau}(f_i(\vec{x}, t) - f_i^{eq}(\vec{x}, t))$$

### Macroscopic Variables
- Density: $\rho = \sum f_i$
- Momentum: $\rho\vec{u} = \sum f_i\vec{e}_i$

## References

- Misner, Thorne, & Wheeler - *Gravitation*
- Anderson - *Computational Fluid Dynamics: The Basics with Applications*
- He & Luo - *Lattice Boltzmann Method for Fluid Flows*

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes with proper documentation
4. Add tests for new functionality
5. Submit a pull request

## Performance Notes

- All tensor calculations use Float64 precision
- Lattice Boltzmann is optimized for sparse grids
- Three.js rendering uses efficient buffer geometries
- Geodesic integration uses adaptive step sizing for accuracy
