import simpleGit from 'simple-git';
import fs from 'fs/promises';
import path from 'path';

/**
 * RepoAnalyzerAgent: Clones repository and analyzes structure
 * Supports: Python, Node.js, Java, Go, Ruby
 */
export class RepoAnalyzerAgent {
  constructor(workspaceDir) {
    this.workspaceDir = workspaceDir;
  }

  async cloneRepository(repoUrl) {
    const repoName = repoUrl.split('/').pop().replace('.git', '');
    const repoPath = path.join(this.workspaceDir, repoName);

    try {
      // Remove existing directory if exists
      try {
        await fs.rm(repoPath, { recursive: true, force: true });
      } catch (error) {
        // Directory might not exist
      }

      // Clone repository with authentication if token is available
      const git = simpleGit();
      const githubToken = process.env.GITHUB_TOKEN;

      let cloneUrl = repoUrl;
      if (githubToken && !repoUrl.includes('@')) {
        // Add token to URL for authentication (private repos + push access)
        cloneUrl = repoUrl.replace('https://github.com/', `https://${githubToken}@github.com/`);
      }

      // NOTE: Do NOT use --depth 1 (shallow clone) — it prevents pushing a new branch
      // because the remote can't traverse the full object graph from a shallow history.
      await git.clone(cloneUrl, repoPath);

      return repoPath;
    } catch (error) {
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  async detectProjectType(repoPath) {
    try {
      const files = await fs.readdir(repoPath);

      // Java (Maven or Gradle)
      if (files.includes('pom.xml') || files.includes('build.gradle') || files.includes('build.gradle.kts')) {
        return 'java';
      }

      // Go
      if (files.includes('go.mod') || files.includes('go.sum')) {
        return 'go';
      }

      // Ruby
      if (files.includes('Gemfile') || files.includes('Gemfile.lock')) {
        return 'ruby';
      }

      // Python (check multiple indicators)
      if (files.includes('requirements.txt') ||
        files.includes('pyproject.toml') ||
        files.includes('setup.py') ||
        files.includes('setup.cfg') ||
        files.includes('Pipfile') ||
        files.some(f => f.endsWith('.py'))) {
        return 'python';
      }

      // Node.js
      if (files.includes('package.json')) {
        return 'node';
      }

      // Fallback: deep scan for .py files
      const allFiles = await this.getAllFiles(repoPath);
      if (allFiles.some(f => f.endsWith('.py'))) {
        return 'python';
      }
      if (allFiles.some(f => f.endsWith('.java'))) {
        return 'java';
      }
      if (allFiles.some(f => f.endsWith('.go'))) {
        return 'go';
      }
      if (allFiles.some(f => f.endsWith('.rb'))) {
        return 'ruby';
      }

      return 'unknown';
    } catch (error) {
      throw new Error(`Failed to detect project type: ${error.message}`);
    }
  }

  async discoverTestFiles(repoPath, projectType) {
    const testFiles = [];

    try {
      const allFiles = await this.getAllFiles(repoPath);

      const patterns = {
        python: [
          /test_.*\.py$/,
          /.*_test\.py$/,
          /.*\/tests\/.*\.py$/
        ],
        node: [
          /.*\.test\.(js|ts|jsx|tsx)$/,
          /.*\.spec\.(js|ts|jsx|tsx)$/,
          /.*\/__tests__\/.*\.(js|ts|jsx|tsx)$/
        ],
        java: [
          /.*Test\.java$/,
          /.*Tests\.java$/,
          /.*\/test\/.*\.java$/
        ],
        go: [
          /.*_test\.go$/
        ],
        ruby: [
          /.*_spec\.rb$/,
          /.*\/spec\/.*\.rb$/,
          /.*\/test\/.*\.rb$/
        ]
      };

      const projectPatterns = patterns[projectType] || [];

      for (const file of allFiles) {
        const relativePath = path.relative(repoPath, file);
        if (projectPatterns.some(pattern => pattern.test(relativePath))) {
          testFiles.push(relativePath);
        }
      }
    } catch (error) {
      console.warn('Error discovering test files:', error.message);
    }

    return testFiles;
  }

  async getAllFiles(dir, fileList = []) {
    const files = await fs.readdir(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        // Skip node_modules, .git, build dirs etc.
        if (!['node_modules', '.git', '__pycache__', '.venv', 'venv', 'target', 'build', 'dist', '.gradle', 'vendor'].includes(file)) {
          await this.getAllFiles(filePath, fileList);
        }
      } else {
        fileList.push(filePath);
      }
    }

    return fileList;
  }

  async getTestCommand(repoPath, projectType) {
    if (projectType === 'python') {
      try {
        const pyprojectPath = path.join(repoPath, 'pyproject.toml');
        const content = await fs.readFile(pyprojectPath, 'utf-8');
        if (content.includes('pytest')) {
          return ['pytest', '-v', '--tb=short'];
        }
      } catch {
        return ['python', '-m', 'pytest', '-v', '--tb=short'];
      }
      return ['python', '-m', 'pytest', '-v', '--tb=short'];

    } else if (projectType === 'node') {
      try {
        const packageJsonPath = path.join(repoPath, 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        if (packageJson.scripts && packageJson.scripts.test) {
          return ['npm', 'test', '--', '--passWithNoTests'];
        }
      } catch (e) {
        // Fallback
      }
      return ['npm', 'test'];

    } else if (projectType === 'java') {
      // Check for Maven first, then Gradle
      try {
        await fs.access(path.join(repoPath, 'pom.xml'));
        return ['mvn', 'test', '-q', '--no-transfer-progress'];
      } catch {
        // Try Gradle
        try {
          await fs.access(path.join(repoPath, 'gradlew'));
          return ['./gradlew', 'test', '--quiet'];
        } catch {
          return ['gradle', 'test', '--quiet'];
        }
      }

    } else if (projectType === 'go') {
      return ['go', 'test', './...', '-v', '-timeout', '120s'];

    } else if (projectType === 'ruby') {
      // Check for RSpec or Minitest
      try {
        const gemfilePath = path.join(repoPath, 'Gemfile');
        const gemfileContent = await fs.readFile(gemfilePath, 'utf-8');
        if (gemfileContent.includes('rspec')) {
          return ['bundle', 'exec', 'rspec', '--format', 'progress'];
        }
      } catch {
        // Fallback to ruby test
      }
      return ['ruby', '-Itest', 'test/**/*.rb'];
    }

    return null;
  }

  async analyzeContext(repoPath, projectType) {
    try {
      console.log('🤖 Asking Gemini to analyze repository context...');

      let contextFiles = [];
      const allFiles = await this.getAllFiles(repoPath);

      // Select key files for context based on project type
      const importantFiles = {
        python: ['requirements.txt', 'pyproject.toml', 'README.md', 'setup.py'],
        node: ['package.json', 'README.md'],
        java: ['pom.xml', 'README.md'],
        go: ['go.mod', 'README.md'],
        ruby: ['Gemfile', 'README.md']
      };

      const filesToCheck = importantFiles[projectType] || ['README.md'];
      for (const f of filesToCheck) {
        if (allFiles.some(af => af.endsWith(f))) contextFiles.push(f);
      }

      let prompt = "Analyze this repository based on the following files:\n\n";

      for (const file of contextFiles) {
        try {
          const content = await fs.readFile(path.join(repoPath, file), 'utf-8');
          const truncated = content.length > 5000 ? content.substring(0, 5000) + '...[TRUNCATED]' : content;
          prompt += `FILE: ${file}\n\`\`\`\n${truncated}\n\`\`\`\n\n`;
        } catch (e) {
          // Skip unreadable files
        }
      }

      prompt += `
        Project type detected: ${projectType}
        
        INSTRUCTIONS:
        1. Summarize what this project does in 2-3 sentences.
        2. Identify the main tech stack.
        3. Identify the number of source files and test files if you can.
        4. Return a JSON object (NO MARKDOWN) with keys: { "summary": string, "stack": string[], "language": string }
      `;

      const aiResponse = await import('../utils/aiClient.js').then(m => m.generateText(prompt));

      try {
        const jsonStr = aiResponse.replace(/^```json\n/, '').replace(/\n```$/, '').trim();
        return JSON.parse(jsonStr);
      } catch (e) {
        return { summary: "AI Analysis Failed to Parse", stack: [], language: projectType };
      }

    } catch (error) {
      console.warn('AI Context Analysis Failed:', error.message);
      return { summary: "Analysis Failed", stack: [], language: projectType };
    }
  }
}
