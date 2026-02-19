import {
  BASE_SCORE,
  SPEED_BONUS_THRESHOLD_MS,
  SPEED_BONUS,
  EFFICIENCY_PENALTY_PER_COMMIT,
  EFFICIENCY_THRESHOLD
} from './constants.js';

/**
 * Calculate score based on time and commit count
 */
export function calculateScore(totalTimeMs, commitCount) {
  const baseScore = BASE_SCORE;
  
  // Speed bonus: +10 if time < 5 minutes
  const speedBonus = totalTimeMs < SPEED_BONUS_THRESHOLD_MS ? SPEED_BONUS : 0;
  
  // Efficiency penalty: -2 per commit over 20
  const commitsOverThreshold = Math.max(0, commitCount - EFFICIENCY_THRESHOLD);
  const efficiencyPenalty = commitsOverThreshold * EFFICIENCY_PENALTY_PER_COMMIT;
  
  // Total score (minimum 0)
  const total = Math.max(0, baseScore + speedBonus - efficiencyPenalty);

  return {
    baseScore,
    speedBonus,
    efficiencyPenalty,
    total
  };
}
