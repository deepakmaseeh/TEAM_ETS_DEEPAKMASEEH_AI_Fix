import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Clock } from 'lucide-react';

export default function StatusBadge({ status, size = 'normal' }) {
  const sizeClasses = {
    small: { padding: '4px 8px', fontSize: '10px', gap: '4px' },
    normal: { padding: '6px 12px', fontSize: '12px', gap: '6px' },
    large: { padding: '8px 16px', fontSize: '14px', gap: '8px' }
  };

  const iconSize = {
    small: 12,
    normal: 14,
    large: 16
  };

  const getStatusConfig = () => {
    switch (status?.toUpperCase()) {
      case 'PASSED':
      case 'FIXED':
      case 'COMPLETED':
      case 'Y':
        return { 
          className: 'badge-success', 
          icon: CheckCircle2,
          color: 'var(--success)'
        };
      case 'FAILED':
      case 'FAILURE':
      case 'N':
        return { 
          className: 'badge-danger', 
          icon: XCircle,
          color: 'var(--danger)'
        };
      case 'RUNNING':
      case 'AI_PROCESSING':
      case 'TESTING':
        return { 
          className: 'badge-info', 
          icon: Loader2,
          color: 'var(--info)',
          spin: true
        };
      case 'STARTED':
        return {
          className: 'badge-info',
          icon: Clock,
          color: 'var(--info)'
        };
      default:
        return { 
          className: 'badge-warning', 
          icon: AlertCircle,
          color: 'var(--warning)'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span 
      className={`badge ${config.className}`}
      style={{
        ...sizeClasses[size],
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: '600',
        borderRadius: '9999px',
        border: `1px solid ${config.color}`,
        background: `${config.color}20`, // 20 is approx 12% opacity hex
        color: config.color,
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}
    >
      {Icon && (
        <Icon 
          size={iconSize[size]} 
          className={config.spin ? 'spin-animation' : ''} 
          style={config.spin ? { animation: 'spin 2s linear infinite' } : {}}
        />
      )}
      {status || 'UNKNOWN'}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </span>
  );
}
