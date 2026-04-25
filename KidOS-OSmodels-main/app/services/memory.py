import time
import asyncio
from typing import List, Dict, Any, Optional
from app.services.supabase_service import supabase_metrics

class HotMemory:
    def __init__(self):
        self._sessions: Dict[str, List[Dict[str, Any]]] = {} # user_id -> interaction logs

    def start_session(self, user_id: str):
        self._sessions[user_id] = []

    def add(self, user_id: str, entry_dict: Dict[str, Any]):
        """Add an interaction to session memory."""
        if user_id not in self._sessions:
            self.start_session(user_id)
        
        # Classification heuristic
        if "classification" not in entry_dict and "text" in entry_dict:
            entry_dict["classification"] = self.classify_text(entry_dict["text"])
        
        entry_dict["timestamp"] = time.time()
        self._sessions[user_id].append(entry_dict)

    def get_session(self, user_id: str) -> List[Dict[str, Any]]:
        return self._sessions.get(user_id, [])

    def get_recent_classifications(self, user_id: str, n: int = 5) -> List[str]:
        session = self.get_session(user_id)
        return [entry.get("classification", "UNKNOWN") for entry in session[-n:]]

    def flush(self, user_id: str) -> List[Dict[str, Any]]:
        """Return full log then clear session memory."""
        log = self._sessions.pop(user_id, [])
        return log

    def classify_text(self, text: str) -> str:
        """Heuristic classification based on keywords."""
        text = text.lower()
        if any(kw in text for kw in ["hate", "boring", "no", "stop", "ugh"]):
            return "venting"
        if any(kw in text for kw in ["wrong", "actually", "instead"]):
            return "correction"
        if any(kw in text for kw in ["what if", "maybe", "hmm"]):
            return "exploratory"
        return "productive"

class WarmMemory:
    def __init__(self):
        self._summaries: Dict[str, List[Dict[str, Any]]] = {} # user_id -> session summaries

    def compile_session_summary(self, user_id: str, hot_log: List[Dict[str, Any]], 
                               avg_f: float, duration_s: float, mastery_updates: Dict[str, Any]):
        """
        SVI (Sentiment Venting Index) = count(venting) / total
        Detect curiosity_type from event types.
        """
        total_interactions = len(hot_log)
        if total_interactions == 0:
            return None
        
        venting_count = sum(1 for entry in hot_log if entry.get("classification") == "venting")
        svi = round(venting_count / total_interactions, 3)
        
        # Detect curiosity type from event types
        # video/image → VISUAL, quiz/text → TEXTUAL, game/interactive → KINETIC
        event_types = [entry.get("event_type", "").lower() for entry in hot_log]
        
        visual_count = sum(1 for et in event_types if et in ["video", "image", "visual"])
        textual_count = sum(1 for et in event_types if et in ["quiz", "text", "textual"])
        kinetic_count = sum(1 for et in event_types if et in ["game", "interactive", "kinetic"])
        
        counts = {"VISUAL": visual_count, "TEXTUAL": textual_count, "KINETIC": kinetic_count}
        dominant_curiosity = max(counts, key=counts.get) if any(counts.values()) else "UNKNOWN"
        
        summary = {
            "timestamp": time.time(),
            "svi": svi,
            "avg_frustration": avg_f,
            "duration": duration_s,
            "mastery_updates": mastery_updates,
            "curiosity_type": dominant_curiosity
        }
        
        if user_id not in self._summaries:
            self._summaries[user_id] = []
        
        self._summaries[user_id].append(summary)
        # Keep last 30
        self._summaries[user_id] = self._summaries[user_id][-30:]
        
        # Async push to Supabase
        metrics = {
            "signal_type": "session_summary",
            "f_score": avg_f,
            "svi_score": svi,
            "action_taken": "session_end",
            "event_type": dominant_curiosity
        }
        asyncio.create_task(supabase_metrics.log_metrics(user_id, metrics))
        
        return summary

    def get_behavioral_trends(self, user_id: str) -> Dict[str, Any]:
        summaries = self._summaries.get(user_id, [])
        if not summaries:
            return {
                "avg_frustration": 0.0,
                "avg_svi": 0.0,
                "dominant_curiosity_type": "UNKNOWN"
            }
        
        avg_f = sum(s["avg_frustration"] for s in summaries) / len(summaries)
        avg_svi = sum(s["svi"] for s in summaries) / len(summaries)
        
        curiosity_history = [s["curiosity_type"] for s in summaries if s["curiosity_type"] != "UNKNOWN"]
        dominant_curiosity = max(set(curiosity_history), key=curiosity_history.count) if curiosity_history else "UNKNOWN"
        
        return {
            "avg_frustration": round(avg_f, 3),
            "avg_svi": round(avg_svi, 3),
            "dominant_curiosity_type": dominant_curiosity
        }

# Singletons
hot_memory = HotMemory()
warm_memory = WarmMemory()
