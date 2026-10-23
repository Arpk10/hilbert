"""Independent Schwarzschild horizon reference calculations.

The verifier uses these formulas directly rather than importing the JavaScript
implementation in Hilbert. This keeps the scoring oracle independent of the
candidate-facing code path.
"""

from dataclasses import dataclass
import math

G = 6.67430e-11
C = 299_792_458.0
HBAR = 1.054571817e-34
KB = 1.380649e-23
M_SUN = 1.98847e30


@dataclass(frozen=True)
class HorizonState:
    mass_kg: float
    radius_m: float
    surface_gravity_m_s2: float
    hawking_temperature_K: float


def horizon_state(mass_kg: float) -> HorizonState:
    if not math.isfinite(mass_kg) or mass_kg <= 0:
        raise ValueError("mass must be finite and strictly positive")
    radius = 2.0 * G * mass_kg / C**2
    kappa = C**4 / (4.0 * G * mass_kg)
    temperature = HBAR * C**3 / (8.0 * math.pi * G * mass_kg * KB)
    return HorizonState(mass_kg, radius, kappa, temperature)


def relative_error(value: float, reference: float) -> float:
    if not math.isfinite(value) or not math.isfinite(reference):
        return math.inf
    return abs(value - reference) / max(abs(reference), 1e-300)
