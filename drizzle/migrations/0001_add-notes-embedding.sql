-- 1) enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2) add a 1,536‑dimensional vector column
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3) (optional) an ANN index for fast k‑NN
CREATE INDEX IF NOT EXISTS notes_embedding_idx
  ON notes USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
