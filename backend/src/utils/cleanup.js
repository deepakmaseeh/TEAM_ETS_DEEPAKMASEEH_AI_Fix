import fs from 'fs/promises';
import path from 'path';

/**
 * Cleanup utility for workspace management
 */
export class WorkspaceCleanup {
  constructor(workspaceDir, maxAgeHours = 24) {
    this.workspaceDir = workspaceDir;
    this.maxAgeHours = maxAgeHours;
  }

  /**
   * Clean up old workspace directories
   */
  async cleanupOldWorkspaces() {
    try {
      const entries = await fs.readdir(this.workspaceDir, { withFileTypes: true });
      const now = Date.now();
      const maxAgeMs = this.maxAgeHours * 60 * 60 * 1000;

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = path.join(this.workspaceDir, entry.name);
          const stats = await fs.stat(dirPath);
          const age = now - stats.mtimeMs;

          if (age > maxAgeMs) {
            await fs.rm(dirPath, { recursive: true, force: true });
            console.log(`Cleaned up old workspace: ${entry.name}`);
          }
        }
      }
    } catch (error) {
      console.warn('Workspace cleanup failed:', error.message);
    }
  }

  /**
   * Get workspace size
   */
  async getWorkspaceSize() {
    try {
      const entries = await fs.readdir(this.workspaceDir, { withFileTypes: true });
      let totalSize = 0;

      for (const entry of entries) {
        const entryPath = path.join(this.workspaceDir, entry.name);
        const stats = await fs.stat(entryPath);
        totalSize += stats.size;
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  }
}
