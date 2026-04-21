-- Migration: Unique constraint on tracking_events.event_id
--
-- Without this, client retries (page reload mid-chat, network retries) can
-- insert duplicate rows for the same conversion. Meta dedups via eventID, but
-- our internal analytics would double-count. Adding UNIQUE lets us upsert
-- idempotently via onConflict.

-- Deduplicate any pre-existing duplicates by keeping the oldest row per event_id.
DELETE FROM public.tracking_events a
USING public.tracking_events b
WHERE a.ctid > b.ctid
  AND a.event_id = b.event_id
  AND a.event_id IS NOT NULL;

-- UNIQUE allows multiple NULLs in Postgres (legacy rows without event_id stay valid).
ALTER TABLE public.tracking_events
  ADD CONSTRAINT tracking_events_event_id_key UNIQUE (event_id);
