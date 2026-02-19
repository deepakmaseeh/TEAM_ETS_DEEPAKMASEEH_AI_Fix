import fs from 'fs/promises';
import path from 'path';
import { BUG_TYPES } from '../utils/constants.js';
import { formatFailure } from '../utils/outputFormatter.js';
import { generateText } from '../utils/aiClient.js';

/**
 * FixGeneratorAgent: Applies rule-based fixes first, then falls back to AI generation
 */
export class FixGeneratorAgent {
  async generateFix(failure, repoPath) {
    const { file, line, bugType, errorMessage } = failure;
    const filePath = path.join(repoPath, file);

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const lines = fileContent.split('\n');

      // 1. Try Rule-based Fix first (fast, deterministic)
      const ruleFix = this.applyRuleBasedFix(lines, line, bugType, errorMessage);

      let fixDescription = `Fixed ${bugType} at line ${line}`;
      let fixedContent = null;

      if (ruleFix) {
        fixedContent = ruleFix;

        // Enhance description with Gemini
        try {
          const prompt = `
            You are an expert software engineer.
            I have applied a rule-based fix to a bug.
            
            BUG: ${bugType} in ${file}:${line}
            ERROR: ${errorMessage}
            
            Please provide a one-sentence, professional commit message/description for this fix.
            Do NOT use markdown. Just the text.
          `;
          const aiDesc = await generateText(prompt);
          if (aiDesc) fixDescription = aiDesc.trim().replace(/^"|"$/g, '');
        } catch (e) {
          // Ignore AI failure, use default description
        }
      } else {
        // 2. Fallback: AI-powered fix generation (send the actual file to Gemini)
        console.log(`🤖 No rule-based fix for ${bugType} in ${file}, asking AI...`);
        const aiFixResult = await this.generateAIFix(failure, fileContent, file);

        if (aiFixResult.applied) {
          return aiFixResult;
        }

        // 3. If both fail, return not applied
        console.warn(`No fix found for ${bugType} in ${file}`);
        return { applied: false, file, line, bugType };
      }

      const formattedOutput = formatFailure(file, line, bugType, fixDescription);

      return {
        file,
        line,
        bugType,
        fixDescription,
        fixedContent,
        formattedOutput,
        applied: true,
        method: 'rule-based'
      };

    } catch (error) {
      console.error(`Failed to generate fix for ${file}:${line}:`, error);
      throw new Error(`Failed to generate fix: ${error.message}`);
    }
  }

  /**
   * AI-powered fix: sends the entire file to Gemini with the error context
   */
  async generateAIFix(failure, fileContent, fileName) {
    const { line, bugType, errorMessage } = failure;

    // Truncate file content if too large (keep first 8000 chars)
    const truncatedContent = fileContent.length > 8000
      ? fileContent.substring(0, 8000) + '\n# ... [TRUNCATED] ...'
      : fileContent;

    const ext = path.extname(fileName).replace('.', '');
    const langMap = { py: 'Python', js: 'JavaScript', ts: 'TypeScript', java: 'Java', go: 'Go', rb: 'Ruby' };
    const lang = langMap[ext] || 'code';

    const prompt = `
      You are an expert ${lang} programmer and automated code fixer.
      
      The following ${lang} file has a bug that is causing a test failure.
      
      FILENAME: ${fileName}
      BUG TYPE: ${bugType}
      ERROR LINE: ${line}
      ERROR MESSAGE: ${errorMessage || 'Unknown error'}
      
      FILE CONTENT:
      \`\`\`${ext}
      ${truncatedContent}
      \`\`\`
      
      TASK: Fix the bug in the file above.
      
      RULES:
      1. Return ONLY the complete, corrected file content
      2. Do NOT include any markdown code fences (\`\`\`)
      3. Do NOT include any explanation, comments about changes, or preamble
      4. Keep ALL other code EXACTLY the same as the original
      5. Only fix the specific bug described, do not refactor or change unrelated code
      6. If you cannot determine the fix with confidence, return the original file unchanged
      
      Return ONLY the corrected file content:
    `;

    try {
      const aiResponse = await generateText(prompt);

      if (!aiResponse || aiResponse.length < 10) {
        return { applied: false, ...failure };
      }

      // Sanity check: response should be similar length to original
      const lengthRatio = aiResponse.length / fileContent.length;
      if (lengthRatio < 0.5 || lengthRatio > 2.0) {
        console.warn(`AI fix response length ratio suspicious (${lengthRatio.toFixed(2)}), skipping`);
        return { applied: false, ...failure };
      }

      const fixDescription = `AI-generated fix for ${bugType} in ${fileName} at line ${line}`;

      return {
        file: failure.file,
        line,
        bugType,
        fixDescription,
        fixedContent: aiResponse,
        formattedOutput: formatFailure(failure.file, line, bugType, fixDescription),
        applied: true,
        method: 'ai-generated'
      };

    } catch (error) {
      console.warn(`AI fix generation failed for ${fileName}:`, error.message);
      return { applied: false, ...failure };
    }
  }

  applyRuleBasedFix(lines, lineIndex, bugType, errorMessage) {
    // lineIndex is 1-based from error, array is 0-based
    const idx = lineIndex - 1;
    if (idx < 0 || idx >= lines.length) return null;

    const originalLine = lines[idx];
    const newLines = [...lines]; // copy

    // Fix: Unused import (Python/JS)
    if (bugType === 'LINTING' || bugType === 'IMPORT' || (errorMessage && errorMessage.toLowerCase().includes('unused'))) {
      if (originalLine.includes('import ')) {
        // Comment out unused import
        newLines[idx] = `# ${originalLine} # Unused import removed by RIFT Agent`;
        return newLines.join('\n');
      }
    }

    // Fix: Missing colon (Python syntax)
    if (bugType === 'SYNTAX' || (errorMessage && (errorMessage.toLowerCase().includes('expected :') || errorMessage.toLowerCase().includes('invalid syntax')))) {
      if (!originalLine.trim().endsWith(':') &&
        (originalLine.trim().startsWith('def ') || originalLine.trim().startsWith('if ') ||
          originalLine.trim().startsWith('else') || originalLine.trim().startsWith('elif ') ||
          originalLine.trim().startsWith('for ') || originalLine.trim().startsWith('while ') ||
          originalLine.trim().startsWith('class ') || originalLine.trim().startsWith('try') ||
          originalLine.trim().startsWith('except') || originalLine.trim().startsWith('finally'))) {
        newLines[idx] = originalLine + ':';
        return newLines.join('\n');
      }
    }

    // Fix: Tab/space indentation issues (Python)
    if (bugType === 'INDENTATION') {
      if (originalLine.includes('\t')) {
        newLines[idx] = originalLine.replace(/\t/g, '    ');
        return newLines.join('\n');
      }
      // Fix over-indented line (try removing 4 spaces)
      if (originalLine.startsWith('        ') && !lines[idx - 1]?.trim().endsWith(':')) {
        newLines[idx] = originalLine.substring(4);
        return newLines.join('\n');
      }
    }

    // Fix: Missing semicolon (JS/Java)
    if (bugType === 'SYNTAX' && errorMessage && errorMessage.toLowerCase().includes('semicolon')) {
      if (!originalLine.trim().endsWith(';') && !originalLine.trim().endsWith('{') && !originalLine.trim().endsWith('}')) {
        newLines[idx] = originalLine + ';';
        return newLines.join('\n');
      }
    }

    // Fix: None/null comparison using == instead of is (Python)
    if (bugType === 'LOGIC' && errorMessage && errorMessage.toLowerCase().includes('none')) {
      if (originalLine.includes('== None')) {
        newLines[idx] = originalLine.replace(/== None/g, 'is None');
        return newLines.join('\n');
      }
      if (originalLine.includes('!= None')) {
        newLines[idx] = originalLine.replace(/!= None/g, 'is not None');
        return newLines.join('\n');
      }
    }

    // Safety fallback: if we can't determine specific fix, don't change anything
    return null;
  }

  async applyFix(repoPath, fix) {
    if (!fix.applied) {
      return false;
    }

    const filePath = path.join(repoPath, fix.file);

    try {
      await fs.writeFile(filePath, fix.fixedContent, 'utf-8');
      return true;
    } catch (error) {
      throw new Error(`Failed to apply fix to ${fix.file}: ${error.message}`);
    }
  }
}
