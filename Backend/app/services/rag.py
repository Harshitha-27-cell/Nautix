import glob
import math
import os
import re
from typing import Dict, List, Optional, Tuple
import logging
from openai import AsyncOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)


class TextChunker:
    """Text chunking engine with overlap options to preserve document boundaries."""

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
        if not text:
            return []
        chunks = []
        start = 0
        text_len = len(text)
        while start < text_len:
            end = start + chunk_size
            chunks.append(text[start:end])
            start += chunk_size - overlap
        return chunks


class EmbeddingGenerator:
    """Embedding generator using OpenAI API with a local TF-IDF vector fallback."""

    def __init__(self):
        self.openai_client = None
        if settings.OPENAI_API_KEY:
            self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        else:
            logger.warning(
                "OPENAI_API_KEY not found in settings. RAG Embeddings will use local term frequency hashing."
            )

        # Predefined vocabulary mapping for local fallback embedding vector (128 dimensions)
        self.vocab = [
            "argo",
            "float",
            "metadata",
            "profiles",
            "quality",
            "control",
            "qc",
            "flag",
            "temperature",
            "salinity",
            "pressure",
            "conductivity",
            "depth",
            "decibars",
            "ocean",
            "buoyancy",
            "descent",
            "ascent",
            "park",
            "drift",
            "iridium",
            "satellite",
            "gps",
            "thermocline",
            "halocline",
            "pycnocline",
            "density",
            "ctd",
            "sensor",
            "data",
            "good",
            "bad",
            "probable",
            "real-time",
            "delayed-mode",
            "netcdf",
            "gdac",
            "bladder",
            "hydraulic",
            "salts",
            "electrical",
            "dbar",
            "mixed",
            "surface",
            "stratification",
            "precipitations",
            "drift",
            "malfunctioning",
        ]
        self.vocab_map = {word: idx for idx, word in enumerate(self.vocab)}

    async def get_embedding(self, text: str) -> List[float]:
        """Generate embedding vector. Returns 1536-dim vector for OpenAI or 128-dim for fallback."""
        if self.openai_client:
            try:
                response = await self.openai_client.embeddings.create(
                    model="text-embedding-3-small", input=[text]
                )
                return response.data[0].embedding
            except Exception as e:
                logger.error(
                    f"OpenAI Embeddings call failed: {e}. Falling back to local term frequency."
                )

        # Local fallback term-frequency vectorizer
        vector = [0.0] * len(self.vocab)
        clean_text = re.sub(r"[^\w\s]", "", text.lower())
        words = clean_text.split()
        for w in words:
            if w in self.vocab_map:
                vector[self.vocab_map[w]] += 1.0

        # L2 normalization of vector
        magnitude = math.sqrt(sum(v**2 for v in vector))
        if magnitude > 0.0:
            vector = [v / magnitude for v in vector]
        else:
            # Avoid division by zero, yield dummy flat vector
            vector = [1.0 / math.sqrt(len(self.vocab))] * len(self.vocab)

        return vector


class LocalVectorDB:
    """In-memory Vector Database providing semantic search via Cosine Similarity."""

    def __init__(self):
        # List of tuples: (chunk_text, source_doc, embedding_vector)
        self.index: List[Tuple[str, str, List[float]]] = []

    def add(self, text: str, source: str, embedding: List[float]) -> None:
        self.index.append((text, source, embedding))

    def clear(self) -> None:
        self.index.clear()

    @staticmethod
    def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        if len(vec_a) != len(vec_b):
            return 0.0
        dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a**2 for a in vec_a))
        norm_b = math.sqrt(sum(b**2 for b in vec_b))
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return dot_product / (norm_a * norm_b)

    def search(self, query_embedding: List[float], top_k: int = 3) -> List[Dict]:
        """Scours the index and returns the top-K matching chunks."""
        scores = []
        for text, source, emb in self.index:
            score = self._cosine_similarity(query_embedding, emb)
            scores.append({"text": text, "source": source, "score": score})

        # Sort descending by score
        scores.sort(key=lambda x: x["score"], reverse=True)
        return scores[:top_k]


