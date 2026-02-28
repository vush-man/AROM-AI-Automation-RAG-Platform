const express = require("express");
const router = express.Router();
const db = require("../db/sqlite");
const { authenticateJWT } = require("../auth/auth.middleware");
const { generateAnswer } = require("../rag/generateAnswer");
const { calculateConfidenceScore } = require("../rag/confidenceScore");
const embedder = require("../embeddings/embedder");
const { similaritySearch } = require("../retrieval/similaritySearch");
const logger = require("../utils/logger");

// Helper: run db.run as a promise
const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

// Helper: run db.get as a promise
const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

// Helper: run db.all as a promise
const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

/**
 * POST /api/query — Submit a query (JWT protected)
 *
 * Execution order (DO NOT CHANGE):
 *  1. Authenticate user        (handled by middleware)
 *  2. Save query to DB
 *  3. Check embeddings exist   (fallback if none)
 *  4. Generate query embedding (via Ollama)
 *  5. Similarity search
 *  6. Generate answer
 *  7. Compute confidence
 *  8. Store result
 *  9. Return response
 */
router.post("/", authenticateJWT, async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user.id;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: "Query cannot be empty" });
    }

    const trimmedQuery = query.trim();

    // 1 — Save query to DB
    const { lastID: queryId } = await dbRun(
      "INSERT INTO queries (user_id, query_text) VALUES (?, ?)",
      [userId, trimmedQuery]
    );
    logger.info(`Query saved id=${queryId} user=${userId}`);

    // 2 — Send query directly to the Python LangGraph chatbot
    const result = await generateAnswer(trimmedQuery, []);

    // 3 — Store the answer in DB
    await dbRun(
      "UPDATE queries SET latest_answer = ? WHERE id = ?",
      [result.answer, queryId]
    );
    logger.info(`Answer stored for query id=${queryId}`);

    // 4 — Return response
    res.json({
      query_id: queryId,
      query: trimmedQuery,
      answer: result.answer,
      confidence: 0.85,
      decision: "AUTO",
      sources: result.sources,
    });
  } catch (error) {
    logger.error("Error processing query:", error);
    res.status(500).json({ error: "Error processing query" });
  }
});

/**
 * POST /api/query/stream — Stream AI response via SSE (JWT protected)
 */
const CHATBOT_API = process.env.CHATBOT_API_URL || "http://127.0.0.1:5001";

router.post("/stream", authenticateJWT, async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user.id;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: "Query cannot be empty" });
    }

    const trimmedQuery = query.trim();

    // Save query to DB first
    const { lastID: queryId } = await dbRun(
      "INSERT INTO queries (user_id, query_text) VALUES (?, ?)",
      [userId, trimmedQuery]
    );
    logger.info(`[Stream] Query saved id=${queryId} user=${userId}`);

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    // Send query_id immediately so frontend knows
    res.write(`data: ${JSON.stringify({ query_id: queryId })}\n\n`);
    res.flush?.();

    // Proxy SSE from Python chatbot
    const pythonRes = await fetch(`${CHATBOT_API}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: trimmedQuery, thread_id: "1" }),
    });

    const reader = pythonRes.body.getReader();
    const decoder = new TextDecoder();
    let fullAnswer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      // Forward SSE data directly to the frontend
      res.write(text);
      res.flush?.();

      // Parse tokens to build full answer for DB storage
      const lines = text.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.token) fullAnswer += parsed.token;
            if (parsed.full_answer) fullAnswer = parsed.full_answer;
          } catch (e) { /* skip unparseable lines */ }
        }
      }
    }

    // Store the full answer in DB after streaming completes
    if (fullAnswer) {
      await dbRun(
        "UPDATE queries SET latest_answer = ? WHERE id = ?",
        [fullAnswer, queryId]
      );
      logger.info(`[Stream] Answer stored for query id=${queryId}`);
    }

    res.end();
  } catch (error) {
    logger.error("Error streaming query:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Error streaming query" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

/**
 * GET /api/query/history — Query history for the authenticated user
 */
router.get("/history", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 50;

    const rows = await dbAll(
      `SELECT q.id, q.query_text, q.created_at,
              COUNT(qr.id) AS result_count
       FROM queries q
       LEFT JOIN query_results qr ON qr.query_id = q.id
       WHERE q.user_id = ?
       GROUP BY q.id
       ORDER BY q.created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    res.json(rows);
  } catch (error) {
    logger.error("Error fetching query history:", error);
    res.status(500).json({ error: "Error fetching history" });
  }
});

module.exports = router;
