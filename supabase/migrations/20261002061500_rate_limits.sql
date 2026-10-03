-- Rate limiting for the ai-categorizer edge function.
-- One row per (subject, window); the function increments count and rejects
-- once it exceeds the limit.

CREATE TABLE public.rate_limits (
  subject     text        NOT NULL,
  window_start timestamptz NOT NULL,
  count       integer     NOT NULL DEFAULT 1,
  CONSTRAINT rate_limits_pkey PRIMARY KEY (subject, window_start)
);

-- Rows are only useful for the current window; drop the rest on read.
CREATE INDEX rate_limits_window_start_idx
  ON public.rate_limits (window_start);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No client-facing policies on purpose: only the edge function's
-- service-role client (ctx.supabaseAdmin, which bypasses RLS) touches this.

REVOKE ALL ON TABLE public.rate_limits FROM anon, authenticated;