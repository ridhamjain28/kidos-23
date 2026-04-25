import { NextRequest, NextResponse } from 'next/server';
import { loadKernel, extractSignals, applySignalsToKernel, saveKernel } from '@/lib/iblm';

/**
 * POST /api/iblm/orchestrate
 * Orchestrates background behavioral signal extraction and kernel updates.
 */
export async function POST(req: NextRequest) {
  try {
    const { interaction } = await req.json();

    if (!interaction || !interaction.user_id) {
      return NextResponse.json({ error: 'Interaction data is required' }, { status: 400 });
    }

    // 1. Load the user's Cold Memory (The Kernel)
    const kernel = await loadKernel(interaction.user_id);

    // 2. Extract signals using the lightweight model (Step 2)
    const signals = await extractSignals(interaction, kernel);

    if (signals.length > 0) {
      // 3. Apply signals to the kernel with belief pruning (Step 3)
      const updatedKernel = applySignalsToKernel(kernel, signals);

      // 4. Save the updated Kernel
      await saveKernel(updatedKernel);

      return NextResponse.json({ ok: true, signals_processed: signals.length, kernel_updated: true });
    }

    return NextResponse.json({ ok: true, signals_processed: 0, kernel_updated: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/iblm/orchestrate]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
