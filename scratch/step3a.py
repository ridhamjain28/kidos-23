import sys, json
from graphify.extract import collect_files, extract
from pathlib import Path

# Load detection results
detect_path = Path('graphify-out/.graphify_detect.json')
if not detect_path.exists():
    print("Error: detect.json missing")
    sys.exit(1)

detect = json.loads(detect_path.read_text(encoding='utf-8'))
code_files = []
for f in detect.get('files', {}).get('code', []):
    path = Path(f)
    if path.is_dir():
        code_files.extend(collect_files(path))
    else:
        code_files.append(path)

print(f"Starting AST extraction for {len(code_files)} files...")
if code_files:
    result = extract(code_files, cache_root=Path('.'))
else:
    result = {'nodes':[],'edges':[],'input_tokens':0,'output_tokens':0}

Path('graphify-out/.graphify_ast.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
print(f"AST: {len(result['nodes'])} nodes, {len(result['edges'])} edges")
