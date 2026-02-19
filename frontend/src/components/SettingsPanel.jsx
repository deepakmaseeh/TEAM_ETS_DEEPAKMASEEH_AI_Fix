import React, { useState, useEffect } from 'react';

export default function SettingsPanel({ isOpen, onClose }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('settings');
      return saved ? JSON.parse(saved) : {
        retryLimit: 5,
        timeout: 600000,
        notifications: true,
        autoRefresh: true,
        refreshInterval: 3000,
        manualApproval: false
      };
    } catch {
      return {
        retryLimit: 5,
        timeout: 600000,
        notifications: true,
        autoRefresh: true,
        refreshInterval: 3000,
        manualApproval: false
      };
    }
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="card scrollbar-hidden" style={{
        maxWidth: '600px',
        width: '100%',
        maxHeight: '85vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        animation: 'slideUp 0.3s ease',
        boxShadow: 'var(--shadow-xl)',
        border: '2px solid var(--border-accent)'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          paddingBottom: '20px',
          borderBottom: '2px solid var(--border-primary)'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>⚙️ Settings</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Configure application preferences
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px 12px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.borderColor = 'var(--border-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
              e.currentTarget.style.borderColor = 'var(--border-primary)';
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="label">Default Retry Limit</label>
            <input
              type="number"
              value={settings.retryLimit}
              onChange={(e) => setSettings({ ...settings, retryLimit: parseInt(e.target.value) })}
              className="input"
              min="1"
              max="10"
            />
          </div>

          <div>
            <label className="label">Timeout (ms)</label>
            <input
              type="number"
              value={settings.timeout}
              onChange={(e) => setSettings({ ...settings, timeout: parseInt(e.target.value) })}
              className="input"
              min="60000"
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
              />
              <span>Enable Notifications</span>
            </label>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={(e) => setSettings({ ...settings, autoRefresh: e.target.checked })}
              />
              <span>Auto Refresh</span>
            </label>
          </div>

          <div>
             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.manualApproval}
                onChange={(e) => setSettings({ ...settings, manualApproval: e.target.checked })}
              />
              <span>Manual Approval Mode (Human-in-the-Loop)</span>
            </label>
            <p style={{ margin: '4px 0 0 24px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
              Agent will pause before applying fixes and request your review.
            </p>
          </div>

          {settings.autoRefresh && (
            <div>
              <label className="label">Refresh Interval (ms)</label>
              <input
                type="number"
                value={settings.refreshInterval}
                onChange={(e) => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) })}
                className="input"
                min="1000"
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button className="button" onClick={() => {
              localStorage.setItem('settings', JSON.stringify(settings));
              onClose();
            }}>
              Save Settings
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '10px 24px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
