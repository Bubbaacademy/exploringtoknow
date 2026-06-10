/** Minimal structured logger. Swap for pino in a later phase if needed. */
type Level = 'debug' | 'info' | 'warn' | 'error';
function log(level: Level, msg: string, meta: Record<string, unknown> = {}) {
  // correlation ids (runId/jobId) are passed in meta by callers (impl pkg §5.2)
  console[level === 'debug' ? 'log' : level](JSON.stringify({ level, msg, ...meta, t: new Date().toISOString() }));
}
export const logger = {
  debug: (m: string, meta?: Record<string, unknown>) => log('debug', m, meta),
  info: (m: string, meta?: Record<string, unknown>) => log('info', m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => log('warn', m, meta),
  error: (m: string, meta?: Record<string, unknown>) => log('error', m, meta),
};