class RAGService:
    """Retrieval-Augmented Generation Service orchestrating loaders, chunkers, and DB lookups."""

    def __init__(
        self,
        embedder: EmbeddingGenerator,
        vector_db: LocalVectorDB,
        knowledge_dir: str = r"c:\ARGO chatbot\Backend\app\knowledge",
    ):
        self.embedder = embedder
        self.db = vector_db
        self.knowledge_dir = knowledge_dir
        self.openai_client = None
        if settings.OPENAI_API_KEY:
            self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def ingest_knowledge_base(self) -> int:
        """Loads and indexes all markdown files inside the knowledge directory."""
        self.db.clear()
        search_path = os.path.join(self.knowledge_dir, "*.md")
        files = glob.glob(search_path)
        chunks_count = 0

        for filepath in files:
            source_name = os.path.basename(filepath)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()

                # Chunk document
                chunks = TextChunker.chunk_text(content, chunk_size=600, overlap=120)
                for chunk in chunks:
                    embedding = await self.embedder.get_embedding(chunk)
                    self.db.add(chunk, source_name, embedding)
                    chunks_count += 1
            except Exception as e:
                logger.error(f"Error reading file {source_name}: {e}")

        logger.info(
            f"RAG Ingestion completed. Vector database indexed {chunks_count} chunks across {len(files)} docs."
        )
        return chunks_count

    async def semantic_search(
        self, query: str, top_k: int = 3
    ) -> List[Dict]:
        query_embedding = await self.embedder.get_embedding(query)
        return self.db.search(query_embedding, top_k=top_k)

    async def query_rag_system(self, query: str, top_k: int = 3) -> Dict:
        # 1. Ingest if vector DB is empty
        if not self.db.index:
            await self.ingest_knowledge_base()

        # 2. Retrieve relevant document chunks
        matching_chunks = await self.semantic_search(query, top_k=top_k)

        # 3. Build context string
        context_parts = []
        for idx, chunk in enumerate(matching_chunks):
            context_parts.append(
                f"[Source: {chunk['source']} (Match Score: {chunk['score']:.2f})]\n{chunk['text']}"
            )
        context_str = "\n\n".join(context_parts)

        # 4. Generate Answer (using OpenAI or fallback rule generator)
        system_prompt = (
            "You are an expert oceanographer ARGO bot. Answer the question based on the provided document contexts.\n"
            "Cite the source document names (e.g. qc_flags.md) in your answer."
        )
        user_prompt = f"DOCUMENT CONTEXTS:\n{context_str}\n\nUSER QUESTION: {query}"

        reply = ""
        if self.openai_client:
            try:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    max_tokens=400,
                    temperature=0.2,
                )
                reply = response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"OpenAI Chat completion in RAG failed: {e}. Using fallback generator.")
                reply = self._generate_fallback_rag_response(query, matching_chunks)
        else:
            reply = self._generate_fallback_rag_response(query, matching_chunks)

        return {
            "query": query,
            "answer": reply,
            "sources": matching_chunks,
        }

    def _generate_fallback_rag_response(
        self, query: str, matching_chunks: List[Dict]
    ) -> str:
        """Fallback rule summarizer yielding rich markdown text from the top matching chunks."""
        if not matching_chunks:
            return "I searched the ARGO documentation database but could not find any relevant sections to answer your question."

        best_chunk = matching_chunks[0]

        # Extract sentences from the top chunk to form a summary
        sentences = re.split(r"(?<=[.!?])\s+", best_chunk["text"])
        summary = " ".join(sentences[:3])

        response = (
            f"### 📖 Documentation Summary (RAG Offline Fallback):\n\n"
            f"{summary}\n\n"
            f"*[Verified against documentation chunk in **{best_chunk['source']}** (semantic match score: {best_chunk['score']:.2f})]*\n\n"
        )

        if len(matching_chunks) > 1:
            response += "#### Additional Related Sources:\n"
            for chunk in matching_chunks[1:]:
                # Extract first sentence of other chunks
                first_sent = re.split(r"(?<=[.!?])\s+", chunk["text"])[0]
                response += f"- **{chunk['source']}**: \"{first_sent}\" (score: {chunk['score']:.2f})\n"

        return response
