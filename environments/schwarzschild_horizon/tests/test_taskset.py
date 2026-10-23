from schwarzschild_horizon.taskset import SchwarzschildHorizonTaskset


def test_taskset_is_deterministic_and_has_expected_size():
    first = SchwarzschildHorizonTaskset().load()
    second = SchwarzschildHorizonTaskset().load()

    assert len(first) == 100
    assert [task.data.prompt for task in first] == [task.data.prompt for task in second]
    assert [task.data.reference for task in first] == [task.data.reference for task in second]


def test_reference_answers_are_finite_and_positive():
    tasks = SchwarzschildHorizonTaskset().load()
    for task in tasks:
        for value in task.data.reference.values():
            assert value > 0
            assert value < float("inf")
