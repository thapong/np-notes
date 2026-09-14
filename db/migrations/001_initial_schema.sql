CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#64748b',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  source TEXT NOT NULL CHECK (source IN ('line', 'web')),
  content_type TEXT NOT NULL,
  text_content TEXT,
  location_json JSONB,
  line_message_id TEXT UNIQUE,
  captured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_document TSVECTOR NOT NULL DEFAULT ''::tsvector
);

CREATE INDEX IF NOT EXISTS notes_category_captured_idx ON notes(category_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS notes_search_document_idx ON notes USING GIN(search_document);

CREATE OR REPLACE FUNCTION notes_search_document_update() RETURNS trigger AS $$
BEGIN
  NEW.search_document :=
    setweight(to_tsvector('simple', coalesce(NEW.text_content, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notes_search_document_trigger ON notes;
CREATE TRIGGER notes_search_document_trigger
  BEFORE INSERT OR UPDATE OF text_content ON notes
  FOR EACH ROW EXECUTE FUNCTION notes_search_document_update();

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  line_message_id TEXT,
  original_name TEXT,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  storage_path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS attachments_note_id_idx ON attachments(note_id);

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS webhook_events_status_idx ON webhook_events(status, received_at);

CREATE TABLE IF NOT EXISTS embedding_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('ollama', 'openrouter')),
  model TEXT NOT NULL,
  dimension INTEGER NOT NULL CHECK (dimension > 0),
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, model, dimension)
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_embedding_profile_idx
  ON embedding_profiles(is_active) WHERE is_active;

CREATE TABLE IF NOT EXISTS note_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  embedding_profile_id UUID NOT NULL REFERENCES embedding_profiles(id) ON DELETE CASCADE,
  embedding vector NOT NULL,
  source_text_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(note_id, embedding_profile_id)
);

CREATE INDEX IF NOT EXISTS note_embeddings_note_id_idx ON note_embeddings(note_id);
