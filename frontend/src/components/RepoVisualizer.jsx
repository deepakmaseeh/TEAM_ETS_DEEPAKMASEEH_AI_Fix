import React from 'react';
import { useRun } from '../context/RunContext';
import { Network, FileCode, CheckCircle, XCircle, Shield, ExternalLink, GitBranch } from 'lucide-react';

export default function RepoVisualizer() {
  const { currentRun } = useRun();

  if (!currentRun || !currentRun.results) return null;

  const results = currentRun.results;
  const fixes = results.fixes || [];
  const testFiles = results.repository_stats?.test_files || [];
  const securityScan = results.security_scan;
  const prUrl = results.pr_url;
  const branchName = results.branch;

  // Group fixes by file
  const fixesByFile = fixes.reduce((acc, fix) => {
    const key = fix.file || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(fix);
    return acc;
  }, {});

  const fixedFiles = Object.entries(fixesByFile);
  const succeededFixes = fixes.filter(f => f.status === 'Fixed');
  const failedFixes = fixes.filter(f => f.status !== 'Fixed');

  // Only test files that were NOT in the broken set
  const cleanTestFiles = testFiles.filter(tf => !Object.keys(fixesByFile).some(ff => tf.includes(ff) || ff.includes(tf)));

  return (
    <div className="card" style={{
      background: 'var(--bg-card)',
      backdropFilter: 'blur(10px)',
      border: 'var(--glass-border)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: 'var(--shadow-lg)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--gradient-primary)', opacity: 0.5 }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Network size={20} color="var(--accent-primary)" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)', fontWeight: 700 }}>Repository Map</h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-tertiary)' }}>
              {fixes.length} files touched · {testFiles.length} test files detected
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {prUrl && (
            <a href={prUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8,
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
              color: 'var(--accent-primary)', fontSize: 12, fontWeight: 600, textDecoration: 'none'
            }}>
              <ExternalLink size={13} /> View PR #{results.pr_number}
            </a>
          )}
          {branchName && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-primary)',
              color: 'var(--text-secondary)', fontSize: 12
            }}>
              <GitBranch size={13} />
              <code style={{ fontSize: 11 }}>{branchName}</code>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Fixed', value: succeededFixes.length, color: 'var(--success)', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', icon: CheckCircle },
          { label: 'Failed', value: failedFixes.length, color: 'var(--danger)', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: XCircle },
          { label: 'Test Files', value: testFiles.length, color: 'var(--accent-primary)', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', icon: FileCode },
          ...(securityScan ? [{ label: 'Security Issues', value: securityScan.summary?.total ?? 0, color: securityScan.summary?.total > 0 ? 'var(--warning)' : 'var(--success)', bg: securityScan.summary?.total > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)', border: securityScan.summary?.total > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)', icon: Shield }] : [])
        ].map(({ label, value, color, bg, border, icon: Icon }) => (
          <div key={label} style={{ padding: '14px 16px', borderRadius: 12, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon size={18} color={color} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Files section */}
      <div style={{ display: 'grid', gridTemplateColumns: fixedFiles.length > 0 && cleanTestFiles.length > 0 ? '1fr 1fr' : '1fr', gap: 20 }}>

        {/* Broken / Fixed files */}
        {fixedFiles.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-tertiary)', marginBottom: 10 }}>
              Files with fixes ({fixedFiles.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }} className="scrollbar-hidden">
              {fixedFiles.map(([file, fileFixes]) => {
                const allFixed = fileFixes.every(f => f.status === 'Fixed');
                const anyFixed = fileFixes.some(f => f.status === 'Fixed');
                const statusColor = allFixed ? 'var(--success)' : anyFixed ? 'var(--warning)' : 'var(--danger)';
                const statusBg = allFixed ? 'rgba(34,197,94,0.08)' : anyFixed ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';
                const statusBorder = allFixed ? 'rgba(34,197,94,0.2)' : anyFixed ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)';
                return (
                  <div key={file} style={{ padding: '10px 14px', borderRadius: 10, background: statusBg, border: `1px solid ${statusBorder}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <FileCode size={13} color={statusColor} style={{ flexShrink: 0 }} />
                        <code style={{ fontSize: 11, color: 'var(--text-primary)', wordBreak: 'break-all', lineHeight: 1.3 }}>{file}</code>
                      </div>
                      <div style={{ fontSize: 10, color: statusColor, fontWeight: 700, flexShrink: 0, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.15)' }}>
                        {allFixed ? '✓ Fixed' : anyFixed ? '~ Partial' : '✗ Failed'}
                      </div>
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {fileFixes.map((fix, i) => (
                        <span key={i} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.2)', color: 'var(--text-tertiary)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          {fix.bug_type || 'UNKNOWN'} {fix.line_number ? `L${fix.line_number}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Clean test files */}
        {cleanTestFiles.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-tertiary)', marginBottom: 10 }}>
              Healthy test files ({cleanTestFiles.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }} className="scrollbar-hidden">
              {cleanTestFiles.map((file, i) => (
                <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={12} color="var(--success)" style={{ flexShrink: 0 }} />
                  <code style={{ fontSize: 11, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{file}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No data state */}
        {fixedFiles.length === 0 && cleanTestFiles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
            <Network size={32} style={{ opacity: 0.2, marginBottom: 10 }} />
            <p style={{ fontSize: 13 }}>No file data available for this run.</p>
          </div>
        )}
      </div>

      {/* Security Issues (if any) */}
      {securityScan && securityScan.issues && securityScan.issues.length > 0 && (
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-tertiary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={12} /> Security Issues ({securityScan.issues.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }} className="scrollbar-hidden">
            {securityScan.issues.map((issue, i) => (
              <div key={i} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <Shield size={12} color="var(--warning)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{issue.type || issue.pattern}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{issue.file} {issue.line ? `· Line ${issue.line}` : ''}</div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 700, flexShrink: 0 }}>
                  {issue.severity || 'MEDIUM'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
