const express = require("express");
const router = express.Router();
const db = require("../db/sqlite");
const { authenticateJWT } = require("../auth/auth.middleware");
const { refineAnswer } = require("../rag/generateAnswer");
const { calculateConfidenceScore } = require("../rag/confidenceScore");
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
 * POST /api/feedback — Feedback + Refinement Loop (JWT protected)
 *
 * Two modes:
 *   1. accepted: true  → User is satisfied. Stores positive feedback. Done.
 *   2. accepted: false → User rejected. Provides `correction` text.
 *      System re-generates the answer using original context + correction.
 *      Returns the refined answer. Loop continues until user accepts.
 *
 * Request body:
 *   {
 *     "query_id": 1,
 *     "accepted": true | false,
 *     "correction": "The amount should be ...",   // required when accepted=false
 *     "rating": 4                                  // optional, 1-5
 *   }
 */
router.post("/", authenticateJWT, async (req, res) => {
  try {
    const { query_id, accepted, correction, rating } = req.body;

    // ── Validation ─────────────────────────────────────────────────
    if (!query_id || accepted === undefined) {
      return res
        .status(400)
        .json({ error: "query_id and accepted (true/false) are required" });
    }

    if (!accepted && (!correction || !correction.trim())) {
      return res.status(400).json({
        error:
          "When rejecting, 'correction' is required — tell us what should change",
      });
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res
        .status(400)
        .json({ error: "Rating must be between 1 and 5" });
    }

    // ── Fetch the original query ──────────────────────────────────
    const queryRow = await dbGet(
      "SELECT id, query_text, latest_answer, iteration FROM queries WHERE id = ?",
      [query_id]
    );

    if (!queryRow) {
      return res.status(404).json({ error: "Query not found" });
    }

    // ═══════════════════════════════════════════════════════════════
    // MODE 1: User ACCEPTED the answer
    // ═══════════════════════════════════════════════════════════════
    if (accepted) {
      await dbRun(
        "INSERT INTO human_feedback (query_id, accepted, previous_answer, iteration, rating) VALUES (?, 1, ?, ?, ?)",
        [query_id, queryRow.latest_answer, queryRow.iteration, rating || null]
      );

      await dbRun("UPDATE queries SET accepted = 1 WHERE id = ?", [query_id]);

      logger.info(
        `Query id=${query_id}: User accepted answer at iteration ${queryRow.iteration}`
      );

      return res.json({
        success: true,
        message: "Answer accepted. Thank you for your feedback!",
        query_id,
        final_answer: queryRow.latest_answer,
        iteration: queryRow.iteration,
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // MODE 2: User REJECTED — refine the answer
    // ═══════════════════════════════════════════════════════════════
    const previousAnswer = queryRow.latest_answer;
    const currentIteration = queryRow.iteration;
    const newIteration = currentIteration + 1;

    // Fetch the stored chunks for this query (the original context)
    const storedResults = await dbAll(
      `SELECT qr.chunk_id, qr.similarity_score,
              dc.chunk_text, dc.chunk_index, dc.source_file
       FROM query_results qr
       JOIN document_chunks dc ON dc.id = qr.chunk_id
       WHERE qr.query_id = ?
       ORDER BY qr.similarity_score DESC`,
      [query_id]
    );

    // Re-generate answer with user's correction
    const refined = await refineAnswer(
      queryRow.query_text,
      previousAnswer,
      correction.trim(),
      storedResults
    );

    // Store the feedback record
    await dbRun(
      `INSERT INTO human_feedback 
       (query_id, accepted, correction, previous_answer, refined_answer, iteration, rating)
       VALUES (?, 0, ?, ?, ?, ?, ?)`,
      [
        query_id,
        correction.trim(),
        previousAnswer,
        refined.answer,
        newIteration,
        rating || null,
      ]
    );

    // Update query with the new refined answer and iteration
    await dbRun(
      "UPDATE queries SET latest_answer = ?, iteration = ? WHERE id = ?",
      [refined.answer, newIteration, query_id]
    );

    // Re-calculate confidence with the context
    const confidence = calculateConfidenceScore(storedResults);

    logger.info(
      `Query id=${query_id}: Refined answer at iteration ${newIteration}`
    );

    return res.json({
      query_id,
      iteration: newIteration,
      answer: refined.answer,
      previous_answer: previousAnswer,
      correction: correction.trim(),
      confidence: confidence.score,
      decision: confidence.decision,
      sources: refined.sources,
      message:
        "Answer has been refined based on your feedback. Accept or provide more corrections.",
    });
  } catch (error) {
    logger.error("Error processing feedback:", error);
    res.status(500).json({ error: "Error processing feedback" });
  }
});

/**
 * GET /api/feedback/stats — Feedback statistics (JWT protected)
 */
router.get("/stats", authenticateJWT, (req, res) => {
  try {
    db.get(
      `SELECT COUNT(*)                                  AS total_feedback,
              COUNT(CASE WHEN accepted = 1 THEN 1 END) AS accepted_count,
              COUNT(CASE WHEN accepted = 0 THEN 1 END) AS rejected_count,
              ROUND(AVG(rating), 2)                     AS average_rating,
              ROUND(AVG(iteration), 1)                  AS avg_iterations
       FROM human_feedback`,
      (err, row) => {
        if (err) {
          logger.error("Error fetching feedback stats:", err);
          return res.status(500).json({ error: "Error fetching stats" });
        }
        res.json(row);
      }
    );
  } catch (error) {
    logger.error("Error in feedback stats:", error);
    res.status(500).json({ error: "Error fetching stats" });
  }
});

/**
 * GET /api/feedback/history/:query_id — Full refinement history for a query
 */
router.get("/history/:query_id", authenticateJWT, async (req, res) => {
  try {
    const { query_id } = req.params;

    const feedbacks = await dbAll(
      `SELECT id, accepted, correction, previous_answer, refined_answer,
              iteration, rating, created_at
       FROM human_feedback
       WHERE query_id = ?
       ORDER BY iteration ASC`,
      [query_id]
    );

    const query = await dbGet(
      "SELECT id, query_text, latest_answer, accepted, iteration FROM queries WHERE id = ?",
      [query_id]
    );

    res.json({
      query,
      feedback_history: feedbacks,
      total_iterations: query?.iteration || 0,
      resolved: query?.accepted === 1,
    });
  } catch (error) {
    logger.error("Error fetching feedback history:", error);
    res.status(500).json({ error: "Error fetching feedback history" });
  }
});

module.exports = router;
