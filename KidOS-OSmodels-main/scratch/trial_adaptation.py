import httpx
import asyncio
import json

BASE_URL = "http://localhost:8000"

async def simulate_behavior(user_id, behavior_type):
    print(f"\n--- Simulating {behavior_type} Behavior for {user_id} ---")
    
    # 1. Start Session
    async with httpx.AsyncClient() as client:
        await client.post(f"{BASE_URL}/iblm/session/start", json={"user_id": user_id})
        
        # 2. Simulate Interaction
        if behavior_type == "Happy":
            # Long dwell time (60s) = High SVI
            signals = [{"signal_type": "dwell", "value": 60000}]
            text = "I love learning about stars!"
        else:
            # Fast skip (1s) = High Frustration
            signals = [{"signal_type": "skip", "value": 1000}]
            text = "This is too hard, I don't get it."

        interact_payload = {
            "user_id": user_id,
            "event_type": "media_playing",
            "signals": signals,
            "user_text": text
        }
        
        print(f"[{user_id}] Sending interaction signals...")
        resp = await client.post(f"{BASE_URL}/iblm/interact", json=interact_payload)
        decision = resp.json()
        print(f"[{user_id}] IBLM Decision: {decision['action']} (Reason: {decision['reason']})")
        print(f"[{user_id}] Mission Briefing Sent to Brain: {decision['mission_briefing']}")

        # 3. Generate Content based on this briefing
        gen_payload = {
            "topTags": ["Science", "Space"],
            "age": 7,
            "mission_briefing": decision['mission_briefing']
        }
        
        print(f"[{user_id}] Brain is synthesizing content...")
        gen_resp = await client.post(f"{BASE_URL}/cognicards/generate", json=gen_payload)
        content = gen_resp.json()
        
        print(f"[{user_id}] Resulting Content:")
        for item in content:
            print(f"  > {item['title']}: {item['body']}")

        await client.post(f"{BASE_URL}/iblm/session/end", json={"user_id": user_id})

async def main():
    # Run both behaviors to compare
    await simulate_behavior("happy_kid_001", "Happy")
    await simulate_behavior("frustrated_kid_002", "Frustrated")

if __name__ == "__main__":
    asyncio.run(main())
