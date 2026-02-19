import React, { useState, useEffect, useRef } from 'react';
import { useRun } from '../context/RunContext';
import axios from 'axios';
import { Sparkles, Terminal, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000');

export default function AgentActivity() {
  const { currentRun } = useRun();
  const [activities, setActivities] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logEndRef = useRef(null);

  // Scroll to bottom of logs
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activities, autoScroll]);

  // Fetch logs
  useEffect(() => {
    if (!currentRun?.id) {
      setActivities([]);
      return;
    }
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${API_URL}/runs/${currentRun.id}/logs?limit=500`);
        const logs = response.data.logs || [];
        const newActivities = logs.map(log => {
          let type = 'thought';
          let icon = Sparkles;
          if (log.level === 'ERROR') { type = 'error'; icon = AlertTriangle; }
          else if (log.message?.includes('Successfully') || log.message?.includes('Fixed')) { type = 'success'; icon = CheckCircle; }
          else if (log.message?.includes('Starting') || log.message?.includes('Running')) { type = 'action'; icon = Terminal; }
          return { ...log, type, icon };
        });
        setActivities(newActivities);
      } catch (error) {
        console.error('Error fetching activity:', error);
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [currentRun?.id]);

  const isRunning = currentRun?.status === 'running' || currentRun?.status === 'started';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Logs Header */}
      <div style={{
        padding: '8px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
        background: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
          <Terminal size={14} />
          <span>Agent Logs</span>
          {isRunning && (
            <span style={{ 
              width: 6, height: 6, borderRadius: '50%', 
              background: '#4ade80', 
              display: 'inline-block', 
              animation: 'pulse-dot 1.2s infinite',
              marginLeft: 4
            }} />
          )}
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 'normal', marginLeft: 8 }}>
            {isRunning ? 'Running...' : `${activities.length} events`}
          </span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 11, color: 'var(--text-tertiary)' }}>
          <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} style={{ width: 12, height: 12 }} />
          Auto-scroll
        </label>
      </div>

      {/* Log entries */}
      <div
        className="scrollbar-hidden"
        style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        {activities.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: 50 }}>
            <Sparkles size={28} style={{ opacity: 0.2, marginBottom: 8 }} />
            <p style={{ fontSize: 12 }}>No logs yet. Start a run!</p>
          </div>
        ) : (
          activities.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, animation: 'typeIn 0.2s ease forwards' }}>
              <div style={{
                minWidth: 18, height: 18, borderRadius: '50%',
                background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 3
              }}>
                <item.icon size={9}
                  color={item.type === 'error' ? 'var(--danger)' : item.type === 'success' ? 'var(--success)' : 'var(--accent-primary)'}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  background: item.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${item.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '0 8px 8px 8px',
                  padding: '6px 10px', fontSize: 11, color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)', lineHeight: 1.4
                }}>
                  {item.message}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2, marginLeft: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Clock size={8} /> {new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
