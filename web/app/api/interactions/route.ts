import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the service-role key server-side so RLS doesn't block writes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/**
 * POST /api/interactions
 * Logs a user interaction to the `interactions` table.
 * Body: { user_id, content_id, action, duration_seconds }
 */
export async function POST(req: NextRequest) {
  try {
    const { user_id, content_id, action, duration_seconds, behavioral_metadata } = await req.json();

    if (!user_id || !content_id || !action) {
      return NextResponse.json(
        { error: 'user_id, content_id, and action are required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('interactions')
      .insert({
        user_id,
        content_id,
        action,
        duration_seconds: duration_seconds ?? 0,
        behavioral_metadata: behavioral_metadata ?? {},
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger IBLM Orchestration asynchronously (Step 1)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    fetch(`${baseUrl}/api/iblm/orchestrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interaction: data }),
    }).catch(err => console.error('IBLM Orchestration trigger failed:', err));

    return NextResponse.json({ ok: true, interaction: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/interactions]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
