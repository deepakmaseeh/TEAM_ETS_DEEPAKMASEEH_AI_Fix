/**
 * Input validation utilities
 */
export class Validator {
  static validateRepoUrl(url) {
    if (!url) {
      throw new Error('Repository URL is required');
    }

    // Basic URL validation
    try {
      const urlObj = new URL(url);
      if (!urlObj.hostname.includes('github.com')) {
        throw new Error('Only GitHub repositories are supported');
      }
      return true;
    } catch (error) {
      throw new Error('Invalid repository URL format');
    }
  }

  static validateTeamName(name) {
    if (!name || name.trim().length === 0) {
      throw new Error('Team name is required');
    }
    if (name.length > 100) {
      throw new Error('Team name must be less than 100 characters');
    }
    return true;
  }

  static validateLeaderName(name) {
    if (!name || name.trim().length === 0) {
      throw new Error('Team leader name is required');
    }
    if (name.length > 100) {
      throw new Error('Team leader name must be less than 100 characters');
    }
    return true;
  }

  static validateRetryLimit(limit) {
    const num = parseInt(limit, 10);
    if (isNaN(num) || num < 1 || num > 10) {
      throw new Error('Retry limit must be between 1 and 10');
    }
    return num;
  }

  static validateRunRequest(body) {
    const { repo_url, team_name, leader_name, retry_limit } = body;

    this.validateRepoUrl(repo_url);
    this.validateTeamName(team_name);
    this.validateLeaderName(leader_name);

    const validatedRetryLimit = retry_limit 
      ? this.validateRetryLimit(retry_limit)
      : 5;

    return {
      repo_url: repo_url.trim(),
      team_name: team_name.trim(),
      leader_name: leader_name.trim(),
      retry_limit: validatedRetryLimit
    };
  }
}
