from dataclasses import dataclass, field
import time
import math
from typing import List, Dict, Any

@dataclass
class RawSignal:
    signal_type: str
    value: float
    timestamp: float = field(default_factory=time.time)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class FrustrationResult:
    F: float
    triggered: bool
    dominant_signal: str
    primitives: Dict[str, float]
    recommendation: str

@dataclass
class SVIResult:
    SVI: float
    empathy_mode: bool
    classification: str

class FrustrationSignalCollector:
    W = {"skip": 0.35, "tap": 0.25, "abandon": 0.25, "silence": 0.15}

    def compute_F(self, signals: List[RawSignal], user_threshold=0.65) -> FrustrationResult:
        scores = {}
        for s in signals:
            v, t = s.value, s.signal_type
            if t == "skip": scores[t] = 1.0 - (v / 1500) if v < 1500 else 0.0
            elif t == "tap": scores[t] = min(1.0, v / 4.0)
            elif t == "abandon": scores[t] = min(1.0, v / 0.5)
            elif t == "silence": scores[t] = min(1.0, (v - 8000) / 10000) if v > 8000 else 0.0

        f_sum = sum(self.W.get(t, 0) * s for t, s in scores.items())
        nonzero = [s for s in scores.values() if s > 0]
        f_val = f_sum / len(nonzero) if nonzero else 0.0
        
        dom = max(scores, key=scores.get) if scores else "none"
        rec = "switch_visual" if f_val > 0.8 else "switch_audio" if f_val > user_threshold else "empathy_mode" if scores.get("silence", 0) > 0.7 else "continue"
        
        return FrustrationResult(f_val, f_val > user_threshold, dom, scores, rec)

    def compute_SVI(self, classifications: List[str]) -> SVIResult:
        if not classifications: return SVIResult(0, False, "neutral")
        n_vent = sum(1 for c in classifications if c in ["venting", "exploratory"])
        svi = n_vent / len(classifications)
        return SVIResult(svi, svi > 0.6, "venting" if svi > 0.5 else "productive")

    def compute_fatigue(self, start_t, f0, l_decay, V_t, A_t) -> dict:
        dt_hrs = (time.time() - start_t) / 3600
        ft = f0 * math.exp(-l_decay * dt_hrs) * (1 + 0.3 * V_t + 0.4 * A_t)
        return {"f_t": max(0.0, min(1.0, ft))}

def compute_dopamine_penalty(signals: List[RawSignal], k=3) -> bool:
    count = 0
    for s in signals:
        if (s.signal_type == "skip" and s.value < 1500) or (s.signal_type == "tap" and s.value > 4.0):
            count += 1
            if count >= k: return True
        else:
            count = 0
    return False

frustration_collector = FrustrationSignalCollector()
