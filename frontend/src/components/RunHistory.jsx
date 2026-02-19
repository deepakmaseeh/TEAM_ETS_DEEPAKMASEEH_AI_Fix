import React, { useState, useEffect } from 'react';
import { useRun } from '../context/RunContext';
import StatusBadge from './StatusBadge';
import { History, Search, Filter, Calendar, Clock, CheckCircle2, Trophy, ChevronRight, RotateCw } from 'lucide-react';

export default function RunHistory({ onSelectRun }) {
  const { history, refreshHistory } = useRun();
  const [filteredRuns, setFilteredRuns] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    let result = history;

    if (search) {
      const lowerQuery = search.toLowerCase();
      result = result.filter(run => 
        run.repo_url?.toLowerCase().includes(lowerQuery) ||
        run.team_name?.toLowerCase().includes(lowerQuery) ||
        run.leader_name?.toLowerCase().includes(lowerQuery) ||
        run.id?.toLowerCase().includes(lowerQuery)
      );
    }

    if (filter !== 'all') {
      result = result.filter(run => run.status === filter);
    }

    setFilteredRuns(result);
  }, [history, search, filter]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const duration = new Date(end) - new Date(start);
    const seconds = Math.floor(duration / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const cardStyle = {
    background: 'var(--bg-card)',
    backdropFilter: 'blur(10px)',
    border: 'var(--glass-border)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: 'var(--shadow-lg)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '800px'
  };

  return (
    <div className="card" style={cardStyle}>
      <div style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'var(--gradient-primary)',
        opacity: 0.3
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History size={20} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Run History</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ 
                width: '180px', 
                marginBottom: 0, 
                paddingLeft: '30px', 
                height: '36px',
                fontSize: '13px',
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)'
              }}
            />
          </div>
          <div style={{ position: 'relative' }}>
             <Filter size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: '0 12px 0 30px',
                height: '36px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {filteredRuns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            No runs found
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            overflowY: 'auto',
            paddingRight: '4px'
          }}
          className="scrollbar-hidden"
          >
            {filteredRuns.map((run) => (
              <div
                key={run.id}
                onClick={() => onSelectRun && onSelectRun(run)}
                style={{
                  padding: '16px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '12px',
                  cursor: onSelectRun ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (onSelectRun) {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.background = 'var(--bg-hover)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (onSelectRun) {
                    e.currentTarget.style.borderColor = 'var(--border-primary)';
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      color: 'var(--text-primary)', 
                      fontWeight: '600', 
                      fontSize: '14px',
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {run.repo_url ? run.repo_url.split('/').pop() : 'Unknown Repository'}
                    </div>
                    <div style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '11px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px' 
                    }}>
                      <Calendar size={10} />
                      {formatDate(run.start_time)}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <StatusBadge status={run.status} size="small" />
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '12px', 
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  borderTop: '1px solid var(--border-secondary)',
                  paddingTop: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={10} />
                    {formatDuration(run.start_time, run.end_time)}
                  </div>
                  {run.results && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)' }}>
                        <CheckCircle2 size={10} />
                        {run.results.fixes_applied || 0} Fixed
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning)' }}>
                        <Trophy size={10} />
                        {run.results.score?.total || 0} pts
                      </div>
                    </>
                  )}
                  {onSelectRun && (
                    <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
