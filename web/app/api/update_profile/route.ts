import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { computeProfile } from '@/lib/profileUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/**
 * POST /api/update_profile
 * Reads the user's recent interactions, recomputes their
 * "virtual personality" profile, and upserts into user_profiles.
 *
 * Body: { user_id }
 */
export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Pull last 200 interactions, joined with content_items for topic/format info
    const { data: interactions, error: ixErr } = await supabase
      .from('interactions')
      .select('*, content_items(topic, format)')
      .eq('user_id', user_id)
      .order('timestamp', { ascending: false })
      .limit(200);

    if (ixErr) throw ixErr;

    const profile = computeProfile(interactions ?? []);

    // Upsert into user_profiles
    const { error: upsertErr } = await supabase.from('user_profiles').upsert(
      {
        user_id,
        topic_scores: profile.topic_scores,
        format_preferences: profile.format_preferences,
        avg_session_time: profile.avg_session_time,
        skip_rate: profile.skip_rate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    if (upsertErr) throw upsertErr;

    return NextResponse.json({ ok: true, profile });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/update_profile]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
