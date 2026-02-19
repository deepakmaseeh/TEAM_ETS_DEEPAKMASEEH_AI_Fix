import React, { useState } from 'react';
import { RunProvider } from './context/RunContext';
import { ThemeProvider } from './context/ThemeContext';
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
import ExportButton from './components/ExportButton';
import SettingsPanel from './components/SettingsPanel';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import RepoVisualizer from './components/RepoVisualizer';
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
  const [showHistory, setShowHistory]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const isRunning   = currentRun?.status === 'running' || currentRun?.status === 'started';
  const isCompleted = currentRun?.status === 'completed';

  return (
    <div className="app-root">
      {/* ── Sticky Topbar ── */}
      <AppHeader
        onOpenSettings={() => setShowSettings(true)}
        onOpenHistory={() => setShowHistory(true)}
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
            <span>Powered by Gemini AI</span>
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
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings">
        <SettingsPanel onClose={() => setShowSettings(false)} />
      </Modal>

      <KeyboardShortcuts shortcuts={[
        { key: 'h', ctrl: true, action: () => setShowHistory(h => !h),  description: 'Toggle history' },
        { key: 's', ctrl: true, action: () => setShowSettings(true),    description: 'Open settings' },
        { key: 'Escape', action: () => { setShowHistory(false); setShowSettings(false); }, description: 'Close modals' }
      ]} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <RunProvider>
        <AppContent />
      </RunProvider>
    </ThemeProvider>
  );
}
