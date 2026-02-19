import fs from 'fs/promises';
import path from 'path';
import { generateText } from '../utils/aiClient.js';

/**
 * SecurityScanAgent: Scans source files for vulnerabilities using Gemini
 */
export class SecurityScanAgent {
    // Patterns that are instant red flags (no AI needed)
    static FAST_PATTERNS = [
        { pattern: /password\s*=\s*["'][^"']+["']/gi, issue: 'Hardcoded password', severity: 'CRITICAL' },
        { pattern: /secret\s*=\s*["'][^"']+["']/gi, issue: 'Hardcoded secret', severity: 'CRITICAL' },
        { pattern: /api_?key\s*=\s*["'][^"']+["']/gi, issue: 'Hardcoded API key', severity: 'HIGH' },
        { pattern: /eval\s*\(/gi, issue: 'Unsafe eval() usage', severity: 'HIGH' },
        { pattern: /exec\s*\(\s*["`'].*\$\{/gi, issue: 'Command injection risk (template literal in exec)', severity: 'HIGH' },
        { pattern: /http:\/\/(?!localhost|127\.0\.0\.1)/gi, issue: 'Non-HTTPS external URL', severity: 'MEDIUM' },
        { pattern: /md5\s*\(/gi, issue: 'Weak hashing algorithm (MD5)', severity: 'MEDIUM' },
        { pattern: /sha1\s*\(/gi, issue: 'Weak hashing algorithm (SHA1)', severity: 'MEDIUM' },
    ];

    // File extensions to scan
    static SCAN_EXTENSIONS = ['.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.rb'];

    // Directories to never scan
    static SKIP_DIRS = ['node_modules', '.git', '__pycache__', '.venv', 'venv', 'dist', 'build'];

    /**
     * Get all source files for a given repo path
     */
    async getSourceFiles(repoPath) {
        const files = [];

        const walk = async (dir) => {
            let entries;
            try {
                entries = await fs.readdir(dir, { withFileTypes: true });
            } catch {
                return;
            }
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (!SecurityScanAgent.SKIP_DIRS.includes(entry.name)) {
                        await walk(fullPath);
                    }
                } else if (SecurityScanAgent.SCAN_EXTENSIONS.includes(path.extname(entry.name))) {
                    files.push(fullPath);
                }
            }
        };

        await walk(repoPath);
        return files;
    }

    /**
     * Fast pattern-based scan (no AI)
     */
    async fastScan(repoPath) {
        const issues = [];
        const sourceFiles = await this.getSourceFiles(repoPath);

        for (const filePath of sourceFiles) {
            let content;
            try {
                content = await fs.readFile(filePath, 'utf-8');
            } catch {
                continue;
            }

            const lines = content.split('\n');
            const relPath = path.relative(repoPath, filePath);

            for (const { pattern, issue, severity } of SecurityScanAgent.FAST_PATTERNS) {
                pattern.lastIndex = 0; // reset regex state
                const matches = content.matchAll(new RegExp(pattern.source, pattern.flags));
                for (const match of matches) {
                    // Count line number
                    const upToMatch = content.substring(0, match.index);
                    const lineNumber = upToMatch.split('\n').length;
                    const lineContent = lines[lineNumber - 1]?.trim() || '';

                    issues.push({
                        file: relPath,
                        line: lineNumber,
                        issue,
                        severity,
                        snippet: lineContent.substring(0, 100),
                        source: 'pattern-scan',
                        suggestion: this.getSuggestion(issue)
                    });
                }
            }
        }

        return issues;
    }

    getSuggestion(issue) {
        const suggestions = {
            'Hardcoded password': 'Use environment variable: os.environ.get("PASSWORD") or process.env.PASSWORD',
            'Hardcoded secret': 'Store in .env file and load with dotenv',
            'Hardcoded API key': 'Use environment variable: process.env.API_KEY or os.environ.get("API_KEY")',
            'Unsafe eval() usage': 'Replace eval() with safer alternatives like JSON.parse() for JSON data',
            'Command injection risk (template literal in exec)': 'Sanitize inputs or use parameterized commands',
            'Non-HTTPS external URL': 'Use HTTPS for all external connections',
            'Weak hashing algorithm (MD5)': 'Use SHA-256 or bcrypt for security-sensitive hashing',
            'Weak hashing algorithm (SHA1)': 'Use SHA-256 or stronger for security-sensitive data',
        };
        return suggestions[issue] || 'Review and fix potential security vulnerability';
    }

    /**
     * AI-powered deep scan for a given file's content
     */
    async aiScanFile(filePath, content, projectType) {
        const truncated = content.length > 6000 ? content.substring(0, 6000) + '\n...[TRUNCATED]' : content;

        const prompt = `
      You are a cybersecurity expert performing a code security review.
      
      File: ${path.basename(filePath)}
      Project type: ${projectType}
      
      \`\`\`
      ${truncated}
      \`\`\`
      
      Identify the top 3 (max) security vulnerabilities in this file.
      For each issue, return a JSON object in this exact format:
      { "line": <number>, "severity": "CRITICAL|HIGH|MEDIUM|LOW", "issue": "<short issue name>", "snippet": "<the problematic line>", "suggestion": "<how to fix it>" }
      
      Return ONLY a JSON array of these objects. If no issues found, return [].
      No markdown, no explanation, just the JSON array.
    `;

        try {
            const response = await generateText(prompt);
            const cleaned = response.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
            const parsed = JSON.parse(cleaned);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    /**
     * Full scan: fast pattern scan + AI scan on high-risk files
     */
    async scanForVulnerabilities(repoPath, projectType) {
        console.log('🔒 Starting security scan...');

        const issues = [];

        // 1. Fast pattern scan
        const patternIssues = await this.fastScan(repoPath);
        issues.push(...patternIssues);

        // 2. AI deep scan on a sample of source files (top 5 to avoid rate limiting)
        const sourceFiles = await this.getSourceFiles(repoPath);
        const filesToAIScan = sourceFiles.slice(0, 5);

        for (const filePath of filesToAIScan) {
            let content;
            try {
                content = await fs.readFile(filePath, 'utf-8');
            } catch {
                continue;
            }

            // Only AI-scan files with non-trivial content
            if (content.length < 50) continue;

            try {
                const aiIssues = await this.aiScanFile(filePath, content, projectType);
                const relPath = path.relative(repoPath, filePath);
                for (const aiIssue of aiIssues) {
                    issues.push({ ...aiIssue, file: relPath, source: 'ai-scan' });
                }
            } catch (e) {
                console.warn(`AI scan failed for ${filePath}:`, e.message);
            }
        }

        // Deduplicate issues (same file + line)
        const seen = new Set();
        const unique = issues.filter(issue => {
            const key = `${issue.file}:${issue.line}:${issue.issue}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // Sort by severity
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        unique.sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4));

        console.log(`🔒 Security scan complete: ${unique.length} issues found`);

        return {
            issues: unique,
            summary: {
                total: unique.length,
                critical: unique.filter(i => i.severity === 'CRITICAL').length,
                high: unique.filter(i => i.severity === 'HIGH').length,
                medium: unique.filter(i => i.severity === 'MEDIUM').length,
                low: unique.filter(i => i.severity === 'LOW').length,
            }
        };
    }
}
