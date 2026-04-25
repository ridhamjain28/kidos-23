"""
AI Chatbot Backend – FastAPI
Connects to local Ollama (text) and ComfyUI (image) services.
"""

import json
import re
import time
import uuid
import base64
import asyncio
from pathlib import Path

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.api.iblm import iblm_router

# ── Config ──────────────────────────────────────────────────────────────────
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "gemma:latest"

COMFYUI_URL = "http://127.0.0.1:8188"
COMFYUI_PROMPT_EP = f"{COMFYUI_URL}/prompt"
COMFYUI_HISTORY_EP = f"{COMFYUI_URL}/history"
COMFYUI_VIEW_EP = f"{COMFYUI_URL}/view"

# ── Content Generation Prompts ──────────────────────────────────────────────
FACT_SYSTEM_PROMPT = (
    "You are a fascinating fact generator for children. "
    "Generate ONE truly surprising, mind-blowing, and short fact. "
    "The fact MUST be under 25 words. No preamble, just the fact."
)

IMAGE_PROMPT_SYSTEM = (
    "You are a Stable Diffusion prompt engineer. Given a fact, generate a "
    "SHORT, vivid image generation prompt (under 30 words) for a beautiful "
    "vertical background image. No text in the image."
)

STORY_SYSTEM_PROMPT = (
    "You are a children's story author. Generate a story with EXACTLY 5 pages. "
    "Output ONLY valid JSON in this format: "
    '{"title":"Title","pages":[{"text":"Page 1..."}, {"text":"Page 2..."}, ...]}'
)

ILLUSTRATION_SYSTEM = (
    "You are an illustration prompt engineer. Given a story page, generate a "
    "SHORT image prompt for a whimsical child-friendly illustration."
)

FEED_IDEAS_SYSTEM = (
    "Generate EXACTLY 4 unique video ideas for kids. Output ONLY valid JSON: "
    '[{"title":"Video Title","description":"..."}, ...]'
)

VIDEO_SCRIPT_SYSTEM = (
    "Write an EXACTLY 6-scene narration script. Output ONLY valid JSON: "
    '[{"narration":"Scene 1..."}, ...]'
)

WORKFLOW_PATH = Path(__file__).parent / "workflows" / "comfy_workflow.json"

IMAGE_KEYWORDS = [
    "draw", "generate image", "create image", "picture",
    "art", "illustration", "paint", "sketch", "make an image",
    "generate a picture", "create a picture", "render",
    "design", "visualize", "depict", "imagine an image",
    "show me", "create art",
]

# ── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(title="AI Chatbot")

# Mount static files
app.mount("/static", StaticFiles(directory=Path(__file__).parent / "static"), name="static")

# Include IBLM routes
app.include_router(iblm_router, prefix="/iblm", tags=["IBLM"])


# ── Helpers ─────────────────────────────────────────────────────────────────

def is_image_request(message: str) -> bool:
    """Check whether the user message implies image generation."""
    lower = message.lower()
    return any(kw in lower for kw in IMAGE_KEYWORDS)


def extract_image_prompt(message: str) -> str:
    """Pull out a cleaner prompt for Stable Diffusion."""
    lower = message.lower()
    prompt = message
    # Strip common command prefixes so the SD prompt is cleaner
    for kw in IMAGE_KEYWORDS:
        if kw in lower:
            idx = lower.find(kw)
            prompt = message[idx + len(kw):].strip(" :.,!?-–—of")
            if prompt:
                break
    return prompt if prompt else message


