import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv("KidOS-OSmodels-main/.env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)

def check_counts():
    tables = ["iblm_kernels", "iblm_signals", "iblm_sessions"]
    for table in tables:
        try:
            res = supabase.table(table).select("count", count="exact").execute()
            print(f"Table '{table}': {res.count} rows")
            
            if res.count > 0:
                # Show latest row
                latest = supabase.table(table).select("*").limit(1).order("id" if table != "iblm_kernels" else "user_id", desc=True).execute()
                print(f"  Latest row in {table}: {latest.data[0]}")
        except Exception as e:
            print(f"Error checking {table}: {e}")

if __name__ == "__main__":
    check_counts()
