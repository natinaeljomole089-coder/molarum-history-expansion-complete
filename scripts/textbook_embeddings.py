#!/usr/bin/env python3
"""Ingest textbook PDFs into Supabase and retrieve semantically similar chunks.

Examples:
  python scripts/textbook_embeddings.py ingest textbook.pdf --subject History
  python scripts/textbook_embeddings.py retrieve --unit "Unit 1" --query "causes of migration"

Required environment variables for both commands:
  SUPABASE_SERVICE_ROLE_KEY
  OPENAI_API_KEY

Optional:
  SUPABASE_URL (defaults to https://jxdfukggxxlemsoumtal.supabase.co)
  EMBEDDING_MODEL (defaults to text-embedding-3-small)
  OPENAI_BASE_URL (for an OpenAI-compatible embeddings endpoint)
"""
from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from openai import OpenAI
from supabase import Client, create_client

DEFAULT_PROJECT_REF = "jxdfukggxxlemsoumtal"
DEFAULT_MODEL = "text-embedding-3-small"
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
    text = re.sub(r"\s+", " ", result.stdout).strip()
    if len(text.split()) < 20:
        raise RuntimeError("The PDF yielded too little text; it may be scanned and need OCR first")
    return text


def detect_unit(position_text: str, fallback: str) -> str:
    # Handles headings such as "Unit 1", "UNIT ONE", and "Chapter 2".
    match = re.search(r"\b(unit|chapter)\s+([0-9]+|[ivxlcdm]+|[a-z]+)\b", position_text, re.I)
    return match.group(0).title() if match else fallback


def chunk_text(text: str, subject: str, default_unit: str, words_per_chunk: int = 400, overlap: int = 40) -> list[Chunk]:
    words = text.split()
    chunks: list[Chunk] = []
    step = max(1, words_per_chunk - overlap)
    unit = default_unit
    for start in range(0, len(words), step):
        window = words[start : start + words_per_chunk]
        if not window:
            break
        window_text = " ".join(window)
        detected = detect_unit(window_text[:500], unit)
        if detected != unit:
            unit = detected
        chunks.append(Chunk(subject=subject, unit=unit, text=window_text))
        if start + words_per_chunk >= len(words):
            break
    return chunks


def embedding_client() -> OpenAI:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is required")
    kwargs = {"api_key": api_key}
    if os.environ.get("OPENAI_BASE_URL"):
        kwargs["base_url"] = os.environ["OPENAI_BASE_URL"]
    return OpenAI(**kwargs)


def embed(client: OpenAI, texts: list[str]) -> list[list[float]]:
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
    print(f"Prepared {len(chunks)} chunks from {args.pdf}")
    if args.dry_run:
        for index, chunk in enumerate(chunks[:3], 1):
            print(f"{index}. [{chunk.unit}] {chunk.text[:180]}…")
        return
    client = embedding_client()
    db = supabase_client()
    batch_size = max(1, args.batch_size)
    inserted = 0
    for offset in range(0, len(chunks), batch_size):
        batch = chunks[offset : offset + batch_size]
        vectors = embed(client, [chunk.text for chunk in batch])
        rows = [
            {"id": str(uuid.uuid4()), "subject": c.subject, "unit": c.unit, "chunk_text": c.text, "embedding": vector}
            for c, vector in zip(batch, vectors)
        ]
        db.table("textbook_chunks").insert(rows).execute()
        inserted += len(rows)
        print(f"Inserted {inserted}/{len(chunks)} chunks")


def retrieve(args: argparse.Namespace) -> None:
    vector = embed(embedding_client(), [args.query])[0]
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
