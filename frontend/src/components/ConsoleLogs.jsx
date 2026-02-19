import React, { useState, useEffect, useRef } from 'react';
import { useRun } from '../context/RunContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000');

export default function ConsoleLogs() {
  const { currentRun } = useRun();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(false); // Disabled by default
  const logEndRef = useRef(null);
  const logContainerRef = useRef(null);

  useEffect(() => {
    if (!currentRun?.id) return;

    const fetchLogs = async () => {
      try {
        const params = new URLSearchParams();
        if (filter !== 'all') params.append('level', filter);
        if (search) params.append('search', search);
        params.append('limit', '500');

        const response = await axios.get(`${API_URL}/runs/${currentRun.id}/logs?${params}`);
        setLogs(response.data.logs || []);
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [currentRun?.id, filter, search]);

  useEffect(() => {
    // Only scroll within the log container, not the entire page
    if (autoScroll && logContainerRef.current && logEndRef.current) {
      const container = logContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      // Only auto-scroll if user is already near the bottom
      if (isNearBottom) {
        logEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [logs, autoScroll]);

  const getLogColor = (level) => {
    switch (level) {
      case 'ERROR': return 'var(--danger)';
      case 'WARN': return 'var(--warning)';
      case 'INFO': return 'var(--accent-primary)';
      case 'DEBUG': return 'var(--text-tertiary)';
      default: return 'var(--text-secondary)';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.level !== filter) return false;
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (!currentRun) return null;

  return (
    <div className="card">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        paddingBottom: '20px',
        borderBottom: '2px solid var(--border-primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: 'var(--glow-primary)'
          }}>
            📝
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Console Logs</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Real-time execution logs
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ width: '200px', marginBottom: 0 }}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          >
            <option value="all">All Levels</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warning</option>
            <option value="ERROR">Error</option>
            <option value="DEBUG">Debug</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Auto-scroll</span>
          </label>
        </div>
      </div>

      <div 
        ref={logContainerRef}
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '8px',
          padding: '16px',
          maxHeight: '500px',
          overflowY: 'auto',
          overflowX: 'hidden',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          fontSize: '13px',
          lineHeight: '1.6',
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        className="scrollbar-hidden"
      >
        {filteredLogs.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px' }}>
            No logs available
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '8px',
                padding: '8px',
                borderRadius: '4px',
                background: idx % 2 === 0 ? 'transparent' : 'var(--bg-tertiary)'
              }}
            >
              <span style={{ color: 'var(--text-tertiary)', marginRight: '12px' }}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span style={{ 
                color: getLogColor(log.level),
                fontWeight: '600',
                marginRight: '12px',
                minWidth: '60px',
                display: 'inline-block'
              }}>
                [{log.level}]
              </span>
              <span style={{ color: 'var(--text-primary)' }}>
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
