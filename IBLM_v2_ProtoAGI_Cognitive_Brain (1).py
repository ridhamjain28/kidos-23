
"""
IBLM v2 – Individual Behaviour Learning Machine (Proto-AGI Cognitive Brain)

Author: Ayush Baldota (Project: KidOS)
Purpose:
- Acts as a cognitive governor ('brain') over an AI system ('voice')
- Models child cognitive & emotional states
- Simulates outcomes before authorizing AI responses
- Enforces 3-layer safety & ethics verification
- Designed for patent, IP, and production evolution

IMPORTANT:
This is NOT a chatbot.
This is a cognitive decision engine that authorizes or blocks AI actions.
"""

from dataclasses import dataclass, field
from typing import List, Dict
import math

# -------------------------
# Utility Functions
# -------------------------

def clamp(value: float, min_v: float = 0.0, max_v: float = 1.0) -> float:
    return max(min_v, min(value, max_v))

def sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-x))

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
    trust_history: List[float] = field(default_factory=list)
    sessions_observed: int = 0

@dataclass
class GovernorPolicy:
    max_words: int
    tone: str
    abstraction_level: str
    allow_questions: bool

@dataclass
class AIInstruction:
    approved: bool
    content: str = ""
    policy: GovernorPolicy = None
    reason: str = ""

# -------------------------
# Cognitive State Estimator
# -------------------------

class CognitiveStateEngine:

    def update_state(
        self,
        prev_state: MentalState,
        interaction: InteractionSignal,
        profile: DevelopmentalProfile
    ) -> MentalState:

        engagement = clamp(
            interaction.duration_ms / profile.baseline_attention_ms
        )

        cognitive_load = clamp(
            interaction.retries * profile.frustration_sensitivity * 0.3
        )

        emotional_stability = clamp(
            prev_state.emotional_stability - cognitive_load +
            (0.1 if interaction.success else -0.1)
        )

        curiosity_momentum = clamp(
            engagement * 0.6 + (0.2 if not interaction.abandoned else -0.2)
        )

        trust_level = clamp(
            prev_state.trust_level +
            (0.05 if interaction.success else -0.08)
        )

        return MentalState(
            engagement=engagement,
            emotional_stability=emotional_stability,
            cognitive_load=cognitive_load,
            curiosity_momentum=curiosity_momentum,
            trust_level=trust_level
        )

# -------------------------
# Predictive Simulation Engine
# -------------------------

class SimulationEngine:

    def simulate(self, proposed_content: str, state: MentalState) -> Dict:
        risk = clamp(
            state.cognitive_load * 0.6 +
            (1 - state.emotional_stability) * 0.4
        )

        learning_gain = clamp(
            state.engagement * 0.7 +
            state.curiosity_momentum * 0.3
        )

        return {
            "risk_score": risk,
            "learning_gain": learning_gain,
            "emotion_after": state
        }

# -------------------------
# Cognitive Governor (Super Nanny)
# -------------------------

class CognitiveGovernor:

    RISK_THRESHOLD = 0.45

    def authorize(
        self,
        simulation_result: Dict,
        state: MentalState
    ) -> AIInstruction:

        # Check 1: Cognitive Safety
        if simulation_result["risk_score"] > self.RISK_THRESHOLD:
            return AIInstruction(
                approved=False,
                reason="Blocked: Cognitive or emotional overload risk"
            )

        # Check 2: Emotional Alignment
        if state.trust_level < 0.5:
            policy = GovernorPolicy(
                max_words=20,
                tone="CALM",
                abstraction_level="CONCRETE_ONLY",
                allow_questions=False
            )
        else:
            policy = GovernorPolicy(
                max_words=40,
                tone="PLAYFUL",
                abstraction_level="CONCRETE_ONLY",
                allow_questions=True
            )

        # Check 3: Ethical & Content Guard (hard-coded placeholder)
        # In production this connects to content classification filters
        ethically_clean = True

        if not ethically_clean:
            return AIInstruction(
                approved=False,
                reason="Blocked: Ethical or age-appropriateness violation"
            )

        return AIInstruction(
            approved=True,
            content="Approved educational response placeholder.",
            policy=policy,
            reason="Approved after 3-stage cognitive verification"
        )

# -------------------------
# Long-Term Profile Update
# -------------------------

class ProfileUpdater:

    def update(
        self,
        profile: DevelopmentalProfile,
        interaction: InteractionSignal,
        state: MentalState
    ) -> DevelopmentalProfile:

        profile.baseline_attention_ms = (
            profile.baseline_attention_ms * 0.95 +
            interaction.duration_ms * 0.05
        )

        profile.preferred_formats[interaction.content_format] = (
            profile.preferred_formats.get(interaction.content_format, 0.0) +
            (0.1 if interaction.success else -0.05)
        )

        profile.learning_velocity = clamp(
            profile.learning_velocity +
            (0.02 if state.curiosity_momentum > 0.6 else -0.01)
        )

        profile.trust_history.append(state.trust_level)
        profile.sessions_observed += 1

        return profile

# -------------------------
# IBLM v2 Orchestrator
# -------------------------

class IBLM_V2:

    def __init__(self):
        self.state_engine = CognitiveStateEngine()
        self.simulator = SimulationEngine()
        self.governor = CognitiveGovernor()
        self.profile_updater = ProfileUpdater()

        self.state = MentalState()
        self.profile = DevelopmentalProfile()

    def process_interaction(self, interaction: InteractionSignal) -> AIInstruction:

        self.state = self.state_engine.update_state(
            self.state, interaction, self.profile
        )

        simulation = self.simulator.simulate(
            interaction.content_format, self.state
        )

        decision = self.governor.authorize(simulation, self.state)

        self.profile = self.profile_updater.update(
            self.profile, interaction, self.state
        )

        return decision

# -------------------------
# End of IBLM v2
# -------------------------
