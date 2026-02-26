import React from 'react';
import { useRun } from '../context/RunContext';
import { FileSpreadsheet } from 'lucide-react';

export default function ExportFixesCSV() {
  const { currentRun } = useRun();

  const handleExport = () => {
    const fixes = currentRun?.results?.fixes || [];
    if (fixes.length === 0) {
      alert('No fixes to export.');
      return;
    }
    const headers = ['file', 'bug_type', 'line_number', 'status', 'commit_message'];
    const rows = fixes.map(f => [
      f.file ?? '',
      f.bug_type ?? f.bugType ?? '',
      f.line_number ?? f.line ?? '',
      f.status ?? '',
      (f.commit_message ?? '').replace(/"/g, '""'),
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.map(c => `"${String(c)}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rift-fixes-${currentRun.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentRun?.results?.fixes?.length) return null;

  return (
    <button type="button" className="btn btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <FileSpreadsheet size={18} />
      Export fixes (CSV)
    </button>
  );
}
