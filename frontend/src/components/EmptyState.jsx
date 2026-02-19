import React from 'react';

export default function EmptyState() {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
      gap: '24px',
      marginTop: '32px'
    }}>
      {/* Main Info Card */}
      <div className="card" style={{ 
        textAlign: 'center', 
        padding: '48px 32px',
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-tertiary) 100%)'
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          margin: '0 auto 24px',
          borderRadius: '20px',
          background: 'var(--gradient-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          boxShadow: 'var(--glow-primary)'
        }}>
          🚀
        </div>
        <h2 style={{ 
          marginBottom: '12px', 
          color: 'var(--text-primary)', 
          fontSize: '28px', 
          fontWeight: 700, 
          letterSpacing: '-0.5px' 
        }}>
          Get started
        </h2>
        <p style={{ 
          color: 'var(--text-secondary)', 
          marginBottom: '32px', 
          lineHeight: '1.7', 
          fontSize: '16px',
          maxWidth: '400px',
          margin: '0 auto 32px'
        }}>
          Enter a repository URL above to start the autonomous CI/CD healing agent.
        </p>
      </div>

      {/* Features Card */}
      <div className="card" style={{ 
        padding: '32px',
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-tertiary) 100%)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '2px solid var(--border-primary)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--gradient-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            ⚡
          </div>
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            color: 'var(--text-primary)', 
            fontWeight: 700 
          }}>
            What the agent does
          </h3>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { icon: '📥', text: 'Clones and analyzes the repository' },
            { icon: '🔍', text: 'Discovers and runs all test files' },
            { icon: '🔧', text: 'Identifies failures and generates fixes' },
            { icon: '💾', text: 'Commits fixes with proper naming' },
            { icon: '✅', text: 'Monitors CI/CD until all tests pass' }
          ].map((item, idx) => (
            <li key={idx} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              padding: '12px',
              borderRadius: '10px',
              background: idx % 2 === 0 ? 'transparent' : 'var(--bg-tertiary)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'var(--bg-tertiary)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
            >
              <span style={{ 
                fontSize: '24px', 
                width: '32px',
                textAlign: 'center'
              }}>
                {item.icon}
              </span>
              <span style={{ 
                fontSize: '14px', 
                color: 'var(--text-primary)', 
                lineHeight: '1.6',
                flex: 1
              }}>
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
