# Textbook embeddings and retrieval

The project stores textbook excerpts in Supabase `public.textbook_chunks`. The `embedding` column uses `extensions.vector(1536)`, and `public.match_textbook_chunks` performs cosine-distance ranking within a unit and returns at most five rows.

## Setup

The migration has already been applied to Supabase project `jxdfukggxxlemsoumtal`. For local use, set a Supabase service-role key and an embeddings-provider key in the shell. The service-role key is required because the table is protected by RLS and must never be shipped in the Expo application.

```bash
export SUPABASE_URL=https://jxdfukggxxlemsoumtal.supabase.co
export SUPABASE_SERVICE_ROLE_KEY='…'
export OPENAI_API_KEY='…'
# Optional: export OPENAI_BASE_URL='https://your-openai-compatible-endpoint/v1'
# Optional: export EMBEDDING_MODEL='text-embedding-3-small'
```

## Ingest a PDF

`pdftotext -layout` extracts the PDF. The script makes approximately 400-word windows with a 40-word overlap. It tags a window from a nearby `Unit N` or `Chapter N` heading when detected; otherwise it uses `--unit` (default `Unassigned`). Embeddings are generated in batches and inserted into Supabase.

```bash
python3 scripts/textbook_embeddings.py ingest /path/to/textbook.pdf \
  --subject History \
  --unit 'Unit 1'
```

Preview extraction and chunk boundaries without calling either external API:

```bash
python3 scripts/textbook_embeddings.py ingest /path/to/textbook.pdf \
  --subject History --unit 'Unit 1' --dry-run
```

Scanned PDFs must be OCRed before ingestion. The script intentionally stops rather than silently inserting empty or unusable chunks.

## Retrieve the top five chunks

The CLI embeds the query with the same 1536-dimensional model and calls the SQL RPC:

```bash
python3 scripts/textbook_embeddings.py retrieve \
  --unit 'Unit 1' \
  --query 'What were the main causes of migration?'
```

The RPC accepts a precomputed vector rather than raw text because Postgres does not call the external embedding provider. This keeps credentials out of the database and makes model consistency explicit.
