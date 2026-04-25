from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from app.services.orchestrator import orchestrator
from app.services.kernel import kernel_manager
from app.services.memory import warm_memory

iblm_router = APIRouter()

class SessionStartRequest(BaseModel):
    user_id: str

class SessionEndRequest(BaseModel):
    user_id: str
    mastery_updates: Dict[str, Any] = Field(default_factory=dict)

class SignalModel(BaseModel):
    signal_type: str = Field(alias="type")
    value: float
    
    class Config:
        populate_by_name = True

class InteractRequest(BaseModel):
    user_id: str
    event_type: str
    signals: List[SignalModel]
    user_text: Optional[str] = None
    content_id: Optional[str] = None
    content_tags: List[str] = Field(default_factory=list)  # Tags of the content the user interacted with

class InterventionOutcomeRequest(BaseModel):
    user_id: str
    skip_latency_before: float
    skip_latency_after: float

@iblm_router.post("/session/start")
async def start_session(request: SessionStartRequest):
    await orchestrator.start_session(request.user_id)
    return await kernel_manager.get_kernel_summary(request.user_id)

@iblm_router.post("/session/end")
async def end_session(request: SessionEndRequest):
    await orchestrator.end_session(request.user_id, request.mastery_updates)
    
    # Fetch the most recent summary for the user
    summaries = warm_memory._summaries.get(request.user_id, [])
    if summaries:
        return summaries[-1]
    return {"status": "success", "message": "Session ended, no summary generated."}

@iblm_router.post("/interact")
async def interact(request: InteractRequest):
    from app.services.supabase_service import supabase_metrics
    
    raw_signals_dicts = [{"signal_type": s.signal_type, "value": s.value} for s in request.signals]
    
    decision = await orchestrator.process_interaction(
        user_id=request.user_id,
        event_type=request.event_type,
        raw_signals_dicts=raw_signals_dicts,
        user_text=request.user_text,
        content_id=request.content_id
    )
    
    # --- Tag Score Update ---
    if request.content_tags:
        existing = await supabase_metrics.get_kernel_tag_scores(request.user_id)
        
        for tag in request.content_tags:
            entry = existing.get(tag, {"engagement": 0.5, "frustration": 0.0, "interactions": 0})
            entry["interactions"] = entry.get("interactions", 0) + 1
            
            # Positive signal (long dwell, like) = higher engagement
            # Negative signal (skip, abandon) = higher frustration
            skip_signals = [s for s in raw_signals_dicts if s["signal_type"] == "skip" and s["value"] < 2000]
            if skip_signals or request.event_type in ["too_hard", "abandon"]:
                entry["frustration"] = min(1.0, entry.get("frustration", 0) + 0.1)
                entry["engagement"] = max(0.0, entry.get("engagement", 0.5) - 0.05)
            else:
                entry["engagement"] = min(1.0, entry.get("engagement", 0.5) + 0.05)
                entry["frustration"] = max(0.0, entry.get("frustration", 0) - 0.02)
            
            existing[tag] = entry
        
        # Push updated tag scores back to Supabase kernel
        await supabase_metrics.upsert_kernel_tag_scores(request.user_id, existing)
        
        # Also log signal row with associated tags
        await supabase_metrics.log_metrics(
            user_id=request.user_id,
            metrics={
                "signal_type": "interaction",
                "f_score": decision.F_score,
                "svi_score": decision.SVI_score,
                "action_taken": decision.action,
                "event_type": request.event_type
            },
            content_tags=request.content_tags
        )
    
    return {
        "action": decision.action,
        "reason": decision.reason,
        "F_score": decision.F_score,
        "SVI_score": decision.SVI_score,
        "gamification_detected": decision.gamification_detected,
        "mission_briefing": decision.mission_briefing,
        "kernel_size_bytes": decision.kernel_size_bytes
    }

@iblm_router.get("/kernel/{user_id}")
async def get_kernel(user_id: str):
    return await kernel_manager.get_kernel_summary(user_id)

@iblm_router.post("/intervention/outcome")
async def intervention_outcome(request: InterventionOutcomeRequest):
    success = await orchestrator.record_intervention_outcome(
        user_id=request.user_id,
        skip_before=request.skip_latency_before,
        skip_after=request.skip_latency_after
    )
    return {"intervention_successful": success}

@iblm_router.get("/conflicts/{user_id}")
async def get_conflicts(user_id: str):
    return orchestrator.get_pending_conflicts(user_id)

@iblm_router.get("/memory/warm/{user_id}")
async def get_warm_memory(user_id: str):
    return warm_memory.get_behavioral_trends(user_id)
