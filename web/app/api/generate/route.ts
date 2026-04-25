import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MOCK_CONTENT, TOPICS, getFallbackContent } from '@/lib/mockData';
import { pickNextContent } from '@/lib/profileUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/**
 * POST /api/generate
 * Generates kid-friendly content via LLM (or falls back to mock data).
 *
 * Body: { user_id, topic?, format?, age? }
 *
 * Flow:
 *  1. Load user profile from user_profiles
 *  2. Pick topic + format (from profile scores or request params)
 *  3. If LLM_API_KEY is set → call the LLM API
 *     Otherwise → return pre-written mock content
 *  4. Store the result as a new content_items row
 *  5. Return content + metadata
 */
export async function POST(req: NextRequest) {
  try {
    const { user_id, topic: reqTopic, format: reqFormat, age = 9, local_profile } = await req.json();

    // 1. Load user profile from request or DB
    let profile = local_profile || null;
    if (user_id && !profile) {
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user_id)
          .maybeSingle();
        if (data) profile = data;
      } catch {
        // Fallback to null
      }
    }

    // 2. Pick topic + format based on individual behavioral learning model
    const { topic, format } = pickNextContent(profile, TOPICS, reqTopic, reqFormat);

    // 3. Generate content
    let content = '';
    const difficulty: 'easy' | 'medium' | 'hard' = age <= 7 ? 'easy' : age <= 10 ? 'medium' : 'hard';

    const llmKey = process.env.LLM_API_KEY; // placeholder — replace with real key

    if (llmKey && llmKey !== 'YOUR_LLM_API_KEY_HERE') {
      // ── IBLM Integration: Load Kernel & Inject Mission Briefing ────────────────
      const { loadKernel, generateMissionBriefing } = await import('@/lib/iblm');
      const kernel = await loadKernel(user_id);
      const missionBriefing = generateMissionBriefing(kernel);

      const topTopics = profile?.topic_scores
        ? Object.entries(profile.topic_scores as Record<string, number>)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([t]) => t)
            .join(', ')
        : topic;

      const topFormats = profile?.format_preferences
        ? Object.entries(profile.format_preferences as Record<string, number>)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2)
            .map(([f]) => f)
            .join(' and ')
        : format;

      const prompt = `
${missionBriefing}

Generate a short, kid-friendly content piece for a child aged ${age}.
This child likes topics like ${topTopics} and prefers ${topFormats} format.
Use simple language, fun emojis, and keep it under 300 words.
Topic: ${topic}
Format: ${format} (story = narrative fiction, explanation = clear bullet facts, quiz = 4 multiple-choice questions with answers)
Difficulty: ${difficulty}
End with a "think about it" question to check understanding.`;

      const llmRes = await fetch(process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${llmKey}`,
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 600,
          temperature: 0.8,
        }),
      });

      if (!llmRes.ok) throw new Error(`LLM API error: ${llmRes.status}`);
      const llmData = await llmRes.json();
      content = llmData.choices?.[0]?.message?.content ?? '';
    } else {
      // ── Mock content (no API key needed) ──────────────────────────────
      const topicBank = MOCK_CONTENT[topic];
      content = topicBank?.[format] ?? getFallbackContent(topic, format, age);
    }

    // 4. Store as content_items
    let contentId: string | null = null;
    try {
      const { data: stored } = await supabase
        .from('content_items')
        .insert({ topic, difficulty, format, content })
        .select('id')
        .single();
      contentId = stored?.id ?? null;
    } catch {
      // Non-fatal — app still returns content even if DB is not configured
    }

    return NextResponse.json({ ok: true, content_id: contentId, topic, format, difficulty, content });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/generate]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
