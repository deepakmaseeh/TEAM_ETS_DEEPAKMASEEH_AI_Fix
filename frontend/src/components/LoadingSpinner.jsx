import React from 'react';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '40px'
    }}>
      <div className="loading" style={{ width: '40px', height: '40px', marginBottom: '20px' }}></div>
      <p style={{ color: '#6c757d' }}>{message}</p>
    </div>
  );
}
