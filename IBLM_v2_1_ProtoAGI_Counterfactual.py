
"""
IBLM v2.1 – Proto‑AGI Cognitive Brain with Counterfactual Simulation

This version upgrades IBLM v2 by adding:
1. Counterfactual (what‑if) simulation
2. Iterative plan repair instead of hard blocking
3. Explicit proto‑AGI reasoning loop
4. A demo block that narrates the system's thinking

AI = Voice
IBLM = Brain
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
import math
import copy

# -------------------------
# Utility Functions
# -------------------------

def clamp(value: float, min_v: float = 0.0, max_v: float = 1.0) -> float:
    return max(min_v, min(value, max_v))

# -------------------------
# Data Models
# -------------------------

@dataclass
class InteractionSignal:
    duration_ms: int
    success: bool
    abandoned: bool
    retries: int
    content_format: str
    timestamp: float

@dataclass
class MentalState:
    engagement: float = 0.5
    emotional_stability: float = 0.5
    cognitive_load: float = 0.5
    curiosity_momentum: float = 0.5
    trust_level: float = 0.8

@dataclass
class DevelopmentalProfile:
    baseline_attention_ms: float = 5000
    frustration_sensitivity: float = 0.5
    preferred_formats: Dict[str, float] = field(default_factory=dict)
    learning_velocity: float = 0.5
    sessions_observed: int = 0

@dataclass
class ContentPlan:
    format: str
    difficulty: str
    modality: str  # visual | audio
    energy: str

@dataclass
class SimulationResult:
    plan: ContentPlan
    risk: float
    learning_gain: float

# -------------------------
# Cognitive State Engine
# -------------------------

class CognitiveStateEngine:
    def update_state(self, prev: MentalState, interaction: InteractionSignal, profile: DevelopmentalProfile) -> MentalState:
        engagement = clamp(interaction.duration_ms / profile.baseline_attention_ms)
        cognitive_load = clamp(interaction.retries * profile.frustration_sensitivity * 0.3)
        emotional_stability = clamp(prev.emotional_stability - cognitive_load + (0.1 if interaction.success else -0.1))
        curiosity = clamp(engagement * 0.6 + (0.2 if not interaction.abandoned else -0.2))
        trust = clamp(prev.trust_level + (0.05 if interaction.success else -0.08))

        return MentalState(
            engagement=engagement,
            emotional_stability=emotional_stability,
            cognitive_load=cognitive_load,
            curiosity_momentum=curiosity,
            trust_level=trust
        )

# -------------------------
# Counterfactual Simulation Engine (Imagination)
# -------------------------

class CounterfactualSimulationEngine:

    def generate_variants(self, base_plan: ContentPlan) -> List[ContentPlan]:
        variants = [
            base_plan,
            ContentPlan(base_plan.format, "EASY", base_plan.modality, "CALM"),
            ContentPlan(base_plan.format, "EASY", "audio", "CALM"),
            ContentPlan("STORY", "EASY", "audio", "CALM"),
            ContentPlan("GAME", "EASY", "visual", "LOW")
        ]
        return variants

    def simulate(self, plan: ContentPlan, state: MentalState) -> SimulationResult:
        risk = clamp(
            state.cognitive_load * (0.7 if plan.difficulty == "HARD" else 0.3) +
            (1 - state.emotional_stability) * (0.5 if plan.energy != "CALM" else 0.2)
        )

        learning = clamp(
            state.engagement * (0.6 if plan.difficulty != "EASY" else 0.4) +
            state.curiosity_momentum * 0.4
        )

        return SimulationResult(plan, risk, learning)

# -------------------------
# Iterative Cognitive Governor
# -------------------------

class IterativeCognitiveGovernor:
    RISK_LIMIT = 0.4

    def decide(self, base_plan: ContentPlan, state: MentalState, simulator: CounterfactualSimulationEngine) -> SimulationResult:
        variants = simulator.generate_variants(base_plan)
        evaluated = [simulator.simulate(p, state) for p in variants]

        safe = [r for r in evaluated if r.risk <= self.RISK_LIMIT]
        if not safe:
            return min(evaluated, key=lambda x: x.risk)

        return max(safe, key=lambda x: x.learning_gain)

# -------------------------
# Profile Updater
# -------------------------

class ProfileUpdater:
    def update(self, profile: DevelopmentalProfile, interaction: InteractionSignal, state: MentalState) -> DevelopmentalProfile:
        profile.baseline_attention_ms = profile.baseline_attention_ms * 0.95 + interaction.duration_ms * 0.05
        profile.learning_velocity = clamp(profile.learning_velocity + (0.02 if state.curiosity_momentum > 0.6 else -0.01))
        profile.sessions_observed += 1
        return profile

# -------------------------
# IBLM v2.1 Orchestrator
# -------------------------

class IBLM_V21:

    def __init__(self):
        self.state_engine = CognitiveStateEngine()
        self.simulator = CounterfactualSimulationEngine()
        self.governor = IterativeCognitiveGovernor()
        self.profile_updater = ProfileUpdater()

        self.state = MentalState()
        self.profile = DevelopmentalProfile()

    def process_interaction(self, interaction: InteractionSignal) -> SimulationResult:
        self.state = self.state_engine.update_state(self.state, interaction, self.profile)

        base_plan = ContentPlan(
            format=interaction.content_format,
            difficulty="MEDIUM",
            modality="visual",
            energy="HIGH"
        )

        decision = self.governor.decide(base_plan, self.state, self.simulator)
        self.profile = self.profile_updater.update(self.profile, interaction, self.state)

        return decision

# -------------------------
# Winning Demo Block
# -------------------------

if __name__ == "__main__":
    iblm = IBLM_V21()

    interaction = InteractionSignal(
        duration_ms=1200,
        success=False,
        abandoned=True,
        retries=3,
        content_format="GAME",
        timestamp=0.0
    )

    result = iblm.process_interaction(interaction)

    print("IBLM Thought Process Result")
    print("----------------------------")
    print(f"Selected Plan: {result.plan}")
    print(f"Risk Score: {result.risk:.2f}")
    print(f"Learning Gain: {result.learning_gain:.2f}")
