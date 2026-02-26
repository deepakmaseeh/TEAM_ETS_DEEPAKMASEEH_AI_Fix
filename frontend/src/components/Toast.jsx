import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

export default function Toast({ message, visible, onDismiss, duration = 4000 }) {
  useEffect(() => {
    if (!visible || !onDismiss || !duration) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [visible, onDismiss, duration]);

  if (!visible) return null;

  return (
    <div
      className="toast"
      role="alert"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 20px',
        background: 'var(--bg-card)',
        border: '1px solid var(--success)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        fontWeight: 500,
        animation: 'fadeInUp 0.3s ease',
      }}
    >
      <CheckCircle size={22} color="var(--success)" />
      {message}
    </div>
  );
}
