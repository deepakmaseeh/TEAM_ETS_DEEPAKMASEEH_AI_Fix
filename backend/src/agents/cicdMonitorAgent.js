/**
 * CICDMonitorAgent: Monitors CI/CD pipeline status
 */
export class CICDMonitorAgent {
  constructor(githubToken) {
    this.githubToken = githubToken;
  }

  async checkCICDStatus(repoUrl, branchName) {
    try {
      // Extract owner and repo from URL
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        return { status: 'UNKNOWN', message: 'Invalid repository URL' };
      }

      const [, owner, repo] = match;
      const repoName = repo.replace('.git', '');

      // Check GitHub Actions status via API
      const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/actions/runs?branch=${branchName}&per_page=1`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        // If no CI/CD configured, assume passed
        if (response.status === 404) {
          return { status: 'PASSED', message: 'No CI/CD configured' };
        }
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.workflow_runs && data.workflow_runs.length > 0) {
        const run = data.workflow_runs[0];
        const status = run.status; // queued, in_progress, completed
        const conclusion = run.conclusion; // success, failure, cancelled, etc.

        if (status === 'completed') {
          return {
            status: conclusion === 'success' ? 'PASSED' : 'FAILED',
            message: conclusion,
            runId: run.id,
            url: run.html_url
          };
        } else {
          return {
            status: 'RUNNING',
            message: status,
            runId: run.id
          };
        }
      } else {
        // No CI/CD runs found, assume passed
        return { status: 'PASSED', message: 'No CI/CD runs found' };
      }
    } catch (error) {
      console.warn('CICD check failed:', error.message);
      // If check fails, assume unknown (don't fail the run)
      return { status: 'UNKNOWN', message: error.message };
    }
  }

  async waitForCICDCompletion(repoUrl, branchName, timeoutMs = 600000) {
    const startTime = Date.now();
    const pollInterval = 10000; // 10 seconds

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.checkCICDStatus(repoUrl, branchName);
      
      if (status.status === 'PASSED' || status.status === 'FAILED') {
        return status;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return { status: 'TIMEOUT', message: 'CI/CD check timed out' };
  }
}
