"""Prime Intellect Verifiers v1 taskset for Schwarzschild horizon physics."""

from __future__ import annotations

import json
import math
import random
import re

import verifiers.v1 as vf

from .physics import M_SUN, horizon_state, relative_error


FIELDS = ("radius_m", "surface_gravity_m_s2", "hawking_temperature_K")


class HorizonData(vf.TaskData):
    """Immutable task row with a hidden reference answer."""

    mass_kg: float
    mass_unit: str
    mode: str
    reference: dict[str, float]


class HorizonTask(vf.Task[HorizonData]):
    """Score a model's numerical answer against an independent physics oracle."""

    @vf.reward
    async def numerical_correctness(self, trace: vf.Trace) -> float:
        answer = self._parse_answer(trace.last_reply)
        if answer is None:
            return 0.0
        scores = []
        for key in FIELDS:
            if key not in answer or not math.isfinite(answer[key]):
                scores.append(0.0)
                continue
            scores.append(float(relative_error(answer[key], self.data.reference[key]) <= 1e-5))
        return sum(scores) / len(scores)

    @vf.metric
    async def parse_success(self, trace: vf.Trace) -> float:
        return float(self._parse_answer(trace.last_reply) is not None)

    @vf.metric
    async def relative_error_mean(self, trace: vf.Trace) -> float:
        answer = self._parse_answer(trace.last_reply)
        if answer is None:
            return math.inf
        errors = [relative_error(answer.get(key, math.nan), self.data.reference[key]) for key in FIELDS]
        return sum(errors) / len(errors)

    @staticmethod
    def _parse_answer(text: str | None) -> dict[str, float] | None:
        if not text:
            return None
        candidate = text.strip()
        try:
            obj = json.loads(candidate)
            if not isinstance(obj, dict):
                return None
            values = {}
            for key in FIELDS:
                if key in obj:
                    values[key] = float(obj[key])
            return values or None
        except (ValueError, TypeError, json.JSONDecodeError):
            values: dict[str, float] = {}
            patterns = {
                "radius_m": r"radius_m\s*=\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)",
                "surface_gravity_m_s2": r"surface_gravity_m_s2\s*=\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)",
                "hawking_temperature_K": r"hawking_temperature_K\s*=\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)",
            }
            for key, pattern in patterns.items():
                match = re.search(pattern, text)
                if match:
                    values[key] = float(match.group(1))
            return values or None


class SchwarzschildHorizonTaskset(vf.Taskset[HorizonTask, vf.TasksetConfig]):
    """Deterministic 100-instance benchmark over a broad astrophysical mass range."""

    def load(self) -> list[HorizonTask]:
        rng = random.Random(20261023)
        tasks: list[HorizonTask] = []
        modes = ("solar_mass", "kilogram", "geometric_units")

        for i in range(100):
            mode = modes[i % len(modes)]
            mass_solar = 10 ** rng.uniform(-6.0, 10.0)
            mass_kg = mass_solar * M_SUN
            state = horizon_state(mass_kg)

            if mode == "solar_mass":
                mass_text = f"{mass_solar:.12e} solar masses"
            elif mode == "kilogram":
                mass_text = f"{mass_kg:.12e} kg"
            else:
                mass_text = f"{mass_solar:.12e} solar masses; use G=c=1 only for the intermediate conversion"

            prompt = (
                "You are solving a deterministic scientific verification task.\n"
                f"Black-hole mass: {mass_text}.\n\n"
                "Using the Schwarzschild solution, compute:\n"
                "1. Schwarzschild radius in metres (radius_m)\n"
                "2. surface gravity in m/s^2 (surface_gravity_m_s2)\n"
                "3. Hawking temperature in kelvin (hawking_temperature_K)\n\n"
                "Return ONLY a JSON object with exactly these three numeric fields. "
                "Use SI values in the final answer."
            )
            reference = {
                "radius_m": state.radius_m,
                "surface_gravity_m_s2": state.surface_gravity_m_s2,
                "hawking_temperature_K": state.hawking_temperature_K,
            }
            data = HorizonData(
                prompt=prompt,
                answer=reference,
                mass_kg=mass_kg,
                mass_unit=mode,
                mode=mode,
                reference=reference,
            )
            tasks.append(HorizonTask(data))

        return tasks
