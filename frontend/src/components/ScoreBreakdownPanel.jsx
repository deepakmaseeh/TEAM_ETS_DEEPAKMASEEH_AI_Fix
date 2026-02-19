import React, { useState, useEffect } from 'react';
import { useRun } from '../context/RunContext';
import { Trophy, Zap, TrendingUp, Target } from 'lucide-react';

export default function ScoreBreakdownPanel() {
  const { currentRun } = useRun();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!currentRun || !currentRun.results || !currentRun.results.score) {
    return null;
  }

  const score = currentRun.results.score;
  const maxScore = 110; 
  const percentage = (score.total / maxScore) * 100;

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
        background: 'var(--gradient-success)',
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
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--success)',
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <Trophy size={24} />
        </div>
        <div>
          <h2 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: 700, 
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px'
          }}>Score Breakdown</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Performance metrics and scoring limits
          </p>
        </div>
      </div>

      <div style={{ marginTop: '8px' }}>
        <div style={{ 
          fontSize: isMobile ? '3rem' : '4.5rem', 
          fontWeight: '800', 
          marginBottom: '32px',
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textAlign: 'center',
          letterSpacing: '-2px',
          lineHeight: '1',
          filter: 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3))'
        }}>
          {score.total}
          <span style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            letterSpacing: '0', 
            color: 'var(--text-secondary)', 
            marginLeft: '8px',
            WebkitTextFillColor: 'var(--text-secondary)'
          }}>pts</span>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={statBoxStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Target size={16} color="var(--text-secondary)" />
              <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Base Score</div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>{score.baseScore}</div>
          </div>

          <div style={statBoxStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Zap size={16} color="var(--warning)" />
              <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Speed Bonus</div>
            </div>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: score.speedBonus > 0 ? 'var(--success)' : 'var(--text-tertiary)'
            }}>
              {score.speedBonus > 0 ? '+' : ''}{score.speedBonus}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              {score.speedBonus > 0 ? '< 5 minutes' : '≥ 5 minutes'}
            </div>
          </div>

          <div style={statBoxStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <TrendingUp size={16} color="var(--info)" />
              <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Efficiency</div>
            </div>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: score.efficiencyPenalty > 0 ? 'var(--danger)' : 'var(--success)'
            }}>
              -{score.efficiencyPenalty}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              {score.efficiencyPenalty > 0 ? 'Over limit' : 'Within limit'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Completion Progress</span>
            <span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: '700' }}>{Math.round(percentage)}%</span>
          </div>
          <div className="progress-bar" style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-tertiary)', border: 'none' }}>
            <div 
              className="progress-fill"
              style={{
                width: `${percentage}%`,
                background: percentage >= 90 ? 'var(--gradient-success)' : percentage >= 70 ? 'var(--warning)' : 'var(--gradient-danger)',
                boxShadow: percentage >= 90 ? 'var(--glow-success)' : 'none',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
