import React, { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import ExportButton from './ExportButton';
import { Settings, BookOpen, Clock, Activity } from 'lucide-react';

export default function Header({ 
  onOpenSettings, 
  onToggleHistory, 
  showHistory, 
  currentRun 
}) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="logo-icon">
          <Activity size={24} color="var(--accent-primary)" />
        </div>
        <div>
          <h1>Rift Agent</h1>
          <p>Autonomous CI/CD Healing • Team ETS</p>
        </div>
      </div>

      <div className="header-controls">
        <ThemeToggle />
        
        <button 
          onClick={onOpenSettings}
          className="header-btn"
          aria-label="Settings"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <button 
          onClick={onToggleHistory}
          className={`header-btn ${showHistory ? 'active' : ''}`}
          aria-label="History"
        >
          <Clock size={18} />
          <span>{showHistory ? 'Hide' : 'History'}</span>
        </button>

        {currentRun && <ExportButton />}
      </div>
    </header>
  );
}
