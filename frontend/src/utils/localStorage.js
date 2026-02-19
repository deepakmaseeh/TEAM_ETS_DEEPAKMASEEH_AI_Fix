// LocalStorage utility for storing run history
const HISTORY_KEY = 'rift_run_history';
const MAX_LOCAL_HISTORY = 100;

export function saveRunToHistory(run) {
  try {
    const history = getRunHistory();
    
    // Check if run already exists (update it)
    const existingIndex = history.findIndex(r => r.id === run.id);
    if (existingIndex >= 0) {
      history[existingIndex] = run;
    } else {
      history.unshift(run); // Add to beginning
    }
    
    // Keep only last MAX_LOCAL_HISTORY entries
    if (history.length > MAX_LOCAL_HISTORY) {
      history.splice(MAX_LOCAL_HISTORY);
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
}

export function getRunHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

export function getRunByIdFromLocalStorage(runId) {
  const history = getRunHistory();
  return history.find(r => r.id === runId);
}

export function searchLocalHistory(query) {
  const history = getRunHistory();
  const lowerQuery = query.toLowerCase();
  
  return history.filter(run => 
    run.repo_url?.toLowerCase().includes(lowerQuery) ||
    run.team_name?.toLowerCase().includes(lowerQuery) ||
    run.leader_name?.toLowerCase().includes(lowerQuery) ||
    run.id?.toLowerCase().includes(lowerQuery)
  );
}

export function filterLocalHistory(filters) {
  let filtered = getRunHistory();
  
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

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
}
