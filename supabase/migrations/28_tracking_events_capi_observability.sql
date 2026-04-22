-- Migration: CAPI observability columns on tracking_events
--
-- Previously sendToMeta() only logged errors to console and persisted a
-- boolean `sent_to_meta`. When Meta rejected an event we had no way to debug
-- without grepping serverless logs. These columns capture the full Meta
-- response so admins can inspect failures directly in the DB / admin UI.

ALTER TABLE public.tracking_events
  ADD COLUMN IF NOT EXISTS meta_http_status  INT,
  ADD COLUMN IF NOT EXISTS meta_fbtrace_id   TEXT,
  ADD COLUMN IF NOT EXISTS meta_error        TEXT,
  ADD COLUMN IF NOT EXISTS meta_response     JSONB,
  ADD COLUMN IF NOT EXISTS meta_attempts     INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS tracking_events_sent_to_meta_idx
  ON public.tracking_events (sent_to_meta, created_at DESC);

CREATE INDEX IF NOT EXISTS tracking_events_event_name_created_idx
  ON public.tracking_events (event_name, created_at DESC);
