# Operational migrations

SQL migrations for the non-Payload operational tables (impl pkg §3): pipeline_runs,
jobs, job_events, tracking_links, click_events, conversions, metric_snapshots,
refresh_queue.

Payload owns and migrates the **content** collections separately via
`payload migrate`. Phase 0 ships no operational migrations yet — the first
(`0001_init_ops.sql`) is created in Phase 1 alongside the queue + catalog work.
