#!/usr/bin/env python3
"""Ingest textbook PDFs into Supabase and retrieve semantically similar chunks.

Examples:
  python scripts/textbook_embeddings.py ingest textbook.pdf --subject History
  python scripts/textbook_embeddings.py retrieve --unit "Unit 1" --query "causes of migration"

Required environment variables for both commands:
  SUPABASE_SERVICE_ROLE_KEY
  OPENAI_API_KEY or GEMINI_API_KEY

Optional:
  SUPABASE_URL (defaults to https://jxdfukggxxlemsoumtal.supabase.co)
  EMBEDDING_PROVIDER (openai, gemini, or local; defaults to openai)
  EMBEDDING_MODEL (provider-specific model name)
  OPENAI_BASE_URL (for an OpenAI-compatible embeddings endpoint)
"""
from __future__ import annotations

import argparse
from collections import Counter
import os
import re
import subprocess
import sys
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from openai import OpenAI
from supabase import Client, create_client

DEFAULT_PROJECT_REF = "jxdfukggxxlemsoumtal"
DEFAULT_MODEL = "text-embedding-3-small"
DEFAULT_GEMINI_MODEL = "gemini-embedding-001"
DEFAULT_LOCAL_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIMENSIONS = 1536


@dataclass(frozen=True)
class Chunk:
    subject: str
    unit: str
    text: str


