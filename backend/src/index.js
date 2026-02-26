import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { runAgent, humanApprovalSignals } from './agents/coordinatorAgent.js';
import { generateText } from './utils/aiClient.js';
import { runs, updateRunStatus, setRunStatus } from './utils/storage.js';
import { Logger } from './utils/logger.js';
import { Validator } from './utils/validator.js';
import { WorkspaceCleanup } from './utils/cleanup.js';
import path from 'path';
import fs from 'fs';

// Global per-run settings store (for Human-in-the-Loop, etc)
global.runSettings = {};

// Log to file helper (disabled in Vercel serverless)
const logToFile = (msg) => {
  if (process.env.VERCEL === 'true' || process.env.VERCEL_ENV) {
    // In Vercel, just log to console
    console.log(`[LOG] ${new Date().toISOString()} - ${msg}`);
    return;
  }
  try {
    fs.appendFileSync('startup.log', `${new Date().toISOString()} - ${msg}\n`);
  } catch (e) {
    // ignore
  }
};

// Global error handlers (skip process.exit in Vercel)
process.on('uncaughtException', (err) => {
  logToFile(`Uncaught Exception: ${err.message}\n${err.stack}`);
  if (process.env.VERCEL !== 'true' && !process.env.VERCEL_ENV) {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logToFile(`Unhandled Rejection: ${reason}`);
});

process.on('exit', (code) => {
  logToFile(`Process exiting with code: ${code}`);
});

logToFile('Starting index.js...');

// Create Express app
const app = express();

// Initialize workspace directory (synchronous setup)
const workspaceDir = process.env.VERCEL === 'true' || process.env.VERCEL_ENV
  ? path.join('/tmp', 'workspace')
  : path.join(process.cwd(), 'workspace');

// Configure dotenv
dotenv.config();

// Audit log (in-memory, last 500 entries)
const auditLog = [];
const AUDIT_MAX = 500;
function audit(action, details = {}) {
  auditLog.unshift({
    timestamp: new Date().toISOString(),
    action,
    ...details,
  });
  if (auditLog.length > AUDIT_MAX) auditLog.pop();
}

// Optional API key middleware (skip for /health)
const API_KEY = process.env.API_KEY;
if (API_KEY) {
  app.use((req, res, next) => {
    if (req.path === '/health') return next();
    const key = req.headers['x-api-key'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '');
    if (key !== API_KEY) {
      return res.status(401).json({ error: 'Invalid or missing API key' });
    }
    next();
  });
}

// Rate limiting (100 requests per 15 minutes per IP)
let rateLimitMiddleware;
try {
  const { default: rateLimit } = await import('express-rate-limit');
  rateLimitMiddleware = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });
} catch (e) {
  rateLimitMiddleware = (req, res, next) => next();
}
app.use(rateLimitMiddleware);

// Middleware (register synchronously)
app.use(cors({
  origin: process.env.FRONTEND_URL || process.env.VERCEL_URL || '*',
  credentials: true
}));
app.use(express.json());

// Initialize cleanup (will be set up asynchronously)
let cleanup = null;

// Audit log endpoint
app.get('/audit-log', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
  res.json({ entries: auditLog.slice(0, limit), total: auditLog.length });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    if (cleanup) {
      const workspaceSize = await cleanup.getWorkspaceSize();
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        workspaceSize: `${(workspaceSize / 1024 / 1024).toFixed(2)} MB`,
        activeRuns: Object.keys(runs).filter(id => runs[id].status === 'running' || runs[id].status === 'started').length
      });
    } else {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    }
  } catch (error) {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }
});

// ===== HUMAN-IN-THE-LOOP ENDPOINTS =====

// Pause a run (sets awaiting_approval, fixes are held)
app.post('/runs/:id/pause', (req, res) => {
  const { id } = req.params;
  const run = runs[id];
  if (!run) return res.status(404).json({ error: 'Run not found' });

  global.runSettings[id] = { ...(global.runSettings[id] || {}), manualApproval: true };
  humanApprovalSignals[id] = 'waiting';
  updateRunStatus(id, { current_step: 'Paused — awaiting manual approval' });

  res.json({ success: true, message: 'Run paused, waiting for approval' });
});

