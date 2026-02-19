import React from 'react';
import { Bot, History, Download, Zap } from 'lucide-react';
import ExportButton from './ExportButton';
import { useRun } from '../context/RunContext';

export default function AppHeader({ onOpenHistory }) {
  const { currentRun } = useRun();
  const isRunning = currentRun?.status === 'running' || currentRun?.status === 'started';

  return (
    <header className="app-topbar">
      {/* Left: Brand */}
      <div className="topbar-brand">
        <div className="topbar-logo">
          <div className="logo-ring">
            <Zap size={18} className="logo-zap" />
          </div>
          <div>
            <div className="topbar-title">RIFT</div>
            <div className="topbar-subtitle">Autonomous CI/CD Healing Agent</div>
          </div>
        </div>
      </div>

      {/* Center: Live Status Badge */}
      <div className="topbar-center">
        {isRunning ? (
          <div className="live-badge">
            <span className="live-dot" />
            AGENT RUNNING
          </div>
        ) : currentRun?.status === 'completed' ? (
          <div className="done-badge">
            ✓ Run Completed
          </div>
        ) : (
          <div className="idle-badge">
            <Bot size={13} />
            RIFT Agent Ready
          </div>
        )}
      </div>

      {/* Right: Controls */}
      <div className="topbar-controls">
        <div className="topbar-meta">
          <span>Team ETS</span>
          <span className="meta-dot">·</span>
          <span>Deepakmaseeh</span>
          <span className="meta-dot">·</span>
          <span>RIFT 2026</span>
        </div>

        <div className="topbar-actions">
          <button className="topbar-btn" onClick={onOpenHistory} title="Run History">
            <History size={16} />
            <span>History</span>
          </button>

          {currentRun && <ExportButton />}
        </div>
      </div>
    </header>
  );
}
