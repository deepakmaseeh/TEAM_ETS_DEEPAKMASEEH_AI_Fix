import React, { useState, useEffect } from 'react';
import { useRun } from '../context/RunContext';
import StatusBadge from './StatusBadge';
import { Wrench, FileCode, Bug, GitCommit, ListFilter, HelpCircle, X } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000');

export default function FixesAppliedTable() {
  const { currentRun } = useRun();
  const [isMobile, setIsMobile] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [loadingFixId, setLoadingFixId] = useState(null);
  const [fixFilter, setFixFilter] = useState('all'); // 'all' | 'Fixed' | 'Failed'

  const handleExplain = async (fix, index) => {
    setLoadingFixId(index);
    try {
      const res = await axios.post(`${API_URL}/explain-fix`, { fix });
      setExplanation({
        title: `Fix for ${fix.file} (Line ${fix.line_number})`,
        text: res.data.explanation
      });
    } catch (err) {
      console.error(err);
      alert('Failed to get explanation');
    } finally {
      setLoadingFixId(null);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!currentRun || !currentRun.results) {
    return (
      <div className="card" style={cardStyle}>
        <div style={headerStyle}>
          <div style={iconBoxStyle}>
            <Wrench size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Fixes Applied</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>Waiting for run to complete...</p>
          </div>
        </div>
      </div>
    );
  }

  const allFixes = currentRun.results.fixes || [];
  const fixes = fixFilter === 'all' ? allFixes : allFixes.filter(f => (f.status || '') === fixFilter);

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
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--success)',
    boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)'
  };

  if (fixes.length === 0) {
    return (
      <div className="card" style={cardStyle}>
        <div style={headerStyle}>
          <div style={iconBoxStyle}>
            <Wrench size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Fixes Applied</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>No automatic fixes were triggered</p>
          </div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="card" style={cardStyle}>
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'var(--gradient-success)',
          opacity: 0.5
        }} />
        
        <div style={headerStyle}>
          <div style={iconBoxStyle}>
            <Wrench size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Fixes Applied</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              All fixes attempted during this run
            </p>
            <select value={fixFilter} onChange={(e) => setFixFilter(e.target.value)} style={{ marginTop: '8px', padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px' }}>
              <option value="all">All status</option>
              <option value="Fixed">Fixed only</option>
              <option value="Failed">Failed only</option>
            </select>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {fixes.map((fix, index) => (
            <div 
              key={index}
              style={{
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                padding: '16px',
                background: 'var(--bg-tertiary)'
              }}
            >
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCode size={14} color="var(--accent-primary)" />
                <code style={{ fontSize: '13px', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                  {fix.file}
                </code>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Bug size={10} /> TYPE
                  </div>
                  <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                    {fix.bug_type}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ListFilter size={10} /> LINE
                  </div>
                  <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{fix.line_number}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-secondary)' }}>
                 <StatusBadge status={fix.status} size="small" />
                 {fix.commit_message && (
                   <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                     <GitCommit size={10} />
                     {fix.commit_message.slice(0, 20)}...
                   </span>
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={cardStyle}>
      <div style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'var(--gradient-success)',
        opacity: 0.5
      }} />

      <div style={headerStyle}>
        <div style={iconBoxStyle}>
          <Wrench size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Fixes Applied</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Detailed breakdown of automated repairs
          </p>
          <select value={fixFilter} onChange={(e) => setFixFilter(e.target.value)} style={{ marginTop: '8px', padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px' }}>
            <option value="all">All status</option>
            <option value="Fixed">Fixed only</option>
            <option value="Failed">Failed only</option>
          </select>
        </div>
      </div>
      
      <div style={{ 
        overflowX: 'auto', 
        overflowY: 'auto',
        maxHeight: '400px',
        borderRadius: '8px',
        border: '1px solid var(--border-primary)'
      }}
      className="scrollbar-hidden"
      >
        <table className="glass-table">
          {/* ... table content ... */}
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)' }}>
              <th><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileCode size={14} /> File</div></th>
              <th><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Bug size={14} /> Bug Type</div></th>
              <th><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ListFilter size={14} /> Line</div></th>
              <th><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><GitCommit size={14} /> Commit</div></th>
              <th>Status</th>
              <th>Insights</th>
            </tr>
          </thead>
          <tbody>
            {fixes.map((fix, index) => (
              <tr key={index}>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>{fix.file}</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    background: 'rgba(245, 158, 11, 0.1)', 
                    color: '#f59e0b',
                    fontSize: '11px',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>
                    {fix.bug_type}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{fix.line_number}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{fix.commit_message || '-'}</td>
                <td>
                  <StatusBadge status={fix.status} size="small" />
                </td>
                <td>
                  <button 
                    onClick={() => handleExplain(fix, index)}
                    disabled={loadingFixId === index}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-primary)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-primary)'}
                  >
                    <HelpCircle size={12} />
                    {loadingFixId === index ? 'Asking AI...' : 'Why?'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Explanation Modal */}
      {explanation && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }} onClick={() => setExplanation(null)}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: 'var(--shadow-lg)',
            animation: 'scaleIn 0.2s ease'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>AI Insight 🤖</h3>
              <button onClick={() => setExplanation(null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: '8px' }}>{explanation.title}</strong>
              {explanation.text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
