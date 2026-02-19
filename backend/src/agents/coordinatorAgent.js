import { RepoAnalyzerAgent } from './repoAnalyzerAgent.js';
import { TestRunnerAgent } from './testRunnerAgent.js';
import { FixGeneratorAgent } from './fixGeneratorAgent.js';
import { CommitAgent } from './commitAgent.js';
import { CICDMonitorAgent } from './cicdMonitorAgent.js';
import { GitHubPRAgent } from './githubPRAgent.js';
import { SecurityScanAgent } from './securityScanAgent.js';
import { updateRunStatus, setRunStatus } from '../utils/storage.js';
import { calculateScore } from '../utils/scoring.js';
import { BRANCH_NAME } from '../utils/constants.js';
import { TimeTracker } from '../utils/timeTracker.js';
import { LogCollector } from '../utils/logCollector.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Human-in-the-Loop: pause signals keyed by runId
// External: { [runId]: 'pause' | 'approve' | 'reject' | 'waiting' | null }
export const humanApprovalSignals = {};

/**
 * Wait for human approval signal (polls every 2 seconds, timeout after 5 minutes)
 */
async function waitForApproval(runId, logCollector) {
  const timeout = 5 * 60 * 1000; // 5 minutes
  const start = Date.now();

  logCollector.info('⏸ Waiting for manual approval...');

  while (Date.now() - start < timeout) {
    const signal = humanApprovalSignals[runId];
    if (signal === 'approve') {
      humanApprovalSignals[runId] = null;
      logCollector.info('✅ Manual approval received, continuing...');
      return true;
    }
    if (signal === 'reject') {
      humanApprovalSignals[runId] = null;
      logCollector.info('❌ Run rejected by user');
      return false;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  logCollector.warn('⏱ Approval timed out, continuing automatically...');
  return true; // Timeout = auto-approve
}

/**
 * CoordinatorAgent: Orchestrates all agents
 */
export async function runAgent(runId, repoUrl, teamName, leaderName, retryLimit = 5) {
  const startTime = Date.now();
  const workspaceDir = path.join(process.cwd(), 'workspace');
  const timeline = [];
  let iteration = 0;
  let allFixes = [];
  let commitCount = 0;
  let prResult = null;
  let securityScanResult = null;
  const manualApprovalMode = false; // Will be set per-run from settings if implemented

  const timeTracker = new TimeTracker();
  const logCollector = new LogCollector(runId);

  updateRunStatus(runId, { logs: logCollector });

  try {
    logCollector.info('🚀 Starting RIFT agent run', { repoUrl, teamName, leaderName, retryLimit });

    await fs.mkdir(workspaceDir, { recursive: true });

    // Initialize agents
    const repoAnalyzer = new RepoAnalyzerAgent(workspaceDir);
    const testRunner = new TestRunnerAgent();
    const fixGenerator = new FixGeneratorAgent();
    const commitAgent = new CommitAgent();
    const cicdMonitor = new CICDMonitorAgent(process.env.GITHUB_TOKEN);
    const prAgent = new GitHubPRAgent(process.env.GITHUB_TOKEN);
    const securityAgent = new SecurityScanAgent();

    logCollector.info('All agents initialized');

    updateRunStatus(runId, { progress: 10, current_step: 'Cloning repository...' });

    // Step 1: Clone and analyze repository
    timeTracker.startPhase('repository_analysis');
    timeTracker.startAgent('RepoAnalyzer');
    logCollector.info('Cloning repository', { repoUrl });

    const repoPath = await repoAnalyzer.cloneRepository(repoUrl);
    logCollector.info('Repository cloned successfully', { repoPath });

    const projectType = await repoAnalyzer.detectProjectType(repoPath);
    logCollector.info('Project type detected', { projectType });

    const testFiles = await repoAnalyzer.discoverTestFiles(repoPath, projectType);
    logCollector.info('Test files discovered', { count: testFiles.length });

    const testCommand = await repoAnalyzer.getTestCommand(repoPath, projectType);
    logCollector.info('Test command determined', { command: testCommand });

    // AI Analysis (non-blocking)
    updateRunStatus(runId, { current_step: 'AI analyzing repository context...' });
    const aiAnalysis = await repoAnalyzer.analyzeContext(repoPath, projectType);
    logCollector.info('AI Analysis Complete', { summary: aiAnalysis.summary });

    timeTracker.endAgent('RepoAnalyzer');
    timeTracker.endPhase('repository_analysis');

    // Run Security Scan in parallel with git setup (async, non-blocking)
    logCollector.info('🔒 Starting security scan in background...');
    const securityScanPromise = securityAgent.scanForVulnerabilities(repoPath, projectType)
      .then(result => {
        securityScanResult = result;
        logCollector.info('Security scan complete', { issues: result.summary.total });
        updateRunStatus(runId, { security_scan: result });
      })
      .catch(err => {
        logCollector.warn('Security scan failed:', err.message);
        securityScanResult = { issues: [], summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 } };
      });

    updateRunStatus(runId, { progress: 20, current_step: 'Setting up git repository...' });

    // Step 2: Setup git repository
    timeTracker.startPhase('git_setup');
    timeTracker.startAgent('CommitAgent');
    logCollector.info('Setting up git repository');

    const branchName = await commitAgent.setupRepository(repoPath, repoUrl, teamName, leaderName);
    logCollector.info('Git repository setup complete', { branchName });

    timeTracker.endAgent('CommitAgent');
    timeTracker.endPhase('git_setup');

    updateRunStatus(runId, { progress: 30, current_step: 'Running initial tests...' });

    // Main iteration loop
    while (iteration < retryLimit) {
      iteration++;

      timeTracker.startIteration(iteration);
      logCollector.info(`Starting iteration ${iteration}/${retryLimit}`);
      updateRunStatus(runId, {
        progress: 30 + (iteration * 10),
        current_step: `Iteration ${iteration}/${retryLimit}: Running tests...`
      });

      // Step 3: Run tests
      timeTracker.startPhase(`iteration_${iteration}_tests`);
      timeTracker.startAgent('TestRunner');
      logCollector.info('Running tests', { iteration, command: testCommand, projectType });

      const testResult = await testRunner.runTests(repoPath, testCommand, projectType);
      logCollector.info('Tests completed', {
        iteration,
        success: testResult.success,
        exitCode: testResult.exitCode
      });

      const failures = testRunner.parseFailures(testResult.stdout + testResult.stderr, projectType);
      logCollector.info('Failures parsed', { iteration, count: failures.length });

      timeTracker.endAgent('TestRunner');
      timeTracker.endPhase(`iteration_${iteration}_tests`);

      // If no failures, we're done with tests
      if (failures.length === 0 && testResult.success) {
        logCollector.info('✅ All tests passing!');
        updateRunStatus(runId, { progress: 85, current_step: 'All tests passing! Finalizing...' });
        break;
      }

      // Step 4: Generate and apply fixes — PARALLEL across different files
      updateRunStatus(runId, {
        progress: 50 + (iteration * 5),
        current_step: `Iteration ${iteration}: Generating fixes...`
      });

      timeTracker.startPhase(`iteration_${iteration}_fixes`);

      // Human-in-the-Loop: pause if manual approval mode is enabled
      const manualApproval = global.runSettings?.[runId]?.manualApproval;
      if (manualApproval) {
        updateRunStatus(runId, {
          status: 'awaiting_approval',
          current_step: 'Awaiting manual approval for fixes...',
          pending_fixes: failures
        });
        humanApprovalSignals[runId] = 'waiting';
        const approved = await waitForApproval(runId, logCollector);
        updateRunStatus(runId, { status: 'running' });
        if (!approved) {
          logCollector.info('Run aborted by user');
          break;
        }
      }

      // Group failures by file for parallel processing
      const failuresByFile = failures.reduce((acc, f) => {
        const key = f.file || 'unknown';
        if (!acc[key]) acc[key] = [];
        acc[key].push(f);
        return acc;
      }, {});

      // Process each file's fixes sequentially within the file, but files run in parallel
      const fileFixPromises = Object.entries(failuresByFile).map(async ([file, fileFailures]) => {
        const fileFixes = [];
        for (const failure of fileFailures) {
          const fixStartTime = Date.now();
          try {
            timeTracker.startAgent('FixGenerator');
            logCollector.info('Generating fix', { iteration, file: failure.file, line: failure.line, bugType: failure.bugType });

            const fix = await fixGenerator.generateFix(failure, repoPath);
            timeTracker.endAgent('FixGenerator');

            if (fix.applied) {
              try {
                await fixGenerator.applyFix(repoPath, fix);
                logCollector.info(`Fix applied (${fix.method || 'unknown'})`, { iteration, file: fix.file, bugType: fix.bugType });

                // Commit the fix
                timeTracker.startAgent('CommitAgent');
                const commitResult = await commitAgent.commitFix(repoPath, fix, branchName);
                timeTracker.endAgent('CommitAgent');

                commitCount++;
                const fixDuration = Date.now() - fixStartTime;
                timeTracker.trackFix(fileFixes.length, fix.file, fix.bugType, fixDuration);

                logCollector.info('Fix committed', { iteration, file: fix.file, commitMessage: commitResult.commitMessage });

                fileFixes.push({
                  ...fix,
                  file: fix.file,
                  line: fix.line,
                  bugType: fix.bugType,
                  bug_type: fix.bugType, // Ensure both formats exist
                  commit_message: commitResult.commitMessage,
                  status: commitResult.success ? 'Fixed' : 'Failed',
                  duration: fixDuration
                });
              } catch (applyError) {
                logCollector.error('Failed to apply fix', { iteration, file: failure.file, error: applyError.message });
                fileFixes.push({
                  ...fix,
                  file: fix.file || failure.file,
                  line: fix.line || failure.line,
                  bugType: fix.bugType || failure.bugType,
                  bug_type: fix.bugType || failure.bugType,
                  commit_message: '',
                  status: 'Failed',
                  error: `Failed to apply fix: ${applyError.message}`,
                  duration: Date.now() - fixStartTime
                });
              }
            } else {
              logCollector.warn('Fix not applicable', { iteration, file: failure.file });
                fileFixes.push({
                  ...fix,
                  file: fix.file || failure.file,
                  line: fix.line || failure.line,
                  bugType: fix.bugType || failure.bugType,
                  bug_type: fix.bugType || failure.bugType,
                  commit_message: '',
                  status: 'Failed',
                  error: 'No applicable fix found',
                  duration: Date.now() - fixStartTime
                });
            }
          } catch (error) {
            logCollector.error('Failed to generate fix', { iteration, file: failure.file, error: error.message });
            fileFixes.push({
              ...failure,
              file: failure.file,
              line: failure.line,
              bugType: failure.bugType,
              bug_type: failure.bugType,
              status: 'Failed',
              error: error.message,
              duration: Date.now() - fixStartTime
            });
          }
        }
        return fileFixes;
      });

      // Await all file fix promises in parallel
      const fileResults = await Promise.allSettled(fileFixPromises);
      const fixes = fileResults.flatMap(r => r.status === 'fulfilled' ? r.value : []);

      timeTracker.endPhase(`iteration_${iteration}_fixes`);
      timeTracker.endIteration(iteration);

      allFixes.push(...fixes);

      // Step 5: Push changes
      updateRunStatus(runId, {
        progress: 70 + (iteration * 3),
        current_step: `Iteration ${iteration}: Pushing changes...`
      });

      try {
        await commitAgent.pushChanges(repoPath, branchName);
      } catch (error) {
        console.warn('Push failed:', error.message);
        logCollector.warn('Push failed (will retry on next iteration)', { error: error.message });
      }

      // Step 6: Wait for CI/CD to fully complete (not just a one-time snapshot)
      updateRunStatus(runId, {
        progress: 80 + (iteration * 2),
        current_step: `Iteration ${iteration}: Waiting for CI/CD pipeline...`
      });

      logCollector.info(`Waiting for CI/CD pipeline (iteration ${iteration})...`);
      // Give GitHub Actions a few seconds to register the push before polling
      await new Promise(resolve => setTimeout(resolve, 8000));

      const cicdStatus = await cicdMonitor.waitForCICDCompletion(repoUrl, branchName, 10 * 60 * 1000); // 10 min timeout
      timeline.push({ iteration, status: cicdStatus.status, timestamp: new Date().toISOString() });
      logCollector.info(`CI/CD status: ${cicdStatus.status}`, { message: cicdStatus.message });

      if (cicdStatus.status === 'PASSED') {
        logCollector.info('✅ CI/CD passed!');
        break;
      }
    }

    // Wait for security scan to finish
    await securityScanPromise;

    // Step 7: Create PR on GitHub
    updateRunStatus(runId, { progress: 92, current_step: 'Creating Pull Request...' });
    logCollector.info('Creating GitHub Pull Request...');

    prResult = await prAgent.createPullRequest(repoUrl, branchName, allFixes, teamName, leaderName);
    if (prResult.success) {
      logCollector.info(`PR created: ${prResult.prUrl}`);
      updateRunStatus(runId, { pr_url: prResult.prUrl, pr_number: prResult.prNumber });
    } else {
      logCollector.warn('PR creation failed', { reason: prResult.reason });
    }

    // Finalize results
    const endTime = Date.now();
    const totalTimeMs = endTime - startTime;
    const score = calculateScore(totalTimeMs, commitCount);
    const timeMetrics = timeTracker.getMetrics();
    const finalCicdStatus = await cicdMonitor.checkCICDStatus(repoUrl, branchName);

    const results = {
      repo_url: repoUrl,
      team_name: teamName,
      leader_name: leaderName,
      branch: branchName,
      total_failures: allFixes.length,
      fixes_applied: allFixes.filter(f => f.status === 'Fixed').length,
      ci_status: finalCicdStatus.status,
      iterations_used: iteration,
      retry_limit: retryLimit,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      fixes: allFixes.map(f => ({
        file: f.file,
        bug_type: f.bugType,
        line_number: f.line,
        commit_message: f.commit_message || f.commitMessage || '',
        status: f.status,
        method: f.method || 'unknown',
        duration: f.duration
      })),
      timeline,
      score,
      time_metrics: timeMetrics,
      pr_url: prResult?.prUrl || null,
      pr_number: prResult?.prNumber || null,
      security_scan: securityScanResult,
      repository_stats: {
        project_type: projectType,
        test_files: testFiles,
        test_command: testCommand,
        ai_analysis: aiAnalysis
      }
    };

    setRunStatus(runId, 'completed', null);
    updateRunStatus(runId, {
      progress: 100,
      current_step: 'Completed',
      results,
      time_metrics: timeMetrics,
      logs: logCollector
    });

    logCollector.info('🎉 Run completed successfully', {
      totalTime: timeMetrics?.formatted?.total,
      fixesApplied: results.fixes_applied,
      score: score.total,
      prUrl: prResult?.prUrl
    });

    // Save results.json
    const resultsPath = path.join(workspaceDir, `results_${runId}.json`);
    await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));

    return results;

  } catch (error) {
    console.error('Agent run failed:', error);
    logCollector?.error('Agent run failed', { error: error.message });
    setRunStatus(runId, 'failed', error);
    throw error;
  }
}
