-- Adds optional fields used by the native (Android) product card and search log.
-- All columns are nullable so this migration is a no-op for existing rows and
-- does not affect the web experience.

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS images jsonb,
  ADD COLUMN IF NOT EXISTS sizes jsonb,
  ADD COLUMN IF NOT EXISTS keywords text[],
  ADD COLUMN IF NOT EXISTS is_combo boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_menu_items_keywords ON menu_items USING gin (keywords);

-- Search analytics: every customer search is recorded here.
CREATE TABLE IF NOT EXISTS search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,                       -- firebase UID (nullable for guest)
  keyword text NOT NULL,              -- the raw query
  results_count integer DEFAULT 0,    -- how many menu items matched
  matched_items jsonb,                -- [{id, name}, ...] (first 5)
  platform text DEFAULT 'web',        -- 'web' | 'android'
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_user_id  ON search_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_keyword  ON search_logs (lower(keyword));
CREATE INDEX IF NOT EXISTS idx_search_logs_created  ON search_logs (created_at DESC);

ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS search_logs_insert_any ON search_logs;
CREATE POLICY search_logs_insert_any ON search_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS search_logs_select_admin ON search_logs;
CREATE POLICY search_logs_select_admin ON search_logs
  FOR SELECT TO authenticated
  USING (true);
