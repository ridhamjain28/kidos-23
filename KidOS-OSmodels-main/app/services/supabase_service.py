import httpx
import time
import asyncio
from typing import Dict, Any, List

import os
from dotenv import load_dotenv

load_dotenv()

# Supabase Config
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

class SupabaseMetrics:
    def __init__(self, url: str = SUPABASE_URL, key: str = SUPABASE_KEY):
        self.url = url
        self.key = key
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }

    async def log_metrics(self, user_id: str, metrics: Dict[str, Any]):
        """
        Logs behavioral metrics to Supabase.
        Metrics typically include engagement_time, frustration_time, etc.
        """
        endpoint = f"{self.url}/rest/v1/iblm_signals"
        
        payload = {
            "user_id": user_id,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            **metrics
        }
        
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(endpoint, json=payload, headers=self.headers)
                if resp.status_code != 201 and resp.status_code != 200:
                    print(f"Supabase Logging Error: {resp.status_code} - {resp.text}")
                resp.raise_for_status()
            except Exception as e:
                print(f"Supabase Logging Error: {e}")

    async def get_recent_metrics(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Fetches the most recent behavioral metrics for a user.
        """
        endpoint = f"{self.url}/rest/v1/iblm_signals"
        params = {
            "user_id": f"eq.{user_id}",
            "order": "timestamp.desc",
            "limit": limit
        }
        
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(endpoint, params=params, headers=self.headers)
                resp.raise_for_status()
                return resp.json()
            except Exception as e:
                print(f"Supabase Fetch Error: {e}")
                return []

supabase_metrics = SupabaseMetrics()
