-- Textbook semantic retrieval layer.
create extension if not exists vector with schema extensions;

create table if not exists public.textbook_chunks (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  unit text not null,
  chunk_text text not null,
  embedding extensions.vector(1536) not null,
  created_at timestamptz not null default now()
);

create index if not exists textbook_chunks_subject_unit_idx
  on public.textbook_chunks (subject, unit);

create index if not exists textbook_chunks_embedding_hnsw_idx
  on public.textbook_chunks using hnsw (embedding vector_cosine_ops);

alter table public.textbook_chunks enable row level security;

create or replace function public.match_textbook_chunks(
  p_unit text,
  p_query_embedding extensions.vector(1536),
  p_match_count integer default 5
)
returns table (
  id uuid,
  subject text,
  unit text,
  chunk_text text,
  similarity real
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    tc.id,
    tc.subject,
    tc.unit,
    tc.chunk_text,
    (1 - (tc.embedding <=> p_query_embedding))::real as similarity
  from public.textbook_chunks as tc
  where lower(tc.unit) = lower(p_unit)
  order by tc.embedding <=> p_query_embedding
  limit greatest(1, least(coalesce(p_match_count, 5), 50));
$$;

comment on function public.match_textbook_chunks(text, extensions.vector, integer)
is 'Returns the most similar textbook chunks for a unit. Embed the query with the same 1536-dimensional model used at ingestion.';

revoke all on table public.textbook_chunks from anon, authenticated;
revoke all on function public.match_textbook_chunks(text, extensions.vector, integer) from public, anon, authenticated;
-- Ingestion and retrieval run with a service-role key. No service-role key belongs in the mobile app.
