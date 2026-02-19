import { setupGitRepo, commitChanges, pushBranch } from '../utils/gitUtils.js';
import { COMMIT_PREFIX } from '../utils/constants.js';

/**
 * CommitAgent: Handles git operations
 */
export class CommitAgent {
  async setupRepository(repoPath, repoUrl, teamName, leaderName) {
    try {
      const branchName = await setupGitRepo(repoPath, repoUrl, teamName, leaderName);
      return branchName;
    } catch (error) {
      throw new Error(`Failed to setup repository: ${error.message}`);
    }
  }

  async commitFix(repoPath, fix, branchName) {
    try {
      // Build commit message with mandatory prefix
      const commitMessage = `${COMMIT_PREFIX} Fix ${fix.bugType || fix.bug_type || 'UNKNOWN'} in ${fix.file}: ${fix.fixDescription || 'Automated fix by RIFT agent'}`;

      // Use absolute file path for staging
      const success = await commitChanges(repoPath, fix.file, commitMessage);

      return {
        file: fix.file,
        commitMessage,
        success: !!success
      };
    } catch (error) {
      console.error(`CommitAgent: commit failed for ${fix.file}:`, error.message);
      return {
        file: fix.file,
        commitMessage: '',
        success: false,
        error: error.message
      };
    }
  }

  async pushChanges(repoPath, branchName) {
    try {
      await pushBranch(repoPath, branchName);
      return true;
    } catch (error) {
      throw new Error(`Failed to push changes: ${error.message}`);
    }
  }
}
