/**
 * Schwarzschild Metric and Geodesic Calculations
 * Implements the Schwarzschild solution for General Relativity
 */
export class SchwarzschildMetric {
  constructor() {
    this.G = 6.67430e-11; // Gravitational constant (m³/kg·s²)
    this.c = 299792458; // Speed of light (m/s)
    this.precision = Float64Array;
  }

  /**
   * Initialize Schwarzschild metric calculations
   */
  initialize() {
    console.log('Schwarzschild metric initialized');
  }

  /**
   * Calculate Schwarzschild radius
   * @param {number} M - Mass (kg)
   * @returns {number} Schwarzschild radius (m)
   */
  schwarzschildRadius(M) {
    return (2 * this.G * M) / (this.c * this.c);
  }

  /**
   * Calculate Schwarzschild metric tensor g_μν
   * @param {number} r - Radial coordinate (m)
   * @param {number} M - Mass (kg)
   * @returns {number[]} 4x4 metric tensor (flat array)
   */
  metricTensor(r, M) {
    const rs = this.schwarzschildRadius(M);
    const factor = 1 - rs / r;
    
    // Schwarzschild metric: ds² = -(1-rs/r)c²dt² + (1-rs/r)⁻¹dr² + r²(dθ² + sin²θ dφ²)
    const metric = new this.precision(16);
    
    // g_tt = -(1 - rs/r)
    metric[0] = -factor;
    
    // g_rr = (1 - rs/r)⁻¹
    metric[5] = 1 / factor;
    
    // g_θθ = r²
    metric[10] = r * r;
    
    // g_φφ = r² sin²θ (θ = π/2 for equatorial plane)
    metric[15] = r * r; // Assuming θ = π/2, sin²(π/2) = 1
    
    return metric;
  }

  /**
   * Calculate inverse metric tensor g^μν
   * @param {number} r - Radial coordinate (m)
   * @param {number} M - Mass (kg)
   * @returns {number[]} 4x4 inverse metric tensor (flat array)
   */
  inverseMetricTensor(r, M) {
    const rs = this.schwarzschildRadius(M);
    const factor = 1 - rs / r;
    
    const inverseMetric = new this.precision(16);
    
    // g^tt = -(1 - rs/r)⁻¹
    inverseMetric[0] = -1 / factor;
    
    // g^rr = (1 - rs/r)
    inverseMetric[5] = factor;
    
    // g^θθ = 1/r²
    inverseMetric[10] = 1 / (r * r);
    
    // g^φφ = 1/(r² sin²θ)
    inverseMetric[15] = 1 / (r * r); // Assuming θ = π/2
    
    return inverseMetric;
  }

  /**
   * Calculate Christoffel symbols Γ^σ_μν
   * @param {number} r - Radial coordinate (m)
   * @param {number} M - Mass (kg)
   * @returns {number[]} Christoffel symbols (4x4x4 tensor, flat array)
   */
  christoffelSymbols(r, M) {
    const rs = this.schwarzschildRadius(M);
    const factor = 1 - rs / r;
    
    // Γ^σ_μν stored as [σ][μ][ν] in flat array (64 elements)
    const christoffel = new this.precision(64);
    
    // Non-zero Christoffel symbols for Schwarzschild metric
    // Γ^t_tr = Γ^t_rt = rs/(2r²(1-rs/r))
    christoffel[1] = rs / (2 * r * r * factor);
    christoffel[4] = christoffel[1];
    
    // Γ^r_tt = rs c²/(2r³(1-rs/r))
    christoffel[16] = rs * this.c * this.c / (2 * r * r * r * factor);
    
    // Γ^r_rr = -rs/(2r²(1-rs/r))
    christoffel[21] = -rs / (2 * r * r * factor);
    
    // Γ^r_θθ = -r(1-rs/r)
    christoffel[26] = -r * factor;
    
    // Γ^r_φφ = -r(1-rs/r)sin²θ (θ = π/2)
    christoffel[31] = -r * factor;
    
    // Γ^θ_rθ = Γ^θ_θr = 1/r
    christoffel[34] = 1 / r;
    christoffel[38] = 1 / r;
    
    // Γ^θ_φφ = -sinθ cosθ (θ = π/2, so this is 0)
    
    // Γ^φ_rφ = Γ^φ_φr = 1/r
    christoffel[51] = 1 / r;
    christoffel[55] = 1 / r;
    
    // Γ^φ_θφ = Γ^φ_φθ = cotθ (θ = π/2, so this is 0)
    
    return christoffel;
  }

