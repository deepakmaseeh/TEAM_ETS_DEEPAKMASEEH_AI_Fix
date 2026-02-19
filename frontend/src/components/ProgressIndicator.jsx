import React from 'react';
import { useRun } from '../context/RunContext';

export default function ProgressIndicator() {
  const { currentRun } = useRun();

  if (!currentRun || 
      (currentRun.status !== 'started' && 
       currentRun.status !== 'running' && 
       currentRun.status !== 'completed' && 
       currentRun.status !== 'failed')) {
    return null;
  }

  // Don't show if completed or failed (results will show instead)
  if (currentRun.status === 'completed' || currentRun.status === 'failed') {
    return null;
  }

  const steps = [
    { id: 'clone', label: 'Clone Repo', key: 'Cloning repository' },
    { id: 'setup', label: 'Setup Git', key: 'Setting up git' },
    { id: 'test', label: 'Run Tests', key: 'Running tests' },
    { id: 'fix', label: 'Generate Fixes', key: 'Generating fixes' },
    { id: 'commit', label: 'Commit & Push', key: 'Pushing changes' },
    { id: 'monitor', label: 'Monitor CI/CD', key: 'Checking CI/CD' }
  ];

  const currentStep = currentRun.current_step || '';
  const progress = currentRun.progress || 0;

  const getStepStatus = (step) => {
    if (currentStep.toLowerCase().includes(step.key.toLowerCase())) {
      return 'active';
    }
    // Check if we've passed this step
    const stepIndex = steps.findIndex(s => s.id === step.id);
    const currentIndex = steps.findIndex(s => currentStep.toLowerCase().includes(s.key.toLowerCase()));
    if (currentIndex > stepIndex) {
      return 'completed';
    }
    return 'pending';
  };

  return (
    <div className="card" style={{
      background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-tertiary) 100%)',
      border: '2px solid var(--border-accent)',
      boxShadow: 'var(--shadow-lg), var(--glow-primary)'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '24px',
        paddingBottom: '20px',
        borderBottom: '2px solid var(--border-primary)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'var(--gradient-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          boxShadow: 'var(--glow-primary)',
          animation: 'pulse 2s infinite'
        }}>
          ⚡
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Progress</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Current execution status
          </p>
        </div>
      </div>
      <div className="progress-indicator">
        <div className="progress-steps">
          {steps.map((step) => {
            const status = getStepStatus(step);
            return (
              <div key={step.id} className={`progress-step ${status}`}>
                {status === 'completed' && '✓ '}
                {step.label}
              </div>
            );
          })}
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${progress}%`,
              backgroundColor: progress >= 90 ? 'var(--success-color)' : 
                              progress >= 50 ? 'var(--info-color)' : 'var(--primary-color)'
            }}
          >
            {progress}%
          </div>
        </div>
        <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
          {currentStep}
        </p>
      </div>
    </div>
  );
}
