import React, { useEffect } from 'react';
import { useRun } from '../context/RunContext';
import StatusBadge from './StatusBadge';
import { GitCompare, X } from 'lucide-react';

export default function CompareRunsModal({ isOpen, onClose, runA, runB, onSelectRunA, onSelectRunB, runs = [] }) {
  const { refreshHistory } = useRun();

  useEffect(() => {
    if (isOpen) refreshHistory();
  }, [isOpen, refreshHistory]);

  if (!isOpen) return null;

  const formatDate = (d) => d ? new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const formatDuration = (start, end) => {
    if (!start || !end) return '—';
    const s = Math.round((new Date(end) - new Date(start)) / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const runOption = (run) => run ? `${run.repo_url?.split('/').pop() || run.id} · ${formatDate(run.start_time)}` : '—';

  const card = (run, label, onSelect, selectId) => (
    <div key={selectId} style={{
      flex: 1,
      minWidth: 0,
      padding: '16px',
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-primary)',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '4px' }}>{label}</div>
      <select
        value={run?.id ?? ''}
        onChange={(e) => {
          const id = e.target.value;
          const r = runs.find(x => x.id === id) || null;
          onSelect(r);
        }}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: '8px',
          color: 'var(--text-primary)',
          fontSize: '13px',
        }}
      >
        <option value="">Select run...</option>
        {runs.map(r => (
          <option key={r.id} value={r.id}>{runOption(r)}</option>
        ))}
      </select>
      {run && (
        <>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDate(run.start_time)}</div>
          <StatusBadge status={run.status} size="small" />
          {run.results && (
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              {run.results.fixes_applied ?? 0} fixed · {run.results.score?.total ?? '—'} pts
            </div>
          )}
        </>
      )}
    </div>
  );

  const row = (label, a, b) => (
    <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
      <td style={{ padding: '8px 12px', color: 'var(--text-tertiary)', fontSize: '12px', width: '120px' }}>{label}</td>
      <td style={{ padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}>{a}</td>
      <td style={{ padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}>{b}</td>
    </tr>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitCompare size={22} />
            Compare two runs
          </h3>
          <button type="button" className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            {card(runA, 'Run A', onSelectRunA, 'a')}
            {card(runB, 'Run B', onSelectRunB, 'b')}
          </div>
          {runA && runB && (
            <div style={{ overflow: 'auto', maxHeight: '400px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  {row('Repository', runA.repo_url?.split('/').pop() || '—', runB.repo_url?.split('/').pop() || '—')}
                  {row('Team', runA.results?.team_name ?? runA.team_name ?? '—', runB.results?.team_name ?? runB.team_name ?? '—')}
                  {row('Branch', runA.results?.branch ?? '—', runB.results?.branch ?? '—')}
                  {row('Status', runA.status ?? '—', runB.status ?? '—')}
                  {row('Failures', String(runA.results?.total_failures ?? '—'), String(runB.results?.total_failures ?? '—'))}
                  {row('Fixed', String(runA.results?.fixes_applied ?? '—'), String(runB.results?.fixes_applied ?? '—'))}
                  {row('Score', String(runA.results?.score?.total ?? '—'), String(runB.results?.score?.total ?? '—'))}
                  {row('Duration', formatDuration(runA.start_time, runA.end_time), formatDuration(runB.start_time, runB.end_time))}
                  {row('Iterations', `${runA.results?.iterations_used ?? '—'} / ${runA.results?.retry_limit ?? 5}`, `${runB.results?.iterations_used ?? '—'} / ${runB.results?.retry_limit ?? 5}`)}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Select Run A and Run B from history, then use &quot;Change&quot; to pick different runs.
          </p>
        </div>
      </div>
    </div>
  );
}
