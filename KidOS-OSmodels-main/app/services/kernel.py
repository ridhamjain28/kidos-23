from dataclasses import dataclass, field, asdict
import json
import time
import httpx
from app.services.supabase_service import SUPABASE_URL, SUPABASE_KEY

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
    def __init__(self):
        self._kernels = {}
        self.headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }

    async def get(self, user_id: str) -> IBLMKernel:
        if user_id in self._kernels:
            return self._kernels[user_id]
        
        endpoint = f"{SUPABASE_URL}/rest/v1/iblm_kernels?user_id=eq.{user_id}"
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(endpoint, headers=self.headers)
                if resp.status_code == 200:
                    data = resp.json()
                    if data and len(data) > 0:
                        kernel_data = data[0].get("kernel_data", {})
                        kernel_data["user_id"] = user_id
                        # Filter out keys not in dataclass
                        valid_keys = {f.name for f in IBLMKernel.__dataclass_fields__.values()}
                        filtered_data = {k: v for k, v in kernel_data.items() if k in valid_keys}
                        kernel = IBLMKernel(**filtered_data)
                        self._kernels[user_id] = kernel
                        return kernel
            except Exception as e:
                print(f"Error loading kernel from Supabase for {user_id}: {e}")
        
        # Create new if not found
        kernel = IBLMKernel(user_id=user_id)
        self._kernels[user_id] = kernel
        return kernel

    async def save(self, user_id: str):
        kernel = await self.get(user_id)
        endpoint = f"{SUPABASE_URL}/rest/v1/iblm_kernels"
        
        payload = {
            "user_id": user_id,
            "kernel_data": asdict(kernel),
            "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        
        headers = {**self.headers, "Prefer": "resolution=merge-duplicates"}
        async with httpx.AsyncClient() as client:
            try:
                await client.post(endpoint, json=payload, headers=headers)
            except Exception as e:
                print(f"Error saving kernel to Supabase for {user_id}: {e}")

    async def add_rule(self, user_id, category, condition, action, weight=0.5):
        kernel = await self.get(user_id)
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

    async def apply_decay(self, user_id, days_elapsed=1.0):
        kernel = await self.get(user_id)
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

    async def update_frustration_threshold(self, user_id, intervention_successful: bool):
        kernel = await self.get(user_id)
        kernel.intervention_count += 1
        if intervention_successful:
            kernel.successful_interventions += 1
        
        if kernel.intervention_count > 0:
            kernel.intervention_success_rate = kernel.successful_interventions / kernel.intervention_count
        
        # Adjust threshold based on success rate
        if kernel.intervention_success_rate > 0.7:
            kernel.frustration_threshold = max(0.1, round(kernel.frustration_threshold - 0.05, 2))
        elif kernel.intervention_success_rate < 0.3:
            kernel.frustration_threshold = min(1.0, round(kernel.frustration_threshold + 0.05, 2))

    async def update_growth(self, user_id, domain, confidence):
        kernel = await self.get(user_id)
        
        if domain not in kernel.growth_projections:
            kernel.growth_projections[domain] = {
                "level": "BEGINNER", 
                "confidence": confidence, 
                "sessions_above_threshold": 0
            }
        else:
            prev_conf = kernel.growth_projections[domain].get("confidence", 0.0)
            new_conf = round(prev_conf * 0.7 + confidence * 0.3, 3)
            kernel.growth_projections[domain]["confidence"] = new_conf
            
            if new_conf > 0.75:
                kernel.growth_projections[domain]["sessions_above_threshold"] = \
                    kernel.growth_projections[domain].get("sessions_above_threshold", 0) + 1
            else:
                kernel.growth_projections[domain]["sessions_above_threshold"] = 0
            
            if kernel.growth_projections[domain]["sessions_above_threshold"] >= 3:
                levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"]
                current_level = kernel.growth_projections[domain].get("level", "BEGINNER")
                if current_level in levels:
                    idx = levels.index(current_level)
                    if idx < len(levels) - 1:
                        kernel.growth_projections[domain]["level"] = levels[idx + 1]
                        kernel.growth_projections[domain]["sessions_above_threshold"] = 0

    async def get_kernel_summary(self, user_id):
        kernel = await self.get(user_id)
        summary = asdict(kernel)
        summary["kernel_size_bytes"] = len(json.dumps(summary).encode())
        return summary

# Singleton instance
kernel_manager = KernelManager()
