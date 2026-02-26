import React from 'react';
import { useRun } from '../context/RunContext';

const darkColors = {
  bg: '#0f1117',
  card: '#161922',
  border: '#2a2d3a',
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  accent: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
};
const lightColors = {
  bg: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  accent: '#2563eb',
  success: '#059669',
  danger: '#dc2626',
  warning: '#d97706',
};

const getSectionStyle = (colors) => ({
  background: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '20px',
});

const getStyles = (colors) => ({
  h2: { margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: colors.text },
  h3: { margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: colors.text },
  p: { margin: 0, fontSize: '13px', color: colors.textSecondary },
  label: { fontSize: '11px', fontWeight: 700, color: colors.textTertiary, textTransform: 'uppercase', marginBottom: '4px' },
  value: { fontSize: '14px', fontWeight: 600, color: colors.text },
});

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatDuration(start, end) {
  if (!start || !end) return '—';
  const s = Math.round((new Date(end) - new Date(start)) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export default function FullReportContent({ reportRef, theme = 'dark' }) {
  const { currentRun } = useRun();
  if (!currentRun?.results) return null;

  const colors = theme === 'light' ? lightColors : darkColors;
  const sectionStyle = getSectionStyle(colors);
  const styles = getStyles(colors);

  const r = currentRun.results;
  const score = r.score || {};
  const fixes = r.fixes || [];
  const timeline = r.timeline || [];
  const timeMetrics = r.time_metrics || {};
  const formatted = timeMetrics.formatted || {};
  const repoStats = r.repository_stats || {};
  const prUrl = currentRun.pr_url;
  const securityScan = currentRun.security_scan;

  return (
    <div ref={reportRef} className="full-report-content" style={{ width: '800px', padding: '24px', background: colors.bg, color: colors.text, fontFamily: 'system-ui, sans-serif' }}>
      {/* Cover / Header */}
      <div style={{ ...sectionStyle, textAlign: 'center', padding: '32px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 800, color: colors.accent }}>RIFT Run Report</h1>
        <p style={{ ...styles.p, fontSize: '14px', marginTop: '8px' }}>Autonomous CI/CD Healing Agent · RIFT 2026</p>
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div><div style={styles.label}>Run ID</div><div style={{ ...styles.value, fontFamily: 'monospace', fontSize: '12px' }}>{currentRun.id}</div></div>
          <div><div style={styles.label}>Generated</div><div style={styles.value}>{formatDate(new Date().toISOString())}</div></div>
          <div><div style={styles.label}>Repository</div><div style={styles.value}>{r.repo_url ? r.repo_url.split('/').pop() : '—'}</div></div>
        </div>
      </div>

      {/* Run Summary */}
      <div style={sectionStyle}>
        <h2 style={styles.h2}>1. Run Summary</h2>
        <p style={{ ...styles.p, marginBottom: '16px' }}>Overview of the analysis run and key identifiers.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { label: 'Repository URL', value: r.repo_url || '—' },
            { label: 'Team Name', value: r.team_name || '—' },
            { label: 'Leader Name', value: r.leader_name || '—' },
            { label: 'Branch', value: r.branch || '—' },
            { label: 'Total Failures', value: String(r.total_failures ?? '—'), color: colors.danger },
            { label: 'Fixes Applied', value: String(r.fixes_applied ?? '—'), color: colors.success },
            { label: 'CI Status', value: r.ci_status || '—', color: r.ci_status === 'PASSED' ? colors.success : colors.danger },
            { label: 'Iterations', value: `${r.iterations_used ?? '—'} / ${r.retry_limit ?? 5}` },
            { label: 'Start Time', value: formatDate(r.start_time) },
            { label: 'End Time', value: formatDate(r.end_time) },
            { label: 'Duration', value: formatDuration(r.start_time, r.end_time) },
          ].map((item, i) => (
            <div key={i} style={{ padding: '12px', background: colors.bg, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
              <div style={styles.label}>{item.label}</div>
              <div style={{ ...styles.value, color: item.color || colors.text, wordBreak: 'break-all' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Score Breakdown */}
      <div style={sectionStyle}>
        <h2 style={styles.h2}>2. Score Breakdown</h2>
        <p style={{ ...styles.p, marginBottom: '16px' }}>Scoring model: base score, speed bonus, efficiency penalty.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div style={{ padding: '16px', background: colors.bg, borderRadius: '8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>
            <div style={styles.label}>Total Score</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: colors.accent }}>{score.total ?? '—'}</div>
            <div style={{ fontSize: '12px', color: colors.textTertiary }}>pts</div>
          </div>
          <div style={{ padding: '16px', background: colors.bg, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
            <div style={styles.label}>Base Score</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: colors.text }}>{score.baseScore ?? score.base ?? '—'}</div>
          </div>
          <div style={{ padding: '16px', background: colors.bg, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
            <div style={styles.label}>Speed Bonus</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: (score.speedBonus ?? score.speed_bonus) > 0 ? colors.success : colors.textTertiary }}>
              +{(score.speedBonus ?? score.speed_bonus ?? 0)}
            </div>
          </div>
          <div style={{ padding: '16px', background: colors.bg, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
            <div style={styles.label}>Efficiency Penalty</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: colors.danger }}>-{score.efficiencyPenalty ?? score.efficiency_penalty ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Time Metrics */}
      {(formatted.total || formatted.phases || formatted.agents) && (
        <div style={sectionStyle}>
          <h2 style={styles.h2}>3. Time Metrics</h2>
          <p style={{ ...styles.p, marginBottom: '16px' }}>Performance timing breakdown.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {formatted.total && (
              <div style={{ padding: '12px', background: colors.bg, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                <div style={styles.label}>Total Time</div>
                <div style={{ ...styles.value, color: colors.accent }}>{formatted.total}</div>
              </div>
            )}
            {formatted.phases && Object.entries(formatted.phases).map(([phase, duration]) => (
              <div key={phase} style={{ padding: '12px', background: colors.bg, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                <div style={styles.label}>{phase.replace(/_/g, ' ')}</div>
                <div style={styles.value}>{duration}</div>
              </div>
            ))}
            {formatted.agents && Object.entries(formatted.agents).map(([agent, data]) => (
              <div key={agent} style={{ padding: '12px', background: colors.bg, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                <div style={styles.label}>{agent}</div>
                <div style={styles.value}>{data.average}</div>
                <div style={{ fontSize: '11px', color: colors.textTertiary }}>Total: {data.total}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repository Statistics */}
      {(repoStats.project_type || repoStats.test_files?.length > 0) && (
        <div style={sectionStyle}>
          <h2 style={styles.h2}>4. Repository Statistics</h2>
          <p style={{ ...styles.p, marginBottom: '16px' }}>Project structure and test configuration.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            {repoStats.project_type && (
              <div style={{ padding: '12px', background: colors.bg, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                <div style={styles.label}>Project Type</div>
                <div style={{ ...styles.value, color: colors.accent }}>{repoStats.project_type}</div>
              </div>
            )}
            <div style={{ padding: '12px', background: colors.bg, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
              <div style={styles.label}>Test Files Count</div>
              <div style={styles.value}>{repoStats.test_files?.length ?? 0}</div>
            </div>
            {repoStats.test_command && (
              <div style={{ padding: '12px', background: colors.bg, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                <div style={styles.label}>Test Command</div>
                <code style={{ fontSize: '13px', color: colors.accent }}>{repoStats.test_command}</code>
              </div>
            )}
          </div>
          {repoStats.test_files?.length > 0 && (
            <>
              <h3 style={styles.h3}>Detected Test Files</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {repoStats.test_files.map((file, idx) => (
                  <span key={idx} style={{ padding: '6px 10px', background: colors.bg, borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px', color: colors.textSecondary }}>
                    {file}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Fixes Applied Table */}
      <div style={sectionStyle}>
        <h2 style={styles.h2}>5. Fixes Applied</h2>
        <p style={{ ...styles.p, marginBottom: '16px' }}>All fixes attempted by the agent ({fixes.length} total).</p>
        {fixes.length === 0 ? (
          <p style={{ ...styles.p, color: colors.textTertiary }}>No fixes recorded.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                <th style={{ textAlign: 'left', padding: '10px 8px', color: colors.textTertiary, fontWeight: 700 }}>#</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', color: colors.textTertiary, fontWeight: 700 }}>File</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', color: colors.textTertiary, fontWeight: 700 }}>Bug Type</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', color: colors.textTertiary, fontWeight: 700 }}>Line</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', color: colors.textTertiary, fontWeight: 700 }}>Status</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', color: colors.textTertiary, fontWeight: 700 }}>Commit Message</th>
              </tr>
            </thead>
            <tbody>
              {fixes.map((f, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '10px 8px', color: colors.textSecondary }}>{i + 1}</td>
                  <td style={{ padding: '10px 8px', color: colors.text, fontFamily: 'monospace' }}>{(f.file || '—').slice(0, 40)}{(f.file || '').length > 40 ? '…' : ''}</td>
                  <td style={{ padding: '10px 8px', color: colors.accent }}>{f.bug_type ?? f.bugType ?? '—'}</td>
                  <td style={{ padding: '10px 8px', color: colors.text }}>{f.line_number ?? f.line ?? '—'}</td>
                  <td style={{ padding: '10px 8px', color: f.status === 'Fixed' ? colors.success : colors.danger }}>{f.status ?? '—'}</td>
                  <td style={{ padding: '10px 8px', color: colors.textSecondary, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(f.commit_message || '—').slice(0, 50)}{(f.commit_message || '').length > 50 ? '…' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CI/CD Timeline */}
      <div style={sectionStyle}>
        <h2 style={styles.h2}>6. CI/CD Status Timeline</h2>
        <p style={{ ...styles.p, marginBottom: '16px' }}>Iteration history and pipeline status.</p>
        {timeline.length === 0 ? (
          <p style={{ ...styles.p, color: colors.textTertiary }}>No timeline entries.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {timeline.map((run, index) => (
              <div key={index} style={{ padding: '12px 16px', background: colors.bg, borderRadius: '8px', border: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: colors.text }}>Iteration {run.iteration}</span>
                <span style={{ fontSize: '12px', color: colors.textTertiary }}>{formatDate(run.timestamp)}</span>
                <span style={{ fontWeight: 600, color: run.status === 'PASSED' ? colors.success : colors.danger }}>{run.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PR Link */}
      {(prUrl || currentRun.pr_number) && (
        <div style={sectionStyle}>
          <h2 style={styles.h2}>7. Pull Request</h2>
          <p style={{ ...styles.p, marginBottom: '12px' }}>Pull request created for this run.</p>
          <a href={prUrl || '#'} target="_blank" rel="noopener noreferrer" style={{ color: colors.accent, fontSize: '14px' }}>
            {prUrl ? 'Open PR' : `PR #${currentRun.pr_number}`}
          </a>
        </div>
      )}

      {/* Security Scan */}
      {securityScan && (securityScan.issues?.length > 0 || securityScan.summary?.total > 0) && (
        <div style={sectionStyle}>
          <h2 style={styles.h2}>8. Security Scan Summary</h2>
          <p style={{ ...styles.p, marginBottom: '12px' }}>Total issues: {securityScan.summary?.total ?? 0}</p>
          {securityScan.issues?.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: colors.textSecondary }}>
              {securityScan.issues.slice(0, 10).map((issue, i) => (
                <li key={i}>{issue.title || issue.message || JSON.stringify(issue)}</li>
              ))}
              {securityScan.issues.length > 10 && <li>… and {securityScan.issues.length - 10} more</li>}
            </ul>
          )}
        </div>
      )}

      {/* Full Results JSON */}
      <div style={sectionStyle}>
        <h2 style={styles.h2}>{prUrl || securityScan ? '9' : '7'}. Full Results (JSON)</h2>
        <p style={{ ...styles.p, marginBottom: '12px' }}>Complete run payload for integration or auditing.</p>
        <pre style={{
          margin: 0,
          padding: '16px',
          background: colors.bg,
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
          fontSize: '11px',
          fontFamily: 'monospace',
          color: colors.textSecondary,
          overflow: 'auto',
          maxHeight: '400px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {JSON.stringify(currentRun.results, null, 2)}
        </pre>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${colors.border}`, textAlign: 'center', fontSize: '12px', color: colors.textTertiary }}>
        RIFT 2026 · Autonomous CI/CD Healing Agent · Team ETS · Report generated {formatDate(new Date().toISOString())}
      </div>
    </div>
  );
}
