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
   * Get total workspace size (recursive for dirs)
   */
  async getWorkspaceSize() {
    try {
      const entries = await fs.readdir(this.workspaceDir, { withFileTypes: true });
      let totalSize = 0;

      for (const entry of entries) {
        const entryPath = path.join(this.workspaceDir, entry.name);
        totalSize += await this._getPathSize(entryPath, entry);
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  async _getPathSize(entryPath, entry) {
    const stats = await fs.stat(entryPath);
    if (stats.isFile()) return stats.size;
    if (!stats.isDirectory()) return 0;
    let total = 0;
    const children = await fs.readdir(entryPath, { withFileTypes: true });
    for (const child of children) {
      total += await this._getPathSize(path.join(entryPath, child.name), child);
    }
    return total;
  }

  /**
   * List cloned repositories in workspace (dirs only, with size and mtime)
   */
  async listWorkspaceDirs() {
    try {
      const entries = await fs.readdir(this.workspaceDir, { withFileTypes: true });
      const dirs = [];

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const dirPath = path.join(this.workspaceDir, entry.name);
        const stats = await fs.stat(dirPath);
        const size = await this._getPathSize(dirPath, entry);
        dirs.push({
          name: entry.name,
          size,
          mtime: stats.mtime.toISOString(),
          path: dirPath
        });
      }

      return dirs.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
    } catch (error) {
      return [];
    }
  }

  /**
   * Delete a workspace directory by name
   */
  async deleteWorkspaceDir(name) {
    const dirPath = path.join(this.workspaceDir, path.basename(name));
    const realWorkspace = path.resolve(this.workspaceDir);
    const realTarget = path.resolve(dirPath);
    if (!realTarget.startsWith(realWorkspace) || realTarget === realWorkspace) {
      throw new Error('Invalid workspace name');
    }
    await fs.rm(dirPath, { recursive: true, force: true });
  }
}
