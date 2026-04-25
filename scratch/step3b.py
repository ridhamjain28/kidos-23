import sys, json, asyncio
from graphify.extract import semantic_extract
from pathlib import Path

# Load uncached files
uncached_path = Path('graphify-out/.graphify_uncached.txt')
if not uncached_path.exists():
    print("Error: uncached.txt missing")
    sys.exit(1)

uncached = [line.strip() for line in uncached_path.read_text(encoding='utf-8').splitlines() if line.strip()]
print(f"Starting semantic extraction for {len(uncached)} files...")

async def main():
    if uncached:
        # Note: model="gemini-2.0-flash" is default if not specified
        result = await semantic_extract([Path(f) for f in uncached])
    else:
        result = {'nodes':[],'edges':[],'hyperedges':[],'input_tokens':0,'output_tokens':0}
    
    Path('graphify-out/.graphify_semantic.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(f"Semantic: {len(result.get('nodes', []))} nodes, {len(result.get('edges', []))} edges, {len(result.get('hyperedges', []))} hyperedges")

if __name__ == "__main__":
    asyncio.run(main())
