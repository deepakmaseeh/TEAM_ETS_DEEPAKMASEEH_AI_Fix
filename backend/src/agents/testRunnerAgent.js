import Docker from 'dockerode';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * TestRunnerAgent: Runs tests and parses output
 * Supports: Python (pytest), Node.js (jest/mocha), Java (maven/gradle), Go, Ruby (rspec)
 */
export class TestRunnerAgent {
  constructor(dockerSocket = '/var/run/docker.sock') {
    try {
      this.docker = new Docker({ socketPath: dockerSocket });
    } catch (e) {
      this.docker = null;
    }
  }

  async runTests(repoPath, testCommand, projectType) {
    // Always fall through to local — Docker is optional
    return await this.runTestsLocally(repoPath, testCommand, projectType);
  }

  async runTestsLocally(repoPath, testCommand, projectType) {
    // Install dependencies before running tests (project-type specific)
    await this.installDependencies(repoPath, projectType);

    try {
      const { stdout, stderr } = await execAsync(
        testCommand.join(' '),
        {
          cwd: repoPath,
          maxBuffer: 10 * 1024 * 1024,
          timeout: 120000 // 2 minute timeout per test run
        }
      );

      return {
        exitCode: 0,
        stdout: stdout || '',
        stderr: stderr || '',
        success: true
      };
    } catch (error) {
      return {
        exitCode: error.code || 1,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message || '',
        success: false
      };
    }
  }

  async installDependencies(repoPath, projectType) {
    try {
      if (projectType === 'python') {
        // Check if requirements.txt exists, then pip install
        try {
          await fs.access(path.join(repoPath, 'requirements.txt'));
          await execAsync('pip install -r requirements.txt -q', { cwd: repoPath, timeout: 60000 });
          console.log('✅ Python dependencies installed');
        } catch {
          // Try pyproject.toml
          try {
            await fs.access(path.join(repoPath, 'pyproject.toml'));
            await execAsync('pip install -e . -q', { cwd: repoPath, timeout: 60000 });
          } catch {
            // No requirements, that's fine
          }
        }
      } else if (projectType === 'node') {
        try {
          await fs.access(path.join(repoPath, 'package.json'));
          await execAsync('npm install --quiet', { cwd: repoPath, timeout: 60000 });
          console.log('✅ Node.js dependencies installed');
        } catch {
          // Skip
        }
      } else if (projectType === 'ruby') {
        try {
          await fs.access(path.join(repoPath, 'Gemfile'));
          await execAsync('bundle install --quiet', { cwd: repoPath, timeout: 60000 });
          console.log('✅ Ruby dependencies installed');
        } catch {
          // Skip
        }
      }
      // Java (Maven/Gradle) and Go handle dependencies during test run automatically
    } catch (e) {
      console.warn('Dependency installation warning:', e.message);
    }
  }

  parseFailures(testOutput, projectType) {
    const output = testOutput || '';

    switch (projectType) {
      case 'python':
        return this.parsePythonFailures(output);
      case 'node':
        return this.parseNodeFailures(output);
      case 'java':
        return this.parseJavaFailures(output);
      case 'go':
        return this.parseGoFailures(output);
      case 'ruby':
        return this.parseRubyFailures(output);
      default:
        return this.parsePythonFailures(output); // default fallback
    }
  }

  parsePythonFailures(output) {
    const failures = [];

    // Pattern 1: FAILED test lines with file::class::method
    const failedPattern = /FAILED\s+([\w\/\.\-]+\.py)(?:::\S+)*\s*-?\s*(.+?)(?=\nFAILED|\n===|$)/gs;
    for (const match of output.matchAll(failedPattern)) {
      const filePath = match[1];
      const errorMessage = (match[2] || '').trim();
      const lineMatch = errorMessage.match(/line\s+(\d+)/i) || output.match(new RegExp(`${filePath}:(\\d+)`));
      const lineNumber = lineMatch ? parseInt(lineMatch[1], 10) : 1;
      failures.push({
        file: filePath,
        line: lineNumber,
        bugType: this.categorizeBug(errorMessage),
        errorMessage: errorMessage.substring(0, 500)
      });
    }

    // Pattern 2: Error lines like "File 'foo.py', line 10, in bar"
    if (failures.length === 0) {
      const errorPattern = /File "(.+?\.py)", line (\d+).*?\n.*?(\w+Error.*?)\n/gs;
      for (const match of output.matchAll(errorPattern)) {
        failures.push({
          file: match[1],
          line: parseInt(match[2], 10),
          bugType: this.categorizeBug(match[3]),
          errorMessage: match[3].substring(0, 500)
        });
      }
    }

    return failures;
  }

