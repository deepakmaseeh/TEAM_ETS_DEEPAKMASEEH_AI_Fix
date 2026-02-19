import simpleGit from 'simple-git';
import { COMMIT_PREFIX } from './constants.js';
import { formatBranchName } from './branchName.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Build an authenticated GitHub HTTPS URL from a plain URL + token
 */
function buildAuthUrl(repoUrl, token) {
  if (!token) return repoUrl;
  // Avoid double-injecting token
  if (repoUrl.includes('@github.com')) return repoUrl;
  return repoUrl.replace('https://github.com/', `https://${token}@github.com/`);
}

/**
 * Initialize git repository and create branch
 */
export async function setupGitRepo(repoPath, repoUrl, teamName, leaderName) {
  const githubToken = process.env.GITHUB_TOKEN;
  const git = simpleGit(repoPath);

  try {
    // Configure git identity (required for commits — uses local repo config)
    await git.addConfig('user.name', 'RIFT AI Agent');
    await git.addConfig('user.email', 'rift-agent@rift-hackathon.local');

    // Always authenticate the remote so pushes work
    const authUrl = buildAuthUrl(repoUrl, githubToken);
    try {
      const remotes = await git.getRemotes();
      if (remotes.find(r => r.name === 'origin')) {
        await git.removeRemote('origin');
      }
    } catch (_) { /* ignore */ }
    await git.addRemote('origin', authUrl);

    // Fetch latest refs from remote
    try {
      await git.fetch('origin');
    } catch (error) {
      console.warn('Fetch warning:', error.message);
    }

    // Create or checkout the required branch
    const branchName = formatBranchName(teamName, leaderName);
    const branches = await git.branchLocal();

    if (branches.all.includes(branchName)) {
      await git.checkout(branchName);
    } else {
      // Try creating from origin/main, then origin/master, then HEAD
      try {
        await git.checkout(['-b', branchName, 'origin/main']);
      } catch {
        try {
          await git.checkout(['-b', branchName, 'origin/master']);
        } catch {
          await git.checkout(['-b', branchName]);
        }
      }
    }

    console.log(`✅ Branch created/checked out: ${branchName}`);
    return branchName;
  } catch (error) {
    throw new Error(`Git setup failed: ${error.message}`);
  }
}

/**
 * Stage ALL changes and commit with [AI-AGENT] prefix
 */
export async function commitChanges(repoPath, filePath, message) {
  const git = simpleGit(repoPath);

  if (!message.startsWith(COMMIT_PREFIX)) {
    message = `${COMMIT_PREFIX} ${message}`;
  }

  try {
    // Stage the specific changed file
    await git.add(filePath);

    // Check if there's anything to commit
    const status = await git.status();
    if (status.staged.length === 0) {
      console.warn(`No staged changes for ${filePath}, skipping commit`);
      return false;
    }

    await git.commit(message);
    return true;
  } catch (error) {
    throw new Error(`Commit failed: ${error.message}`);
  }
}

/**
 * Push branch to remote with authentication (never push to main/master)
 */
export async function pushBranch(repoPath, branchName) {
  const git = simpleGit(repoPath);

  if (branchName === 'main' || branchName === 'master') {
    throw new Error('Cannot push to main/master branch');
  }

  try {
    // simple-git v3: use array form for flags like -u (--set-upstream)
    await git.push(['-u', 'origin', branchName]);
    console.log(`✅ Pushed branch: ${branchName}`);
    return true;
  } catch (error) {
    // Fallback: push without -u (may already have upstream)
    try {
      await git.push('origin', branchName);
      console.log(`✅ Pushed branch (no upstream): ${branchName}`);
      return true;
    } catch (fallbackError) {
      throw new Error(`Push failed: ${fallbackError.message}`);
    }
  }
}

/**
 * Get current branch name
 */
export async function getCurrentBranch(repoPath) {
  const git = simpleGit(repoPath);
  const branch = await git.branch();
  return branch.current;
}
