/**
 * Coordinate System Transformations
 * Handles spherical and Cartesian coordinate transformations
 */
export class CoordinateSystem {
  constructor() {
    this.precision = Float64Array;
  }

  /**
   * Initialize coordinate system
   */
  initialize() {
    console.log('Coordinate system initialized with Float64 precision');
  }

  /**
   * Convert spherical to Cartesian coordinates
   * @param {number} r - radial distance
   * @param {number} theta - polar angle (0 to π)
   * @param {number} phi - azimuthal angle (0 to 2π)
   * @returns {number[]} [x, y, z] Cartesian coordinates
   */
  sphericalToCartesian(r, theta, phi) {
    const x = r * Math.sin(theta) * Math.cos(phi);
    const y = r * Math.sin(theta) * Math.sin(phi);
    const z = r * Math.cos(theta);
    return new this.precision([x, y, z]);
  }

  /**
   * Convert Cartesian to spherical coordinates
   * @param {number} x - x coordinate
   * @param {number} y - y coordinate
   * @param {number} z - z coordinate
   * @returns {number[]} [r, theta, phi] spherical coordinates
   */
  cartesianToSpherical(x, y, z) {
    const r = Math.sqrt(x*x + y*y + z*z);
    const theta = Math.acos(z / r);
    const phi = Math.atan2(y, x);
    return new this.precision([r, theta, phi]);
  }

  /**
   * Calculate Jacobian matrix for spherical coordinates
   * @param {number} r - radial distance
   * @param {number} theta - polar angle
   * @param {number} phi - azimuthal angle
   * @returns {number[][]} 3x3 Jacobian matrix
   */
  sphericalJacobian(r, theta, phi) {
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    return new this.precision([
      [sinTheta * cosPhi, r * cosTheta * cosPhi, -r * sinTheta * sinPhi],
      [sinTheta * sinPhi, r * cosTheta * sinPhi, r * sinTheta * cosPhi],
      [cosTheta, -r * sinTheta, 0]
    ]);
  }
}
