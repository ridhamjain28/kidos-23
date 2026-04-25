import httpx
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

async def test_table(client, headers, table_name):
    endpoint = f"{SUPABASE_URL}/rest/v1/{table_name}?limit=1"
    try:
        resp = await client.get(endpoint, headers=headers)
        if resp.status_code == 200:
            print(f"  [OK] Table '{table_name}' is accessible.")
        elif resp.status_code == 404:
            print(f"  [MISSING] Table '{table_name}' not found. Did you run the SQL schema?")
        else:
            print(f"  [ERROR] Table '{table_name}' returned status {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"  [EXC] Table '{table_name}' connection failed: {e}")

async def test_connection():
    print(f"Testing Supabase connection at: {SUPABASE_URL}")
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: SUPABASE_URL or SUPABASE_KEY is missing from .env")
        return

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    
    tables_to_check = ["users", "content_items", "interactions", "iblm_kernels", "iblm_signals", "iblm_sessions"]
    
    async with httpx.AsyncClient() as client:
        print("Checking tables...")
        for table in tables_to_check:
            await test_table(client, headers, table)

if __name__ == "__main__":
    asyncio.run(test_connection())
