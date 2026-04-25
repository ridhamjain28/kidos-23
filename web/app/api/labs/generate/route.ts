import { NextRequest, NextResponse } from 'next/server';
import { FALLBACK_POOL, LABS_TAGS, LabsTag } from '@/lib/labs';

const getSystemPrompt = (age: number) => `You are a friendly educational assistant for a child aged ${age}.
RULES:
- exactly 2 items
- each item = 2 lines
- vocabulary appropriate for a ${age} year old
- for age 5-7: use very simple words, focus on wonder and play
- for age 8-12: use slightly more technical terms but explain them simply
- no emojis
- no hashtags
- no fake facts
- must strongly relate to both provided tags
- return STRICT JSON ONLY

JSON FORMAT:
[
  { "title": "...", "body": "...", "tags": ["TAG1","TAG2"] },
  { "title": "...", "body": "...", "tags": ["TAG1","TAG2"] }
]`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topTags, age = 7, userId, mission_briefing } = body;
    const tags: LabsTag[] = topTags && topTags.length > 0 ? topTags : ["Tech", "Science"];

    // Try calling the Python backend first (Primary)
    try {
      const pythonRes = await fetch('http://localhost:8000/cognicards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topTags: tags, 
          age, 
          user_id: userId, 
          mission_briefing 
        }),
      });

      if (pythonRes.ok) {
        const items = await pythonRes.json();
        // Add unique IDs to the items
        const safeItems = items.map((it: any, idx: number) => ({
            ...it,
            id: `gen-${Date.now()}-${idx}`
        }));
        return NextResponse.json({ items: safeItems, isFallback: false });
      }
    } catch (err) {
      console.log("Python backend unreachable, falling back to local Ollama...");
    }

    const ollamaUrl = process.env.OLLAMA_HOST || "http://localhost:11434";
    const model = process.env.OLLAMA_MODEL || "llama3.2:3b";

    const prompt = `Generate exactly 2 items for a ${age}-year-old child interest in: ${tags.join(" and ")}.
    ${mission_briefing ? `Contextual Intelligence: ${mission_briefing}` : ''}`;

    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: `${getSystemPrompt(age)}\n\n${prompt}`,
        stream: false,
        format: "json"
      }),
    }).catch(() => null);

    if (!res || !res.ok) {
      throw new Error("LLM Connection Failed");
    }

    const data = await res.json();
    let rawJson = data.response;
    
    // Safety Pipeline: Parse
    let parsed;
    try {
      parsed = JSON.parse(rawJson);
    } catch (e) {
      // Try to extract JSON if there's text around it
      const match = rawJson.match(/\[.*\]/s);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error("JSON Parse Failed");
    }
    
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Empty or Invalid JSON Array");
    }

    // Safety Pipeline: Validate & Force Tags
    const items = parsed.slice(0, 2).map((item: any, idx: number) => ({
      id: `gen-${Date.now()}-${idx}`,
      title: item.title || "Neural Insight",
      body: item.body || "Synthesizing complex information based on your unique interest profile.",
      tags: tags // Mandatory tag alignment
    }));

    if (items[0].body.length < 10) throw new Error("Response too short");

    return NextResponse.json({ items, isFallback: false });

  } catch (error) {
    console.warn("Labs Generation Safety Fallback triggered:", error);
    
    // FALLBACK LOGIC: Filter by top tags first, then random
    const tags = body?.topTags || ["Tech", "Science"];

    const matching = FALLBACK_POOL.filter(item => 
      item.tags.some(t => tags.includes(t))
    );
    
    const finalItems = matching.length >= 2 
      ? matching.sort(() => 0.5 - Math.random()).slice(0, 2)
      : FALLBACK_POOL.sort(() => 0.5 - Math.random()).slice(0, 2);

    return NextResponse.json({ 
      items: finalItems.map(it => ({ ...it, id: `${it.id}-${Date.now()}` })), 
      isFallback: true 
    });
  }
}