  /**
   * Integrate geodesic equations using Runge-Kutta 4th order
   * @param {number[]} initialState - [t, r, θ, φ, dt/dτ, dr/dτ, dθ/dτ, dφ/dτ]
   * @param {number} M - Mass (kg)
   * @param {number} stepSize - Integration step size
   * @param {number} steps - Number of integration steps
   * @returns {number[][]} Array of geodesic points
   */
  integrateGeodesic(initialState, M, stepSize = 0.001, steps = 1000) {
    const trajectory = [];
    let state = [...initialState];
    
    for (let i = 0; i < steps; i++) {
      trajectory.push([...state]);
      
      // RK4 integration
      const k1 = this.geodesicEquations(state, M);
      const k2 = this.geodesicEquations(this.addArrays(state, this.scaleArray(k1, stepSize/2)), M);
      const k3 = this.geodesicEquations(this.addArrays(state, this.scaleArray(k2, stepSize/2)), M);
      const k4 = this.geodesicEquations(this.addArrays(state, this.scaleArray(k3, stepSize)), M);
      
      const derivative = this.addArrays(
        this.addArrays(k1, k4),
        this.scaleArray(this.addArrays(k2, k3), 2)
      );
      
      state = this.addArrays(state, this.scaleArray(derivative, stepSize/6));
    }
    
    return trajectory;
  }

  /**
   * Geodesic equations d²x^μ/dτ² = -Γ^μ_αβ (dx^α/dτ)(dx^β/dτ)
   * @param {number[]} state - Current state [t, r, θ, φ, dt/dτ, dr/dτ, dθ/dτ, dφ/dτ]
   * @param {number} M - Mass (kg)
   * @returns {number[]} Derivatives [dt/dτ, dr/dτ, dθ/dτ, dφ/dτ, d²t/dτ², d²r/dτ², d²θ/dτ², d²φ/dτ²]
   */
  geodesicEquations(state, M) {
    const r = state[1];
    const fourVelocity = state.slice(4, 8);
    const christoffel = this.christoffelSymbols(r, M);
    
    const derivatives = new this.precision(8);
    
    // First derivatives (four-velocity)
    for (let i = 0; i < 4; i++) {
      derivatives[i] = fourVelocity[i];
    }
    
    // Second derivatives (four-acceleration)
    for (let mu = 0; mu < 4; mu++) {
      let acceleration = 0;
      for (let alpha = 0; alpha < 4; alpha++) {
        for (let beta = 0; beta < 4; beta++) {
          acceleration -= christoffel[mu * 16 + alpha * 4 + beta] * fourVelocity[alpha] * fourVelocity[beta];
        }
      }
      derivatives[mu + 4] = acceleration;
    }
    
    return derivatives;
  }

  /**
   * Helper function: add two arrays
   */
  addArrays(a, b) {
    const result = new this.precision(a.length);
    for (let i = 0; i < a.length; i++) {
      result[i] = a[i] + b[i];
    }
    return result;
  }

  /**
   * Helper function: scale array by scalar
   */
  scaleArray(a, scalar) {
    const result = new this.precision(a.length);
    for (let i = 0; i < a.length; i++) {
      result[i] = a[i] * scalar;
    }
    return result;
  }
}
