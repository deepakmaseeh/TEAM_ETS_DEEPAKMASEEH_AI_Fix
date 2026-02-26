import React, { useState, useEffect } from 'react';
import { useRun } from '../context/RunContext';
import HealthGauge from './HealthGauge';
import StatusBadge from './StatusBadge';
import { 
  Activity, 
  GitBranch, 
  Clock, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  Users, 
  User, 
  ExternalLink,
  LayoutDashboard,
  GitPullRequest
} from 'lucide-react';

export default function RunSummaryCard() {
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

  if (!currentRun || !currentRun.results) {
    return null;
  }

  const results = currentRun.results;
  const duration = results.end_time && results.start_time
    ? Math.round((new Date(results.end_time) - new Date(results.start_time)) / 1000)
    : 0;

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

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

  const itemStyle = {
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    border: '1px solid var(--border-primary)',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  };

  const getGlowClass = (status) => {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s === 'success' || s === 'passed') return 'card-glow-success';
    if (s === 'failure' || s === 'error' || s === 'failed') return 'card-glow-failure';
    if (s === 'running' || s === 'in_progress') return 'card-glow-running';
    return '';
  };

  const glowClass = getGlowClass(results.ci_status);

  return (
    <div className={`card ${glowClass}`} style={cardStyle}>
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
          <LayoutDashboard size={24} />
        </div>
        <div>
          <h2 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: 700, 
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px'
          }}>Run Summary</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Complete analysis execution details
          </p>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px' 
      }}>
        {/* Health Score Card */}
        <div style={{...itemStyle, alignItems: 'center', textAlign: 'center'}}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', width: '100%', justifyContent: 'flex-start' }}>
            <Activity size={16} color="var(--text-secondary)" />
            <span style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '11px', 
              fontWeight: 700, 
              letterSpacing: '0.5px', 
              textTransform: 'uppercase' 
            }}>Health Score</span>
          </div>
          <HealthGauge score={Math.max(0, 100 - (results.total_failures * 5))} />
        </div>

        {/* Repository Card */}
        <div style={itemStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <GitBranch size={16} color="var(--text-secondary)" />
            <span style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '11px', 
              fontWeight: 700, 
              letterSpacing: '0.5px', 
              textTransform: 'uppercase' 
            }}>Repository</span>
          </div>
          <a href={results.repo_url} target="_blank" rel="noopener noreferrer" style={{ 
            color: 'var(--accent-primary)', 
            textDecoration: 'none', 
            fontSize: '14px',
            fontWeight: '600',
            wordBreak: 'break-all',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {results.repo_url.split('/').pop()}
            <ExternalLink size={12} />
          </a>
        </div>

        {[
          { label: 'Team', value: results.team_name, icon: Users, color: 'var(--info)' },
          { label: 'Leader', value: results.leader_name, icon: User, color: 'var(--warning)' },
          { label: 'Branch', value: results.branch, icon: GitBranch, isCode: true },
          { label: 'Failures', value: results.total_failures, icon: XCircle, color: 'var(--danger)', isLarge: true },
          { label: 'Fixed', value: results.fixes_applied, icon: CheckCircle2, color: 'var(--success)', isLarge: true },
          { label: 'Duration', value: formatTime(duration), icon: Clock },
          { label: 'Iterations', value: `${results.iterations_used} / ${results.retry_limit}`, icon: RotateCw }
        ].map((item, idx) => (
          <div key={idx} style={itemStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <item.icon size={16} color={item.color || "var(--text-secondary)"} />
              <span style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '11px', 
                fontWeight: 700, 
                letterSpacing: '0.5px', 
                textTransform: 'uppercase' 
              }}>
                {item.label}
              </span>
            </div>
            <div style={{ 
              fontSize: item.isLarge ? '24px' : '14px', 
              fontWeight: item.isLarge ? '700' : '600',
              color: item.color || 'var(--text-primary)',
              letterSpacing: '-0.5px'
            }}>
              {item.isCode ? (
                <code style={{ 
                  fontSize: '12px', 
                  color: 'var(--accent-primary)',
                  background: 'rgba(59, 130, 246, 0.1)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>{item.value}</code>
              ) : item.value}
            </div>
          </div>
        ))}

        {/* Status Card */}
        <div style={itemStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Activity size={16} color="var(--text-secondary)" />
            <span style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '11px', 
              fontWeight: 700, 
              letterSpacing: '0.5px', 
              textTransform: 'uppercase' 
            }}>Status</span>
          </div>
          <StatusBadge status={results.ci_status} size="normal" />
        </div>

        {/* PR Link (when available) */}
        {(currentRun.pr_url || currentRun.pr_number) && (
          <div style={itemStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <GitPullRequest size={16} color="var(--text-secondary)" />
              <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Pull Request</span>
            </div>
            <a href={currentRun.pr_url || '#'} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {currentRun.pr_url ? 'Open PR' : `PR #${currentRun.pr_number}`}
              <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