async def query_ollama(prompt: str) -> str:
    """Send a prompt to Ollama and return the full generated text."""
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(OLLAMA_URL, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data.get("response", "").strip()


async def query_comfyui(prompt_text: str) -> str:
    """Queue an image generation job in ComfyUI and return the image as base64."""
    # Load & patch workflow
    workflow = json.loads(WORKFLOW_PATH.read_text())
    workflow["3"]["inputs"]["seed"] = int(time.time()) % (2**32)
    workflow["6"]["inputs"]["text"] = prompt_text

    client_id = str(uuid.uuid4())
    payload = {"prompt": workflow, "client_id": client_id}

    async with httpx.AsyncClient(timeout=300.0) as client:
        # Queue the prompt
        resp = await client.post(COMFYUI_PROMPT_EP, json=payload)
        resp.raise_for_status()
        result = resp.json()
        prompt_id = result.get("prompt_id")
        if not prompt_id:
            raise RuntimeError("ComfyUI did not return a prompt_id")

        # Poll history until the job finishes
        for _ in range(300):  # up to ~5 min
            await asyncio.sleep(1)
            hist_resp = await client.get(f"{COMFYUI_HISTORY_EP}/{prompt_id}")
            if hist_resp.status_code != 200:
                continue
            history = hist_resp.json()
            if prompt_id in history:
                break
        else:
            raise RuntimeError("ComfyUI generation timed out")

        # Extract image info from the history
        outputs = history[prompt_id].get("outputs", {})
        for node_id, node_out in outputs.items():
            images = node_out.get("images", [])
            if images:
                img_info = images[0]
                filename = img_info["filename"]
                subfolder = img_info.get("subfolder", "")
                img_type = img_info.get("type", "output")

                params = {"filename": filename, "type": img_type}
                if subfolder:
                    params["subfolder"] = subfolder

                img_resp = await client.get(COMFYUI_VIEW_EP, params=params)
                img_resp.raise_for_status()
                b64 = base64.b64encode(img_resp.content).decode("utf-8")
                return f"data:image/png;base64,{b64}"

        raise RuntimeError("No image found in ComfyUI output")


# ── Cognicards Logic ────────────────────────────────────────────────────────

COGNICARDS_TAGS = ["Tech", "Cooking", "Fitness", "Travel", "Gaming", "Finance", "Art", "Science"]

COGNICARDS_FALLBACK = [
    {"title": "Quantum Productivity", "body": "Stop multitasking. The quantum observer effect proves that focusing on one task actually changes its outcome.", "tags": ["Tech", "Science"]},
    {"title": "The Perfect Sear", "body": "A steak only needs to be flipped once. Heat management is the difference between a dinner and a masterpiece.", "tags": ["Cooking", "Science"]},
    {"title": "Digital Gold", "body": "Bitcoin isn't just money; it's a protocol. Understanding the code is more valuable than tracking the price.", "tags": ["Tech", "Finance"]},
    {"title": "Abstract Motion", "body": "Great art doesn't capture what a person looks like; it captures how they feel while moving through space.", "tags": ["Art", "Fitness"]},
    {"title": "Mars Colony", "body": "Life on Mars isn't just about oxygen; it's about building a new culture under a pink sky.", "tags": ["Science", "Travel"]},
    {"title": "Lo-Fi Beats", "body": "The secret to focus isn't silence; it's the right kind of noise. Low fidelity, high output.", "tags": ["Art", "Gaming"]},
    {"title": "Budgeting Spells", "body": "Compound interest is the only real magic in the world. Start small, dream big.", "tags": ["Finance", "Science"]},
    {"title": "Glitch Art", "body": "Beauty can be found in errors. A corrupted file is just a different perspective on reality.", "tags": ["Art", "Tech"]},
    {"title": "Muscle Memory", "body": "Your body learns while you sleep. The workout is the stimulus; the rest is the growth.", "tags": ["Fitness", "Science"]},
    {"title": "Speedrunning Life", "body": "Efficiency isn't about rushing; it's about finding the shortest path to joy.", "tags": ["Gaming", "Tech"]},
]

def get_filtered_fallback(top_tags: list) -> list:
    """Filter fallback pool based on top tags, then pad with random."""
    filtered = [item for item in COGNICARDS_FALLBACK if any(t in item["tags"] for t in top_tags)]
    # Ensure variety by adding random ones if needed
    if len(filtered) < 2:
        import random
        others = [item for item in COGNICARDS_FALLBACK if item not in filtered]
        filtered.extend(random.sample(others, 2 - len(filtered)))
    return filtered[:2]

@app.post("/cognicards/generate")
async def cognicards_generate(request: Request):
    body = await request.json()
    top_tags = body.get("topTags", ["Tech", "Science"])
    age = body.get("age", 7)
    
    try:
        # Age-specific instructions
        if age <= 7:
            age_prompt = "Use simple, playful words. Focus on wonder and discovery. Like explaining to a curious 6-year-old."
        else:
            age_prompt = "Use slightly more technical terms but explain them simply. Focus on clear, logical insights. Calibrated for a 10-year-old."

        mission_briefing = body.get("mission_briefing", "")
        
        prompt = (
            f"You are a kid-friendly content generator. Target Age: {age}.\n"
            f"IBLM CONTEXT: {mission_briefing}\n"
            f"INSTRUCTION: {age_prompt}\n"
            f"TASK: Generate exactly 2 short content items. Each must be exactly 2 lines long.\n"
            f"TOPICS: {top_tags[0]} and {top_tags[1]}.\n"
            f"BEHAVIORAL RULES: Follow any constraints in the IBLM CONTEXT strictly.\n"
            f"OUTPUT FORMAT: Return ONLY a valid JSON array of objects. No intro, no outro, no markdown formatting blocks.\n"
            f"Example format: [{{'title': '...', 'body': '...', 'tags': [...]}}, ...]"
        )
        
        raw_response = await query_ollama(prompt)
        print(f"DEBUG: Raw Ollama Response: {raw_response}")
        
        # Pre-parse validation
        if not raw_response or len(raw_response) < 50:
            raise ValueError("Response too short")
            
        # Clean response string to find JSON array
        match = re.search(r'\[.*\]', raw_response, re.DOTALL)
        if not match:
            raise ValueError("No JSON array found")
            
        items = json.loads(match.group(0))
        
        # Post-parse validation & Tag Overwrite
        safe_items = []
        for i, item in enumerate(items[:2]):
            safe_items.append({
                "title": item.get("title", "Synthesized Insight"),
                "body": item.get("body", "Content currently being processed."),
                "tags": top_tags # Programmatic Tag Assignment
            })
            
        if len(safe_items) < 2:
            raise ValueError("Not enough items generated")
            
        return JSONResponse(safe_items)
        
    except Exception as e:
        print(f"Cognicards generation error: {e}")
        return JSONResponse(get_filtered_fallback(top_tags))

# ── Missing Content Routes ──────────────────────────────────────────────────

@app.post("/fact-feed/generate")
async def generate_fact():
    """Generate a random fact with an AI-generated background image."""
    try:
        fact = await query_ollama(f"Generate a surprising fact. System: {FACT_SYSTEM_PROMPT}")
        img_prompt = await query_ollama(f"Generate an image prompt for this fact: {fact}. System: {IMAGE_PROMPT_SYSTEM}")
        
        # 9:16 vertical image
        image_data = await query_comfyui(img_prompt)
        
        return {
            "status": "success",
            "fact": fact,
            "image": image_data
        }
    except Exception as e:
        print(f"Fact Feed Error: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/library/generate")
async def generate_book():
    """Generate a complete children's story book with illustrations."""
    try:
        raw_story = await query_ollama(f"Write a magical story. System: {STORY_SYSTEM_PROMPT}")
        # Extract JSON
        match = re.search(r'\{.*\}', raw_story, re.DOTALL)
        story = json.loads(match.group(0))
        
        title = story.get("title", "Untitled")
        pages = story.get("pages", [])
        
        # Cover
        cover_prompt = await query_ollama(f"Prompt for cover of '{title}'. System: {ILLUSTRATION_SYSTEM}")
        cover_image = await query_comfyui(cover_prompt)
        
        illustrated_pages = []
        for page in pages[:5]:
            p_text = page.get("text", "")
            p_prompt = await query_ollama(f"Illustration for: {p_text}. System: {ILLUSTRATION_SYSTEM}")
            p_image = await query_comfyui(p_prompt)
            illustrated_pages.append({"text": p_text, "image": p_image})
            
        return {
            "status": "success",
            "title": title,
            "cover": cover_image,
            "pages": illustrated_pages
        }
    except Exception as e:
        print(f"Library Error: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/wondertv/generate-feed")
async def generate_wtv_feed():
    try:
        raw_ideas = await query_ollama(f"4 video ideas. System: {FEED_IDEAS_SYSTEM}")
        match = re.search(r'\[.*\]', raw_ideas, re.DOTALL)
        ideas = json.loads(match.group(0))
        
        feed = []
        for idea in ideas[:4]:
            title = idea.get("title", "Video")
            thumb_prompt = await query_ollama(f"Thumbnail for {title}. System: {IMAGE_PROMPT_SYSTEM}")
            thumb = await query_comfyui(thumb_prompt)
            feed.append({"title": title, "description": idea.get("description", ""), "thumbnail": thumb})
            
        return {"status": "success", "feed": feed}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/wondertv/watch")
async def wtv_watch(request: Request):
    body = await request.json()
    title = body.get("title", "Video")
    try:
        raw_script = await query_ollama(f"6-scene script for {title}. System: {VIDEO_SCRIPT_SYSTEM}")
        match = re.search(r'\[.*\]', raw_script, re.DOTALL)
        scenes_text = json.loads(match.group(0))
        
        scenes = []
        for s in scenes_text[:6]:
            narr = s.get("narration", "")
            s_prompt = await query_ollama(f"Scene image for: {narr}. System: {IMAGE_PROMPT_SYSTEM}")
            s_img = await query_comfyui(s_prompt)
            scenes.append({"narration": narr, "image": s_img})
            
        return {"status": "success", "scenes": scenes}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/speak")
async def speak(request: Request):
    # Mock speak for now as we don't have a local TTS tool ready in this script
    return {"status": "success", "message": "Speech simulated"}

# ── Routes ──────────────────────────────────────────────────────────────────

@app.get("/favicon.ico")
async def favicon():
    from fastapi.responses import Response
    return Response(status_code=204)

@app.get("/")
async def root():
    """Serve the frontend."""
    from fastapi.responses import HTMLResponse
    html = (Path(__file__).parent / "static" / "index.html").read_text(encoding="utf-8")
    return HTMLResponse(content=html)


@app.post("/chat")
async def chat(request: Request):
    body = await request.json()
    user_message = body.get("message", "").strip()
    if not user_message:
        return JSONResponse({"type": "error", "content": "Empty message"}, status_code=400)

    try:
        if is_image_request(user_message):
            prompt = extract_image_prompt(user_message)
            # Optionally enhance prompt via Ollama
            enhanced = await query_ollama(
                f"You are an expert Stable Diffusion prompt writer. "
                f"Convert the following request into a concise, descriptive image generation prompt "
                f"with artistic details. Only output the prompt, nothing else.\n\n"
                f"Request: {prompt}"
            )
            image_prompt = enhanced if enhanced else prompt
            image_b64 = await query_comfyui(image_prompt)
            return JSONResponse({
                "type": "image",
                "content": image_b64,
                "caption": f"🎨 Generated from: *{image_prompt}*",
            })
        else:
            answer = await query_ollama(user_message)
            return JSONResponse({"type": "text", "content": answer})
    except httpx.ConnectError as e:
        service = "ComfyUI" if "8188" in str(e) else "Ollama"
        return JSONResponse(
            {"type": "error", "content": f"Cannot connect to {service}. Make sure it is running."},
            status_code=502,
        )
    except Exception as e:
        return JSONResponse({"type": "error", "content": str(e)}, status_code=500)


# ── Run ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
