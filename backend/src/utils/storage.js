// In-memory storage for runs
// In production, use Redis or database
export const runs = {};
export const runHistory = []; // Store completed runs for history
export const MAX_HISTORY = 100; // Maximum history entries

export function getRun(runId) {
  return runs[runId];
}

export function getAllRuns() {
  return Object.values(runs);
}

export function getRunHistory(limit = 50) {
  return runHistory.slice(-limit).reverse();
}

export function getRunByIdFromHistory(runId) {
  return runHistory.find(r => r.id === runId);
}

export function updateRunStatus(runId, updates) {
  if (runs[runId]) {
    runs[runId] = { ...runs[runId], ...updates };
  }
}

export function setRunStatus(runId, status, error = null) {
  if (runs[runId]) {
    runs[runId].status = status;
    if (error) {
      runs[runId].error = error.message || error;
    }
    if (status === 'completed' || status === 'failed') {
      runs[runId].end_time = new Date().toISOString();
      
      // Move to history
      const runData = { ...runs[runId] };
      runHistory.push(runData);
      
      // Keep only last MAX_HISTORY entries
      if (runHistory.length > MAX_HISTORY) {
        runHistory.shift();
      }
    }
  }
}

export function searchRuns(query) {
  const lowerQuery = query.toLowerCase();
  return runHistory.filter(run => 
    run.repo_url?.toLowerCase().includes(lowerQuery) ||
    run.team_name?.toLowerCase().includes(lowerQuery) ||
    run.leader_name?.toLowerCase().includes(lowerQuery) ||
    run.id?.toLowerCase().includes(lowerQuery)
  );
}

export function filterRuns(filters) {
  let filtered = runHistory;
  
  if (filters.status) {
    filtered = filtered.filter(r => r.status === filters.status);
  }
  
  if (filters.dateFrom) {
    filtered = filtered.filter(r => new Date(r.start_time) >= new Date(filters.dateFrom));
  }
  
  if (filters.dateTo) {
    filtered = filtered.filter(r => new Date(r.start_time) <= new Date(filters.dateTo));
  }
  
  if (filters.repository) {
    filtered = filtered.filter(r => r.repo_url?.includes(filters.repository));
  }
  
  return filtered;
}
