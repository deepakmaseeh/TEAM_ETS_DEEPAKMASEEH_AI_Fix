import React, { useState } from 'react';
import axios from 'axios';
import { useRun } from '../context/RunContext';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000');

export default function ExportButton() {
  const { currentRun } = useRun();
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format = 'json') => {
    if (!currentRun?.id) return;

    try {
      setExporting(true);
      const response = await axios.get(`${API_URL}/runs/${currentRun.id}/export?format=${format}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `run_${currentRun.id}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export run data');
    } finally {
      setExporting(false);
    }
  };

  if (!currentRun) return null;

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={() => handleExport('json')}
        disabled={exporting}
        className="button"
        style={{ fontSize: '13px', padding: '8px 16px' }}
      >
        {exporting ? 'Exporting...' : '📥 Export JSON'}
      </button>
    </div>
  );
}
