import { BUG_TYPES } from './constants.js';

/**
 * Format failure output exactly as required:
 * {BUG_TYPE} error in {file} line {line} → Fix: {description}
 */
export function formatFailure(file, line, bugType, fixDescription) {
  // Validate bug type
  const validTypes = Object.values(BUG_TYPES);
  if (!validTypes.includes(bugType)) {
    throw new Error(`Invalid bug type: ${bugType}. Must be one of: ${validTypes.join(', ')}`);
  }

  return `${bugType} error in ${file} line ${line} → Fix: ${fixDescription}`;
}

/**
 * Parse test case input to extract components
 * Example: "src/utils.py — Line 15: Unused import 'os'"
 */
export function parseTestCaseInput(input) {
  // Pattern: "file — Line line: description"
  const match = input.match(/^(.+?)\s+—\s+Line\s+(\d+):\s+(.+)$/);
  if (!match) {
    return null;
  }

  const [, file, line, description] = match;
  return {
    file: file.trim(),
    line: parseInt(line, 10),
    description: description.trim()
  };
}

/**
 * Map test case input to output format
 */
export function mapTestCaseToOutput(testCaseInput) {
  const parsed = parseTestCaseInput(testCaseInput);
  if (!parsed) {
    return null;
  }

  const { file, line, description } = parsed;
  
  // Determine bug type and fix description from input
  let bugType = BUG_TYPES.LOGIC; // default
  let fixDescription = description.toLowerCase();

  if (description.toLowerCase().includes('unused import')) {
    bugType = BUG_TYPES.LINTING;
    fixDescription = 'remove the import statement';
  } else if (description.toLowerCase().includes('missing colon')) {
    bugType = BUG_TYPES.SYNTAX;
    fixDescription = 'add the colon at the correct position';
  } else if (description.toLowerCase().includes('import')) {
    bugType = BUG_TYPES.IMPORT;
  } else if (description.toLowerCase().includes('indent')) {
    bugType = BUG_TYPES.INDENTATION;
  } else if (description.toLowerCase().includes('type')) {
    bugType = BUG_TYPES.TYPE_ERROR;
  }

  return formatFailure(file, line, bugType, fixDescription);
}
