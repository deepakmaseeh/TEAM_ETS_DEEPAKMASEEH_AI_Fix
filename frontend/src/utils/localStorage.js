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

  if (filters.tag) {
    filtered = filtered.filter(r => {
      const tags = r.tags;
      if (Array.isArray(tags)) return tags.includes(filters.tag);
      if (typeof tags === 'string') return tags === filters.tag;
      return false;
    });
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

export function removeRunsFromHistory(runIds = []) {
  try {
    if (!Array.isArray(runIds) || runIds.length === 0) {
      return true;
    }

    const idsToRemove = new Set(runIds);
    const filteredHistory = getRunHistory().filter(run => !idsToRemove.has(run.id));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
    return true;
  } catch (error) {
    console.error('Error removing runs from history:', error);
    return false;
  }
}

export function updateRunInHistory(runId, updates) {
  try {
    const history = getRunHistory();
    const idx = history.findIndex(r => r.id === runId);
    if (idx < 0) return false;
    history[idx] = { ...history[idx], ...updates };
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return true;
  } catch (error) {
    console.error('Error updating run in history:', error);
    return false;
  }
}

export function getUniqueTagsFromHistory() {
  const history = getRunHistory();
  const set = new Set();
  history.forEach(run => {
    const tags = run.tags;
    if (Array.isArray(tags)) tags.forEach(t => set.add(t));
    else if (typeof tags === 'string' && tags.trim()) set.add(tags.trim());
  });
  return Array.from(set).sort();
}
