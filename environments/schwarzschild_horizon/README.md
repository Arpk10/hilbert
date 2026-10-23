# Schwarzschild Horizon Verifier

A small, deterministic scientific-reasoning environment for Prime Intellect Verifiers v1.

## Task

Given a black-hole mass, an agent must compute three Schwarzschild quantities in SI units:

- Schwarzschild radius: `r_s = 2GM/c^2`
- Surface gravity: `kappa = c^4/(4GM)`
- Hawking temperature: `T_H = hbar*c^3/(8*pi*G*M*k_B)`

The taskset generates 100 parameterized instances across six decades below and ten decades above one solar mass. Inputs are expressed using kilograms, solar masses, and a geometric-units conversion case.

## Verification design

The scoring oracle is implemented independently in `physics.py` and does not import Hilbert's JavaScript physics implementation. This separation is intentional: the environment should be able to reject an answer even if the candidate implementation contains the same bug as the reference simulator.

The default scoring is deterministic and numerical. A valid JSON response is preferred:

```json
{
  "radius_m": 2953.33938206688,
  "surface_gravity_m_s2": 15250000000000.0,
  "hawking_temperature_K": 6.17e-8
}
```

A compact `key=value` fallback is also accepted. Numerical scores are based on relative error, with a 1e-5 reference tolerance. A separate consistency reward checks all three reported values against the independent oracle.

## Why this is an environment rather than a physics calculator

The benchmark is designed to measure whether an AI system can perform a short scientific computation while respecting units, numerical scale, and a strict output contract. Future versions can add adversarially corrupted candidate calculations and require the agent to diagnose the failure.

## Layout

```text
environments/schwarzschild_horizon/
├── pyproject.toml
├── README.md
├── src/schwarzschild_horizon/
│   ├── __init__.py
│   ├── physics.py       # independent scoring oracle
│   └── taskset.py       # generated tasks + deterministic rewards
└── tests/
    └── test_physics.py
```

## Local verification

Install the package into a Python environment containing the compatible `verifiers` release, then run the taskset through the Verifiers CLI. The exact CLI command should follow the version of `verifiers` installed in the target environment.

The pure physics oracle can be tested independently with:

```bash
pytest environments/schwarzschild_horizon/tests
```

## Scientific scope and limitations

This environment deliberately covers only the classical Schwarzschild horizon quantities and the standard semiclassical Hawking-temperature formula. It does **not** claim to simulate Hawking radiation, quantum gravity, evaporation, or near-Planck-scale black-hole physics.

The benchmark is intended as a small first environment: deterministic, cheap to execute, easy to audit, and extensible toward harder scientific verification tasks.
