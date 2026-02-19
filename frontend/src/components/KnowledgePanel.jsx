import React from 'react';
import { Info, BookOpen, Users, Code, Zap } from 'lucide-react';

export default function KnowledgePanel() {
  return (
    <div className="card" style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', padding: '0', position: 'sticky', top: '24px' }}>
      
      {/* Header */}
      <div style={{ 
        padding: '20px', 
        borderBottom: '1px solid var(--border-primary)',
        background: 'rgba(255, 255, 255, 0.02)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border-primary)'
        }}>
          <BookOpen size={20} color="var(--accent-primary)" />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Knowledge Base</h2>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>App Info & Guide</div>
        </div>
      </div>

      {/* Content */}
      <div className="scrollbar-hidden" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Section 1: Team Info */}
        <div className="info-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Users size={16} color="var(--accent-secondary)" />
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>Team ETS</h3>
          </div>
          <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', margin: 0 }}>
            Built for <strong>RIFT 2026</strong>.
            <br />
            <strong>Leader:</strong> Deepakmaseeh
            <br />
            <strong>Goal:</strong> Autonomous CI/CD Healing
          </p>
        </div>

        {/* Section 2: How it Works */}
        <div className="info-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Zap size={16} color="var(--success)" />
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>How it Works</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { title: '1. Clone', desc: 'Securely clones your repo to a workspace.' },
              { title: '2. Analyze', desc: 'Scans for Python linting, syntax, and indentation errors.' },
              { title: '3. Fix', desc: 'Applies automated rule-based fixes to the code.' },
              { title: '4. Verify', desc: 'Runs tests and checks CI/CD status.' }
            ].map((step, idx) => (
              <div key={idx} style={{ 
                background: 'var(--bg-tertiary)', 
                padding: '10px', 
                borderRadius: '8px',
                border: '1px solid var(--border-primary)'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{step.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.4' }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Features */}
        <div className="info-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Code size={16} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>Key Features</h3>
          </div>
          <ul style={{ 
            fontSize: '13px', 
            lineHeight: '1.6', 
            color: 'var(--text-secondary)', 
            margin: 0, 
            paddingLeft: '20px' 
          }}>
            <li>Autonomous Fix Branching</li>
            <li>Dockerized Test Execution</li>
            <li>Real-time Progress Tracking</li>
            <li>AI-Powered Agent Chat</li>
          </ul>
        </div>
        
      </div>
    </div>
  );
}
