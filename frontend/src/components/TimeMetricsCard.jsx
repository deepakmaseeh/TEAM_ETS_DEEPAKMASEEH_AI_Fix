import React from 'react';
import { useRun } from '../context/RunContext';

export default function TimeMetricsCard() {
  const { currentRun } = useRun();

  if (!currentRun || !currentRun.results || !currentRun.results.time_metrics) {
    return null;
  }

  const metrics = currentRun.results.time_metrics;
  const formatted = metrics.formatted || {};

  return (
    <div className="card">
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '24px',
        paddingBottom: '20px',
        borderBottom: '2px solid var(--border-primary)'
      }}>
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
          ⏱️
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Time Metrics</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Performance timing breakdown
          </p>
        </div>
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginTop: '20px'
      }}>
        <div style={{ 
          padding: '16px', 
          background: 'var(--bg-tertiary)', 
          borderRadius: '8px',
          border: '1px solid var(--border-primary)'
        }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Total Time</div>
          <div style={{ color: 'var(--accent-primary)', fontSize: '24px', fontWeight: '700' }}>
            {formatted.total || 'N/A'}
          </div>
        </div>

        {formatted.phases && Object.entries(formatted.phases).map(([phase, duration]) => (
          <div key={phase} style={{ 
            padding: '16px', 
            background: 'var(--bg-tertiary)', 
            borderRadius: '8px',
            border: '1px solid var(--border-primary)'
          }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', textTransform: 'capitalize' }}>
              {phase.replace(/_/g, ' ')}
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: '600' }}>
              {duration}
            </div>
          </div>
        ))}

        {formatted.agents && Object.entries(formatted.agents).map(([agent, data]) => (
          <div key={agent} style={{ 
            padding: '16px', 
            background: 'var(--bg-tertiary)', 
            borderRadius: '8px',
            border: '1px solid var(--border-primary)'
          }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>
              {agent} ({data.calls} calls)
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>
              {data.average}
            </div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginTop: '4px' }}>
              Total: {data.total}
            </div>
          </div>
        ))}
      </div>

      {formatted.iterations && formatted.iterations.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--text-primary)' }}>Iteration Times</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {formatted.iterations.map((iter, idx) => (
              <div key={idx} style={{ 
                padding: '12px', 
                background: 'var(--bg-tertiary)', 
                borderRadius: '6px',
                border: '1px solid var(--border-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Iteration {iter.number}
                </span>
                <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600' }}>
                  {iter.duration}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
