import httpx
import time
import json
from typing import Dict, Any, List

import os
from dotenv import load_dotenv

load_dotenv()

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

    async def log_metrics(self, user_id: str, metrics: Dict[str, Any], content_tags: List[str] = None):
        """Logs a behavioral signal row to iblm_signals."""
        endpoint = f"{self.url}/rest/v1/iblm_signals"
        payload = {
            "user_id": user_id,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "content_tags": content_tags or [],
            **metrics
        }
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(endpoint, json=payload, headers=self.headers)
                if resp.status_code not in (200, 201):
                    print(f"Supabase Signal Error: {resp.status_code} - {resp.text}")
            except Exception as e:
                print(f"Supabase Signal Error: {e}")

    async def upsert_kernel_tag_scores(self, user_id: str, tag_scores: Dict[str, Any]):
        """
        Upserts the tag_scores JSONB column in iblm_kernels.
        tag_scores format: {"Space": {"engagement": 0.7, "frustration": 0.2}, ...}
        """
        endpoint = f"{self.url}/rest/v1/iblm_kernels?on_conflict=user_id"
        headers = {**self.headers, "Prefer": "resolution=merge-duplicates,return=minimal"}
        payload = {
            "user_id": user_id,
            "tag_scores": tag_scores,
            "last_active": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(endpoint, json=payload, headers=headers)
                if resp.status_code not in (200, 201):
                    print(f"Supabase Kernel Upsert Error: {resp.status_code} - {resp.text}")
            except Exception as e:
                print(f"Supabase Kernel Upsert Error: {e}")

    async def get_kernel_tag_scores(self, user_id: str) -> Dict[str, Any]:
        """Fetches the current tag_scores from the kernel."""
        endpoint = f"{self.url}/rest/v1/iblm_kernels"
        params = {"user_id": f"eq.{user_id}", "select": "tag_scores"}
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(endpoint, params=params, headers=self.headers)
                data = resp.json()
                if data and isinstance(data, list):
                    return data[0].get("tag_scores", {}) or {}
            except Exception as e:
                print(f"Supabase Kernel Fetch Error: {e}")
        return {}

    async def get_recent_metrics(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        endpoint = f"{self.url}/rest/v1/iblm_signals"
        params = {"user_id": f"eq.{user_id}", "order": "timestamp.desc", "limit": limit}
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(endpoint, params=params, headers=self.headers)
                resp.raise_for_status()
                return resp.json()
            except Exception as e:
                print(f"Supabase Fetch Error: {e}")
                return []

supabase_metrics = SupabaseMetrics()
