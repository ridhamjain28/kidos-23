from dataclasses import dataclass
from typing import List, Dict, Any, Optional
import json
import httpx
import asyncio

from app.services.kernel import kernel_manager
from app.services.memory import hot_memory, warm_memory
from app.services.frustration import frustration_collector, RawSignal, compute_dopamine_penalty
from app.services.supabase_service import supabase_metrics

@dataclass
class ModalityDecision:
    action: str
    reason: str
    F_score: float
    SVI_score: float
    gamification_detected: bool
    mission_briefing: str
    kernel_size_bytes: int

class IBLMOrchestrator:
    def __init__(self):
        self.pending_conflicts: Dict[str, List[Dict[str, Any]]] = {}

    async def start_session(self, user_id: str):
        # Init session signals list (handled inside hot_memory)
        hot_memory.start_session(user_id)
        
        # Increment kernel.total_sessions
        kernel = await kernel_manager.get(user_id)
        kernel.total_sessions += 1
        await kernel_manager.save(user_id)

    async def end_session(self, user_id: str, mastery_updates: dict = None):
        if mastery_updates is None:
            mastery_updates = {}
            
        # Flush hot memory
        hot_log = hot_memory.flush(user_id)
        
        # Compile warm summary
        summary = warm_memory.compile_session_summary(
            user_id=user_id,
            hot_log=hot_log,
            avg_f=0.0, # Approximate or fetch from session tracking if available
            duration_s=len(hot_log) * 10.0, # Rough approximation
            mastery_updates=mastery_updates
        )
        
        if summary:
            kernel = await kernel_manager.get(user_id)
            
            # Update kernel.curiosity_type from trends
            trends = warm_memory.get_behavioral_trends(user_id)
            if trends["dominant_curiosity_type"] != "UNKNOWN":
                kernel.curiosity_type = trends["dominant_curiosity_type"]
            
            # Apply decay
            await kernel_manager.apply_decay(user_id)
            
            # Add rule for dominant curiosity
            if kernel.curiosity_type != "UNKNOWN":
                await kernel_manager.add_rule(
                    user_id=user_id,
                    category="learning_style",
                    condition=f"user shows {kernel.curiosity_type} curiosity",
                    action=f"prioritize {kernel.curiosity_type.lower()} content",
                    weight=0.8
                )
            
            await kernel_manager.save(user_id)

    async def process_interaction(self, user_id: str, event_type: str, raw_signals_dicts: List[dict], user_text: str = None, content_id: str = None) -> ModalityDecision:
        # 1. Parse raw_signals into RawSignal objects
        raw_signals = [RawSignal(**s) for s in raw_signals_dicts]
        
        # 2. Compute F(t) on last 20 signals
        recent_signals = raw_signals[-20:]
        f_result = frustration_collector.compute_F(recent_signals)
        
        # 3. Check P(t) gamification on last 10 signals
        gamification_detected = compute_dopamine_penalty(raw_signals[-10:])
        
        # 4. Classify user_text via hot_memory.classify_text
        classification = "neutral"
        if user_text:
            classification = hot_memory.classify_text(user_text)
            
        # 6. Store HotMemoryEntry
        entry = {
            "event_type": event_type,
            "text": user_text,
            "classification": classification,
            "content_id": content_id,
            "signals": [s.__dict__ for s in raw_signals]
        }
        hot_memory.add(user_id, entry)
        
        # 5. Compute SVI on last 5 classifications
        recent_classes = hot_memory.get_recent_classifications(user_id, n=5)
        svi_result = frustration_collector.compute_SVI(recent_classes)
        
        # 7. Decision priority
        action = "continue"
        reason = "normal"
        if gamification_detected:
            action = "penalty_reset"
            reason = "gamification"
        elif svi_result.empathy_mode:
            action = "empathy_mode"
            reason = "high SVI"
        elif f_result.triggered:
            action = f_result.recommendation
            reason = "frustration triggered"

        # 8. Build mission_briefing string
        kernel_summary = await kernel_manager.get_kernel_summary(user_id)
        curiosity_type = kernel_summary.get("curiosity_type", "UNKNOWN")
        threshold = kernel_summary.get("frustration_threshold", 0.65)
        
        # Get top 3 rules
        rules = kernel_summary.get("rules", [])
        top_rules = sorted(rules, key=lambda x: x.get("weight", 0), reverse=True)[:3]
        rules_str = ", ".join([r.get("action", "") for r in top_rules])
        
        growth = str(kernel_summary.get("growth_projections", {}))
        
        mission_briefing = (
            f"Curiosity: {curiosity_type} | Threshold: {threshold} | "
            f"F: {f_result.F:.2f} | SVI class: {svi_result.classification} | "
            f"Top rules: {rules_str} | Growth: {growth}"
        )
        
        # 9. Return ModalityDecision
        decision = ModalityDecision(
            action=action,
            reason=reason,
            F_score=f_result.F,
            SVI_score=svi_result.SVI,
            gamification_detected=gamification_detected,
            mission_briefing=mission_briefing,
            kernel_size_bytes=kernel_summary.get("kernel_size_bytes", 0)
        )
        
        # Micro-pause observer call
        if event_type in ["media_playing", "video_watch", "game_loading"]:
            await asyncio.create_task(self.call_gemma_observer(user_id))
            
        await supabase_metrics.log_metrics(user_id, {
            "signal_type": "interaction",
            "F_score": f_result.F,
            "SVI_score": svi_result.SVI,
            "action_taken": action,
            "event_type": event_type
        })
            
        return decision

    async def call_gemma_observer(self, user_id: str):
        # 1. Take user_id and the last 5 hot_memory entries
        entries = hot_memory.get_session(user_id)[-5:]
        if not entries:
            return
            
        # 2. Build exact prompt
        PROMPT = f"""You are a behavioral signal classifier. Analyze these {len(entries)} 
child interactions and return ONLY valid JSON, no other text:

Interactions: {json.dumps(entries)}

Return:
{{
  "dominant_signal": "venting|exploratory|productive|correction",
  "curiosity_type": "VISUAL|TEXTUAL|KINETIC",
  "frustration_estimate": 0.0-1.0,
  "suggested_rules": [
    {{"condition": "string", "action": "string", "weight": 0.0-1.0}}
  ]
}}"""

        # 3. Call Ollama API
        url = "http://localhost:11434/api/generate"
        payload = {
            "model": "gemma3:1b",
            "prompt": PROMPT,
            "stream": False,
            "options": {"temperature": 0.1, "num_predict": 200}
        }
        
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                
                # 4. Parse JSON
                response_text = data.get("response", "").strip()
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                    
                parsed_json = json.loads(response_text)
                
                # 5. Add rules
                suggested_rules = parsed_json.get("suggested_rules", [])
                for rule in suggested_rules:
                    await kernel_manager.add_rule(
                        user_id, "auto", rule.get("condition", ""), rule.get("action", ""), rule.get("weight", 0.5)
                    )
                
                # 6. Update curiosity
                curiosity_type = parsed_json.get("curiosity_type", "UNKNOWN")
                if curiosity_type != "UNKNOWN":
                    kernel = await kernel_manager.get(user_id)
                    kernel.curiosity_type = curiosity_type
                    await kernel_manager.save(user_id)
                    
        except Exception:
            # 8. Silently skip on error or timeout
            pass

    def log_conflict(self, user_id: str, old_rule: str, new_signal: str):
        if user_id not in self.pending_conflicts:
            self.pending_conflicts[user_id] = []
        self.pending_conflicts[user_id].append({"old_rule": old_rule, "new_signal": new_signal})

    def get_pending_conflicts(self, user_id: str) -> List[Dict[str, str]]:
        conflicts = self.pending_conflicts.pop(user_id, [])
        return conflicts

    async def record_intervention_outcome(self, user_id: str, skip_before: float, skip_after: float) -> bool:
        delta = skip_after - skip_before
        success = delta > 500
        await kernel_manager.update_frustration_threshold(user_id, intervention_successful=success)
        await kernel_manager.save(user_id)
        return success

orchestrator = IBLMOrchestrator()
