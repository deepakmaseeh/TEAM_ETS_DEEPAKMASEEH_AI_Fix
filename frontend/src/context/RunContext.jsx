import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { saveRunToHistory, getRunHistory } from '../utils/localStorage.js';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000');

const RunContext = createContext();

export function RunProvider({ children }) {
  const [currentRun, setCurrentRun] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load history on mount
  useEffect(() => {
    setHistory(getRunHistory());
  }, []);

  const refreshHistory = useCallback(() => {
    setHistory(getRunHistory());
  }, []);

  const startTestRun = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCurrentRun(null);

    try {
      const response = await axios.post(`${API_URL}/run-agent/test`, {
        repo_url: 'https://github.com/test/repo',
        team_name: 'Test Team',
        leader_name: 'Test Leader',
        retry_limit: 5
      });
      
      const runId = response.data.run_id;
      setCurrentRun({ id: runId, status: 'completed' });
      
      // Fetch the completed run data
      const statusResponse = await axios.get(`${API_URL}/runs/${runId}/status`);
      const runData = statusResponse.data;
      setCurrentRun(runData);
      setLoading(false);
      
      if (runData.status === 'completed' && runData.results) {
        saveRunToHistory(runData);
        refreshHistory();
      }
    } catch (err) {
      console.error('Error starting test run:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to start test run';
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      setLoading(false);
    }
  }, [refreshHistory]);

  const startRun = useCallback(async (repoUrl, teamName, leaderName, retryLimit = 5) => {
    setLoading(true);
    setError(null);
    setCurrentRun(null);

    try {
      // Validate inputs
      if (!repoUrl || !teamName || !leaderName) {
        throw new Error('All fields are required');
      }

      // Start the agent run
      const response = await axios.post(`${API_URL}/run-agent`, {
        repo_url: repoUrl.trim(),
        team_name: teamName.trim(),
        leader_name: leaderName.trim(),
        retry_limit: retryLimit
      }, {
        timeout: 10000 // 10 second timeout
      });

      const runId = response.data.run_id;

      // Poll for status
      let pollCount = 0;
      const maxPolls = 600; // 30 minutes max (600 * 3 seconds)

      const pollStatus = async () => {
        try {
          pollCount++;
          
          if (pollCount > maxPolls) {
            setError('Request timeout: Agent run took too long');
            setLoading(false);
            return;
          }

          const statusResponse = await axios.get(`${API_URL}/runs/${runId}/status`, {
            timeout: 5000
          });
          const runData = statusResponse.data;

          setCurrentRun(runData);

          // Continue polling if not completed or failed
          if (runData.status === 'started' || runData.status === 'running') {
            setTimeout(pollStatus, 3000); // Poll every 3 seconds
          } else {
            setLoading(false);
            
            // If completed, fetch full results
            if (runData.status === 'completed' && runData.results) {
              setCurrentRun(runData);
              // Save to localStorage
              try {
                saveRunToHistory(runData);
                refreshHistory(); // Update local state
              } catch (err) {
                console.warn('Failed to save to localStorage:', err);
              }
            } else if (runData.status === 'failed') {
              const errorMsg = runData.error || 'Agent run failed';
              setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
              // Save failed run to localStorage too
              try {
                saveRunToHistory(runData);
                refreshHistory(); // Update local state
              } catch (err) {
                console.warn('Failed to save to localStorage:', err);
              }
            }
          }
        } catch (err) {
          console.error('Error polling status:', err);
          // Only set error if it's not a timeout or network error during polling
          if (err.code !== 'ECONNABORTED') {
            const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Unknown error';
            setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
          }
          setLoading(false);
        }
      };

      // Start polling
      pollStatus();
    } catch (err) {
      console.error('Error starting run:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to start agent run';
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      setLoading(false);
    }
  }, [refreshHistory]);

  const value = {
    currentRun,
    history,
    loading,
    error,
    startRun,
    startTestRun,
    refreshHistory
  };

  return <RunContext.Provider value={value}>{children}</RunContext.Provider>;
}

export function useRun() {
  const context = useContext(RunContext);
  if (!context) {
    throw new Error('useRun must be used within RunProvider');
  }
  return context;
}
