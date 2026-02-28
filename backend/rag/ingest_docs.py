import os
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    TextLoader,
)

LOADERS = {
    ".pdf": PyPDFLoader,
    ".docx": Docx2txtLoader,
    ".txt": TextLoader,
}

def load_document(file_path):
    """Pick the right loader based on file extension."""
    ext = os.path.splitext(file_path)[1].lower()
    loader_cls = LOADERS.get(ext)
    if loader_cls is None:
        print(f"   ⚠️  Skipping unsupported file type: {ext}")
        return []
    try:
        if loader_cls is TextLoader:
            # Try utf-8 first, then fall back to latin-1
            try:
                return TextLoader(file_path, encoding="utf-8").load()
            except UnicodeDecodeError:
                print(f"   ⚠️  UTF-8 failed for {os.path.basename(file_path)}, retrying with latin-1")
                return TextLoader(file_path, encoding="latin-1").load()
        return loader_cls(file_path).load()
    except Exception as e:
        print(f"   ❌ Error loading {os.path.basename(file_path)}: {e}")
        return []

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    docs_dir = os.path.abspath(os.path.join(base_dir, "..", "embeddings", "docs"))
    index_dir = os.path.join(base_dir, "faiss_index")

    print(f"🔍 Scanning {docs_dir} for new documents...")

    file_paths = []
    for root, dirs, files in os.walk(docs_dir):
        for file in files:
            if not file.startswith('.'):
                file_paths.append(os.path.join(root, file))

    if not file_paths:
        print(f"⚠️  No documents found in {docs_dir}")
        print("Please drop your PDFs, Word Docs, or text files into that folder first!")
        return

    print(f"📄 Found {len(file_paths)} document(s):")
    for fp in file_paths:
        print(f"   - {os.path.basename(fp)}")

    print("\n⏳ Loading documents...")
    all_docs = []
    for fp in file_paths:
        print(f"   Loading: {os.path.basename(fp)}")
        docs = load_document(fp)

        # Tag each doc with its folder name as doc_type (e.g. invoices, reviews, policies, threads)
        parent_folder = os.path.basename(os.path.dirname(fp)).lower()
        for doc in docs:
            doc.metadata["doc_type"] = parent_folder

        all_docs.extend(docs)
        print(f"   ✔ Loaded {len(docs)} page(s) [type: {parent_folder}]")

    if not all_docs:
        print("⚠️  No content could be extracted from the documents.")
        return

    print(f"\n✂️  Chunking {len(all_docs)} pages...")
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_documents(all_docs)
    print(f"   Created {len(chunks)} searchable chunks.")

    print("\n🧠 Generating AI embeddings via Ollama (qwen3-embedding:4b)...")
    embedding = OllamaEmbeddings(model='qwen3-embedding:4b')

    vector_store = FAISS.from_documents(chunks, embedding)

    print(f"\n💾 Saving vector database to {index_dir}...")
    vector_store.save_local(index_dir)
    print("✅ DONE! The FAISS database is ready. You can now ask questions about these documents in your Dashboard!")

if __name__ == "__main__":
    main()
