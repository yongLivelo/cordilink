CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO storage.buckets (id, name, public)
    VALUES ('report_images', 'report_images', TRUE)
ON CONFLICT (id)
    DO NOTHING;