  parseNodeFailures(output) {
    const failures = [];

    // Jest pattern: ● TestSuite > TestCase
    const jestPattern = /●\s+(.+?)\n\n\s+(.+?)(?=\n\s+at\s|\n●|\n---)/gs;
    for (const match of output.matchAll(jestPattern)) {
      const errorMessage = match[2].trim();
      const lineMatch = output.match(/at\s.+?\((.+?):(\d+):\d+\)/);
      failures.push({
        file: lineMatch ? lineMatch[1].replace(process.cwd(), '').replace(/^\//, '') : 'unknown',
        line: lineMatch ? parseInt(lineMatch[2], 10) : 1,
        bugType: this.categorizeBug(errorMessage),
        errorMessage: errorMessage.substring(0, 500)
      });
    }

    return failures;
  }

  parseJavaFailures(output) {
    const failures = [];

    // Maven Surefire pattern: Tests run: X, Failures: Y
    const mvnPattern = /\[ERROR\]\s+(.+?\.java):\[(\d+),\d+\]\s+(.+?)(?=\[ERROR\]|\[INFO\]|$)/gs;
    for (const match of output.matchAll(mvnPattern)) {
      failures.push({
        file: match[1],
        line: parseInt(match[2], 10),
        bugType: this.categorizeBug(match[3]),
        errorMessage: match[3].trim().substring(0, 500)
      });
    }

    // Alternative: compilation error pattern
    if (failures.length === 0) {
      const compilePattern = /(.+?\.java):(\d+):\s+error:\s+(.+)/g;
      for (const match of output.matchAll(compilePattern)) {
        failures.push({
          file: match[1],
          line: parseInt(match[2], 10),
          bugType: 'SYNTAX',
          errorMessage: match[3].trim().substring(0, 500)
        });
      }
    }

    return failures;
  }

  parseGoFailures(output) {
    const failures = [];

    // Go test failure: --- FAIL: TestName (Xs) or ./foo.go:10:5: error message
    const goCompilePattern = /\.\/(.+?\.go):(\d+):\d+:\s+(.+)/g;
    for (const match of output.matchAll(goCompilePattern)) {
      failures.push({
        file: match[1],
        line: parseInt(match[2], 10),
        bugType: this.categorizeBug(match[3]),
        errorMessage: match[3].trim().substring(0, 500)
      });
    }

    // Go test panic
    const panicPattern = /panic:\s+(.+?)\n.*?goroutine.*?\n.*?(.+?\.go):(\d+)/gs;
    for (const match of output.matchAll(panicPattern)) {
      failures.push({
        file: match[2],
        line: parseInt(match[3], 10),
        bugType: 'LOGIC',
        errorMessage: `panic: ${match[1].trim()}`.substring(0, 500)
      });
    }

    return failures;
  }

  parseRubyFailures(output) {
    const failures = [];

    // RSpec failure pattern
    const rspecPattern = /Failure\/Error:\s+.+?\n\s+(.+?)\n.*?# (.+?\.rb):(\d+)/gs;
    for (const match of output.matchAll(rspecPattern)) {
      failures.push({
        file: match[2],
        line: parseInt(match[3], 10),
        bugType: this.categorizeBug(match[1]),
        errorMessage: match[1].trim().substring(0, 500)
      });
    }

    return failures;
  }

  categorizeBug(errorMessage) {
    const errorLower = (errorMessage || '').toLowerCase();

    if (errorLower.includes('unused') || errorLower.includes('lint')) {
      return 'LINTING';
    } else if (errorLower.includes('syntax') || errorLower.includes('parse') || errorLower.includes('expected ') || errorLower.includes('invalid syntax') || errorLower.includes('unexpected')) {
      return 'SYNTAX';
    } else if (errorLower.includes('typeerror') || errorLower.includes('type error') || errorLower.includes('type mismatch') || errorLower.includes('cannot use')) {
      return 'TYPE_ERROR';
    } else if (errorLower.includes('import') || errorLower.includes('module not found') || errorLower.includes('cannot find') || errorLower.includes('undefined:')) {
      return 'IMPORT';
    } else if (errorLower.includes('indent') || errorLower.includes('indentation') || errorLower.includes('expected indent')) {
      return 'INDENTATION';
    } else if (errorLower.includes('null') || errorLower.includes('nil') || errorLower.includes('none') || errorLower.includes('undefined') || errorLower.includes('not defined')) {
      return 'TYPE_ERROR';
    } else {
      return 'LOGIC';
    }
  }
}
