// Team constants - DO NOT CHANGE
export const TEAM_NAME = 'Team ETS';
export const TEAM_LEADER = 'Deepakmaseeh';
export const BRANCH_NAME = 'TEAM_ETS_DEEPAKMASEEH_AI_Fix';
export const COMMIT_PREFIX = '[AI-AGENT]';

// Bug types
export const BUG_TYPES = {
  LINTING: 'LINTING',
  SYNTAX: 'SYNTAX',
  LOGIC: 'LOGIC',
  TYPE_ERROR: 'TYPE_ERROR',
  IMPORT: 'IMPORT',
  INDENTATION: 'INDENTATION'
};

// Scoring constants
export const BASE_SCORE = 100;
export const SPEED_BONUS_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
export const SPEED_BONUS = 10;
export const EFFICIENCY_PENALTY_PER_COMMIT = 2;
export const EFFICIENCY_THRESHOLD = 20;
