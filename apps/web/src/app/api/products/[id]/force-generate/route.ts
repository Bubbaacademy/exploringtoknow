import { NextResponse } from 'next/server';
import { enqueue, QUEUES, type GenerateContentJob } from '@etk/queue';

/**
 * POST /api/products/:id/force-generate — explicit force-generate trigger.
 * Enqueues the content pipeline for one product and returns immediately
 * (sync/async boundary, impl pkg §5.1). Does NOT run generation inline.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const job: GenerateContentJob = { productId: id, trigger: 'force_generate' };
  try {
    const jobId = await enqueue(QUEUES.generateContent, job);
    return NextResponse.json({ status: 'queued', jobId }, { status: 202 });
  } catch (e) {
    return NextResponse.json({ status: 'error', error: String(e) }, { status: 503 });
  }
}
