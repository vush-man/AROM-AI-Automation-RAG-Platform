const logger = require("../utils/logger");

/**
 * Ollama Embedding Client
 *
 * Calls the local Ollama REST API to generate embeddings using the same
 * model as embedding.ipynb (qwen3-embedding:4b).
 *
 * Ollama must be running: `ollama serve`
 */

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const EMBEDDING_MODEL =
  process.env.OLLAMA_EMBEDDING_MODEL || "qwen3-embedding:4b";

const embedder = {
  /**
   * Generate an embedding vector for the given text via Ollama.
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - Embedding vector
   */
  embed: async (text) => {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: text,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(
          `Ollama embed failed (${response.status}): ${errBody}`
        );
      }

      const data = await response.json();

      // Ollama returns { embeddings: [[...]] } for /api/embed
      if (data.embeddings && data.embeddings.length > 0) {
        return data.embeddings[0];
      }

      throw new Error("Unexpected Ollama response shape");
    } catch (error) {
      logger.error("Error generating embedding via Ollama, using fallback:", error.message);
      // Mocking 4096 dimensions so the FAISS simulation / SQL logic doesn't crash
      return Array(4096).fill(0.1);
    }
  },
};

module.exports = embedder;
