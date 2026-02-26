import React, { useState, useRef, useEffect } from 'react';
import { RunProvider } from './context/RunContext';
import AppHeader from './components/AppHeader';
import InputSection from './components/InputSection';
import RunSummaryCard from './components/RunSummaryCard';
import ScoreBreakdownPanel from './components/ScoreBreakdownPanel';
import FixesAppliedTable from './components/FixesAppliedTable';
import CICDStatusTimeline from './components/CICDStatusTimeline';
import ProgressIndicator from './components/ProgressIndicator';
import EmptyState from './components/EmptyState';
import TimeMetricsCard from './components/TimeMetricsCard';
import AgentActivity from './components/AgentActivity';
import RepositoryStats from './components/RepositoryStats';
import PerformanceCharts from './components/PerformanceCharts';
import RunHistory from './components/RunHistory';
import WorkspaceModal from './components/WorkspaceModal';
import ExportButton from './components/ExportButton';
import ExportFixesCSV from './components/ExportFixesCSV';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import RepoVisualizer from './components/RepoVisualizer';
import ResultsJsonViewer from './components/ResultsJsonViewer';
import ReportDownloadButton from './components/ReportDownloadButton';
import Toast from './components/Toast';
import { useRun } from './context/RunContext';
import { X } from 'lucide-react';
import './App.css';

/* ─── Modal ─────────────────────────────────────────────────────── */
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

/* ─── Section wrapper ────────────────────────────────────────────── */
const Section = ({ label, children, className = '' }) => (
  <section className={`dashboard-section ${className}`}>
    {label && <div className="section-label">{label}</div>}
    {children}
  </section>
);

/* ─── App Content ────────────────────────────────────────────────── */
function AppContent() {
  const { error, currentRun } = useRun();
  const [showHistory, setShowHistory] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const reportDownloadRef = useRef(null);
  const prevRunStatusRef = useRef(currentRun?.status);

  const isRunning   = currentRun?.status === 'running' || currentRun?.status === 'started';
  const isCompleted = currentRun?.status === 'completed';

  useEffect(() => {
    if (currentRun?.status === 'completed' && prevRunStatusRef.current !== 'completed') {
      setToastVisible(true);
    }
    prevRunStatusRef.current = currentRun?.status;
  }, [currentRun?.status]);

  return (
    <div className="app-root">
      {/* ── Sticky Topbar ── */}
      <AppHeader
        onOpenHistory={() => setShowHistory(true)}
        onOpenWorkspace={() => setShowWorkspace(true)}
      />

      {/* ── Page Body ── */}
      <div className="page-body">

        {/* ── Left / Main Column ── */}
        <main className="main-col">

          {/* Error / Success banners */}
          {error && (
            <div className="banner banner-error">
              <strong>⚠ Error:</strong> {error}
            </div>
          )}
          {isCompleted && (
            <div className="banner banner-success">
              <strong>✓ Run completed successfully!</strong> All results are ready below.
            </div>
          )}

          {/* ── New Run Section ── */}
          <Section label="New Analysis Run">
            <InputSection />
          </Section>

          {/* ── Progress (while running) ── */}
          {isRunning && (
            <Section label="Agent Progress">
              <ProgressIndicator />
            </Section>
          )}

          {/* ── Dashboard Grid (after completed) ── */}
          {isCompleted && (
            <>
              {/* Row 1: Summary + Score */}
              <Section label="Run Overview">
                <div className="row-2col">
                  <RunSummaryCard />
                  <ScoreBreakdownPanel />
                </div>
              </Section>

              {/* Row 2: Time + Repo Stats */}
              <Section label="Metrics">
                <div className="row-2col">
                  <TimeMetricsCard />
                  <RepositoryStats />
                </div>
              </Section>

              {/* Row 3: Charts full width */}
              <Section label="Performance">
                <PerformanceCharts />
              </Section>

              {/* Row 4: Fixes Table + Timeline side by side */}
              <Section label="Fixes & CI/CD Status">
                <div className="row-fixes">
                  <FixesAppliedTable />
                  <CICDStatusTimeline />
                </div>
              </Section>

              {/* Row 5: Repo Visualizer full width */}
              <Section label="Repository Visualizer">
                <RepoVisualizer />
              </Section>

              {/* Row 6: Results JSON + Report download */}
              <Section label="Results & Report">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <ResultsJsonViewer />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <ExportFixesCSV />
                    <ReportDownloadButton ref={reportDownloadRef} />
                  </div>
                </div>
              </Section>
            </>
          )}

          {/* Empty State */}
          {!currentRun && <EmptyState />}

          {/* Partial result (failed/unknown state) */}
          {currentRun && !isRunning && !isCompleted && (
            <Section label="Run Summary">
              <RunSummaryCard />
            </Section>
          )}

          {/* Footer */}
          <footer className="page-footer">
            <span>RIFT 2026 · Team ETS · Deepakmaseeh</span>
            <span>Powered by <b>Excel Tech Solutions</b></span>
          </footer>
        </main>

        {/* ── Right Sidebar: AI Agent Activity ── */}
        <aside className="agent-sidebar">
          <div className="sidebar-label">AI Agent Console</div>
          <AgentActivity />
        </aside>
      </div>

      {/* ── Modals ── */}
      <Modal isOpen={showHistory} onClose={() => setShowHistory(false)} title="Run History">
        <RunHistory onSelectRun={() => setShowHistory(false)} />
      </Modal>
      <WorkspaceModal isOpen={showWorkspace} onClose={() => setShowWorkspace(false)} />

      <Toast message="Run completed successfully!" visible={toastVisible} onDismiss={() => setToastVisible(false)} />

      <KeyboardShortcuts shortcuts={[
        { key: 'h', ctrl: true, action: () => setShowHistory(h => !h), description: 'Toggle history' },
        { key: 'p', ctrl: true, action: () => reportDownloadRef.current?.download?.(), description: 'Download report (PDF)' },
        { key: 'Escape', action: () => { setShowHistory(false); setShowWorkspace(false); }, description: 'Close modals' }
      ]} />
    </div>
  );
}

export default function App() {
  return (
    <RunProvider>
      <AppContent />
    </RunProvider>
  );
}