def pdf_to_text(pdf_path: Path) -> str:
    """Extract layout-preserving text using pdftotext, with a clear scan-PDF error."""
    try:
        result = subprocess.run(
            ["pdftotext", "-layout", str(pdf_path), "-"],
            check=True,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError as exc:
        raise RuntimeError("pdftotext is required; install poppler-utils") from exc
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(f"Could not extract text from {pdf_path}: {exc.stderr.strip()}") from exc
    text = "\n".join(re.sub(r"[ \t]+", " ", line).strip() for line in result.stdout.splitlines())
    text = re.sub(r"\n{2,}", "\n", text).strip()
    if len(text.split()) < 20:
        raise RuntimeError("The PDF yielded too little text; it may be scanned and need OCR first")
    return text


def chunk_text(text: str, subject: str, default_unit: str, words_per_chunk: int = 400, overlap: int = 40) -> list[Chunk]:
    words = text.split()
    chunks: list[Chunk] = []
    step = max(1, words_per_chunk - overlap)
    unit = default_unit
    # The PDF repeats a compact "Unit N|..." header on many pages. Map each
    # heading's word offset to the following windows so page headers do not
    # leave most chunks tagged as Unassigned.
    spaced_unit_starts = list(re.finditer(r"(?m)^\s*U\s*N\s*I\s*T\b.*$", text))
    if spaced_unit_starts:
        unit_markers = [
            (len(text[: match.start()].split()), f"Unit {index}")
            for index, match in enumerate(spaced_unit_starts, 1)
        ]
    else:
        unit_markers = [
            (len(text[: match.start()].split()), f"Unit {match.group(1)}")
            for match in re.finditer(r"(?im)^\s*Unit\s+([0-9]+)\s*(?:[:|].*)?$", text)
        ]
    marker_index = 0
    for start in range(0, len(words), step):
        window = words[start : start + words_per_chunk]
        if not window:
            break
        window_text = " ".join(window)
        while marker_index + 1 < len(unit_markers) and unit_markers[marker_index + 1][0] <= start:
            marker_index += 1
        if unit_markers and unit_markers[marker_index][0] <= start:
            unit = unit_markers[marker_index][1]
        chunks.append(Chunk(subject=subject, unit=unit, text=window_text))
        if start + words_per_chunk >= len(words):
            break
    return chunks


def embedding_client() -> Any:
    provider = os.environ.get("EMBEDDING_PROVIDER", "openai").lower()
    if provider == "local":
        from sentence_transformers import SentenceTransformer

        return SentenceTransformer(os.environ.get("EMBEDDING_MODEL", DEFAULT_LOCAL_MODEL))
    if provider == "gemini":
        from google import genai

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is required for EMBEDDING_PROVIDER=gemini")
        return genai.Client(api_key=api_key)
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is required")
    kwargs = {"api_key": api_key}
    if os.environ.get("OPENAI_BASE_URL"):
        kwargs["base_url"] = os.environ["OPENAI_BASE_URL"]
    return OpenAI(**kwargs)


def embed(client: Any, texts: list[str], task_type: str) -> list[list[float]]:
    provider = os.environ.get("EMBEDDING_PROVIDER", "openai").lower()
    if provider == "local":
        vectors = client.encode(texts, normalize_embeddings=True).tolist()
        # Preserve the existing vector(1536) contract while using a local model
        # whose native dimension may be smaller. Zero-padding preserves cosine
        # similarity because vectors are normalized before padding.
        vectors = [vector + [0.0] * (EMBEDDING_DIMENSIONS - len(vector)) for vector in vectors]
    elif provider == "gemini":
        from google.genai import types

        response = client.models.embed_content(
            model=os.environ.get("EMBEDDING_MODEL", DEFAULT_GEMINI_MODEL),
            contents=texts,
            config=types.EmbedContentConfig(
                output_dimensionality=EMBEDDING_DIMENSIONS,
                task_type=task_type,
            ),
        )
        vectors = [item.values for item in response.embeddings]
    else:
        response = client.embeddings.create(
            model=os.environ.get("EMBEDDING_MODEL", DEFAULT_MODEL),
            input=texts,
            dimensions=EMBEDDING_DIMENSIONS,
        )
        vectors = [item.embedding for item in sorted(response.data, key=lambda item: item.index)]
    if any(len(vector) != EMBEDDING_DIMENSIONS for vector in vectors):
        raise RuntimeError("Embedding provider returned a vector with the wrong dimension")
    return vectors


def supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL", f"https://{DEFAULT_PROJECT_REF}.supabase.co")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is required; never use it in a mobile bundle")
    return create_client(url, key)


def ingest(args: argparse.Namespace) -> None:
    chunks = chunk_text(pdf_to_text(Path(args.pdf)), args.subject, args.unit)
    if args.skip < 0 or args.skip > len(chunks):
        raise ValueError(f"--skip must be between 0 and {len(chunks)}")
    chunks = chunks[args.skip :]
    print(f"Prepared {len(chunks)} chunks from {args.pdf}")
    if args.dry_run:
        print("Unit distribution:", dict(Counter(chunk.unit for chunk in chunks)))
        for index, chunk in enumerate(chunks[:3], 1):
            print(f"{index}. [{chunk.unit}] {chunk.text[:180]}…")
        return
    client = embedding_client()
    db = supabase_client()
    batch_size = max(1, args.batch_size)
    inserted = 0
    for offset in range(0, len(chunks), batch_size):
        batch = chunks[offset : offset + batch_size]
        vectors = embed(client, [chunk.text for chunk in batch], "RETRIEVAL_DOCUMENT")
        rows = [
            {"id": str(uuid.uuid4()), "subject": c.subject, "unit": c.unit, "chunk_text": c.text, "embedding": vector}
            for c, vector in zip(batch, vectors)
        ]
        db.table("textbook_chunks").insert(rows).execute()
        inserted += len(rows)
        print(f"Inserted {inserted}/{len(chunks)} chunks")


def retrieve(args: argparse.Namespace) -> None:
    vector = embed(embedding_client(), [args.query], "RETRIEVAL_QUERY")[0]
    result = supabase_client().rpc(
        "match_textbook_chunks",
        {"p_unit": args.unit, "p_query_embedding": vector, "p_match_count": 5},
    ).execute()
    rows = result.data or []
    for index, row in enumerate(rows, 1):
        print(f"{index}. [{row['unit']}] similarity={row['similarity']:.4f}\n{row['chunk_text']}\n")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    ingest_parser = subparsers.add_parser("ingest")
    ingest_parser.add_argument("pdf")
    ingest_parser.add_argument("--subject", required=True)
    ingest_parser.add_argument("--unit", default="Unassigned")
    ingest_parser.add_argument("--batch-size", type=int, default=32)
    ingest_parser.add_argument("--skip", type=int, default=0, help="Skip this many already-inserted chunks when resuming")
    ingest_parser.add_argument("--dry-run", action="store_true")
    ingest_parser.set_defaults(func=ingest)
    retrieve_parser = subparsers.add_parser("retrieve")
    retrieve_parser.add_argument("--unit", required=True)
    retrieve_parser.add_argument("--query", required=True)
    retrieve_parser.set_defaults(func=retrieve)
    return parser


if __name__ == "__main__":
    try:
        args = build_parser().parse_args()
        args.func(args)
    except KeyboardInterrupt:
        sys.exit(130)
