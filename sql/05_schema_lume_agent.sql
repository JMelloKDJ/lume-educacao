-- Lume Educação (ENGN62 — Grupo 4)
-- Migration 05: Schema operacional lume_agent (estado durável, delta turns, outbox, cache, RAG pgvector, ações e telemetria)

CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA IF NOT EXISTS lume_agent;

CREATE TABLE IF NOT EXISTS lume_agent.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  active_turn_id uuid,
  status text NOT NULL DEFAULT 'idle',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lume_agent.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES lume_agent.conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  turn_id uuid,
  processed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lume_agent_messages_conv_created
  ON lume_agent.messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_lume_agent_messages_unprocessed
  ON lume_agent.messages (conversation_id, processed, created_at)
  WHERE role = 'user' AND processed = false;

CREATE TABLE IF NOT EXISTS lume_agent.turn_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES lume_agent.conversations(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('debouncing', 'running', 'completed', 'error')),
  process_after timestamptz NOT NULL DEFAULT now(),
  model_used text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_lume_agent_turn_jobs_conv_status
  ON lume_agent.turn_jobs (conversation_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS lume_agent.outbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES lume_agent.conversations(id) ON DELETE CASCADE,
  turn_id uuid NOT NULL,
  seq integer NOT NULL,
  content text NOT NULL,
  delivered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lume_agent_outbox_conv_seq
  ON lume_agent.outbox_messages (conversation_id, created_at, seq);

CREATE TABLE IF NOT EXISTS lume_agent.knowledge_chunks (
  id bigserial PRIMARY KEY,
  source_file text NOT NULL,
  section_title text NOT NULL DEFAULT '',
  chunk_index integer NOT NULL,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1536) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_file, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_lume_agent_knowledge_embedding_hnsw
  ON lume_agent.knowledge_chunks
  USING hnsw (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION lume_agent.match_knowledge_chunks(
  query_embedding vector(1536),
  match_count integer DEFAULT 6
)
RETURNS TABLE (
  id bigint,
  source_file text,
  section_title text,
  chunk_index integer,
  content text,
  metadata jsonb,
  similarity double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    kc.id,
    kc.source_file,
    kc.section_title,
    kc.chunk_index,
    kc.content,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM lume_agent.knowledge_chunks kc
  ORDER BY kc.embedding <=> query_embedding
  LIMIT LEAST(GREATEST(match_count, 1), 15);
$$;

CREATE TABLE IF NOT EXISTS lume_agent.tool_cache (
  cache_key text PRIMARY KEY,
  tool_name text NOT NULL,
  data_fingerprint text NOT NULL,
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lume_agent_tool_cache_expires
  ON lume_agent.tool_cache (expires_at);

CREATE TABLE IF NOT EXISTS lume_agent.agent_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES lume_agent.conversations(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  payload jsonb NOT NULL,
  governance_level text NOT NULL,
  status text NOT NULL DEFAULT 'registrada',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lume_agent_actions_created
  ON lume_agent.agent_actions (created_at DESC);

CREATE TABLE IF NOT EXISTS lume_agent.turn_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES lume_agent.conversations(id) ON DELETE SET NULL,
  turn_id uuid NOT NULL,
  status text NOT NULL,
  messages_coalesced integer NOT NULL DEFAULT 1,
  model_primary text NOT NULL,
  escalated_to_flash boolean NOT NULL DEFAULT false,
  escalation_reason text,
  cache_hits integer NOT NULL DEFAULT 0,
  rag_chunks_count integer NOT NULL DEFAULT 0,
  tools_called jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_created integer NOT NULL DEFAULT 0,
  outbox_bubbles_count integer NOT NULL DEFAULT 0,
  debounce_ms integer NOT NULL DEFAULT 0,
  rag_ms integer NOT NULL DEFAULT 0,
  tools_ms integer NOT NULL DEFAULT 0,
  llm_ms integer NOT NULL DEFAULT 0,
  total_ms integer NOT NULL DEFAULT 0,
  tokens_in integer NOT NULL DEFAULT 0,
  tokens_out integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lume_agent_telemetry_created
  ON lume_agent.turn_telemetry (created_at DESC);
