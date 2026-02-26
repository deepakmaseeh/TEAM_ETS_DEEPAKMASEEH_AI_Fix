import React, { useState, useEffect } from 'react';
import { useRun } from '../context/RunContext';
import StatusBadge from './StatusBadge';
import { removeRunsFromHistory, updateRunInHistory, getUniqueTagsFromHistory, filterLocalHistory } from '../utils/localStorage';
import CompareRunsModal from './CompareRunsModal';
import { History, Search, Filter, Calendar, Clock, CheckCircle2, Trophy, ChevronRight, Trash2, Download, GitCompare, RotateCw, Tag } from 'lucide-react';

export default function RunHistory({ onSelectRun }) {
  const { history, refreshHistory, startRun } = useRun();
  const [filteredRuns, setFilteredRuns] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRunIds, setSelectedRunIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [compareRunA, setCompareRunA] = useState(null);
  const [compareRunB, setCompareRunB] = useState(null);
  const [tagInputs, setTagInputs] = useState({});
  const uniqueTags = getUniqueTagsFromHistory();

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    let result = filterLocalHistory({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, tag: tagFilter === 'all' ? undefined : tagFilter, status: filter === 'all' ? undefined : filter });
    if (search) {
      const lowerQuery = search.toLowerCase();
      result = result.filter(run =>
        run.repo_url?.toLowerCase().includes(lowerQuery) ||
        run.team_name?.toLowerCase().includes(lowerQuery) ||
        run.leader_name?.toLowerCase().includes(lowerQuery) ||
        run.id?.toLowerCase().includes(lowerQuery) ||
        (Array.isArray(run.tags) && run.tags.some(t => t.toLowerCase().includes(lowerQuery)))
      );
    }
    setFilteredRuns(result);
  }, [history, search, filter, dateFrom, dateTo, tagFilter]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const duration = new Date(end) - new Date(start);
    const seconds = Math.floor(duration / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev);
    setSelectedRunIds([]);
  };

  const toggleRunSelection = (runId) => {
    setSelectedRunIds(prev => (
      prev.includes(runId)
        ? prev.filter(id => id !== runId)
        : [...prev, runId]
    ));
  };

  const handleDeleteSelected = () => {
    if (selectedRunIds.length === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedRunIds.length} selected history item(s)? This cannot be undone.`
    );
    if (!confirmed) return;
    const deleted = removeRunsFromHistory(selectedRunIds);
    if (!deleted) {
      window.alert('Failed to delete selected history items.');
      return;
    }
    setSelectedRunIds([]);
    setIsSelectionMode(false);
    refreshHistory();
  };

  const handleExportCSV = () => {
    const headers = ['id', 'repo_url', 'team_name', 'leader_name', 'status', 'start_time', 'end_time', 'branch', 'total_failures', 'fixes_applied', 'score_total', 'tags'];
    const rows = filteredRuns.map(r => [
      r.id,
      r.repo_url ?? '',
      (r.results?.team_name ?? r.team_name) ?? '',
      (r.results?.leader_name ?? r.leader_name) ?? '',
      r.status ?? '',
      r.start_time ?? '',
      r.end_time ?? '',
      r.results?.branch ?? '',
      r.results?.total_failures ?? '',
      r.results?.fixes_applied ?? '',
      r.results?.score?.total ?? '',
      Array.isArray(r.tags) ? r.tags.join(';') : (r.tags ?? ''),
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rift-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredRuns, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rift-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunAgain = (run) => {
    const repo = run.repo_url;
    const team = run.results?.team_name ?? run.team_name ?? '';
    const leader = run.results?.leader_name ?? run.leader_name ?? '';
    if (!repo || !team || !leader) {
      alert('Missing repo/team/leader for this run.');
      return;
    }
    startRun(repo, team, leader);
    if (onSelectRun) onSelectRun();
  };

  const addTag = (runId, tag) => {
    const t = (tag || '').trim();
    if (!t) return;
    const run = history.find(r => r.id === runId);
    if (!run) return;
    const existing = Array.isArray(run.tags) ? run.tags : (run.tags ? [run.tags] : []);
    if (existing.includes(t)) return;
    updateRunInHistory(runId, { tags: [...existing, t] });
    setTagInputs(prev => ({ ...prev, [runId]: '' }));
    refreshHistory();
  };

  const cardStyle = {
    background: 'var(--bg-card)',
    backdropFilter: 'blur(10px)',
    border: 'var(--glass-border)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: 'var(--shadow-lg)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '800px'
  };

  return (
    <div className="card" style={cardStyle}>
      <div style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'var(--gradient-primary)',
        opacity: 0.3
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History size={20} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Run History</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ 
                width: '180px', 
                marginBottom: 0, 
                paddingLeft: '30px', 
                height: '36px',
                fontSize: '13px',
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)'
              }}
            />
          </div>
          <div style={{ position: 'relative' }}>
             <Filter size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: '0 12px 0 30px',
                height: '36px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowCompare(true)}
            style={{ height: '36px', padding: '0 12px', fontSize: '13px' }}
          >
            <GitCompare size={14} />
            Compare
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            style={{ height: '36px', padding: '0 12px', fontSize: '13px' }}
          >
            <Download size={14} />
            CSV
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportJSON}
            style={{ height: '36px', padding: '0 12px', fontSize: '13px' }}
          >
            <Download size={14} />
            JSON
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={toggleSelectionMode}
            style={{ height: '36px', padding: '0 12px', fontSize: '13px' }}
          >
            {isSelectionMode ? 'Cancel' : 'Select'}
          </button>
          {isSelectionMode && (
            <button
              type="button"
              className="btn"
              onClick={handleDeleteSelected}
              disabled={selectedRunIds.length === 0}
              style={{
                height: '36px',
                padding: '0 12px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: selectedRunIds.length === 0 ? 0.6 : 1,
                cursor: selectedRunIds.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <Trash2 size={14} />
              Delete Selected ({selectedRunIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Date range & tag filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          style={{ height: '32px', padding: '0 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px' }}
          title="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          style={{ height: '32px', padding: '0 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px' }}
          title="To date"
        />
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          style={{ height: '32px', padding: '0 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px' }}
        >
          <option value="all">All tags</option>
          {uniqueTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {filteredRuns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            No runs found
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            overflowY: 'auto',
            paddingRight: '4px'
          }}
          className="scrollbar-hidden"
          >
            {filteredRuns.map((run) => (
              <div
                key={run.id}
                onClick={() => {
                  if (isSelectionMode) return;
                  if (onSelectRun) onSelectRun(run);
                }}
                style={{
                  padding: '16px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '12px',
                  cursor: isSelectionMode ? 'default' : (onSelectRun ? 'pointer' : 'default'),
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (onSelectRun && !isSelectionMode) {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.background = 'var(--bg-hover)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (onSelectRun && !isSelectionMode) {
                    e.currentTarget.style.borderColor = 'var(--border-primary)';
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                {isSelectionMode && (
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        checked={selectedRunIds.includes(run.id)}
                        onChange={() => toggleRunSelection(run.id)}
                      />
                      Select
                    </label>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      color: 'var(--text-primary)', 
                      fontWeight: '600', 
                      fontSize: '14px',
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {run.repo_url ? run.repo_url.split('/').pop() : 'Unknown Repository'}
                    </div>
                    <div style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '11px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px' 
                    }}>
                      <Calendar size={10} />
                      {formatDate(run.start_time)}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <StatusBadge status={run.status} size="small" />
                  </div>
                </div>
                
                {(Array.isArray(run.tags) && run.tags.length > 0) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                    {(run.tags || []).map((t, i) => (
                      <span key={i} style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--accent-primary)', color: 'white', borderRadius: '4px', opacity: 0.9 }}>{t}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <input
                    type="text"
                    placeholder="Add tag..."
                    value={tagInputs[run.id] ?? ''}
                    onChange={(e) => setTagInputs(prev => ({ ...prev, [run.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') addTag(run.id, tagInputs[run.id]); }}
                    style={{ flex: 1, height: '24px', padding: '0 8px', fontSize: '11px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '4px', color: 'var(--text-primary)' }}
                  />
                  <button type="button" className="btn btn-secondary" onClick={() => addTag(run.id, tagInputs[run.id])} style={{ padding: '0 8px', height: '24px', fontSize: '11px' }}><Tag size={12} /> Add</button>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '12px', 
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  borderTop: '1px solid var(--border-secondary)',
                  paddingTop: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={10} />
                    {formatDuration(run.start_time, run.end_time)}
                  </div>
                  {run.results && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)' }}>
                        <CheckCircle2 size={10} />
                        {run.results.fixes_applied || 0} Fixed
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning)' }}>
                        <Trophy size={10} />
                        {run.results.score?.total || 0} pts
                      </div>
                    </>
                  )}
                  {onSelectRun && !isSelectionMode && (
                    <>
                      <button type="button" className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); handleRunAgain(run); }} style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: '11px' }} title="Run again with same repo/team/leader">
                        <RotateCw size={12} />
                        Run again
                      </button>
                      <ChevronRight size={14} style={{ opacity: 0.5 }} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CompareRunsModal
        isOpen={showCompare}
        onClose={() => setShowCompare(false)}
        runA={compareRunA}
        runB={compareRunB}
        onSelectRunA={setCompareRunA}
        onSelectRunB={setCompareRunB}
        runs={filteredRuns}
      />
    </div>
  );
}
