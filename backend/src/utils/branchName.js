/**
 * Format branch name: TEAM_NAME_LEADER_NAME_AI_Fix
 * Rules:
 * - All UPPERCASE
 * - Replace spaces with underscores (_)
 * - End with _AI_Fix (no brackets)
 * - No special characters except underscores
 * 
 * Examples:
 * - "RIFT ORGANISERS", "Saiyam Kumar" → "RIFT_ORGANISERS_SAIYAM_KUMAR_AI_Fix"
 * - "Code Warriors", "John Doe" → "CODE_WARRIORS_JOHN_DOE_AI_Fix"
 * - "Team ETS", "Deepakmaseeh" → "TEAM_ETS_DEEPAKMASEEH_AI_Fix"
 */
export function formatBranchName(teamName, leaderName) {
  if (!teamName || !leaderName) {
    throw new Error('Team name and leader name are required');
  }

  // Convert to uppercase and replace spaces with underscores
  const formattedTeam = teamName.toUpperCase().replace(/\s+/g, '_');
  const formattedLeader = leaderName.toUpperCase().replace(/\s+/g, '_');

  // Remove any special characters except underscores
  const cleanTeam = formattedTeam.replace(/[^A-Z0-9_]/g, '');
  const cleanLeader = formattedLeader.replace(/[^A-Z0-9_]/g, '');

  // Combine: TEAM_NAME_LEADER_NAME_AI_Fix
  return `${cleanTeam}_${cleanLeader}_AI_Fix`;
}

/**
 * Validate branch name format
 */
export function validateBranchName(branchName) {
  const pattern = /^[A-Z0-9_]+_AI_Fix$/;
  return pattern.test(branchName);
}
