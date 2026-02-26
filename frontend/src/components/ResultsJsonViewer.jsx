import React, { useState } from 'react';
import { useRun } from '../context/RunContext';
import { FileJson, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

export default function ResultsJsonViewer() {
  const { currentRun } = useRun();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const results = currentRun?.results;
  if (!results) return null;

  const jsonString = JSON.stringify(results, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const containerStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-md)',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.03)',
    borderBottom: '1px solid var(--border-primary)',
    cursor: 'pointer',
    userSelect: 'none',
  };

  const preStyle = {
    margin: 0,
    padding: '16px',
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)',
    background: 'rgba(0,0,0,0.2)',
    overflow: 'auto',
    maxHeight: '400px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle} onClick={() => setExpanded((e) => !e)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <FileJson size={18} color="var(--accent-primary)" />
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Results JSON</span>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          style={{ padding: '6px 10px', fontSize: '12px' }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span style={{ marginLeft: '6px' }}>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      {expanded && (
        <pre style={preStyle} data-testid="results-json">
          {jsonString}
        </pre>
      )}
    </div>
  );
}
