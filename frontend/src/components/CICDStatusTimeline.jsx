import React, { useState, useEffect } from 'react';
import { useRun } from '../context/RunContext';
import StatusBadge from './StatusBadge';
import { RefreshCw, PlayCircle } from 'lucide-react';

export default function CICDStatusTimeline() {
  const { currentRun } = useRun();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!currentRun || !currentRun.results || !currentRun.results.timeline) {
    return null;
  }

  const timeline = currentRun.results.timeline;
  const retryLimit = currentRun.results.retry_limit || 5;

  const cardStyle = {
    background: 'var(--bg-card)',
    backdropFilter: 'blur(10px)',
    border: 'var(--glass-border)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: 'var(--shadow-lg)',
    position: 'relative',
    overflow: 'hidden',
    height: '100%'
  };

  const headerStyle = {
    display: 'flex', 
    alignItems: 'center', 
    gap: '16px', 
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '1px solid var(--border-primary)'
  };

  const iconBoxStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(236, 72, 153, 0.1) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ec4899',
    boxShadow: '0 0 15px rgba(236, 72, 153, 0.1)',
    border: '1px solid rgba(236, 72, 153, 0.2)'
  };

  if (timeline.length === 0) {
    return (
      <div className="card" style={cardStyle}>
        <div style={headerStyle}>
          <div style={iconBoxStyle}>
            <RefreshCw size={24} />
          </div>
          <h2>CI/CD Status Timeline</h2>
        </div>
        <p>No CI/CD runs recorded.</p>
      </div>
    );
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="card" style={cardStyle}>
      <div style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)',
        opacity: 0.5
      }} />

      <div style={headerStyle}>
        <div style={iconBoxStyle}>
          <RefreshCw size={24} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>CICD Timeline</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
             Run execution history
          </p>
        </div>
      </div>

      <div style={{ 
        marginBottom: '20px',
        padding: '12px 16px',
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
          <PlayCircle size={14} /> Iterations
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          {timeline.length} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>/ {retryLimit}</span>
        </div>
      </div>

      <div className="timeline scrollbar-hidden" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {timeline.map((run, index) => (
          <div 
            key={index} 
            className={`timeline-item ${run.status.toLowerCase() || 'unknown'}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
                Iteration {run.iteration}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                {formatTimestamp(run.timestamp)}
              </span>
            </div>
            
            <div style={{ marginTop: '8px' }}>
              <StatusBadge status={run.status} size="small" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
