import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/iblm/orchestrate
 * Orchestrates background behavioral signal extraction and kernel updates by forwarding to the Python IBLM backend.
 */
export async function POST(req: NextRequest) {
  try {
    const { interaction } = await req.json();

    if (!interaction || !interaction.user_id) {
      return NextResponse.json({ error: 'Interaction data is required' }, { status: 400 });
    }

    const backendUrl = process.env.IBLM_BACKEND_URL || 'http://localhost:8001';

    const payload = {
      user_id: interaction.user_id,
      event_type: interaction.action,
      signals: [
        { type: "skip", value: interaction.duration_seconds < 5 ? 500 : 5000 },
      ],
      user_text: interaction.user_text || null,
      content_id: interaction.content_id || null
    };

    const res = await fetch(`${backendUrl}/iblm/interact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Backend error: ${res.status} ${errText}`);
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/iblm/orchestrate]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
