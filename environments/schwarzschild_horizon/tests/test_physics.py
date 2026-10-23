import math

import pytest

from schwarzschild_horizon.physics import C, G, HBAR, KB, M_SUN, horizon_state


def test_one_solar_mass_reference_scales():
    state = horizon_state(M_SUN)
    assert state.radius_m == pytest.approx(2953.33938206688, rel=1e-12)
    assert state.surface_gravity_m_s2 == pytest.approx(1.525e13, rel=1e-12)
    assert state.hawking_temperature_K == pytest.approx(6.170e-8, rel=1e-6)


def test_scaling_laws():
    a = horizon_state(M_SUN)
    b = horizon_state(10 * M_SUN)
    assert b.radius_m / a.radius_m == pytest.approx(10.0)
    assert b.surface_gravity_m_s2 / a.surface_gravity_m_s2 == pytest.approx(0.1)
    assert b.hawking_temperature_K / a.hawking_temperature_K == pytest.approx(0.1)


def test_rejects_nonpositive_or_nonfinite_mass():
    for mass in (0.0, -1.0, math.inf, math.nan):
        with pytest.raises(ValueError):
            horizon_state(mass)
