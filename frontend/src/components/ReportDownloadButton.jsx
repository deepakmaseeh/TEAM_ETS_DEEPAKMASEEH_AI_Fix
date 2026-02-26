import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { useRun } from '../context/RunContext';
import FullReportContent from './FullReportContent';
import { FileDown, Loader2, FileCode, Eye, Sun, Moon } from 'lucide-react';

function buildReportHTML(currentRun, theme) {
  const r = currentRun?.results;
  if (!r) return '';
  const dark = theme !== 'light';
  const bg = dark ? '#0f1117' : '#f8fafc';
  const card = dark ? '#161922' : '#ffffff';
  const border = dark ? '#2a2d3a' : '#e2e8f0';
  const text = dark ? '#e2e8f0' : '#0f172a';
  const text2 = dark ? '#94a3b8' : '#475569';
  const accent = '#3b82f6';
  const success = '#10b981';
  const danger = '#ef4444';
  const fixes = (r.fixes || []).map(f => `<tr><td>${(f.file || '').replace(/</g, '&lt;')}</td><td>${(f.bug_type || f.bugType || '').replace(/</g, '&lt;')}</td><td>${f.line_number ?? f.line ?? ''}</td><td>${(f.status || '').replace(/</g, '&lt;')}</td><td>${(f.commit_message || '').replace(/</g, '&lt;').slice(0, 60)}</td></tr>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>RIFT Report ${currentRun.id}</title><style>body{font-family:system-ui;background:${bg};color:${text};padding:24px;margin:0}.section{background:${card};border:1px solid ${border};border-radius:12px;padding:20px;margin-bottom:20px}h2{margin:0 0 8px;font-size:18px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:10px;text-align:left;border-bottom:1px solid ${border}}.muted{color:${text2};font-size:13px}a{color:${accent}</style></head><body><h1 style="color:${accent}">RIFT Run Report</h1><p class="muted">Run ID: ${(currentRun.id || '').replace(/</g, '&lt;')} · Generated ${new Date().toISOString()}</p><div class="section"><h2>Summary</h2><p class="muted">Repo: ${(r.repo_url || '').replace(/</g, '&lt;')} · Team: ${(r.team_name || '').replace(/</g, '&lt;')} · Branch: ${(r.branch || '').replace(/</g, '&lt;')}</p><p>Failures: ${r.total_failures ?? '—'} · Fixed: ${r.fixes_applied ?? '—'} · Score: ${r.score?.total ?? '—'} · CI: ${(r.ci_status || '').replace(/</g, '&lt;')}</p></div><div class="section"><h2>Fixes Applied</h2><table><thead><tr><th>File</th><th>Bug Type</th><th>Line</th><th>Status</th><th>Commit</th></tr></thead><tbody>${fixes}</tbody></table></div><footer class="muted" style="margin-top:24px;padding-top:16px;border-top:1px solid ${border}">RIFT 2026 · Team ETS</footer></body></html>`;
}

const ReportDownloadButton = forwardRef(function ReportDownloadButton(_, ref) {
  const { currentRun } = useRun();
  const reportRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [pdfTheme, setPdfTheme] = useState('dark');
  const [showPreview, setShowPreview] = useState(false);

  const handleDownloadReport = async () => {
    if (!currentRun?.id || !reportRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: pdfTheme === 'light' ? '#f8fafc' : '#0f1117',
        height: element.scrollHeight,
        windowHeight: element.scrollHeight,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pageHeightPx = (imgWidth * pdfHeight) / pdfWidth;
      let y = 0;
      let pageNum = 0;
      while (y < imgHeight) {
        if (pageNum > 0) pdf.addPage();
        const sliceH = Math.min(pageHeightPx, imgHeight - y);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imgWidth;
        tempCanvas.height = sliceH;
        const ctx = tempCanvas.getContext('2d');
        ctx.fillStyle = pdfTheme === 'light' ? '#f8fafc' : '#0f1117';
        ctx.fillRect(0, 0, imgWidth, sliceH);
        ctx.drawImage(canvas, 0, y, imgWidth, sliceH, 0, 0, imgWidth, sliceH);
        const sliceData = tempCanvas.toDataURL('image/png');
        const w = pdfWidth;
        const h = Math.min(pdfHeight, w * (sliceH / imgWidth));
        pdf.addImage(sliceData, 'PNG', 0, 0, w, h);
        y += pageHeightPx;
        pageNum++;
      }
      pdf.save(`rift-report-${currentRun.id}.pdf`);
    } catch (err) {
      console.error('Report export failed:', err);
      alert('Failed to generate PDF report. Try exporting JSON instead.');
    } finally {
      setExporting(false);
    }
  };

  useImperativeHandle(ref, () => ({ download: handleDownloadReport }), [currentRun?.id, pdfTheme]);

  const handleDownloadHTML = () => {
    const html = buildReportHTML(currentRun, pdfTheme);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rift-report-${currentRun.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentRun?.results) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px', zIndex: -1 }}>
        <FullReportContent reportRef={reportRef} theme={pdfTheme} />
      </div>

      {showPreview && (
        <div style={{ maxHeight: '500px', overflow: 'auto', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '16px', background: 'var(--bg-tertiary)' }}>
          <FullReportContent reportRef={undefined} theme={pdfTheme} />
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <button type="button" className="btn btn-secondary" onClick={() => setShowPreview(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={18} />
          {showPreview ? 'Hide preview' : 'Preview report'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setPdfTheme(t => t === 'dark' ? 'light' : 'dark')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }} title="PDF theme">
          {pdfTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {pdfTheme === 'dark' ? 'Light PDF' : 'Dark PDF'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleDownloadHTML} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileCode size={18} />
          Download HTML
        </button>
        <button
          type="button"
          className="btn"
          onClick={handleDownloadReport}
          disabled={exporting}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {exporting ? <Loader2 size={18} className="spin" /> : <FileDown size={18} />}
          {exporting ? 'Generating PDF…' : 'Download PDF'}
        </button>
      </div>
    </div>
  );
});

export default ReportDownloadButton;