// Approve or reject a paused run
app.post('/runs/:id/approve', (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;

  if (!runs[id]) return res.status(404).json({ error: 'Run not found' });

  humanApprovalSignals[id] = approved ? 'approve' : 'reject';
  res.json({ success: true, message: approved ? 'Run approved and resumed' : 'Run rejected and aborted' });
});

// Get pending approval info
app.get('/runs/:id/pending-approval', (req, res) => {
  const { id } = req.params;
  const run = runs[id];
  if (!run) return res.status(404).json({ error: 'Run not found' });

  res.json({
    runId: id,
    status: run.status,
    awaitingApproval: humanApprovalSignals[id] === 'waiting',
    pendingFixes: run.pending_fixes || []
  });
});

// Update per-run settings (e.g. manual approval mode)
app.post('/runs/:id/settings', (req, res) => {
  const { id } = req.params;
  if (!runs[id]) return res.status(404).json({ error: 'Run not found' });
  global.runSettings[id] = { ...(global.runSettings[id] || {}), ...req.body };
  res.json({ success: true, settings: global.runSettings[id] });
});

// Get security scan results for a run
app.get('/runs/:id/security', (req, res) => {
  const { id } = req.params;
  const run = runs[id];
  if (!run) return res.status(404).json({ error: 'Run not found' });
  res.json(run.security_scan || { issues: [], summary: { total: 0 } });
});

// Get PR info for a run
app.get('/runs/:id/pr', (req, res) => {
  const { id } = req.params;
  const run = runs[id];
  if (!run) return res.status(404).json({ error: 'Run not found' });
  res.json({ pr_url: run.pr_url || null, pr_number: run.pr_number || null });
});

