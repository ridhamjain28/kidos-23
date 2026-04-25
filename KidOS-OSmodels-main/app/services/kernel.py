from dataclasses import dataclass, field, asdict
import json
import os
from pathlib import Path
import time

@dataclass
class IBLMKernel:
    user_id: str
    curiosity_type: str = "UNKNOWN"
    attention_span_ms: int = 5000
    frustration_threshold: float = 0.65
    growth_projections: dict = field(default_factory=dict)
    rules: list = field(default_factory=list) # list of dicts: {"category": str, "condition": str, "action": str, "weight": float}
    intervention_success_rate: float = 0.0
    intervention_count: int = 0
    successful_interventions: int = 0
    gamification_attempts: int = 0
    total_sessions: int = 0

class KernelManager:
    def __init__(self, storage_dir: str = "kernels"):
        # Storage in the root of the project or data folder
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self._kernels = {}

    def get(self, user_id: str) -> IBLMKernel:
        if user_id in self._kernels:
            return self._kernels[user_id]
        
        file_path = self.storage_dir / f"{user_id}_kernel.json"
        if file_path.exists():
            try:
                with open(file_path, "r") as f:
                    data = json.load(f)
                    kernel = IBLMKernel(**data)
                    self._kernels[user_id] = kernel
                    return kernel
            except Exception as e:
                print(f"Error loading kernel for {user_id}: {e}")
        
        # Create new if not found
        kernel = IBLMKernel(user_id=user_id)
        self._kernels[user_id] = kernel
        return kernel

    def save(self, user_id: str):
        kernel = self.get(user_id)
        file_path = self.storage_dir / f"{user_id}_kernel.json"
        try:
            with open(file_path, "w") as f:
                json.dump(asdict(kernel), f, indent=2)
        except Exception as e:
            print(f"Error saving kernel for {user_id}: {e}")

    def add_rule(self, user_id, category, condition, action, weight=0.5):
        kernel = self.get(user_id)
        # Check for existing matching rule
        for rule in kernel.rules:
            if (rule.get("category") == category and 
                rule.get("condition") == condition and 
                rule.get("action") == action):
                # Strengthen weight by 0.1
                rule["weight"] = min(1.0, rule.get("weight", 0.5) + 0.1)
                return
        
        # Else append new rule
        kernel.rules.append({
            "category": category,
            "condition": condition,
            "action": action,
            "weight": weight
        })

    def apply_decay(self, user_id, days_elapsed=1.0):
        kernel = self.get(user_id)
        decay_factor = 0.97 ** days_elapsed
        
        new_rules = []
        for rule in kernel.rules:
            rule["weight"] = rule.get("weight", 0.5) * decay_factor
            # Prune if weight < 0.05
            if rule["weight"] >= 0.05:
                new_rules.append(rule)
        
        # Keep max 40 rules, sorted by weight
        new_rules.sort(key=lambda x: x["weight"], reverse=True)
        kernel.rules = new_rules[:40]

    def update_frustration_threshold(self, user_id, intervention_successful: bool):
        kernel = self.get(user_id)
        kernel.intervention_count += 1
        if intervention_successful:
            kernel.successful_interventions += 1
        
        if kernel.intervention_count > 0:
            kernel.intervention_success_rate = kernel.successful_interventions / kernel.intervention_count
        
        # Adjust threshold based on success rate
        if kernel.intervention_success_rate > 0.7:
            # Lower threshold (make it more sensitive/proactive)
            kernel.frustration_threshold = max(0.1, round(kernel.frustration_threshold - 0.05, 2))
        elif kernel.intervention_success_rate < 0.3:
            # Raise threshold (allow more frustration before intervening)
            kernel.frustration_threshold = min(1.0, round(kernel.frustration_threshold + 0.05, 2))

    def update_growth(self, user_id, domain, confidence):
        kernel = self.get(user_id)
        
        if domain not in kernel.growth_projections:
            kernel.growth_projections[domain] = {
                "level": "BEGINNER", 
                "confidence": confidence, 
                "sessions_above_threshold": 0
            }
        else:
            # EMA update: current = current * 0.7 + new * 0.3
            prev_conf = kernel.growth_projections[domain].get("confidence", 0.0)
            new_conf = round(prev_conf * 0.7 + confidence * 0.3, 3)
            kernel.growth_projections[domain]["confidence"] = new_conf
            
            # Track consistency
            if new_conf > 0.75:
                kernel.growth_projections[domain]["sessions_above_threshold"] = \
                    kernel.growth_projections[domain].get("sessions_above_threshold", 0) + 1
            else:
                kernel.growth_projections[domain]["sessions_above_threshold"] = 0
            
            # Promote level if confidence > 0.75 across 3+ sessions
            if kernel.growth_projections[domain]["sessions_above_threshold"] >= 3:
                levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"]
                current_level = kernel.growth_projections[domain].get("level", "BEGINNER")
                if current_level in levels:
                    idx = levels.index(current_level)
                    if idx < len(levels) - 1:
                        kernel.growth_projections[domain]["level"] = levels[idx + 1]
                        kernel.growth_projections[domain]["sessions_above_threshold"] = 0 # Reset for next tier

    def get_kernel_summary(self, user_id):
        kernel = self.get(user_id)
        summary = asdict(kernel)
        # Add kernel size metric
        summary["kernel_size_bytes"] = len(json.dumps(summary).encode())
        return summary

# Singleton instance
kernel_manager = KernelManager()
