"""
export_to_sqlite.py
====================
Run this script AFTER running embedding.ipynb to export the FAISS vector
data (chunks + embeddings) into the SQLite database so the Node.js
backend can query them.

Usage (run in the same Python env as the notebook):
    python embeddings/export_to_sqlite.py

Or run it as a cell at the end of embedding.ipynb:
    %run export_to_sqlite.py
"""

import os
import sys
import json
import sqlite3
import numpy as np

# ── Configuration ────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FAISS_INDEX_DIR = os.path.join(SCRIPT_DIR, "faiss_index")
DB_PATH = os.path.join(SCRIPT_DIR, "..", "db", "slingshot.db")

# ── Imports from LangChain (same env as notebook) ────────────────────────
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import FAISS

def main():
    print(f"[INFO] Loading FAISS index from: {FAISS_INDEX_DIR}")
    if not os.path.isdir(FAISS_INDEX_DIR):
        print(f"[ERROR] FAISS index not found at {FAISS_INDEX_DIR}")
        print("        Run embedding.ipynb first to generate the index.")
        sys.exit(1)

    # Load the FAISS vector store (same embedding model as notebook)
    embedding_model = OllamaEmbeddings(model="qwen3-embedding:4b")
    vector_store = FAISS.load_local(
        FAISS_INDEX_DIR,
        embedding_model,
        allow_dangerous_deserialization=True,
    )

    print(f"[INFO] Connecting to SQLite: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Create tables if they don't exist
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS document_chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chunk_text TEXT NOT NULL,
            source_file TEXT,
            chunk_index INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS embeddings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chunk_id INTEGER NOT NULL,
            embedding BLOB NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(chunk_id) REFERENCES document_chunks(id) ON DELETE CASCADE
        );
    """)

    # Clear existing data (fresh export)
    cur.execute("DELETE FROM embeddings")
    cur.execute("DELETE FROM document_chunks")
    conn.commit()
    print("[INFO] Cleared existing chunks and embeddings")

    # Extract documents and their embeddings from the FAISS store
    docstore = vector_store.docstore
    index_to_docstore_id = vector_store.index_to_docstore_id
    faiss_index = vector_store.index

    total_vectors = faiss_index.ntotal
    print(f"[INFO] Found {total_vectors} vectors in FAISS index")

    # Reconstruct all vectors from the index
    all_vectors = faiss_index.reconstruct_n(0, total_vectors)

    exported = 0
    for i in range(total_vectors):
        doc_id = index_to_docstore_id[i]
        doc = docstore.search(doc_id)

        chunk_text = doc.page_content
        source_file = doc.metadata.get("source", doc.metadata.get("filename", "unknown"))
        embedding_vec = all_vectors[i].tolist()

        # Insert chunk
        cur.execute(
            "INSERT INTO document_chunks (chunk_text, source_file, chunk_index) VALUES (?, ?, ?)",
            (chunk_text, source_file, i),
        )
        chunk_id = cur.lastrowid

        # Insert embedding as JSON blob
        cur.execute(
            "INSERT INTO embeddings (chunk_id, embedding) VALUES (?, ?)",
            (chunk_id, json.dumps(embedding_vec)),
        )

        exported += 1

    conn.commit()
    conn.close()

    print(f"[SUCCESS] Exported {exported} chunks + embeddings to {DB_PATH}")
    print("[INFO] Node.js backend can now query these embeddings.")


if __name__ == "__main__":
    main()
