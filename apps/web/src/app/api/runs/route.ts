import { NextResponse } from 'next/server';
import { enqueue, QUEUES } from '@etk/queue';

/**
 * POST /api/runs — trigger the daily pipeline now (manual force-run). Enqueues
 * the daily-pipeline job; the worker selects active products and fans out
 * generate-content jobs. Never executes generation inline (impl pkg §5.1).
 */
export async function POST() {
  try {
    const jobId = await enqueue(QUEUES.dailyPipeline, { trigger: 'manual' });
    return NextResponse.json({ status: 'queued', jobId }, { status: 202 });
  } catch (e) {
    return NextResponse.json({ status: 'error', error: String(e) }, { status: 503 });
  }
}
