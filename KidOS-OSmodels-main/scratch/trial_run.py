import httpx
import asyncio
import json

BASE_URL = "http://localhost:8000"
TRIAL_USER_ID = "550e8400-e29b-41d4-a716-446655440000"

async def run_trial():
    user_id = TRIAL_USER_ID
    print(f"--- Starting Trial for {user_id} ---")
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        # 1. Start Session
        print("\n[Step 1] Starting IBLM Session...")
        resp = await client.post(f"{BASE_URL}/iblm/session/start", json={"user_id": user_id})
        print(f"Response: {resp.status_code}")
        print(f"Kernel Summary: {json.dumps(resp.json(), indent=2)}")

        # 2. Simulate Frustration Interactions
        print("\n[Step 2] Simulating Frustration (High Skip Rate)...")
        # We send a series of 'skip' signals with very low duration
        # Event type must be 'skip' to match our decision logic
        payload = {
            "user_id": USER_ID,
            "event_type": "skip",
            "signals": [
                {"type": "skip", "value": 200},
                {"type": "skip", "value": 150},
                {"type": "skip", "value": 300},
                {"type": "skip", "value": 100}
            ],
            "content_id": "content_abc"
        }
        resp = await client.post(f"{BASE_URL}/iblm/interact", json=payload)
        decision = resp.json()
        print(f"Decision: {json.dumps(decision, indent=2)}")
        
        # 3. Generate Content using the Mission Briefing
        mission_briefing = decision.get("mission_briefing", "")
        print(f"\n[Step 3] Generating Content with Mission Briefing...")
        print(f"Context: {mission_briefing}")
        
        gen_payload = {
            "topTags": ["Science", "Space"],
            "age": 7,
            "mission_briefing": mission_briefing
        }
        resp = await client.post(f"{BASE_URL}/cognicards/generate", json=gen_payload)
        if resp.status_code == 200:
            content = resp.json()
            print(f"Generated Content: {json.dumps(content, indent=2)}")
        else:
            print(f"Generation Failed: {resp.status_code} - {resp.text}")

        # 4. End Session
        print("\n[Step 4] Ending Session and Saving Kernel...")
        resp = await client.post(f"{BASE_URL}/iblm/session/end", json={
            "user_id": USER_ID,
            "mastery_updates": {"science": 0.1}
        })
        print(f"Session End Summary: {json.dumps(resp.json(), indent=2)}")

        # 5. Final Kernel Verification
        print("\n[Step 5] Final Kernel State in Supabase...")
        resp = await client.get(f"{BASE_URL}/iblm/kernel/{USER_ID}")
        print(f"Final Kernel: {json.dumps(resp.json(), indent=2)}")

if __name__ == "__main__":
    asyncio.run(run_trial())
