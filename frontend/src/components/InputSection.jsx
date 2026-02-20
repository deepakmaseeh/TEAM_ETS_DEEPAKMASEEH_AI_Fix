import React, { useState } from 'react';
import { useRun } from '../context/RunContext';
import { Link, Users, User, RotateCw, Play, Loader2, Rocket, FlaskConical } from 'lucide-react';

export default function InputSection() {
  const { startRun, startTestRun, loading } = useRun();
  const [repoUrl, setRepoUrl] = useState('');
  const [teamName, setTeamName] = useState('Team ETS');
  const [leaderName, setLeaderName] = useState('Deepakmaseeh');
  const [retryLimit, setRetryLimit] = useState(5);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (repoUrl && teamName && leaderName) {
      startRun(repoUrl, teamName, leaderName, retryLimit);
    }
  };

  const cardStyle = {
    background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    padding: '32px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease'
  };

  const inputWrapperStyle = (fieldName) => ({
    position: 'relative',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '12px',
    border: `1px solid ${focusedField === fieldName ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)'}`,
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    padding: '4px 16px',
    boxShadow: focusedField === fieldName ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none'
  });

  const iconWrapperStyle = (color) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: `rgba(${color}, 0.1)`,
    color: `rgb(${color})`,
    marginRight: '12px'
  });

  const inputStyle = {
    background: 'transparent',
    border: 'none',
    padding: '16px 0',
    fontSize: '15px',
    color: 'var(--text-primary)',
    width: '100%',
    fontFamily: 'var(--font-mono)',
    outline: 'none',
    fontWeight: '500'
  };

  const labelStyle = {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-tertiary)',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    display: 'block'
  };

  return (
    <div className="card-hover-effect" style={cardStyle}>
      {/* Decorative background glow */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
            animation: 'pulse-glow 3s infinite'
          }}>
            <Rocket size={28} color="white" />
          </div>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '24px', 
              fontWeight: 800, 
              background: 'linear-gradient(to right, white, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px'
            }}>New Analysis Run</h2>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Configure and launch autonomous healing agent
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Repo URL Input */}
        <div>
          <label style={labelStyle}>Repository Source</label>
          <div style={inputWrapperStyle('repo')}>
            <div style={iconWrapperStyle('99, 102, 241')}>
              <Link size={18} />
            </div>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onFocus={() => setFocusedField('repo')}
              onBlur={() => setFocusedField(null)}
              placeholder="https://github.com/owner/repo"
              required
              disabled={loading}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Team Details Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '24px' 
        }}>
          <div>
            <label style={labelStyle}>Team Name</label>
            <div style={inputWrapperStyle('team')}>
              <div style={iconWrapperStyle('34, 197, 94')}>
                <Users size={18} />
              </div>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                onFocus={() => setFocusedField('team')}
                onBlur={() => setFocusedField(null)}
                placeholder="Team Name"
                required
                disabled={loading}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
             <label style={labelStyle}>Team Leader</label>
            <div style={inputWrapperStyle('leader')}>
              <div style={iconWrapperStyle('245, 158, 11')}>
                <User size={18} />
              </div>
              <input
                type="text"
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                onFocus={() => setFocusedField('leader')}
                onBlur={() => setFocusedField(null)}
                placeholder="Leader Name"
                required
                disabled={loading}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Retry Limit & Button Row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '120px' }}>
            <label style={labelStyle}>Max Retries</label>
            <div style={inputWrapperStyle('retry')}>
              <div style={iconWrapperStyle('148, 163, 184')}>
                <RotateCw size={18} />
              </div>
              <input
                type="number"
                value={retryLimit}
                onChange={(e) => setRetryLimit(parseInt(e.target.value) || 5)}
                onFocus={() => setFocusedField('retry')}
                onBlur={() => setFocusedField(null)}
                min="1"
                max="10"
                disabled={loading}
                style={inputStyle}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={startTestRun}
            disabled={loading}
            style={{
              padding: '18px 24px',
              fontSize: '14px',
              fontWeight: '600',
              letterSpacing: '0.5px',
              background: loading ? 'var(--bg-tertiary)' : 'rgba(139, 92, 246, 0.2)',
              color: loading ? 'var(--text-secondary)' : 'var(--info)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              height: '60px',
              whiteSpace: 'nowrap'
            }}
            title="Generate test data to verify UI components"
          >
            <FlaskConical size={18} />
            <span>Test Data</span>
          </button>

          <button
            type="submit"
            disabled={loading || !repoUrl || !teamName || !leaderName}
            style={{
              flex: 1,
              padding: '18px 32px',
              fontSize: '16px',
              fontWeight: '700',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              background: loading ? 'var(--bg-tertiary)' : 'var(--gradient-primary)',
              color: loading ? 'var(--text-secondary)' : '#ffffff',
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 10px 30px -5px rgba(99, 102, 241, 0.4)',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              height: '60px'
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(99, 102, 241, 0.5)')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 10px 30px -5px rgba(99, 102, 241, 0.4)')}
            onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'translateY(1px)')}
          >
            {loading ? (
              <>
                <Loader2 size={24} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Initializing Agent...</span>
              </>
            ) : (
              <>
                <Play size={24} fill="currentColor" />
                <span>Start Analysis Run</span>
              </>
            )}
          </button>
        </div>
      </form>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
          100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
      `}</style>
    </div>
  );
}
