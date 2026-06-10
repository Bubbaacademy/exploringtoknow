-- ExploringToKnow — operational (non-Payload) tables. Impl package §3.
-- Idempotent: safe to re-run. All timestamps UTC; money in integer cents.

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- ---- orchestration -------------------------------------------------------
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date    date NOT NULL,
  status      text NOT NULL DEFAULT 'queued',  -- queued|running|completed|failed|partial
  started_at  timestamptz,
  finished_at timestamptz,
  stats       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_date)
);

CREATE TABLE IF NOT EXISTS jobs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id       uuid REFERENCES pipeline_runs(id) ON DELETE SET NULL,
  type         text NOT NULL,                  -- product_intelligence|content_brief|generate_article|quality_gate|generate_social|publish_article|publish_social|refresh_suggestion
  entity_type  text,
  entity_id    uuid,
  status       text NOT NULL DEFAULT 'queued', -- queued|running|succeeded|failed|flagged
  attempts     int  NOT NULL DEFAULT 0,
  max_attempts int  NOT NULL DEFAULT 3,
  payload      jsonb,
  result       jsonb,
  error        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jobs_run_status ON jobs(run_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_entity ON jobs(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS job_events (
  id        bigserial PRIMARY KEY,
  job_id    uuid REFERENCES jobs(id) ON DELETE CASCADE,
  ts        timestamptz NOT NULL DEFAULT now(),
  level     text NOT NULL DEFAULT 'info',
  message   text NOT NULL,
  data      jsonb
);
CREATE INDEX IF NOT EXISTS idx_job_events_job ON job_events(job_id, ts);

-- ---- tracking ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tracking_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,
  kind        text NOT NULL,   -- amazon_attribution|amazon_affiliate|external_affiliate|internal_lp|hubspot_form
  destination text NOT NULL,
  product_id  uuid,
  article_id  uuid,
  source      text, medium text, campaign text, content text,  -- UTM
  created_at  timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE IF NOT EXISTS click_events (
  id         bigserial PRIMARY KEY,
  link_id    uuid REFERENCES tracking_links(id) ON DELETE CASCADE,
  ts         timestamptz NOT NULL DEFAULT now(),
  referrer   text, user_agent text, ip_hash text, country text
);
CREATE INDEX IF NOT EXISTS idx_click_link_ts ON click_events(link_id, ts);

CREATE TABLE IF NOT EXISTS conversions (
  id           bigserial PRIMARY KEY,
  source       text NOT NULL,    -- amazon_attribution|hubspot
  link_id      uuid REFERENCES tracking_links(id) ON DELETE SET NULL,
  product_id   uuid,
  article_id   uuid,
  kind         text NOT NULL,    -- sale|lead
  value_cents  bigint NOT NULL DEFAULT 0,
  occurred_on  date NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversions_entity ON conversions(article_id, product_id, occurred_on);

-- ---- analytics -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS metric_snapshots (
  id          bigserial PRIMARY KEY,
  source      text NOT NULL,     -- ga4|gsc|amazon_attribution|hubspot|meta
  entity_type text NOT NULL,     -- article|product|post|link|site
  entity_id   uuid,
  metric      text NOT NULL,     -- views|clicks|ctr|leads|sales|revenue_cents|impressions|position
  value       numeric NOT NULL,
  period_date date NOT NULL,
  pulled_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, entity_type, entity_id, metric, period_date)
);
CREATE INDEX IF NOT EXISTS idx_snap_entity ON metric_snapshots(entity_type, entity_id, period_date);

CREATE TABLE IF NOT EXISTS refresh_queue (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  uuid NOT NULL,
  reason      text NOT NULL,     -- decay|stale|broken_link|low_ctr|seasonal|ranking_slip
  priority    int  NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'pending',  -- pending|in_progress|resolved
  created_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_refresh_status_priority ON refresh_queue(status, priority DESC);