// Explain a fix using AI
app.post('/explain-fix', async (req, res) => {
  try {
    const { file, bugType, errorMessage, commitMessage } = req.body;
    const prompt = `
      You are a senior software engineer explaining a code fix to a developer.

      A bug was automatically detected and fixed:
      - File: ${file}
      - Bug Type: ${bugType}
      - Error: ${errorMessage || 'Not specified'}
      - Fix Applied: ${commitMessage || 'Automatic fix'}

      Explain in 3-4 sentences:
      1. What the bug was
      2. Why it was a problem
      3. How it was fixed

      Be clear, concise, and technical but approachable. Use plain text.
    `;
    const explanation = await generateText(prompt);
    res.json({ explanation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate explanation', details: error.message });
  }
});

// Test endpoint to generate sample data for UI testing (with actual branch creation)
app.post('/run-agent/test', async (req, res) => {
  try {
    const { repo_url, team_name, leader_name, retry_limit } = req.body;
    const runId = crypto.randomUUID();
    const { LogCollector } = await import('./utils/logCollector.js');
    const logCollector = new LogCollector(runId);
    
    const testRepoUrl = repo_url || 'https://github.com/octocat/Hello-World';
    const testTeamName = team_name || 'Test Team';
    const testLeaderName = leader_name || 'Test Leader';
    
    // Initialize run status
    runs[runId] = {
      id: runId,
      status: 'running',
      repo_url: testRepoUrl,
      team_name: testTeamName,
      leader_name: testLeaderName,
      retry_limit: retry_limit || 5,
      start_time: new Date().toISOString(),
      progress: 0,
      current_step: 'Initializing test run...',
      logs: logCollector
    };
    
    logCollector.info('🚀 Starting RIFT agent run (TEST MODE)');
    
    // Import required modules
    const { RepoAnalyzerAgent } = await import('./agents/repoAnalyzerAgent.js');
    const { CommitAgent } = await import('./agents/commitAgent.js');
    const { formatBranchName } = await import('./utils/branchName.js');
        const { TimeTracker } = await import('./utils/timeTracker.js');
        const fsPromises = await import('fs/promises');
        
        // Ensure workspace directory exists (use the global workspaceDir)
        await fsPromises.mkdir(workspaceDir, { recursive: true });
    
    const timeTracker = new TimeTracker();
    timeTracker.startPhase('repository_analysis');
    
    // Step 1: Clone repository (if repo_url provided, otherwise skip)
    let repoPath = null;
    let branchName = null;
    
    if (repo_url) {
      try {
        logCollector.info('Cloning repository for branch creation test', { repoUrl: repo_url });
        const repoAnalyzer = new RepoAnalyzerAgent(workspaceDir);
        repoPath = await repoAnalyzer.cloneRepository(repo_url);
        logCollector.info('Repository cloned successfully', { repoPath });
        
        // Step 2: Create branch with proper format
        logCollector.info('Creating branch with required format...');
        const commitAgent = new CommitAgent();
        branchName = await commitAgent.setupRepository(repoPath, repo_url, testTeamName, testLeaderName);
        logCollector.info('Branch created successfully', { branchName });
        
        // Verify branch name format
        const expectedBranch = formatBranchName(testTeamName, testLeaderName);
        if (branchName !== expectedBranch) {
          logCollector.warn('Branch name mismatch', { expected: expectedBranch, actual: branchName });
        }
        
        timeTracker.endPhase('repository_analysis');
      } catch (error) {
        logCollector.warn('Repository operations failed (using sample data)', { error: error.message });
        branchName = formatBranchName(testTeamName, testLeaderName);
      }
    } else {
      branchName = formatBranchName(testTeamName, testLeaderName);
      logCollector.info('No repository URL provided, using sample data', { branchName });
    }
    
    // Generate sample test data
    const bugTypes = ['LINTING', 'SYNTAX', 'IMPORT', 'INDENTATION', 'LOGIC', 'TYPE_ERROR'];
    const files = ['src/utils.py', 'src/validator.py', 'src/helper.js', 'tests/test_main.py', 'src/config.py'];
    const statuses = ['Fixed', 'Failed'];
    
    const sampleFixes = Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, i) => ({
      file: files[Math.floor(Math.random() * files.length)],
      bug_type: bugTypes[Math.floor(Math.random() * bugTypes.length)],
      bugType: bugTypes[Math.floor(Math.random() * bugTypes.length)],
      line_number: Math.floor(Math.random() * 100) + 1,
      line: Math.floor(Math.random() * 100) + 1,
      commit_message: `[AI-AGENT] Fix ${bugTypes[Math.floor(Math.random() * bugTypes.length)]} in ${files[Math.floor(Math.random() * files.length)]}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      method: 'rule-based',
      duration: Math.floor(Math.random() * 5000) + 1000
    }));
    
    timeTracker.startIteration(1);
    timeTracker.endIteration(1);
    const timeMetrics = timeTracker.getMetrics();
    
    const results = {
      repo_url: testRepoUrl,
      team_name: testTeamName,
      leader_name: testLeaderName,
      branch: branchName,
      total_failures: sampleFixes.length,
      fixes_applied: sampleFixes.filter(f => f.status === 'Fixed').length,
      ci_status: 'PASSED',
      iterations_used: 2,
      retry_limit: retry_limit || 5,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 120000).toISOString(),
      fixes: sampleFixes,
      timeline: [
        { iteration: 1, status: 'PASSED', timestamp: new Date().toISOString() },
        { iteration: 2, status: 'PASSED', timestamp: new Date(Date.now() + 60000).toISOString() }
      ],
      score: { base: 100, speed_bonus: 10, efficiency_penalty: 0, total: 110 },
      time_metrics: timeMetrics,
      repository_stats: {
        project_type: 'Python',
        test_files: ['tests/test_main.py', 'tests/test_utils.py', 'tests/test_validator.py'],
        test_command: 'pytest',
        ai_analysis: 'Sample analysis'
      }
    };
    
    // Update run status
    runs[runId] = {
      ...runs[runId],
      status: 'completed',
      end_time: new Date().toISOString(),
      progress: 100,
      current_step: 'Completed',
      results,
      time_metrics: timeMetrics
    };
    
    // Add logs
    logCollector.info('Repository cloned successfully');
    logCollector.info('Project type detected: Python');
    logCollector.info('Test files discovered', { count: 3 });
    logCollector.info(`Branch created: ${branchName}`);
    sampleFixes.forEach((fix, i) => {
      logCollector.info(`Fix applied: ${fix.bug_type} in ${fix.file}`, { line: fix.line_number });
    });
    logCollector.info('🎉 Run completed successfully');
    
    res.json({ 
      run_id: runId, 
      status: 'completed', 
      message: 'Test data generated',
      branch: branchName,
      branch_created: !!repoPath
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: 'Failed to generate test data', details: error.message });
  }
});

// Start agent run
app.post('/run-agent', async (req, res) => {
  try {
    // Validate and sanitize input
    const validated = Validator.validateRunRequest(req.body);
    const { repo_url, team_name, leader_name, retry_limit } = validated;

    // Generate run ID
    const runId = crypto.randomUUID();

    // Initialize log collector
    const { LogCollector } = await import('./utils/logCollector.js');
    const logCollector = new LogCollector(runId);

    // Initialize run status
    runs[runId] = {
      id: runId,
      status: 'started',
      repo_url,
      team_name,
      leader_name,
      retry_limit: retry_limit || 5,
      start_time: new Date().toISOString(),
      progress: 0,
      current_step: 'Initializing...',
      logs: logCollector
    };

    // Start agent in background (non-blocking)
    runAgent(runId, repo_url, team_name, leader_name, retry_limit || 5)
      .catch(error => {
        Logger.error(`Run ${runId} failed:`, error);
        if (runs[runId]) {
          runs[runId].status = 'failed';
          runs[runId].error = error.message;
          runs[runId].end_time = new Date().toISOString();
        }
      });

    audit('run_started', { runId, repo_url: validated.repo_url, team_name: validated.team_name });

    res.json({
      run_id: runId,
      status: 'started',
      message: 'Agent run initiated'
    });
  } catch (error) {
    Logger.error('Error starting agent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get run status
app.get('/runs/:id/status', (req, res) => {
  const { id } = req.params;
  const run = runs[id];

  if (!run) {
    return res.status(404).json({ error: 'Run not found' });
  }

  res.json(run);
});

// Get run results (results.json)
app.get('/runs/:id/results', (req, res) => {
  const { id } = req.params;
  const run = runs[id];

  if (!run) {
    return res.status(404).json({ error: 'Run not found' });
  }

  if (run.status !== 'completed') {
    return res.status(400).json({ error: 'Run not completed yet' });
  }

  res.json(run.results);
});

// List cloned repositories in workspace
app.get('/workspace', async (req, res) => {
  try {
    if (cleanup) {
      const dirs = await cleanup.listWorkspaceDirs();
      return res.json({ repos: dirs, total: dirs.length });
    }
    const fsPromises = await import('fs/promises');
    const entries = await fsPromises.readdir(workspaceDir, { withFileTypes: true });
    const repos = entries.filter(e => e.isDirectory()).map(e => ({
      name: e.name,
      size: 0,
      mtime: new Date().toISOString(),
      path: path.join(workspaceDir, e.name)
    }));
    res.json({ repos, total: repos.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list workspace', details: error.message });
  }
});

// Delete a cloned repository from workspace
app.delete('/workspace/:name', async (req, res) => {
  const name = decodeURIComponent(req.params.name);
  if (!name || name.includes('..') || name.includes('/')) {
    return res.status(400).json({ error: 'Invalid repository name' });
  }
  try {
    if (cleanup) {
      await cleanup.deleteWorkspaceDir(name);
    } else {
      const fsPromises = await import('fs/promises');
      const dirPath = path.join(workspaceDir, name);
      await fsPromises.rm(dirPath, { recursive: true, force: true });
    }
    res.json({ success: true, message: `Deleted ${name}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete workspace', details: error.message });
  }
});

// Get run logs
app.get('/runs/:id/logs', async (req, res) => {
  const { id } = req.params;
  const { getRunByIdFromHistory } = await import('./utils/storage.js');
  const run = runs[id] || getRunByIdFromHistory(id);

  if (!run) {
    return res.status(404).json({ error: 'Run not found' });
  }

  const { level, limit, search } = req.query;
  let logs = [];

  if (run.logs && typeof run.logs.getAllLogs === 'function') {
    logs = run.logs.getAllLogs();
  } else if (Array.isArray(run.logs)) {
    logs = run.logs;
  }

  if (level) {
    logs = logs.filter(log => log.level === level.toUpperCase());
  }

  if (search && run.logs && typeof run.logs.searchLogs === 'function') {
    logs = run.logs.searchLogs(search);
  } else if (search) {
    const lowerSearch = search.toLowerCase();
    logs = logs.filter(log =>
      log.message?.toLowerCase().includes(lowerSearch) ||
      log.level?.toLowerCase().includes(lowerSearch)
    );
  }

  if (limit) {
    logs = logs.slice(-parseInt(limit));
  }

  res.json({ logs, total: logs.length });
});

// Get run history
app.get('/runs/history', async (req, res) => {
  const { limit = 50, search, status, dateFrom, dateTo, repository } = req.query;

  const { getRunHistory, searchRuns, filterRuns } = await import('./utils/storage.js');

  let history = getRunHistory(parseInt(limit));

  if (search) {
    history = searchRuns(search);
  }

  if (status || dateFrom || dateTo || repository) {
    history = filterRuns({ status, dateFrom, dateTo, repository });
  }

  res.json({ runs: history, total: history.length });
});

// Get specific run from history
app.get('/runs/history/:id', async (req, res) => {
  const { id } = req.params;
  const { getRunByIdFromHistory } = await import('./utils/storage.js');
  const run = getRunByIdFromHistory(id);

  if (!run) {
    return res.status(404).json({ error: 'Run not found in history' });
  }

  res.json(run);
});

// Export run data
app.get('/runs/:id/export', async (req, res) => {
  const { id } = req.params;
  const { format = 'json' } = req.query;
  const { getRunByIdFromHistory } = await import('./utils/storage.js');
  const run = runs[id] || getRunByIdFromHistory(id);

  if (!run) {
    return res.status(404).json({ error: 'Run not found' });
  }

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="run_${id}.json"`);
    res.json(run);
  } else {
    res.status(400).json({ error: 'Unsupported format. Use json' });
  }
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt = `
      You are the autonomous AI Agent for this CI/CD Healing Application.
      Your name is "Rift Agent".
      Your goal is to help the user fix their pipeline and explain how to use this dashboard.
      
      HOW TO USE THE APP:
      1. Open the dashboard.
      2. Enter a GitHub repo URL (e.g. https://github.com/owner/repo).
      3. Enter a Team Name and Leader Name.
      4. Click "Start Analysis Run".
      
      WHAT YOU DO (Backend Process):
      1. Clone the repo and create a fix branch (format: TEAM_NAME_LEADER_NAME_AI_Fix).
      2. Analyze repository for issues (Linting, Syntax, Imports, Indentation, Logic errors).
      3. Generate fixes (Rule-based, optionally enhanced by Gemini if API key is set).
      4. Commit fixes with [AI-AGENT] prefix.
      5. Push to the new branch (never to main/master).
      6. Monitor CI/CD pipeline status via GitHub Actions API.
      7. Report results to the dashboard.

      INSTRUCTIONS:
      - Be helpful, professional, and concise.
      - If the user asks how to start, guide them through the form.
      - If the user asks what you fix, list the supported bug types.
      - Explain where repos are cloned: backend/workspace/{repo-name}/
      - Do not make up features that don't exist.
    `;

    // Try AI first, fallback to rule-based responses
    try {
      let fullPrompt = `${systemPrompt}\n\nChat History:\n`;
      if (history && Array.isArray(history)) {
        history.forEach(msg => {
          fullPrompt += `${msg.role === 'user' ? 'User' : 'Agent'}: ${msg.text}\n`;
        });
      }
      fullPrompt += `User: ${message}\nAgent:`;

      const reply = await generateText(fullPrompt);
      res.json({ reply });
    } catch (aiError) {
      // Fallback to rule-based responses if AI is not available
      console.warn('AI chat failed, using fallback:', aiError.message);
      
      const lowerMessage = message.toLowerCase();
      let reply = '';

      if (lowerMessage.includes('how') && (lowerMessage.includes('start') || lowerMessage.includes('use'))) {
        reply = 'To use the RIFT agent:\n1. Enter a GitHub repository URL\n2. Enter your Team Name and Leader Name\n3. Click "Start Analysis Run"\n\nThe agent will clone the repo, detect bugs, fix them, and push to a new branch.';
      } else if (lowerMessage.includes('what') && (lowerMessage.includes('fix') || lowerMessage.includes('bug'))) {
        reply = 'I can fix these bug types:\n• LINTING - Remove unused imports\n• SYNTAX - Add missing colons, fix syntax errors\n• IMPORT - Fix broken import statements\n• INDENTATION - Normalize to 4 spaces\n• LOGIC - Detect logic errors (may need review)\n• TYPE_ERROR - Type-related errors';
      } else if (lowerMessage.includes('branch') || lowerMessage.includes('where')) {
        reply = 'Branches are created with format: TEAM_NAME_LEADER_NAME_AI_Fix (all uppercase, underscores). Repositories are cloned to: backend/workspace/{repo-name}/';
      } else if (lowerMessage.includes('cicd') || lowerMessage.includes('pipeline')) {
        reply = 'I monitor CI/CD pipelines via GitHub Actions API. After pushing fixes, I wait for the pipeline to complete (up to 10 minutes) and report the status (PASSED/FAILED).';
      } else {
        reply = 'I\'m the RIFT AI Agent. I help fix CI/CD pipeline issues automatically. Ask me about:\n• How to use the dashboard\n• What bugs I can fix\n• How branch creation works\n• CI/CD pipeline monitoring\n\nNote: AI features require GEMINI_API_KEY to be configured for advanced responses.';
      }

      res.json({ reply });
    }

  } catch (error) {
    console.error('Chat API Error:', error);
    logToFile(`Chat API Error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to generate response',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  Logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Async initialization (cleanup, etc.) - runs in background
const initializeAsync = async () => {
  try {
    cleanup = new WorkspaceCleanup(workspaceDir, 24);
    logToFile('Cleanup initialized');

    // Run cleanup every hour (skip in Vercel as it's ephemeral)
    if (process.env.VERCEL !== 'true' && !process.env.VERCEL_ENV) {
      setInterval(() => {
        cleanup.cleanupOldWorkspaces().catch(err => {
          Logger.warn('Cleanup failed:', err);
        });
      }, 60 * 60 * 1000);
    }
  } catch (error) {
    console.error('Async initialization error:', error);
  }
};

// Start server (only in non-serverless mode)
if (process.env.VERCEL !== 'true' && !process.env.VERCEL_ENV) {
  const PORT = process.env.PORT || 8000;
  
  // Initialize async parts
  initializeAsync().catch(err => {
    console.error('Failed to initialize async components:', err);
  });
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    Logger.info(`🚀 Backend server running on http://localhost:${PORT}`);
    Logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    logToFile(`Server started on port ${PORT}`);
  });

  server.on('error', (e) => {
    logToFile(`Server error: ${e.message}`);
  });
} else {
  // Vercel serverless mode - initialize async parts in background
  initializeAsync().catch(err => {
    console.error('Failed to initialize async components:', err);
  });
  console.log('Running in serverless mode (Vercel)');
  Logger.info('Running in serverless mode (Vercel)');
}

// Export app for Vercel serverless functions
export default app;
