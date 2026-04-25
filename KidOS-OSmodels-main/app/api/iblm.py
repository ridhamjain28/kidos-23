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
    raw_signals_dicts = [{"signal_type": s.signal_type, "value": s.value} for s in request.signals]
    
    decision = await orchestrator.process_interaction(
        user_id=request.user_id,
        event_type=request.event_type,
        raw_signals_dicts=raw_signals_dicts,
        user_text=request.user_text,
        content_id=request.content_id
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
