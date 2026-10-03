// Extra scoring logic - so scoring no be only AI, we fit adjust

const calculateFinalScore = (aiResult, options = {}) => {
  let finalScore = aiResult.score || 0;

  // Example: You can add weight adjustments here later without changing prompt
  // e.g., if blind mode is on, don't penalize missing name/school
  if (options.isBlindMode) {
    // Don't penalize education too much
    finalScore = Math.round((aiResult.experience_relevance * 0.7) + (aiResult.skills_matched.length * 3));
  }

  // Clamp 0-100
  finalScore = Math.max(0, Math.min(100, finalScore));

  // Normalize recommendation based on final score
  let recommendation = aiResult.recommendation;
  if (finalScore >= 80) recommendation = "HIGHLY_RECOMMENDED";
  else if (finalScore >= 60) recommendation = "RECOMMENDED";
  else if (finalScore >= 40) recommendation = "MAYBE";
  else recommendation = "NOT_RECOMMENDED";

  return {
    ...aiResult,
    final_score: finalScore,
    recommendation,
  };
};

const getScoreColor = (score) => {
  if (score >= 80) return "green";
  if (score >= 60) return "blue";
  if (score >= 40) return "yellow";
  return "red";
};

module.exports = { calculateFinalScore, getScoreColor };