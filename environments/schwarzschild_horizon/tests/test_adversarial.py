import math

from schwarzschild_horizon.physics import M_SUN, horizon_state, relative_error


def test_reference_is_independent_of_candidate_formatting():
    state = horizon_state(M_SUN)
    candidate = {
        "radius_m": state.radius_m * 1.0,
        "surface_gravity_m_s2": state.surface_gravity_m_s2 * 1.0,
        "hawking_temperature_K": state.hawking_temperature_K * 1.0,
    }
    assert all(relative_error(candidate[k], getattr(state, k)) <= 1e-12 for k in candidate)


def test_common_formula_errors_are_detectable():
    state = horizon_state(M_SUN)
    bad = {
        "radius_m": state.radius_m * 1e2,
        "surface_gravity_m_s2": state.surface_gravity_m_s2 / 4.0,
        "hawking_temperature_K": state.hawking_temperature_K * 4.0 * math.pi,
    }
    assert relative_error(bad["radius_m"], state.radius_m) > 1e-5
    assert relative_error(bad["surface_gravity_m_s2"], state.surface_gravity_m_s2) > 1e-5
    assert relative_error(bad["hawking_temperature_K"], state.hawking_temperature_K) > 1e-5


def test_scaling_can_catch_unit_confusion():
    one = horizon_state(M_SUN)
    ten = horizon_state(10 * M_SUN)
    assert ten.radius_m == one.radius_m * 10
    assert ten.surface_gravity_m_s2 == one.surface_gravity_m_s2 / 10
    assert ten.hawking_temperature_K == one.hawking_temperature_K / 10
