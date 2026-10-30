-- Adds event photo uploads (safe to re-run).
BEGIN;
CREATE TABLE IF NOT EXISTS event_photos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
    caption text NOT NULL DEFAULT '',
    content_type text NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
    size_bytes integer NOT NULL CHECK (size_bytes > 0),
    data bytea NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_photos_event_idx ON event_photos(event_id, created_at DESC);
COMMIT;
