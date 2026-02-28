/**
 * Calculate confidence score and decision based on retrieval results.
 *
 * Factors:
 *   1. Similarity scores   — how closely chunks match the query
 *   2. Chunk agreement     — consistency across top results
 *   3. Data completeness   — how many results were returned vs expected
 *
 * Decision logic:
 *   ≥ 0.85         → AUTO
 *   0.60 – 0.84    → HUMAN_REVIEW
 *   < 0.60         → MANUAL
 *
 * @param {object[]} retrievalResults - Results from similarity search
 * @param {number}   expectedK       - Expected number of results (default 5)
 * @returns {object} - { score, decision, analysis }
 */
const calculateConfidenceScore = (retrievalResults, expectedK = 5) => {
  if (!retrievalResults || retrievalResults.length === 0) {
    return {
      score: 0.0,
      decision: "MANUAL",
      analysis: "No results available",
      average_similarity: 0,
      result_count: 0,
    };
  }

  const similarities = retrievalResults.map((r) => r.similarity_score);
  const count = similarities.length;

  // ── Factor 1: Similarity scores ────────────────────────────────────
  const maxSimilarity = Math.max(...similarities);
  const avgSimilarity =
    similarities.reduce((a, b) => a + b, 0) / count;

  // ── Factor 2: Chunk agreement ──────────────────────────────────────
  // Measures how consistent the top results are with each other.
  // Low variance = high agreement (chunks agree on the topic).
  const variance =
    similarities.reduce((sum, s) => sum + Math.pow(s - avgSimilarity, 2), 0) /
    count;
  // Convert variance to a 0–1 agreement score (lower variance = higher agreement)
  const agreementScore = Math.max(0, 1 - Math.sqrt(variance) * 2);

  // ── Factor 3: Data completeness ────────────────────────────────────
  // Ratio of results returned vs expected count
  const completenessScore = Math.min(count / expectedK, 1.0);

  // ── Weighted final score ───────────────────────────────────────────
  // Similarity is the primary factor (60%), agreement (25%), completeness (15%)
  const finalScore =
    maxSimilarity * 0.6 + agreementScore * 0.25 + completenessScore * 0.15;

  // ── Decision logic ─────────────────────────────────────────────────
  let decision;
  let analysis;

  if (finalScore >= 0.85) {
    decision = "AUTO";
    analysis = "High confidence — strong matches with good agreement";
  } else if (finalScore >= 0.60) {
    decision = "HUMAN_REVIEW";
    analysis = "Medium confidence — human review recommended";
  } else {
    decision = "MANUAL";
    analysis = "Low confidence — manual processing required";
  }

  return {
    score: parseFloat(finalScore.toFixed(4)),
    decision,
    analysis,
    max_similarity: parseFloat(maxSimilarity.toFixed(4)),
    average_similarity: parseFloat(avgSimilarity.toFixed(4)),
    chunk_agreement: parseFloat(agreementScore.toFixed(4)),
    data_completeness: parseFloat(completenessScore.toFixed(4)),
    result_count: count,
  };
};

module.exports = { calculateConfidenceScore };
