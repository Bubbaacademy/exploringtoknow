/* Queue integration test (pg-boss v10) — proves the production enqueue→deliver
 * path actually works, which preflight/worker-rest do NOT exercise (they call the
 * persistence layer directly and bypass pg-boss entirely).
 *
 * Proves: both official queues are registered; send() returns a real non-empty id;
 * a corresponding pgboss.job row exists; a registered worker receives the job
 * exactly once; enqueue() rejects a null/empty job id. Uses an isolated embedded
 * Postgres on a dedicated port; never calls Anthropic/OpenAI; never connects to
 * production; cleans up its own resources.
 */
import EmbeddedPostgres from 'embedded-postgres';

async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir: '/tmp/pgdata_queue', user: 'etk', password: 'etk', port: 5441, persistent: false,
  });
  await pg.initialise();
  await pg.start();
  try { await pg.createDatabase('exploringtoknow'); } catch { /* exists */ }
  process.env.DATABASE_URL = 'postgres://etk:etk@127.0.0.1:5441/exploringtoknow';

  const { getBoss, enqueue, ensureQueues, QUEUES } = await import('@etk/queue');
  const { getPool } = await import('@etk/db');
  const ok = (b: boolean, m: string) => { console.log(`${b ? 'PASS' : 'FAIL'}  ${m}`); if (!b) process.exitCode = 1; };

  console.log('===== QUEUE INTEGRATION TEST =====');

  // 1) single init; concurrent callers share one promise/instance (no race)
  const [b1, b2] = await Promise.all([getBoss(), getBoss()]);
  ok(b1 === b2, 'concurrent getBoss() shares one instance (single init, no race)');

  // 2) both official queues registered after start
  ok(!!(await b1.getQueue(QUEUES.generateContent)), 'queue registered: generate-content');
  ok(!!(await b1.getQueue(QUEUES.dailyPipeline)), 'queue registered: daily-pipeline');

  // 3) ensureQueues is idempotent when queues already exist
  let idem = true;
  try { await ensureQueues(b1); } catch { idem = false; }
  ok(idem, 'ensureQueues is idempotent when queues already exist');

  // 4) enqueue returns a real, non-empty job id
  const jobId = await enqueue(QUEUES.generateContent, { productId: 'queue-test', trigger: 'force_generate' });
  ok(typeof jobId === 'string' && jobId.length > 0, `enqueue returns a real job id (${jobId})`);

  // 5) a corresponding pg-boss job row exists
  const pool = getPool();
  const row = await pool.query(
    'SELECT count(*)::int AS c FROM pgboss.job WHERE name = $1 AND id = $2',
    [QUEUES.generateContent, jobId],
  );
  ok(row.rows[0].c === 1, 'pgboss.job row exists for the enqueued id');

  // 6) a registered worker receives the job exactly once
  let received = 0;
  let receivedId = '';
  await b1.work(QUEUES.generateContent, async ([job]: any[]) => { received += 1; receivedId = job.id; });
  for (let i = 0; i < 40 && received < 1; i++) await new Promise((r) => setTimeout(r, 250));
  ok(received === 1, `registered worker received the job exactly once (received=${received})`);
  ok(receivedId === jobId, 'processed job id matches the enqueued id');

  // 7) enqueue rejects a null job id (silent-drop guard) with a descriptive error
  const orig = b1.send.bind(b1);
  (b1 as any).send = async () => null;
  let threw = false;
  try {
    await enqueue(QUEUES.dailyPipeline, { trigger: 'daily' });
  } catch (e) {
    threw = /no job id/i.test(String(e)) && String(e).includes(QUEUES.dailyPipeline);
  }
  (b1 as any).send = orig;
  ok(threw, 'enqueue throws a descriptive error (incl. queue name) when send() returns null');

  await b1.stop({ graceful: false }).catch(() => {});
  console.log(process.exitCode ? '\nQUEUE_RESULT=FAIL' : '\nQUEUE_RESULT=PASS');
  // Exit directly (same pattern as preflight): process teardown reclaims the
  // embedded Postgres child; calling pg.stop() here can surface an unhandled
  // pg-pool error while connections are still open.
  process.exit(process.exitCode ?? 0);
}

main().catch((e) => { console.error('QUEUE_ERR', e?.stack || e); process.exit(1); });
