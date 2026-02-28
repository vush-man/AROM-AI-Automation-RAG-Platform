const logger = require("../utils/logger");

/**
 * Talks to the Python Flask chatbot server via HTTP
 * Python server runs on http://127.0.0.1:5001
 */
const CHATBOT_API = process.env.CHATBOT_API_URL || "http://127.0.0.1:5001";

const generateAnswer = async (query, retrievedChunks = []) => {
  try {
    logger.info(`Sending query to Python chatbot API: "${query}"`);

    const response = await fetch(`${CHATBOT_API}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, thread_id: "1" }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("Chatbot API error:", data.error);
      return {
        answer: data.error || "Error from AI backend.",
        sources: [],
      };
    }

    return {
      answer: data.answer,
      sources: retrievedChunks.map((c, i) => ({
        chunk_index: i,
        chunk_id: c.chunk_id,
        source_file: c.source_file,
        similarity_score: c.similarity_score,
      })),
    };
  } catch (error) {
    logger.error("Failed to reach Python chatbot API:", error.message);
    return {
      answer:
        "The Python AI engine is not running. Please start it with: python rag/chatbot_server.py",
      sources: [],
    };
  }
};

const refineAnswer = async (
  query,
  previousAnswer,
  correction,
  retrievedChunks = []
) => {
  const feedbackPrompt = `My previous question was: "${query}". You answered: "${previousAnswer}". That answer is not correct. Here is my feedback: "${correction}". Please revise your answer.`;

  try {
    logger.info("Sending feedback to Python chatbot API.");

    const response = await fetch(`${CHATBOT_API}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: feedbackPrompt, thread_id: "1" }),
    });

    const data = await response.json();

    return {
      answer: data.answer || "Could not refine answer.",
      sources: retrievedChunks.map((c, i) => ({
        chunk_index: i,
        chunk_id: c.chunk_id,
        source_file: c.source_file,
        similarity_score: c.similarity_score,
      })),
    };
  } catch (error) {
    logger.error("Failed to reach Python chatbot API for refinement:", error.message);
    return {
      answer:
        "The Python AI engine is not running. Please start it with: python rag/chatbot_server.py",
      sources: [],
    };
  }
};

module.exports = { generateAnswer, refineAnswer };
