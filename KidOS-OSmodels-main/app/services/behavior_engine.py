from typing import Dict, Any, List
from app.services.supabase_service import supabase_metrics

class BehaviorEngine:
    async def get_user_mode(self, user_id: str) -> str:
        """
        Fetches recent metrics and determines the operational mode.
        If avg_svi > 0.7, mode is 'low_complexity'.
        """
        metrics = await supabase_metrics.get_recent_metrics(user_id, limit=10)
        if not metrics:
            return "normal"
        
        # Calculate avg_svi
        # Note: If fetching from fallback 'interactions', the metrics might be in 'behavioral_metadata'
        svi_values = []
        for m in metrics:
            svi = m.get("svi")
            if svi is None and "behavioral_metadata" in m:
                svi = m["behavioral_metadata"].get("svi")
            if svi is not None:
                svi_values.append(svi)
        
        if not svi_values:
            return "normal"
            
        avg_svi = sum(svi_values) / len(svi_values)
        
        if avg_svi > 0.7:
            return "low_complexity"
        else:
            return "normal"

    async def get_curiosity_type(self, user_id: str) -> str:
        """
        Detects the dominant curiosity type from recent metrics.
        """
        metrics = await supabase_metrics.get_recent_metrics(user_id, limit=10)
        if not metrics:
            return "UNKNOWN"
            
        counts = {}
        for m in metrics:
            ct = m.get("curiosity_type")
            if ct is None and "behavioral_metadata" in m:
                ct = m["behavioral_metadata"].get("curiosity_type")
            
            if ct:
                counts[ct] = counts.get(ct, 0) + 1
        
        if not counts:
            return "UNKNOWN"
            
        return max(counts, key=counts.get)

    async def get_behavioral_summary(self, user_id: str) -> Dict[str, Any]:
        """
        Returns a summary of behavioral trends for the user.
        """
        metrics = await supabase_metrics.get_recent_metrics(user_id, limit=10)
        if not metrics:
            return {
                "avg_frustration": 0.0,
                "avg_svi": 0.0,
                "dominant_curiosity": "UNKNOWN"
            }
            
        svi_values = []
        frustration_values = []
        curiosity_counts = {}
        
        for m in metrics:
            # Handle both direct and nested metadata
            data = m if "svi" in m or "frustration_score" in m else m.get("behavioral_metadata", {})
            
            svi = data.get("svi")
            if svi is not None: svi_values.append(svi)
            
            frust = data.get("frustration_score") or data.get("avg_frustration")
            if frust is not None: frustration_values.append(frust)
            
            ct = data.get("curiosity_type")
            if ct: curiosity_counts[ct] = curiosity_counts.get(ct, 0) + 1
            
        return {
            "avg_svi": sum(svi_values) / len(svi_values) if svi_values else 0.0,
            "avg_frustration": sum(frustration_values) / len(frustration_values) if frustration_values else 0.0,
            "dominant_curiosity": max(curiosity_counts, key=curiosity_counts.get) if curiosity_counts else "UNKNOWN"
        }

behavior_engine = BehaviorEngine()
