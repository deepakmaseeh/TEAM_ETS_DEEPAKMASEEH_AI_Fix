import React from 'react';
import { useRun } from '../context/RunContext';
import { Package, FileCode, Terminal, FileText, Layers, Code2 } from 'lucide-react';

export default function RepositoryStats() {
  const { currentRun } = useRun();

  if (!currentRun || !currentRun.results) {
    return (
      <div className="card" style={cardStyle}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px', 
          marginBottom: '24px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border-primary)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <Package size={24} />
          </div>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '20px', 
              fontWeight: 700, 
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px'
            }}>Repository Statistics</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Waiting for run to complete...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stats = currentRun.results.repository_stats || {};

  const cardStyle = {
    background: 'var(--bg-card)',
    backdropFilter: 'blur(10px)',
    border: 'var(--glass-border)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: 'var(--shadow-lg)',
    position: 'relative',
    overflow: 'hidden'
  };

  const statBoxStyle = {
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    border: '1px solid var(--border-primary)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
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
        opacity: 0.5
      }} />

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        marginBottom: '24px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border-primary)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-primary)',
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <Package size={24} />
        </div>
        <div>
          <h2 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: 700, 
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px'
          }}>Repository Statistics</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Project structure and test configuration
          </p>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '16px',
        marginTop: '20px'
      }}>
        <div style={statBoxStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Layers size={16} color="var(--text-secondary)" />
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Project Type</div>
          </div>
          <div style={{ 
            color: 'var(--accent-primary)', 
            fontSize: '16px', 
            fontWeight: '600', 
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {stats.project_type || 'Unknown'}
          </div>
        </div>

        <div style={statBoxStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FileCode size={16} color="var(--text-secondary)" />
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Test Files</div>
          </div>
          <div style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: '700' }}>
            {stats.test_files?.length || 0}
          </div>
        </div>

        <div style={statBoxStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Terminal size={16} color="var(--text-secondary)" />
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Test Command</div>
          </div>
          <code style={{ 
            color: 'var(--accent-primary)', 
            fontSize: '13px',
            background: 'rgba(59, 130, 246, 0.1)',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            display: 'block',
            width: 'fit-content'
          }}>
            {stats.test_command || 'N/A'}
          </code>
        </div>
      </div>

      {stats.test_files && stats.test_files.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Code2 size={16} color="var(--text-secondary)" />
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>Detected Test Files</h3>
          </div>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px',
            maxHeight: '200px',
            overflowY: 'auto'
          }} className="scrollbar-hidden">
            {stats.test_files.map((file, idx) => (
              <div key={idx} style={{ 
                padding: '6px 12px', 
                background: 'var(--bg-tertiary)', 
                borderRadius: '6px',
                border: '1px solid var(--border-primary)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <FileText size={12} />
                {file}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
